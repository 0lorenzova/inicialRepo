import type { LedgerEnvelope, LedgerMovement } from "./finance-ledger";
import { isRecurrenceDue, type Recurrence } from "./finance-recurrence";

export const notificationTones = ["Suave", "Campana", "Breve"] as const;
export type NotificationTone = (typeof notificationTones)[number];
export type NotificationState = {
  internal: boolean;
  system: boolean;
  sound: boolean;
  tone: NotificationTone;
  initialized: boolean;
  readIds: string[];
  dismissedIds: string[];
  deliveredIds: string[];
};
export type NotificationDestination = { page: "Movimientos" | "Recordatorios"; movementId?: string; envelopeId?: string };
export type FinanceNotification = {
  id: string;
  title: string;
  detail: string;
  date: string;
  amount: number;
  kind: "movement" | "reminder";
  destination: NotificationDestination;
};
export type NotificationEnvelope = LedgerEnvelope & { recurrence?: Recurrence };
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
export function deriveFinanceNotifications(movements: LedgerMovement[], envelopes: NotificationEnvelope[], today: string): FinanceNotification[] {
  const result = new Map<string, FinanceNotification>();
  for (const movement of movements) {
    const id = `movement:${movement.id}`;
    result.set(id, {
      id, title: movement.type, detail: movement.name, date: movement.date,
      amount: movement.amount, kind: "movement",
      destination: { page: "Movimientos", movementId: movement.id },
    });
  }
  for (const envelope of envelopes) {
    if (!isRecurrenceDue(envelope, today) || !envelope.recurrence) continue;
    const dueDate = envelope.recurrence.nextDate;
    const id = `reminder:${encodeURIComponent(envelope.id)}:${dueDate}`;
    result.set(id, {
      id, title: "Aporte pendiente", detail: envelope.name,
      amount: envelope.recurrence.amount, date: `${dueDate}T00:00`, kind: "reminder",
      destination: { page: "Recordatorios", envelopeId: envelope.id },
    });
  }
  // Equal timestamps retain the ledger's order, just as Movimientos does.
  return [...result.values()].sort((a, b) => b.date.localeCompare(a.date));
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
