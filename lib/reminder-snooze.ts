import { deriveReminderRecords, type ReminderEnvelope } from "./finance-reminders";
import { contributionStep, previewPostponement, recurrenceDates, type PostponeOption } from "./finance-recurrence";
import { temporalDistance } from "./envelope-goals";
import type { LedgerMovement, Loan } from "./finance-ledger";

export type ReminderSource = { kind: "scheduled" | "goal" | "contribution" | "loan"; envelopeId?: string; itemId?: string; date?: string };
export type ReminderTarget = ReminderSource & { key: string; title: string; amount: number; context?: string; originalDate: string; nextDate?: string };
export type ReminderSnooze = { until: string; originalDate: string };
export type ReminderSnoozes = Record<string, ReminderSnooze>;

// Occurrence identity never includes urgency, read status or the postponed date.
export function reminderKey(source: ReminderSource): string {
  return JSON.stringify([source.kind, source.envelopeId ?? "", source.itemId ?? "", source.date ?? ""]);
}
export function validReminderDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) return false;
  try { temporalDistance(value, value); return new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value; } catch { return false; }
}
export function normalizeReminderSnoozes(value: unknown): ReminderSnoozes {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, entry]) => {
    if (!entry || typeof entry !== "object") return false;
    const item = entry as ReminderSnooze;
    try { const parts = JSON.parse(key); return Array.isArray(parts) && parts.length === 4 && parts.every(part => typeof part === "string") && validReminderDate(item.until) && validReminderDate(item.originalDate); } catch { return false; }
  }).map(([key, entry]) => [key, { until: (entry as ReminderSnooze).until, originalDate: (entry as ReminderSnooze).originalDate }]));
}
export function snoozeReminder(current: ReminderSnoozes, target: ReminderTarget, until: string, today: string): ReminderSnoozes {
  if (!validReminderDate(today) || !validReminderDate(until) || until <= today) throw new Error("Selecciona una fecha futura válida.");
  return { ...current, [target.key]: { until, originalDate: target.originalDate } };
}
export function cancelReminderSnooze(current: ReminderSnoozes, key: string): ReminderSnoozes {
  const next = { ...current }; delete next[key]; return next;
}
export function pruneReminderSnoozes(current: ReminderSnoozes, targets: ReminderTarget[]): ReminderSnoozes {
  const active = new Set(targets.map(target => target.key));
  return Object.fromEntries(Object.entries(current).filter(([key]) => active.has(key)));
}
export function isReminderSnoozed(current: ReminderSnoozes | undefined, key: string | undefined, today: string): boolean {
  return Boolean(key && current?.[key]?.until && current[key].until > today);
}

function followingDate(start: string, today: string, step: PostponeOption, anchorDay?: number, endDate?: string): string | undefined {
  try {
    const from = previewPostponement(start > today ? start : today, { unit: "days", amount: 1 });
    const to = previewPostponement(from, { unit: "days", amount: 366 });
    return recurrenceDates(start, from, to, step, anchorDay, endDate)[0];
  } catch { return undefined; }
}

/** Read-only catalogue. Completed/omitted records and virtual projections are not snoozable. */
export function reminderTargets(envelopes: ReminderEnvelope[], movements: LedgerMovement[], loans: Loan[], today: string): ReminderTarget[] {
  const targets: ReminderTarget[] = [];
  for (const record of deriveReminderRecords(envelopes, movements, today)) {
    if (record.status === "completed" || record.status === "omitted" || record.amount <= 0 || !validReminderDate(record.date)) continue;
    if (record.kind === "contribution" && !record.expectedDate) continue;
    const envelope = envelopes.find(item => item.id === record.envelopeId)!;
    const source: ReminderSource = { kind: record.kind === "payment" ? "scheduled" : record.kind, envelopeId: envelope.id, itemId: record.kind === "goal" ? envelope.goalId || "goal" : record.itemId, date: record.expectedDate || record.date };
    let nextDate: string | undefined;
    if (record.kind === "contribution" && envelope.recurrence) {
      const recurrence = envelope.recurrence;
      nextDate = followingDate(recurrence.nextDate, today, contributionStep(recurrence), recurrence.anchorDay ?? Number(recurrence.nextDate.slice(-2)), recurrence.endDate);
    }
    if (record.kind === "payment") {
      const item = envelope.scheduledAmounts?.find(item => item.id === record.itemId);
      const repeat = item?.repetition;
      if (item && repeat) nextDate = followingDate(item.occurrenceDate ?? item.deadline, today, { unit: ["monthly", "yearly"].includes(repeat.frequency) ? "months" : "days", amount: repeat.frequency === "yearly" ? 12 : repeat.frequency === "weekly" ? 7 : 1 }, repeat.anchorDay, repeat.endDate);
    }
    targets.push({ ...source, key: reminderKey(source), title: record.title, amount: record.amount, context: record.envelopeName, originalDate: record.date, nextDate });
  }
  for (const loan of loans) {
    if (!Number.isSafeInteger(loan.outstanding) || loan.outstanding <= 0 || !validReminderDate(loan.dueDate)) continue;
    const source: ReminderSource = { kind: "loan", itemId: loan.id, date: loan.dueDate };
    targets.push({ ...source, key: reminderKey(source), title: `${loan.targetName} → ${loan.sourceName}`, amount: loan.outstanding, originalDate: loan.dueDate });
  }
  return targets;
}

/** Validate against the latest store snapshot, including completion before a dialog saves. */
export function validateSnoozeChanges(previous: ReminderSnoozes | undefined, next: ReminderSnoozes | undefined, targets: ReminderTarget[], today: string): void {
  for (const [key, value] of Object.entries(next ?? {})) {
    if (previous?.[key]?.until === value.until && previous[key].originalDate === value.originalDate) continue;
    const target = targets.find(item => item.key === key);
    if (!target || target.originalDate !== value.originalDate) throw new Error("El evento cambió o ya no está pendiente. Vuelve a abrirlo.");
    snoozeReminder({}, target, value.until, today);
  }
}
