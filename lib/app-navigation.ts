export const appViews = ["Inicio", "Movimientos", "Sobres", "Cuentas", "Préstamos", "Reportes", "Recordatorios", "Configuración"] as const;
const overlays = ["new", "envelope", "goal", "account", "repay", "action", "postpone", "notifications", "feedback", "planning", "planningDetail", "scheduled", "incomeTrace", "proximity", "reset", "products"] as const;
export type AppNavigation = {
  view: string;
  flow: "Ingreso" | "Gasto" | null;
  step: number;
  overlay: (typeof overlays)[number] | null;
  context?: unknown;
  historyFrom?: string;
  historyTo?: string;
  reportMonth?: string;
  flowEnvelopeId?: string | null;
  movementEnvelopeId?: string | null;
  movementId?: string | null;
  reminderEnvelopeId?: string | null;
};
export type NavigationEntry = { scope: string; session: string; index: number; base: number; value: AppNavigation };

export function safeNavigationView(view: unknown): string {
  return typeof view === "string" && appViews.some(item => item === view) ? view : "Inicio";
}

export function baseNavigation(scope: string, session: string, view: unknown = "Inicio"): NavigationEntry {
  return { scope, session, index: 0, base: 0, value: { view: safeNavigationView(view), flow: null, step: 0, overlay: null, context: null } };
}

export function nextNavigation(previous: NavigationEntry, patch: Partial<AppNavigation>, replace = false): NavigationEntry {
  const value = { ...previous.value, ...patch };
  value.view = safeNavigationView(value.view);
  if (!value.flow && !value.overlay) value.context = null;
  const index = replace ? previous.index : previous.index + 1;
  return { scope: previous.scope, session: previous.session, index, base: value.flow || value.overlay ? previous.base : index, value };
}

export function navigationUrl(value: AppNavigation): string {
  const params = new URLSearchParams({ vista: value.view });
  if (value.flow) { params.set("registro", value.flow); params.set("paso", String(value.step + 1)); }
  if (value.overlay) params.set("panel", value.overlay);
  return `?${params}`;
}

export function restoreNavigation(saved: unknown, scope: string, session: string): { entry: NavigationEntry; replace: boolean } | null {
  if (!saved || typeof saved !== "object") return null;
  const candidate = saved as Partial<NavigationEntry>;
  const view = candidate.value?.view;
  const value = candidate.value;
  const validIndices = Number.isSafeInteger(candidate.index) && Number.isSafeInteger(candidate.base) && candidate.index! >= candidate.base! && candidate.base! >= 0;
  const validView = typeof view === "string" && safeNavigationView(view) === view;
  const validFlow = value?.flow === null || value?.flow === "Ingreso" || value?.flow === "Gasto";
  const validOverlay = value?.overlay === null || overlays.some(overlay => overlay === value?.overlay);
  const validStep = Number.isSafeInteger(value?.step) && value!.step >= 0 && value!.step <= (value?.flow === "Gasto" ? 2 : value?.flow === "Ingreso" ? 1 : 0);
  const needsContext = ["goal", "repay", "action", "postpone", "planning", "planningDetail", "scheduled", "incomeTrace", "proximity", "reset", "products"].some(overlay => overlay === value?.overlay);
  const validContext = !needsContext || (value?.context !== null && typeof value?.context === "object");
  const validFilters = [value?.historyFrom, value?.historyTo, value?.reportMonth, value?.flowEnvelopeId, value?.movementEnvelopeId, value?.movementId, value?.reminderEnvelopeId].every(id => id == null || typeof id === "string");
  if (candidate.scope !== scope || candidate.session !== session || !validIndices || !validView || !validFlow || !validOverlay || !validStep || !validContext || !validFilters) {
    return { entry: baseNavigation(scope, session, view), replace: true };
  }
  return { entry: candidate as NavigationEntry, replace: false };
}
