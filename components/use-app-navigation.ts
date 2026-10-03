"use client";

import { useEffect, useRef, useState } from "react";
import { baseNavigation, navigationUrl, nextNavigation, restoreNavigation, type AppNavigation, type NavigationEntry } from "@/lib/app-navigation";
export type { AppNavigation } from "@/lib/app-navigation";
const initial = baseNavigation("", "").value;

export function useAppNavigation(scope: string) {
  const [state, setState] = useState(initial);
  const current = useRef<NavigationEntry>(baseNavigation(scope, ""));
  useEffect(() => {
    // A new mount can restore a section, but never an incomplete form or a
    // previous user's contextual draft from an old browser-history entry.
    const session = crypto.randomUUID();
    const entry = baseNavigation(scope, session, new URLSearchParams(window.location.search).get("vista"));
    current.current = entry;
    window.history.replaceState({ ...window.history.state, financeNav: entry }, "", navigationUrl(entry.value));
    const timer = window.setTimeout(() => { if (current.current === entry) setState(entry.value); }, 0);
    const pop = (event: PopStateEvent) => {
      const restored = restoreNavigation(event.state?.financeNav, scope, current.current.session);
      if (!restored) return;
      window.clearTimeout(timer);
      current.current = restored.entry;
      if (restored.replace) window.history.replaceState({ ...window.history.state, financeNav: restored.entry }, "", navigationUrl(restored.entry.value));
      setState(restored.entry.value);
    };
    window.addEventListener("popstate", pop);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", pop); };
  }, [scope]);

  const open = (patch: Partial<AppNavigation>, replace = false) => {
    const previous = current.current;
    const entry = nextNavigation(previous, patch, replace);
    if (JSON.stringify(entry.value) === JSON.stringify(previous.value)) return;
    window.history[replace ? "replaceState" : "pushState"]({ ...window.history.state, financeNav: entry }, "", navigationUrl(entry.value));
    current.current = entry;
    setState(entry.value);
  };
  const close = () => {
    const entry = current.current;
    if (entry.index > entry.base) window.history.go(entry.base - entry.index);
    else open({ flow: null, step: 0, overlay: null }, true);
  };
  const back = () => window.history.back();
  const reset = () => {
    const entry = baseNavigation(scope, crypto.randomUUID());
    current.current = entry;
    window.history.replaceState({ ...window.history.state, financeNav: entry }, "", navigationUrl(entry.value));
    setState(entry.value);
  };
  return { ...state, open, close, back, reset };
}
