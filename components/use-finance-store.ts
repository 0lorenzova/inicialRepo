"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FinanceSyncController, type SyncState } from "@/lib/finance-sync";
import { createFinanceTransport } from "@/lib/supabase/finance-transport";

const LOCAL_KEY = "claro-finanzas-v2"; // Preserve existing local-only data.
type User = { id: string; email?: string };

export function useFinanceStore<T>(client: SupabaseClient | null, initial: T, hydrate: (value: T) => T) {
  const [snapshot, setSnapshot] = useState({ data: initial, ready: false, status: client ? "loading" : "local", error: null as string | null, pending: false });
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(Boolean(client));
  const controller = useRef<FinanceSyncController<T> | null>(null);
  const localData = useRef(initial);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scheduleSave = useCallback(() => {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void controller.current?.flush(); }, 450);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!client) {
      const timer = setTimeout(() => {
        let data = initial;
        let error: string | null = null;
        try {
          const saved = localStorage.getItem(LOCAL_KEY);
          if (saved) data = hydrate(JSON.parse(saved));
        } catch { error = "No se pudo leer la copia local. El archivo original se conserva en este navegador."; }
        if (!alive) return;
        localData.current = data;
        // Do not overwrite unreadable data with a blank document.
        setSnapshot({ data, ready: !error, status: error ? "error" : "local", error, pending: false });
        setAuthLoading(false);
      }, 0);
      return () => { alive = false; clearTimeout(timer); };
    }

    const tabId: string = crypto.randomUUID();
    let previousTabId: string | undefined;
    try {
      previousTabId = sessionStorage.getItem("finanzas-tab-id") || undefined;
      sessionStorage.setItem("finanzas-tab-id", tabId);
    } catch { /* In-memory identity still isolates this session's drafts. */ }
    const sync = new FinanceSyncController<T>({
      initial, hydrate, storage: {
        getItem: key => localStorage.getItem(key),
        setItem: (key, value) => localStorage.setItem(key, value),
        removeItem: key => localStorage.removeItem(key),
      },
      instanceId: tabId,
      previousInstanceId: previousTabId,
      transport: createFinanceTransport<T>(client),
      onChange: (state: SyncState<T>) => {
        if (alive) setSnapshot({ data: state.data, ready: state.ready, status: state.status, error: state.error, pending: state.pending });
      },
    });
    controller.current = sync;
    let currentUser: string | null | undefined;
    let receivedAuthEvent = false;
    const acceptUser = (next: User | null) => {
      if (!alive) return;
      setUser(next);
      setAuthLoading(false);
      if (next?.id === currentUser || (!next && currentUser === null)) return;
      currentUser = next?.id ?? null;
      clearTimeout(saveTimer.current);
      if (next) void sync.open(next.id).then(() => { if (alive) scheduleSave(); });
      else sync.close();
    };
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      // Keep asynchronous database work outside Supabase's auth callback lock.
      setTimeout(() => acceptUser(session?.user ?? null), 0);
    });
    void client.auth.getUser().then(({ data: { user: loadedUser }, error }) => {
      if (!alive || receivedAuthEvent) return;
      acceptUser(loadedUser);
      if (error) setSnapshot(current => ({ ...current, status: "error", error: error.message }));
    }).catch(() => {
      if (!alive) return;
      setAuthLoading(false);
      setSnapshot(current => ({ ...current, status: "error", error: "No se pudo comprobar la sesión. Revisa tu conexión." }));
    });
    const refresh = () => {
      if (document.visibilityState === "hidden" || !currentUser) return;
      void sync.refresh().then(() => { if (alive) scheduleSave(); });
    };
    window.addEventListener("focus", refresh);
    window.addEventListener("online", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = setInterval(refresh, 30_000);
    return () => {
      alive = false;
      clearTimeout(saveTimer.current);
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("online", refresh);
      document.removeEventListener("visibilitychange", refresh);
      subscription.unsubscribe();
      sync.close();
      if (controller.current === sync) controller.current = null;
    };
  }, [client, initial, hydrate, scheduleSave]);

  // Evaluate updates immediately against the current snapshot, including a
  // previous click in the same render. Financial operations stay atomic.
  const setData = useCallback((next: T | ((current: T) => T)) => {
    if (client) {
      if (!controller.current) throw new Error("Espera a que termine la carga de tus datos.");
      controller.current.setData(next);
      scheduleSave();
      return;
    }
    const value = typeof next === "function" ? (next as (current: T) => T)(localData.current) : next;
    // Persist before acknowledging success; full/disabled storage cannot
    // silently discard a financial operation in local-only mode.
    localStorage.setItem(LOCAL_KEY, JSON.stringify(value));
    localData.current = value;
    setSnapshot({ data: value, ready: true, status: "local", error: null, pending: false });
  }, [client, scheduleSave]);

  const retry = async () => {
    if (!controller.current || !user) return;
    if (!controller.current.getState().ready) await controller.current.open(user.id);
    else await controller.current.refresh();
    await controller.current.flush();
  };
  const clearLocalCopy = () => {
    if (client) {
      if (!controller.current) throw new Error("Espera a que termine la carga.");
      if (!controller.current.clearCache()) throw new Error("Sincroniza los cambios pendientes antes de limpiar la copia local.");
    } else {
      const backup = JSON.stringify(localData.current);
      localStorage.setItem(`finanzas:backup:local:${crypto.randomUUID()}`, backup);
      localStorage.setItem("finanzas:backup:local", backup);
      setData(initial);
    }
  };
  const replaceWithBackup = (update: (current: T) => T) => {
    const state = controller.current?.getState();
    if (client && (!state?.ready || state.pending || state.status !== "synced" || !state.userId)) throw new Error("Primero sincroniza los cambios y resuelve cualquier conflicto antes de restablecer.");
    if (!client && !snapshot.ready) throw new Error("Primero recupera la copia local antes de restablecer.");
    const current = client ? state!.data : localData.current;
    const next = update(current);
    // If storage is unavailable/full, fail before changing any financial data.
    localStorage.setItem(`finanzas:backup:${client ? state!.userId : "local"}:reset:${crypto.randomUUID()}`, JSON.stringify({ data: current, createdAt: new Date().toISOString() }));
    setData(next);
  };
  const downloadBackup = () => {
    let backups: { key: string; value: string | null }[] = [];
    let previous: string | null = null;
    try {
      backups = Object.keys(localStorage).filter(key => client
        ? user && (key.startsWith(`finanzas:backup:${user.id}`) || key.startsWith(`finanzas:draft:${user.id}:`))
        : key.startsWith("finanzas:backup:local")).map(key => ({ key, value: localStorage.getItem(key) }));
      if (!client) previous = localStorage.getItem(LOCAL_KEY);
    } catch { /* The in-memory snapshot can still be downloaded. */ }
    const payload = client ? { current: controller.current?.getSnapshot(), backups } : { data: localData.current, previous, backups };
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `finanzas-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return { ...snapshot, setData, user, authLoading, retry, clearLocalCopy, downloadBackup, replaceWithBackup,
    reloadFromCloud: async () => { await controller.current?.reloadFromCloud(); },
  };
}
