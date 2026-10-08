import { DEFAULT_GOAL_THRESHOLDS, LEGACY_GOAL_THRESHOLDS, getEnvelopeGoal, getTemporalState, validateTemporalSettings, type GoalSettings, type GoalTemporalState, type GoalThresholds } from "./envelope-goals";
import { postMovement, type Ledger } from "./finance-ledger";
import { previewPostponement } from "./finance-recurrence";
import { temporalDistance } from "./envelope-goals";

export type ScheduledRepetition = { frequency: "daily" | "weekly" | "monthly"; anchorDay: number; seriesId: string };

export type ScheduledAmount = {
  id: string;
  name: string;
  amount: number;
  deadline: string;
  thresholds?: GoalThresholds;
  active: boolean;
  timingEnabled: boolean;
  repetition?: ScheduledRepetition;
  payment?: { movementId: string; amount: number; date: string; accountId: string };
};
export type EnvelopePlanning = { scheduledAmounts?: ScheduledAmount[]; balanceHidden?: boolean };
export type PlanningEnvelope = GoalSettings & EnvelopePlanning & { id: string; name: string; balance: number; archived?: boolean };
export type PlanningItem = { id: string; kind: "goal" | "scheduled"; name: string; amount: number; deadline?: string; temporal: GoalTemporalState | null; timingEnabled: boolean; greenDays?: number; payment?: ScheduledAmount["payment"] };
export const proximityTones = ["white", "green", "yellow", "red", "purple"] as const;
export type ProximityFilter = typeof proximityTones[number];
export const proximityLabels = { white: "Blanco", green: "Verde", yellow: "Amarillo", red: "Rojo", purple: "Púrpura" };
export const planningTone = (item: PlanningItem): ProximityFilter => item.temporal?.tone ?? "white";

export function globalPlanningItems(envelopes: PlanningEnvelope[], today: string, filter?: ProximityFilter) {
  return envelopes.filter(e => !e.archived).flatMap(envelope => planningItems(envelope, today)
    .filter(item => !item.payment && (!filter || planningTone(item) === filter))
    .map(item => ({ envelopeId: envelope.id, envelopeName: envelope.name, item })))
    .sort((a,b) => (a.item.deadline || "9999").localeCompare(b.item.deadline || "9999") || a.item.id.localeCompare(b.item.id));
}

export function planningItems(envelope: PlanningEnvelope, today: string): PlanningItem[] {
  const goal = getEnvelopeGoal(envelope, today);
  const items: PlanningItem[] = goal.active ? [{ id: envelope.goalId || "goal", kind: "goal", name: envelope.goalName?.trim() || `Meta de ${envelope.name}`, amount: goal.amount, deadline: envelope.goalDate, temporal: goal.temporal, greenDays: (envelope.goalThresholds ?? LEGACY_GOAL_THRESHOLDS).green, timingEnabled: envelope.goalTimingEnabled !== false }] : [];
  for (const item of envelope.scheduledAmounts ?? []) {
    if (!item.active) continue;
    let temporal: GoalTemporalState | null = null;
    try { if (!item.payment) temporal = getTemporalState(item.deadline, today, item.thresholds ?? DEFAULT_GOAL_THRESHOLDS).temporal; }
    catch { /* Preserve legacy planning data; invalid optional dates never break financial screens. */ }
    items.push({ id: item.id, kind: "scheduled", name: item.name, amount: item.amount, deadline: item.deadline, temporal, greenDays: (item.thresholds ?? DEFAULT_GOAL_THRESHOLDS).green, timingEnabled: item.timingEnabled !== false, payment: item.payment });
  }
  return items.sort((a,b) => (a.deadline || "9999").localeCompare(b.deadline || "9999") || a.id.localeCompare(b.id));
}

export function proximityCounts(items: PlanningItem[]) {
  const counts = { white: 0, green: 0, yellow: 0, red: 0, purple: 0 };
  for (const item of items) if (!item.payment) counts[planningTone(item)]++;
  return counts;
}

export function mostUrgent(items: PlanningItem[]): GoalTemporalState | null {
  const priority = { green: 1, yellow: 2, red: 3, purple: 4 };
  return items.reduce<GoalTemporalState | null>((urgent, item) => item.temporal && (!urgent || priority[item.temporal.tone] > priority[urgent.tone]) ? item.temporal : urgent, null);
}

export function validateScheduledAmount(item: ScheduledAmount): void {
  if (!item.id || !item.name.trim()) throw new Error("Escribe el nombre del importe programado.");
  if (!Number.isSafeInteger(item.amount) || item.amount <= 0) throw new Error("Ingresa un monto programado entero mayor que cero.");
  if (!item.deadline) throw new Error("Selecciona la fecha límite del importe.");
  temporalDistance(item.deadline, item.deadline);
  if (item.timingEnabled && item.thresholds) validateTemporalSettings(item.deadline, item.thresholds);
  if (item.repetition) nextScheduledDate(item);
}

export function nextScheduledDate(item: ScheduledAmount): string {
  const repeat = item.repetition;
  if (!repeat || !["daily", "weekly", "monthly"].includes(repeat.frequency) || !repeat.seriesId) throw new Error("Selecciona una frecuencia válida para repetir el importe.");
  return previewPostponement(item.deadline, { unit: repeat.frequency === "monthly" ? "months" : "days", amount: repeat.frequency === "weekly" ? 7 : 1 }, repeat.anchorDay);
}

const comparable = (item: ScheduledAmount) => JSON.stringify([item.id, item.name, item.amount, item.deadline, item.active, item.timingEnabled, ...( ["green", "yellow", "red"] as const).map(tone => item.thresholds?.[tone] ?? null), item.repetition?.frequency, item.repetition?.anchorDay, item.repetition?.seriesId]);

// Update only the selected planning item on the current envelope. Never copy a stale balance.
export function saveScheduledAmount<T extends PlanningEnvelope>(envelopes: T[], envelopeId: string, requested: ScheduledAmount, original: ScheduledAmount | null): T[] {
  validateScheduledAmount(requested);
  const envelope = envelopes.find(item => item.id === envelopeId);
  if (!envelope || envelope.archived) throw new Error("El sobre ya no está activo. Vuelve a la lista de sobres.");
  const items = envelope.scheduledAmounts ?? [];
  const current = items.find(item => item.id === requested.id);
  if (current?.payment || requested.payment) throw new Error("Este importe ya está pagado y conserva su comprobante en Movimientos.");
  if (original ? !current || original.id !== requested.id || comparable(current) !== comparable(original) : Boolean(current)) {
    throw new Error("El importe cambió mientras lo editabas. Cierra el formulario y vuelve a abrirlo.");
  }
  const updated = { ...requested, name: requested.name.trim(), thresholds: requested.thresholds ? { ...requested.thresholds } : undefined };
  return envelopes.map(item => item.id === envelopeId ? { ...item, scheduledAmounts: original ? items.map(existing => existing.id === requested.id ? updated : existing) : [...items, updated] } : item);
}

export function payScheduledAmount(ledger: Ledger, envelopeId: string, itemId: string, amount: number, accountId: string, date: string): Ledger {
  const envelope = ledger.envelopes.find(item => item.id === envelopeId && !item.archived) as PlanningEnvelope | undefined;
  const item = envelope?.scheduledAmounts?.find(item => item.id === itemId && item.active);
  if (!item) throw new Error("El importe ya no está activo.");
  if (item.payment) throw new Error("Este importe ya está pagado. No se registró otro gasto.");
  const following = item.repetition ? { ...item, id: `scheduled:${item.repetition.seriesId}:${nextScheduledDate(item)}`, deadline: nextScheduledDate(item), payment: undefined } : null;
  if (following && envelope!.scheduledAmounts!.some(p => p.id === following.id || (p.repetition?.seriesId === item.repetition!.seriesId && p.deadline === following.deadline))) throw new Error("La siguiente ocurrencia ya existe. Revisa la programación antes de pagar.");
  const movementId = `scheduled-payment:${envelopeId}:${itemId}`;
  const next = postMovement(ledger, { id: movementId, type: "Gasto", amount, accountId, envelopeAllocations: [{ id: envelopeId, amount }], date, name: `Pago: ${item.name}`, category: "Importe programado" });
  return { ...next, movements: next.movements.map(m => m.id === movementId ? { ...m, scheduledAmountId: itemId } : m), envelopes: next.envelopes.map(e => e.id === envelopeId ? { ...e, scheduledAmounts: [...envelope!.scheduledAmounts!.map(p => p.id === itemId ? { ...p, payment: { movementId, amount, date, accountId } } : p), ...(following ? [following] : [])] } : e) };
}

export function planningIndicators(items: PlanningItem[]): ProximityFilter[] {
  const counts = proximityCounts(items);
  return proximityTones.filter(tone => counts[tone] > 0);
}
export function planningStateText(item: PlanningItem): string {
  if (item.payment) return "Pagado";
  if (item.temporal) return `${item.temporal.label}. ${item.temporal.explanation}`;
  if (!item.deadline) return "Sin fecha límite";
  if (!item.timingEnabled) return "Seguimiento por proximidad desactivado para este elemento.";
  return item.greenDays !== undefined ? `Faltan más de ${item.greenDays} días para la fecha límite.` : "Sin rangos de proximidad configurados.";
}

// Move planning only. Payments and ledger history keep their original attribution.
export function moveScheduledAmount<T extends PlanningEnvelope>(envelopes: T[], sourceId: string, targetId: string, original: ScheduledAmount): T[] {
  if (sourceId === targetId) throw new Error("Selecciona otro sobre como destino.");
  const source = envelopes.find(e=>e.id===sourceId && !e.archived);
  const target = envelopes.find(e=>e.id===targetId && !e.archived);
  if (!source || !target) throw new Error("Ambos sobres deben estar activos.");
  const current = source.scheduledAmounts?.find(item=>item.id===original.id);
  if (!current || !current.active) throw new Error("El importe ya no está en este sobre.");
  if (current.payment || original.payment) throw new Error("Los importes pagados conservan su sobre e historial original.");
  if (comparable(current)!==comparable(original)) throw new Error("El importe cambió. Vuelve a abrirlo antes de moverlo.");
  if (target.scheduledAmounts?.some(item=>item.id===current.id || (current.repetition && item.repetition?.seriesId===current.repetition.seriesId && item.deadline===current.deadline))) throw new Error("El destino ya contiene esa programación.");
  return envelopes.map(envelope=>envelope.id===sourceId ? { ...envelope, scheduledAmounts: envelope.scheduledAmounts!.filter(item=>item.id!==current.id) } : envelope.id===targetId ? { ...envelope, scheduledAmounts: [...(envelope.scheduledAmounts??[]),current] } : envelope);
}
