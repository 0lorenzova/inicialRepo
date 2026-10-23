"use client";

import { useEffect, useRef, useState } from "react";
import { baseNavigation, navigationFromUrl, navigationUrl, nextNavigation, restoreNavigation, type AppNavigation, type NavigationEntry } from "@/lib/app-navigation";
export type { AppNavigation } from "@/lib/app-navigation";
const initial = baseNavigation("", "").value;

export function useAppNavigation(scope: string) {
  const [state, setState] = useState(initial);
  const current = useRef<NavigationEntry>(baseNavigation(scope, ""));
  const returningToRootGuard = useRef(false);
  useEffect(() => {
    // A new mount can restore a section, but never an incomplete form or a
    // previous user's contextual draft from an old browser-history entry.
    const session = crypto.randomUUID();
    const entry = navigationFromUrl(scope, session, window.location.search);
    current.current = entry;
    window.history.replaceState({ ...window.history.state, financeNav: entry }, "", navigationUrl(entry.value));
    // Keep an in-app entry behind the initial view. This prevents a Back press
    // at the app root from navigating out to the page that launched Finanzas.
    window.history.pushState({ ...window.history.state, financeNav: entry, financeBackGuard: session }, "", navigationUrl(entry.value));
    const timer = window.setTimeout(() => { if (current.current === entry) setState(entry.value); }, 0);
    const pop = (event: PopStateEvent) => {
      const previous = current.current;
      if (event.state?.financeBackGuard === previous.session) returningToRootGuard.current = false;
      const restored = restoreNavigation(event.state?.financeNav, scope, current.current.session);
      if (!restored) {
        // A same-document history entry without our navigation state can only
        // be the entry immediately before the app's root guard.
        if (previous.index === 0 && !returningToRootGuard.current) {
          returningToRootGuard.current = true;
          window.history.forward();
        }
        return;
      }
      const sameEntry = restored.entry.session === previous.session
        && restored.entry.index === previous.index
        && JSON.stringify(restored.entry.value) === JSON.stringify(previous.value);
      // Reset can leave old entries behind. Return to the new root instead of
      // restoring an older user's or pre-reset navigation state.
      if (restored.replace && previous.index === 0 && restored.entry.index === 0) {
        if (!returningToRootGuard.current) {
          returningToRootGuard.current = true;
          window.history.forward();
        }
        return;
      }
      window.clearTimeout(timer);
      current.current = restored.entry;
      if (restored.replace) window.history.replaceState({ ...window.history.state, financeNav: restored.entry }, "", navigationUrl(restored.entry.value));
      setState(restored.entry.value);
      const isRootGuard = event.state?.financeBackGuard === restored.entry.session;
      if (restored.entry.index === 0 && !isRootGuard) {
        if (sameEntry && !returningToRootGuard.current) {
          // This is the unguarded twin of the root entry. Move forward to its
          // guard without discarding the browser's Forward history.
          returningToRootGuard.current = true;
          window.history.forward();
        } else if (!sameEntry) {
          // A replaced root entry is a recovery edge case; create its guard.
          window.history.pushState({ ...window.history.state, financeNav: restored.entry, financeBackGuard: restored.entry.session }, "", navigationUrl(restored.entry.value));
        }
      }
    };
    window.addEventListener("popstate", pop);
    return () => { window.clearTimeout(timer); window.removeEventListener("popstate", pop); };
  }, [scope]);

  const open = (patch: Partial<AppNavigation>, replace = false) => {
    const previous = current.current;
    const nextValue = { ...previous.value, ...patch };
    const isGuardedRoot = window.history.state?.financeBackGuard === previous.session;
    // A modal opened with replace semantics must not consume the only root
    // guard; keep it as a separate history step that Back can return to.
    const useReplace = replace && !(isGuardedRoot && (nextValue.flow || nextValue.overlay));
    const entry = nextNavigation(previous, patch, useReplace);
    if (JSON.stringify(entry.value) === JSON.stringify(previous.value)) return;
    const nextState = { ...window.history.state, financeNav: entry };
    if (!useReplace) delete nextState.financeBackGuard;
    window.history[useReplace ? "replaceState" : "pushState"](nextState, "", navigationUrl(entry.value));
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
    const nextState = { ...window.history.state, financeNav: entry };
    delete nextState.financeBackGuard;
    window.history.replaceState(nextState, "", navigationUrl(entry.value));
    window.history.pushState({ ...nextState, financeBackGuard: entry.session }, "", navigationUrl(entry.value));
    setState(entry.value);
  };
  return { ...state, open, close, back, reset };
}
