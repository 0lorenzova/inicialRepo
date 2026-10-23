import { DEFAULT_GOAL_THRESHOLDS, LEGACY_GOAL_THRESHOLDS, getEnvelopeGoal, getTemporalState, validateTemporalSettings, type GoalSettings, type GoalTemporalState, type GoalThresholds } from "./envelope-goals";
import { postMovement, type Ledger } from "./finance-ledger";
import { previewPostponement } from "./finance-recurrence";
import { temporalDistance } from "./envelope-goals";

export type ScheduledRepetition = { frequency: "daily" | "weekly" | "monthly" | "yearly"; anchorDay: number; seriesId: string; endDate?: string };
export type ScheduledPayment = { movementId: string; amount: number; date: string; accountId: string };

export type ScheduledAmount = {
  id: string;
  name: string;
  amount: number;
  deadline: string;
  plannedPaymentDate?: string;
  occurrenceDate?: string;
  thresholds?: GoalThresholds;
  active: boolean;
  timingEnabled: boolean;
  repetition?: ScheduledRepetition;
  payment?: ScheduledPayment;
  payments?: ScheduledPayment[];
  /** The original date is retained when a single occurrence is postponed. */
  postponedFrom?: string;
  /** Omission is an occurrence-level planning state; it never creates a movement. */
  omittedAt?: string;
};
export type EnvelopePlanning = { scheduledAmounts?: ScheduledAmount[]; balanceHidden?: boolean };
export type PlanningEnvelope = GoalSettings & EnvelopePlanning & { id: string; name: string; balance: number; archived?: boolean };
export type PlanningItem = { id: string; kind: "goal" | "scheduled"; recurrent?: boolean; name: string; amount: number; paidAmount?: number; remainingAmount?: number; payments?: ScheduledPayment[]; deadline?: string; plannedPaymentDate?: string; temporal: GoalTemporalState | null; timingEnabled: boolean; greenDays?: number; payment?: ScheduledAmount["payment"]; omitted?: boolean; postponedFrom?: string; covered?: boolean; coverageHidden?: boolean; fundedAmount?: number; shortfall?: number };
export const proximityTones = ["white", "green", "yellow", "red", "purple"] as const;
export type ProximityFilter = typeof proximityTones[number];
export const proximityLabels = { white: "Blanco", green: "Verde", yellow: "Amarillo", red: "Rojo", purple: "Púrpura" };
export const planningTone = (item: PlanningItem): ProximityFilter => item.temporal?.tone ?? "white";

// A plan is not a payment. Coverage, proximity and the current day do not affect this warning.
export function plannedPaymentDelay(item: Pick<PlanningItem, "deadline" | "plannedPaymentDate" | "payment">): number {
  if (item.payment || !item.deadline || !item.plannedPaymentDate) return 0;
  try { return Math.max(0, temporalDistance(item.plannedPaymentDate, item.deadline)); }
  catch { return 0; } // Preserve malformed legacy records without breaking financial screens.
}

export function globalPlanningItems(envelopes: PlanningEnvelope[], today: string, filter?: ProximityFilter) {
  return envelopes.filter(e => !e.archived).flatMap(envelope => planningItems(envelope, today)
    .filter(item => !item.payment && !item.omitted && (!filter || planningTone(item) === filter))
    .map(item => ({ envelopeId: envelope.id, envelopeName: envelope.name, item })))
    .sort((a,b) => (a.item.deadline || "9999").localeCompare(b.item.deadline || "9999") || a.item.id.localeCompare(b.item.id));
}

export function planningItems(envelope: PlanningEnvelope, today: string): PlanningItem[] {
  const goal = getEnvelopeGoal(envelope, today);
  const items: PlanningItem[] = goal.active ? [{ id: envelope.goalId || "goal", kind: "goal", name: envelope.goalName?.trim() || `Meta de ${envelope.name}`, amount: goal.amount, deadline: envelope.goalDate, plannedPaymentDate: envelope.goalPlannedPaymentDate, temporal: goal.temporal, greenDays: (envelope.goalThresholds ?? LEGACY_GOAL_THRESHOLDS).green, timingEnabled: envelope.goalTimingEnabled !== false }] : [];
  for (const item of envelope.scheduledAmounts ?? []) {
    if (!item.active) continue;
    let temporal: GoalTemporalState | null = null;
    try { if (!item.payment && !item.omittedAt) temporal = getTemporalState(item.deadline, today, item.thresholds ?? DEFAULT_GOAL_THRESHOLDS).temporal; }
    catch { /* Preserve legacy planning data; invalid optional dates never break financial screens. */ }
    const paidAmount = scheduledPaidAmount(item);
    items.push({ id: item.id, kind: "scheduled", recurrent: Boolean(item.repetition), name: item.name, amount: item.amount, paidAmount, remainingAmount: Math.max(0, item.amount - paidAmount), payments: scheduledPayments(item), deadline: item.deadline, plannedPaymentDate: item.plannedPaymentDate, temporal, greenDays: (item.thresholds ?? DEFAULT_GOAL_THRESHOLDS).green, timingEnabled: item.timingEnabled !== false, payment: item.payment, omitted: Boolean(item.omittedAt), postponedFrom: item.postponedFrom });
  }
  return allocatePlanningCoverage(items.sort((a,b) => (a.deadline || "9999").localeCompare(b.deadline || "9999") || a.id.localeCompare(b.id)), envelope.balance).map(item=>({...item,coverageHidden:envelope.balanceHidden||undefined}));
}

// Projection only. Each colón covers one obligation, in the existing chronological
// display order. Paid items and deficits never contribute spendable funds.
export function allocatePlanningCoverage(items: PlanningItem[], balance: number): PlanningItem[] {
  let remaining = Number.isSafeInteger(balance) ? Math.max(0, balance) : 0;
  return items.map(item => {
    if (item.payment || item.omitted) return { ...item, covered: undefined, fundedAmount: undefined, shortfall: undefined };
    const required = item.remainingAmount ?? item.amount;
    const valid = Number.isSafeInteger(required) && required > 0;
    const fundedAmount = valid ? Math.min(remaining, required) : 0;
    remaining -= fundedAmount;
    return { ...item, fundedAmount, shortfall: valid ? required - fundedAmount : undefined, covered: valid && fundedAmount === required };
  });
}

export function planningCoverage(items: PlanningItem[]): boolean | undefined {
  const pending = items.filter(item => !item.payment && !item.omitted);
  return pending.length&&!pending.some(item=>item.coverageHidden) ? pending.every(item => item.covered === true) : undefined;
}

export function proximityCounts(items: PlanningItem[]) {
  const counts = { white: 0, green: 0, yellow: 0, red: 0, purple: 0 };
  for (const item of items) if (!item.payment && !item.omitted) counts[planningTone(item)]++;
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
  if (item.plannedPaymentDate) {
    try { temporalDistance(item.plannedPaymentDate, item.plannedPaymentDate); }
    catch { throw new Error("Selecciona una fecha prevista de pago válida."); }
  }
  if (item.timingEnabled && item.thresholds) validateTemporalSettings(item.deadline, item.thresholds);
  if (item.occurrenceDate) temporalDistance(item.occurrenceDate,item.occurrenceDate);
  if (item.postponedFrom) temporalDistance(item.postponedFrom,item.postponedFrom);
  if (item.omittedAt) temporalDistance(item.omittedAt,item.omittedAt);
  if (item.repetition?.endDate) temporalDistance(item.repetition.endDate,item.repetition.endDate);
  if (item.repetition) nextScheduledDate(item);
}

export function nextScheduledDate(item: ScheduledAmount): string {
  const repeat = item.repetition;
  if (!repeat || !["daily", "weekly", "monthly", "yearly"].includes(repeat.frequency) || !repeat.seriesId) throw new Error("Selecciona una frecuencia válida para repetir el importe.");
  return previewPostponement(item.occurrenceDate ?? item.deadline, { unit: ["monthly","yearly"].includes(repeat.frequency) ? "months" : "days", amount: repeat.frequency === "yearly" ? 12 : repeat.frequency === "weekly" ? 7 : 1 }, repeat.anchorDay);
}

const comparable = (item: ScheduledAmount) => JSON.stringify([item.id, item.name, item.amount, item.deadline, item.plannedPaymentDate, item.occurrenceDate, item.active, item.timingEnabled, item.postponedFrom, item.omittedAt, item.payment, item.payments, ...( ["green", "yellow", "red"] as const).map(tone => item.thresholds?.[tone] ?? null), item.repetition?.frequency, item.repetition?.anchorDay, item.repetition?.seriesId, item.repetition?.endDate]);

export function scheduledPayments(item: ScheduledAmount): ScheduledPayment[] {
  return item.payments?.length ? item.payments : item.payment ? [item.payment] : [];
}

export function scheduledPaidAmount(item: ScheduledAmount): number {
  return scheduledPayments(item).reduce((sum, payment) => sum + (Number.isSafeInteger(payment.amount) && payment.amount > 0 ? payment.amount : 0), 0);
}

// Update only the selected planning item on the current envelope. Never copy a stale balance.
export function saveScheduledAmount<T extends PlanningEnvelope>(envelopes: T[], envelopeId: string, requested: ScheduledAmount, original: ScheduledAmount | null): T[] {
  validateScheduledAmount(requested);
  const envelope = envelopes.find(item => item.id === envelopeId);
  if (!envelope || envelope.archived) throw new Error("El sobre ya no está activo. Vuelve a la lista de sobres.");
  const items = envelope.scheduledAmounts ?? [];
  const current = items.find(item => item.id === requested.id);
  if (current?.payment || requested.payment || current?.payments?.length || requested.payments?.length) throw new Error("Este importe ya tiene pagos registrados y conserva sus comprobantes en Movimientos.");
  if (current?.omittedAt || requested.omittedAt) throw new Error("Esta ocurrencia fue omitida y se conserva en el historial.");
  if (original ? !current || original.id !== requested.id || comparable(current) !== comparable(original) : Boolean(current)) {
    throw new Error("El importe cambió mientras lo editabas. Cierra el formulario y vuelve a abrirlo.");
  }
  const occurrenceDate = requested.occurrenceDate ?? original?.occurrenceDate ?? (original?.repetition ? original.deadline : undefined);
  const updated = { ...requested, ...(occurrenceDate ? {occurrenceDate} : {}), name: requested.name.trim(), thresholds: requested.thresholds ? { ...requested.thresholds } : undefined };
  return envelopes.map(item => item.id === envelopeId ? { ...item, scheduledAmounts: original ? items.map(existing => existing.id === requested.id ? updated : existing) : [...items, updated] } : item);
}

export function payScheduledAmount(ledger: Ledger, envelopeId: string, itemId: string, amount: number, accountId: string, date: string): Ledger {
  const envelope = ledger.envelopes.find(item => item.id === envelopeId && !item.archived) as PlanningEnvelope | undefined;
  const item = envelope?.scheduledAmounts?.find(item => item.id === itemId && item.active);
  if (!item) throw new Error("El importe ya no está activo.");
  if (item.omittedAt) throw new Error("Esta ocurrencia fue omitida. No se registró ningún gasto.");
  if (item.payment) throw new Error("Este importe ya está pagado. No se registró otro gasto.");
  const payments = scheduledPayments(item);
  const paidBefore = scheduledPaidAmount(item);
  const remaining = Math.max(0, item.amount - paidBefore);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Ingresa un monto entero mayor que cero.");
  if (amount > remaining) throw new Error("El pago supera el saldo pendiente de esta ocurrencia.");
  const paidAfter = paidBefore + amount;
  const completes = paidAfter >= item.amount;
  const following = completes && item.repetition && (!item.repetition.endDate || nextScheduledDate(item)<=item.repetition.endDate) ? { ...item, id: `scheduled:${item.repetition.seriesId}:${nextScheduledDate(item)}`, deadline: nextScheduledDate(item), occurrenceDate: nextScheduledDate(item), plannedPaymentDate: undefined, payment: undefined, payments: undefined, omittedAt: undefined, postponedFrom: undefined } : null;
  if (following && envelope!.scheduledAmounts!.some(p => p.id === following.id || (p.repetition?.seriesId === item.repetition!.seriesId && p.deadline === following.deadline))) throw new Error("La siguiente ocurrencia ya existe. Revisa la programación antes de pagar.");
  const movementId = `scheduled-payment:${envelopeId}:${itemId}:${paidBefore}`;
  if (ledger.movements.some(movement => movement.id === movementId)) throw new Error("Este abono ya se registró. Actualiza el detalle antes de volver a intentarlo.");
  const next = postMovement(ledger, { id: movementId, type: "Gasto", amount, accountId, envelopeAllocations: [{ id: envelopeId, amount }], date, name: `Pago: ${item.name}`, category: "Importe programado" });
  const payment = { movementId, amount, date, accountId };
  return { ...next, movements: next.movements.map(m => m.id === movementId ? { ...m, scheduledAmountId: itemId } : m), envelopes: next.envelopes.map(e => e.id === envelopeId ? { ...e, scheduledAmounts: [...envelope!.scheduledAmounts!.map(p => p.id === itemId ? { ...p, payments: [...payments, payment], payment: completes ? payment : undefined } : p), ...(following ? [following] : [])] } : e) };
}

export function planningIndicators(items: PlanningItem[]): ProximityFilter[] {
  const counts = proximityCounts(items);
  return proximityTones.filter(tone => counts[tone] > 0);
}
export function planningStateText(item: PlanningItem): string {
  if (item.omitted) return "Omitido. No se registró ningún movimiento.";
  if (item.payment) return "Pagado";
  if ((item.paidAmount ?? 0) > 0) return "Abono parcial. Aún hay un saldo pendiente.";
  if (item.postponedFrom) return `Pospuesto desde ${item.postponedFrom}.`;
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
  if (current.payment || original.payment || current.payments?.length || original.payments?.length) throw new Error("Los importes con pagos registrados conservan su sobre e historial original.");
  if (current.omittedAt || original.omittedAt) throw new Error("Las ocurrencias omitidas conservan su historial en el sobre original.");
  if (comparable(current)!==comparable(original)) throw new Error("El importe cambió. Vuelve a abrirlo antes de moverlo.");
  if (target.scheduledAmounts?.some(item=>item.id===current.id || (current.repetition && item.repetition?.seriesId===current.repetition.seriesId && item.deadline===current.deadline))) throw new Error("El destino ya contiene esa programación.");
  return envelopes.map(envelope=>envelope.id===sourceId ? { ...envelope, scheduledAmounts: envelope.scheduledAmounts!.filter(item=>item.id!==current.id) } : envelope.id===targetId ? { ...envelope, scheduledAmounts: [...(envelope.scheduledAmounts??[]),current] } : envelope);
}

/** Change only the selected occurrence date; recurrence remains anchored to occurrenceDate. */
export function postponeScheduledOccurrence<T extends PlanningEnvelope>(envelopes: T[], envelopeId: string, itemId: string, newDate: string): T[] {
  temporalDistance(newDate, newDate);
  const envelope = envelopes.find(item => item.id === envelopeId && !item.archived);
  const current = envelope?.scheduledAmounts?.find(item => item.id === itemId && item.active);
  if (!envelope || !current) throw new Error("El compromiso ya no está activo.");
  if (current.payment || current.omittedAt) throw new Error("Este compromiso ya fue completado u omitido.");
  if (newDate <= current.deadline) throw new Error("La nueva fecha debe ser posterior a la fecha programada.");
  return envelopes.map(item => item.id === envelopeId ? {
    ...item,
    scheduledAmounts: item.scheduledAmounts?.map(value => value.id === itemId ? {
      ...value,
      postponedFrom: value.postponedFrom ?? value.deadline,
      // Keep the recurring series anchored to its original occurrence date.
      occurrenceDate: value.occurrenceDate ?? (value.repetition ? value.deadline : undefined),
      deadline: newDate,
    } : value),
  } : item);
}

/** Omit exactly one pending occurrence and materialize its next recurrence once. */
export function omitScheduledOccurrence<T extends PlanningEnvelope>(envelopes: T[], envelopeId: string, itemId: string, date: string): T[] {
  temporalDistance(date, date);
  const envelope = envelopes.find(item => item.id === envelopeId && !item.archived);
  const current = envelope?.scheduledAmounts?.find(item => item.id === itemId && item.active);
  if (!envelope || !current) throw new Error("El compromiso ya no está activo.");
  if (current.payment) throw new Error("Este importe ya está pagado.");
  if (current.omittedAt) throw new Error("Esta ocurrencia ya fue omitida.");
  const repeat = current.repetition;
  let following: ScheduledAmount | null = null;
  if (repeat) {
    const nextDate = nextScheduledDate(current);
    if (!repeat.endDate || nextDate <= repeat.endDate) {
      const id = `scheduled:${repeat.seriesId}:${nextDate}`;
      const duplicate = envelope.scheduledAmounts?.some(item => item.id === id || (item.repetition?.seriesId === repeat.seriesId && item.deadline === nextDate));
      if (!duplicate) following = { ...current, id, deadline: nextDate, plannedPaymentDate: undefined, occurrenceDate: nextDate, postponedFrom: undefined, omittedAt: undefined, payment: undefined, payments: undefined };
    }
  }
  return envelopes.map(item => item.id === envelopeId ? {
    ...item,
    scheduledAmounts: item.scheduledAmounts?.map(value => value.id === itemId ? { ...value, omittedAt: date } : value).concat(following ? [following] : []),
  } : item);
}

// Separate indicators with different warnings, even when they share a proximity tone.
export function planningIndicatorGroups(items: PlanningItem[]) {
  return proximityTones.flatMap(tone => [false,true].flatMap(late => {
    const matches=items.filter(item=>!item.payment && planningTone(item)===tone && (plannedPaymentDelay(item)>0)===late);
    return matches.length ? [{tone,late,items:matches}] : [];
  }));
}

/** Describes planned lateness, independently of today's proximity state. */
export function plannedPaymentDelayText(days: number): string {
  return days > 0 ? `Pago previsto con ${days} ${days === 1 ? "día" : "días"} de atraso` : "";
}
export function plannedPaymentWarnings(items: Pick<PlanningItem, "deadline" | "plannedPaymentDate" | "payment">[]): string {
  return [...new Set(items.map(plannedPaymentDelay).filter(days=>days>0))].sort((a,b)=>a-b).map(plannedPaymentDelayText).join("; ");
}
