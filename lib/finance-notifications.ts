import { envelopeLabel } from "./envelope-label";
import { globalPlanningItems, plannedPaymentDelay, plannedPaymentDelayText, type PlanningEnvelope, type PlanningItem } from "./envelope-planning";
import { getTemporalState, type GoalTemporalState } from "./envelope-goals";
import type { LedgerMovement, Loan } from "./finance-ledger";
import { isRecurrenceDue, recurrenceDueDate, type Recurrence } from "./finance-recurrence";

export const notificationTones = ["Suave", "Campana", "Breve"] as const;
export type NotificationTone = (typeof notificationTones)[number];
export type NotificationState = {
  internal: boolean;
  showResponsibilityAmount?: boolean;
  system: boolean;
  sound: boolean;
  tone: NotificationTone;
  initialized: boolean;
  readIds: string[];
  dismissedIds: string[];
  deliveredIds: string[];
};
export type NotificationDestination = { page: "Movimientos" | "Recordatorios" | "Cronograma" | "Préstamos"; movementId?: string; envelopeId?: string; itemId?: string; itemKind?: PlanningItem["kind"] };
export type FinanceNotification = {
  id: string;
  title: string;
  detail: string;
  concept?: string;
  context?: string;
  description?: string;
  actionKind?: "payment" | "contribution" | "goal" | "loan" | "information";
  date: string;
  amount: number;
  kind: "movement" | "reminder" | "attention" | "loan";
  tone?: GoalTemporalState["tone"];
  covered?: boolean;
  plannedPaymentDate?: string;
  plannedLate?: boolean;
  plannedLateLabel?: string;
  destination: NotificationDestination;
};
export type NotificationEnvelope = PlanningEnvelope & { recurrence?: Recurrence };
export type NotificationUpdate = (update: (current: NotificationState) => NotificationState) => void;

export function saveNotificationUpdate(persist: NotificationUpdate, update: (current: NotificationState) => NotificationState): string | null {
  try {
    persist(update);
    return null;
  } catch {
    // Preference failures must not make the financial workspace unusable.
    return "No se pudo guardar la preferencia de notificaciones. Revisa la sincronización o el espacio del navegador e inténtalo de nuevo.";
  }
}

const ids = (value: unknown) => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string"))] : [];

export function normalizeNotificationState(value?: Partial<NotificationState> | null): NotificationState {
  return {
    internal: typeof value?.internal === "boolean" ? value.internal : true,
    showResponsibilityAmount: value?.showResponsibilityAmount === true,
    system: value?.system === true,
    sound: value?.sound === true,
    tone: notificationTones.includes(value?.tone as NotificationTone) ? value!.tone! : "Suave",
    initialized: value?.initialized === true,
    readIds: ids(value?.readIds),
    dismissedIds: ids(value?.dismissedIds),
    deliveredIds: ids(value?.deliveredIds),
  };
}

// Notification contents are projections of the ledger and due reminders. Only
// read/dismiss/delivery preferences are persisted; no financial copy is created.
export function deriveFinanceNotifications(movements: LedgerMovement[], envelopes: NotificationEnvelope[], today: string, loans: Loan[] = []): FinanceNotification[] {
  const result = new Map<string, FinanceNotification>();
  // Ordinary activity belongs exclusively to Movimientos.
  void movements;
  for (const {envelopeId,envelopeName,item} of globalPlanningItems(envelopes,today)) {
    if (!item.temporal || !["red","purple","yellow"].includes(item.temporal.tone)) continue;
    const stage = item.deadline === today ? "today" : item.temporal.tone;
    const id = `attention:${encodeURIComponent(envelopeId)}:${item.kind}:${encodeURIComponent(item.id)}:${item.deadline}:${stage}`;
    result.set(id,{id,title:item.temporal.label,detail:`${item.name} · ${envelopeLabel(envelopeName)}. ${item.temporal.explanation}`,concept:item.name,context:envelopeLabel(envelopeName),description:item.temporal.explanation,actionKind:item.kind==="scheduled"?"payment":"goal",date:`${item.deadline}T00:00`,amount:item.remainingAmount??item.amount,kind:"attention",plannedPaymentDate:item.plannedPaymentDate,plannedLate:plannedPaymentDelay(item)>0,plannedLateLabel:plannedPaymentDelayText(plannedPaymentDelay(item)),tone:item.temporal.tone,covered:item.coverageHidden?undefined:item.covered,destination:{page:"Cronograma",envelopeId,itemId:item.id,itemKind:item.kind}});
  }
  for (const envelope of envelopes) {
    if (!envelope.recurrence) continue;
    let dueDate:string, due:boolean, temporal:GoalTemporalState|null;
    let pendingAmount=envelope.recurrence.amount;
    try {
      dueDate = recurrenceDueDate(envelope.recurrence);
      if (envelope.recurrence.endDate && dueDate > envelope.recurrence.endDate) continue;
      const reference=`Aporte recurrente · ${envelope.recurrence.nextDate}`;
      const contributed=movements
        .filter(movement=>movement.type==="Asignación"&&movement.reference===reference)
        .reduce((sum,movement)=>sum+(movement.allocations.find(allocation=>allocation.envelopeId===envelope.id)?.amount??0),0);
      pendingAmount=Math.max(0,envelope.recurrence.amount-contributed);
      if(pendingAmount===0)continue;
      due = isRecurrenceDue(envelope, today);
      temporal = getTemporalState(dueDate,today).temporal;
    } catch { continue; }
    if (!temporal || (!due && !["yellow","red"].includes(temporal.tone))) continue;
    const id = due
      ? `reminder:${encodeURIComponent(envelope.id)}:${dueDate}:${temporal.tone}`
      : `reminder:${encodeURIComponent(envelope.id)}:${dueDate}:upcoming`;
    result.set(id, {
      id, title: due ? "Aporte pendiente" : "Aporte próximo", detail: `${envelopeLabel(envelope.name)}. ${temporal.explanation}`, concept: due ? "Aporte pendiente" : "Aporte próximo", context: envelopeLabel(envelope.name), description: temporal.explanation, actionKind: "contribution", tone: temporal.tone,
      amount: pendingAmount, date: `${dueDate}T00:00`, kind: "reminder",
      destination: { page: "Recordatorios", envelopeId: envelope.id },
    });
  }
  for (const loan of loans) {
    if (!loan.dueDate || !Number.isSafeInteger(loan.outstanding) || loan.outstanding <= 0) continue;
    let daysRemaining: number;
    let temporal: GoalTemporalState;
    try {
      const state = getTemporalState(loan.dueDate, today);
      daysRemaining = state.daysRemaining;
      if (daysRemaining > 0 || !state.temporal) continue;
      temporal = state.temporal;
    } catch {
      // Older or imported malformed data should not break the notification list.
      continue;
    }
    const stage = daysRemaining < 0 ? "overdue" : "today";
    const id = `loan:${encodeURIComponent(loan.id)}:${loan.dueDate}:${stage}`;
    const title = stage === "overdue" ? "Devolución de préstamo vencida" : "Devolución de préstamo vence hoy";
    const detail = stage === "overdue"
      ? `${loan.targetName} debe devolver a ${loan.sourceName}. La fecha límite pasó hace ${Math.abs(daysRemaining)} ${Math.abs(daysRemaining) === 1 ? "día" : "días"}.`
      : `${loan.targetName} debe devolver a ${loan.sourceName}. La fecha límite es hoy.`;
    result.set(id, {
      id, title, detail, concept: "Devolución de préstamo", context: `${loan.targetName} → ${loan.sourceName}`, actionKind: "loan", date: `${loan.dueDate}T00:00`, amount: loan.outstanding, kind: "loan", tone: temporal.tone,
      destination: { page: "Préstamos" },
    });
  }
  // Overdue obligations first, then nearest deadline. IDs keep delivery idempotent.
  return [...result.values()].sort((a, b) => Number(b.tone === "purple") - Number(a.tone === "purple") || a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
}

export function initializeNotifications(state: NotificationState, events: FinanceNotification[]): NotificationState {
  if (state.initialized) return state;
  const history = events.filter(event => event.kind === "movement").map(event => event.id);
  return {
    ...state, initialized: true,
    readIds: [...new Set([...state.readIds, ...history])],
    deliveredIds: [...new Set([...state.deliveredIds, ...history])],
  };
}

export function visibleNotifications(state: NotificationState, events: FinanceNotification[]): FinanceNotification[] {
  const dismissed = new Set(state.dismissedIds);
  return events.filter(event => !dismissed.has(event.id));
}

export function pendingNotificationDelivery(state: NotificationState, events: FinanceNotification[]): FinanceNotification[] {
  const consumed = new Set([...state.deliveredIds, ...state.dismissedIds, ...state.readIds]);
  return events.filter(event => !consumed.has(event.id));
}

export function markNotifications(state: NotificationState, field: "readIds" | "dismissedIds" | "deliveredIds", eventIds: string[]): NotificationState {
  return { ...state, [field]: [...new Set([...state[field], ...eventIds])] };
}

// The amount belongs to the pending obligation, never to its envelope balance or coverage shortfall.
export function notificationDetail(event:FinanceNotification, showAmount:boolean, privateMode:boolean):string {
  if(privateMode)return "Los detalles están ocultos por privacidad.";
  if(!showAmount)return event.detail;
  const amount=new Intl.NumberFormat("es-CR",{style:"currency",currency:"CRC",maximumFractionDigits:0}).format(event.amount);
  return `${event.detail} · Importe pendiente: ${amount}`;
}
