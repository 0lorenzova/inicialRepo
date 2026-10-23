export const appViews = ["Inicio", "Movimientos", "Sobres", "Cuentas", "Préstamos", "Reportes", "Recordatorios", "Configuración", "Cronograma", "Sin asignar", "Salarios"] as const;
const overlays = ["new", "salaryReceive", "envelope", "goal", "account", "repay", "action", "postpone", "notifications", "feedback", "planning", "planningDetail", "scheduled", "incomeTrace", "assignIncome", "proximity", "reset", "products", "expenseCategories", "movementDetail"] as const;
export const reportKinds = ["summary", "income", "category", "envelope", "history"] as const;
export type ReportKind = (typeof reportKinds)[number];
export const reportPanels = ["summary", "category", "envelope", "history"] as const;
export type ReportPanel = (typeof reportPanels)[number];
export type AppNavigation = {
  view: string;
  flow: "Ingreso" | "Gasto" | null;
  step: number;
  overlay: (typeof overlays)[number] | null;
  context?: unknown;
  historyFrom?: string;
  historyTo?: string;
  reportMonth?: string;
  reportKind?: ReportKind | null;
  reportPanels?: string;
  calendarDate?: string;
  calendarScale?: "Día" | "Semana" | "Mes" | "Año";
  flowEnvelopeId?: string | null;
  movementEnvelopeId?: string | null;
  movementId?: string | null;
  returnToIncome?: string | null;
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
  if(patch.view!==undefined&&patch.reportKind===undefined)value.reportKind=null;
  if(patch.view!==undefined&&patch.returnToIncome===undefined)value.returnToIncome=null;
  if (!value.flow && !value.overlay) value.context = null;
  const index = replace ? previous.index : previous.index + 1;
  return { scope: previous.scope, session: previous.session, index, base: value.flow || value.overlay ? previous.base : index, value };
}

export function navigationUrl(value: AppNavigation): string {
  const params = new URLSearchParams({ vista: value.view });
  if (value.flow) { params.set("registro", value.flow); params.set("paso", String(value.step + 1)); }
  if (value.overlay) params.set("panel", value.overlay);
  if (value.view === "Reportes") {
    if (value.reportMonth !== undefined) params.set("periodo", value.reportMonth || "todo");
    if (value.reportKind) params.set("reporte", value.reportKind);
    if (value.reportPanels !== undefined) params.set("paneles", value.reportPanels);
  }
  return `?${params}`;
}

export function navigationFromUrl(scope: string, session: string, search: string): NavigationEntry {
  const params = new URLSearchParams(search);
  const entry = baseNavigation(scope, session, params.get("vista"));
  if (entry.value.view !== "Reportes") return entry;
  const period = params.get("periodo");
  const kind = params.get("reporte");
  const panels = params.get("paneles");
  if (period === "todo") entry.value.reportMonth = "";
  else if (period && /^\d{4}-(0[1-9]|1[0-2])$/.test(period)) entry.value.reportMonth = period;
  if (kind && reportKinds.some(candidate => candidate === kind)) entry.value.reportKind = kind as ReportKind;
  if (panels !== null && (panels === "" || panels.split(",").every(panel => reportPanels.some(candidate => candidate === panel)))) entry.value.reportPanels = panels;
  return entry;
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
  const needsContext = ["goal", "repay", "action", "postpone", "planning", "planningDetail", "scheduled", "incomeTrace", "assignIncome", "proximity", "reset", "products", "expenseCategories", "movementDetail", "salaryReceive"].some(overlay => overlay === value?.overlay);
  const validContext = !needsContext || (value?.context !== null && typeof value?.context === "object");
  const validFilters = [value?.calendarDate, value?.historyFrom, value?.historyTo, value?.reportMonth, value?.reportPanels, value?.flowEnvelopeId, value?.movementEnvelopeId, value?.movementId, value?.returnToIncome, value?.reminderEnvelopeId].every(id => id == null || typeof id === "string");
  const validReportPanels = value?.reportPanels == null || value.reportPanels === "" || value.reportPanels.split(",").every(panel => reportPanels.some(candidatePanel => candidatePanel === panel));
  if (candidate.scope !== scope || candidate.session !== session || !validIndices || !validView || !validFlow || !validOverlay || !validStep || !validContext || !validFilters || (value?.reportKind != null && !reportKinds.some(kind => kind === value.reportKind)) || (value?.reportMonth != null && value.reportMonth !== "" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(value.reportMonth)) || !validReportPanels || (value?.calendarScale !== undefined && !["Día","Semana","Mes","Año"].includes(value.calendarScale))) {
    return { entry: baseNavigation(scope, session, view), replace: true };
  }
  return { entry: candidate as NavigationEntry, replace: false };
}
