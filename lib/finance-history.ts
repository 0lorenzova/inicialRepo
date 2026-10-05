import { movementHasEnvelope, type LedgerMovement } from "./finance-ledger";

// A datetime-local ledger entry represents Costa Rica time, regardless of the device.
export function movementInstant(value: string): number {
  return Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}-06:00`);
}
export function movementDay(value: string): string {
  const instant = movementInstant(value);
  if (!Number.isFinite(instant)) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Costa_Rica", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(instant);
  const get = (type: string) => parts.find(p => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export type HistoryFilters = { type?: string; envelopeId?: string | null; movementId?: string | null; search?: string; from?: string; to?: string };
export function historyRangeError(from?: string, to?: string): string | null {
  for (const date of [from, to]) {
    if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date.startsWith("0000") || Number.isNaN(Date.parse(date)) || new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) !== date)) return "Selecciona una fecha válida.";
  }
  return from && to && from > to ? "La fecha Desde debe ser anterior o igual a Hasta." : null;
}
export function filterHistory(movements: LedgerMovement[], filters: HistoryFilters): LedgerMovement[] {
  if (historyRangeError(filters.from, filters.to)) return [];
  const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const search = normalize(filters.search?.trim() || "");
  return movements.filter(m => {
    if (filters.movementId && m.id !== filters.movementId) return false;
    if (filters.envelopeId && !movementHasEnvelope(m, filters.envelopeId)) return false;
    if (filters.type && filters.type !== "Todos" && m.type !== filters.type) return false;
    const day = movementDay(m.date);
    if (filters.from && (!day || day < filters.from) || filters.to && (!day || day > filters.to)) return false;
    const searchable = [m.name, m.category, m.description, m.reference, m.merchant, m.accountName, m.paymentMethod, ...(m.tags ?? []), ...m.allocations.map(a=>a.name), ...(m.products ?? []).map(p=>p.name)].filter(Boolean).join(" ");
    return !search || normalize(searchable).includes(search);
  }).sort((a,b) => (movementInstant(b.date) - movementInstant(a.date) || b.id.localeCompare(a.id)));
}
export function monthRange(month: string): { from: string; to: string } {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || month.startsWith("0000")) throw new Error("Selecciona un mes válido.");
  const end = new Date(`${month}-01T12:00:00Z`);
  end.setUTCMonth(end.getUTCMonth()+1,0);
  return { from: `${month}-01`, to: end.toISOString().slice(0,10) };
}
export function financialReport(movements: LedgerMovement[], month?: string) {
  const items = filterHistory(movements, month ? monthRange(month) : {});
  const income = items.filter(m=>m.type === "Ingreso").reduce((sum,m)=>sum+m.amount,0);
  const expenses = items.filter(m=>m.type === "Gasto");
  const spent = expenses.reduce((sum,m)=>sum+m.amount,0);
  const categories = new Map<string,number>();
  const envelopes = new Map<string,{ id: string; name: string; spent: number }>();
  for (const expense of expenses) {
    const category = expense.category || "Sin categoría";
    categories.set(category,(categories.get(category) ?? 0)+expense.amount);
    for (const allocation of expense.allocations) {
      // Old ambiguous names are reported without assigning a made-up envelope ID.
      const id = allocation.envelopeId || `legacy:${allocation.name}`;
      const row = envelopes.get(id) ?? {id,name:allocation.name,spent:0};
      row.spent += allocation.amount;
      envelopes.set(id,row);
    }
  }
  const byEnvelope = [...envelopes.values()].sort((a,b)=>b.spent-a.spent);
  return { income, spent, net: income-spent, count: items.length, categories: [...categories].sort((a,b)=>b[1]-a[1]), envelopes: byEnvelope, withoutEnvelope: spent-byEnvelope.reduce((sum,e)=>sum+e.spent,0) };
}
