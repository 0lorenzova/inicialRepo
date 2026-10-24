import { getEnvelopeGoal, temporalDistance } from "./envelope-goals";
import { recurrenceDueDate, type Recurrence, type RecurringContributionHistoryEntry } from "./finance-recurrence";
import type { LedgerMovement } from "./finance-ledger";
import { scheduledPaidAmount, scheduledPayments, type PlanningEnvelope, type ScheduledAmount, type ScheduledRepetition } from "./envelope-planning";

export type ReminderStatus = "upcoming" | "overdue" | "partial" | "completed" | "postponed" | "omitted";
export type ReminderKind = "contribution" | "payment" | "goal";
export type ReminderRecord = {
  key: string;
  kind: ReminderKind;
  status: ReminderStatus;
  title: string;
  envelopeId: string;
  envelopeName: string;
  envelopeIcon: string;
  amount: number;
  paidAmount?: number;
  performedAmount?: number;
  date?: string;
  detail?: string;
  frequency?: string;
  itemId?: string;
  movementId?: string;
  expectedDate?: string;
  progress?: number;
  performedDate?: string;
};

export type ReminderEnvelope = PlanningEnvelope & {
  icon?: string;
  recurrence?: Recurrence;
  recurringContributionHistory?: RecurringContributionHistoryEntry[];
  goalName?: string;
  goalEnabled?: boolean;
  goalDate?: string;
};

const validDate = (value?: string) => {
  if (!value) return false;
  try { temporalDistance(value, value); return true; } catch { return false; }
};
const monthOf = (date: string) => date.slice(0, 7);
const repetitionLabels: Record<ScheduledRepetition["frequency"], string> = {
  daily: "diario",
  weekly: "semanal",
  monthly: "mensual",
  yearly: "anual",
};

function pendingStatus(date: string | undefined, today: string, postponed = false): ReminderStatus {
  if (date && date < today) return "overdue";
  return postponed ? "postponed" : "upcoming";
}

/** Read-only projection over the user's existing envelope and movement snapshot. */
export function deriveReminderRecords(envelopes: ReminderEnvelope[], movements: LedgerMovement[], today: string): ReminderRecord[] {
  const currentMonth = monthOf(today);
  const records: ReminderRecord[] = [];
  for (const envelope of envelopes.filter(item => !item.archived)) {
    const recurrence = envelope.recurrence;
    if (recurrence) {
      try {
        const dueDate = recurrenceDueDate(recurrence);
        const reference = `Aporte recurrente · ${recurrence.nextDate}`;
        const paidAmount = movements
          .filter(movement => movement.type === "Asignación" && movement.reference === reference)
          .reduce((sum, movement) => sum + (movement.allocations.find(value => value.envelopeId === envelope.id)?.amount ?? 0), 0);
        const remainingAmount = Math.max(0, recurrence.amount - paidAmount);
        if ((!recurrence.endDate || dueDate <= recurrence.endDate) && validDate(dueDate)) {
          if (remainingAmount > 0) records.push({
            key: `contribution:${envelope.id}:${recurrence.nextDate}`,
            kind: "contribution",
            status: dueDate < today ? "overdue" : paidAmount > 0 ? "partial" : pendingStatus(dueDate, today, Boolean(recurrence.snoozedUntil && recurrence.snoozedUntil > recurrence.nextDate)),
            title: `Aporte a ${envelope.name}`,
            envelopeId: envelope.id,
            envelopeName: envelope.name,
            envelopeIcon: envelope.icon ?? "▣",
            amount: remainingAmount,
            paidAmount,
            date: dueDate,
            detail: `${paidAmount > 0 ? `Abonado ${formatMoney(paidAmount)} · pendiente ${formatMoney(remainingAmount)} · ` : ""}Asignación interna · no es un gasto`,
            frequency: recurrence.frequency,
            expectedDate: recurrence.nextDate,
          });
        }
      } catch { /* Invalid legacy recurrence settings stay editable but are not actionable here. */ }
    }

    const omittedOccurrences = new Map<string, RecurringContributionHistoryEntry>();
    for (const item of Array.isArray(envelope.recurringContributionHistory) ? envelope.recurringContributionHistory : []) {
      if (item && validDate(item.expectedDate) && validDate(item.date) && Number.isSafeInteger(item.amount) && item.amount > 0) omittedOccurrences.set(item.expectedDate, item);
    }
    // Read omissions written by the earlier format in which history lived only
    // inside the active recurrence settings.
    if (recurrence) for (const skippedDate of Array.isArray(recurrence.skippedDates) ? recurrence.skippedDates : []) {
      if (!omittedOccurrences.has(skippedDate)) omittedOccurrences.set(skippedDate, { expectedDate: skippedDate, date: skippedDate, amount: recurrence.amount, frequency: recurrence.frequency });
    }
    for (const omitted of omittedOccurrences.values()) {
      const matching = movements.filter(movement => movement.type === "Asignación" && movement.reference === `Aporte recurrente · ${omitted.expectedDate}`);
      const paidAmount = matching.reduce((sum, movement) => sum + (movement.allocations.find(value => value.envelopeId === envelope.id)?.amount ?? 0), 0);
      const lastMovement = [...matching].sort((a,b)=>b.date.localeCompare(a.date))[0];
      if (validDate(omitted.date) && Number.isSafeInteger(omitted.amount) && omitted.amount > 0) records.push({
        key: `contribution-omitted:${envelope.id}:${omitted.expectedDate}`,
        kind: "contribution", status: "omitted", title: `Aporte omitido · ${envelope.name}`,
        envelopeId: envelope.id, envelopeName: envelope.name, envelopeIcon: envelope.icon ?? "▣",
        amount: Math.max(0,omitted.amount-paidAmount), paidAmount, performedAmount: paidAmount,
        date: omitted.date, performedDate: lastMovement?.date.slice(0,10) ?? omitted.date,
        detail: paidAmount>0 ? `Se conservaron aportes por ${formatMoney(paidAmount)}; se omitió el saldo restante.` : "Omitido sin mover dinero.", frequency: omitted.frequency,
      });
    }

    for (const item of envelope.scheduledAmounts ?? []) {
      if (item.payment) {
        const payments = scheduledPayments(item);
        const performedDate = item.payment.date.slice(0, 10);
        const performedAmount = payments.filter(payment=>monthOf(payment.date.slice(0,10))===currentMonth).reduce((sum,payment)=>sum+payment.amount,0);
        records.push({
          key: `payment:${envelope.id}:${item.id}`, kind: "payment", status: "completed", title: item.name,
          envelopeId: envelope.id, envelopeName: envelope.name, envelopeIcon: envelope.icon ?? "▣",
          amount: scheduledPaidAmount(item), performedAmount, date: performedDate, performedDate,
          detail: `Pagado · programado ${formatMoney(item.amount)}`, itemId: item.id, movementId: item.payment.movementId,
        });
      } else if (item.omittedAt) {
        const paidAmount=scheduledPaidAmount(item);
        records.push({
          key: `payment-omitted:${envelope.id}:${item.id}`, kind: "payment", status: "omitted", title: item.name,
          envelopeId: envelope.id, envelopeName: envelope.name, envelopeIcon: envelope.icon ?? "▣",
          amount: Math.max(0,item.amount-paidAmount), paidAmount, date: item.deadline, performedDate: item.omittedAt.slice(0, 10),
          detail: paidAmount>0 ? `Se conservaron abonos por ${formatMoney(paidAmount)}.` : "Omitido sin registrar un gasto.", itemId: item.id,
        });
      } else if (item.active && validDate(item.deadline)) {
        const paidAmount = scheduledPaidAmount(item);
        const remaining = Math.max(0,item.amount-paidAmount);
        records.push({
        key: `payment:${envelope.id}:${item.id}`, kind: "payment",
        status: paidAmount>0&&item.deadline>=today ? "partial" : pendingStatus(item.deadline, today, Boolean(item.postponedFrom)), title: item.name,
        envelopeId: envelope.id, envelopeName: envelope.name, envelopeIcon: envelope.icon ?? "▣",
        amount: remaining, paidAmount, date: item.deadline,
        detail: paidAmount>0 ? `Abonado ${formatMoney(paidAmount)} · pendiente ${formatMoney(remaining)}` : item.repetition ? `Pago programado · ${repetitionLabels[item.repetition.frequency]}` : "Pago desde este sobre",
        frequency: item.repetition?.frequency, itemId: item.id,
        });
      }
    }

    const goal = getEnvelopeGoal(envelope, today);
    if (goal.active) {
      const date = validDate(envelope.goalDate) ? envelope.goalDate : undefined;
      const completed = goal.reached;
      records.push({
        key: `goal:${envelope.id}:${envelope.goalId ?? "goal"}`, kind: "goal",
        status: completed ? "completed" : pendingStatus(date, today),
        title: envelope.goalName?.trim() || `Meta de ${envelope.name}`,
        envelopeId: envelope.id, envelopeName: envelope.name, envelopeIcon: envelope.icon ?? "▣",
        amount: Math.max(0, goal.amount - Math.max(0, envelope.balance)), date,
        detail: `${formatMoney(Math.max(0, envelope.balance))} de ${formatMoney(goal.amount)} · ${Math.round(goal.fillPercentage)}%`,
        progress: goal.fillPercentage,
      });
    }
  }

  // Group actual recurring assignment movements by occurrence. Partial installments
  // become one history row instead of being mistaken for several completed occurrences.
  const contributionGroups = new Map<string, { envelopeId: string; expectedDate: string; amount: number; movementId: string; latestDate: string }>();
  for (const movement of movements) {
    const match = movement.type === "Asignación" ? /^Aporte recurrente · (\d{4}-\d{2}-\d{2})$/.exec(movement.reference ?? "") : null;
    const allocation = movement.allocations.find(value => value.envelopeId);
    if (!match || !allocation?.envelopeId) continue;
    const key = `${allocation.envelopeId}:${match[1]}`;
    const group = contributionGroups.get(key);
    if (group) {
      group.amount += allocation.amount;
      if (movement.date > group.latestDate) { group.latestDate = movement.date; group.movementId = movement.id; }
    } else contributionGroups.set(key, { envelopeId: allocation.envelopeId, expectedDate: match[1], amount: allocation.amount, movementId: movement.id, latestDate: movement.date });
  }
  for (const group of contributionGroups.values()) {
    const envelope = envelopes.find(value => value.id === group.envelopeId);
    if (!envelope || envelope.archived || envelope.recurrence?.nextDate === group.expectedDate || (Array.isArray(envelope.recurrence?.skippedDates) && envelope.recurrence.skippedDates.includes(group.expectedDate)) || (Array.isArray(envelope.recurringContributionHistory) && envelope.recurringContributionHistory.some(item=>item?.expectedDate===group.expectedDate))) continue;
    const paidAmount = group.amount;
    records.push({
      key: `contribution-done:${group.envelopeId}:${group.expectedDate}`, kind: "contribution", status: "completed",
      title: `Aporte a ${envelope.name}`, envelopeId: envelope.id, envelopeName: envelope.name,
      envelopeIcon: envelope.icon ?? "▣", amount: paidAmount, performedAmount: paidAmount,
      date: group.latestDate.slice(0, 10), performedDate: group.latestDate.slice(0, 10),
      detail: `${formatMoney(paidAmount)} aportados · asignación interna`, movementId: group.movementId,
    });
  }

  return records.sort((a, b) => {
    const priority = (status: ReminderStatus) => status === "overdue" ? 0 : status === "upcoming" ? 1 : status === "postponed" ? 2 : status === "completed" ? 3 : 4;
    return priority(a.status) - priority(b.status) || (a.date ?? "9999-12-31").localeCompare(b.date ?? "9999-12-31") || a.key.localeCompare(b.key);
  });
}

export function summarizeReminders(records: ReminderRecord[], today: string) {
  const end = new Date(`${today}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 30);
  const horizon = end.toISOString().slice(0, 10);
  const upcoming = records.filter(item => (item.status === "upcoming" || item.status === "postponed" || item.status === "partial") && item.date && item.date >= today && item.date <= horizon);
  const overdue = records.filter(item => item.status === "overdue");
  const completed = records.filter(item => item.status === "completed" && item.performedDate?.slice(0, 7) === monthOf(today));
  const obligationAmount = (items: ReminderRecord[]) => items.filter(item => item.kind !== "goal").reduce((sum, item) => sum + item.amount, 0);
  return {
    upcoming: { count: upcoming.length, amount: obligationAmount(upcoming) },
    overdue: { count: overdue.length, amount: obligationAmount(overdue) },
    completed: { count: completed.length, amount: completed.reduce((sum, item) => sum + (item.performedAmount ?? item.amount), 0) },
  };
}

function formatMoney(amount: number) {
  return `₡${Math.round(amount).toLocaleString("es-CR")}`;
}

export type ScheduledOccurrenceEnvelope = PlanningEnvelope & { scheduledAmounts?: ScheduledAmount[] };
