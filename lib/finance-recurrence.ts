import { assign, type Ledger, type LedgerEnvelope } from "./finance-ledger";

export type Recurrence = {
  amount: number;
  frequency: "Semanal" | "Quincenal" | "Mensual" | "Anual" | "Personalizado";
  anchorDay?: number;
  endDate?: string;
  intervalDays?: number;
  nextDate: string;
  snoozedUntil?: string;
  skippedDates?: string[];
};

export type RecurringContributionHistoryEntry = { expectedDate: string; date: string; amount: number; frequency: Recurrence["frequency"] };
type RecurringEnvelope = LedgerEnvelope & { recurrence?: Recurrence; recurringContributionHistory?: RecurringContributionHistoryEntry[] };

// These are civil dates in Costa Rica, supplied by the caller. UTC arithmetic
// keeps calendar changes independent of the browser's local time zone.
function civilDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000")) {
    throw new Error("La fecha del aporte no es válida.");
  }
  const date = new Date(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error("La fecha del aporte no es válida.");
  }
  return date;
}

function formatCivilDate(date: Date): string {
  const result = date.toISOString().slice(0, 10);
  civilDate(result);
  return result;
}

export function validateRecurrence(recurrence: Recurrence): void {
  if (!Number.isSafeInteger(recurrence.amount) || recurrence.amount <= 0) {
    throw new Error("El aporte recurrente debe ser un monto entero mayor que cero.");
  }
  if (!["Semanal", "Quincenal", "Mensual", "Anual", "Personalizado"].includes(recurrence.frequency)) {
    throw new Error("Selecciona una frecuencia válida para el aporte.");
  }
  if (recurrence.frequency === "Personalizado") validateDayInterval(recurrence.intervalDays);
  civilDate(recurrence.nextDate);
  if (recurrence.endDate) civilDate(recurrence.endDate);
  if (recurrence.skippedDates !== undefined) {
    if (!Array.isArray(recurrence.skippedDates) || recurrence.skippedDates.some(value => typeof value !== "string")) throw new Error("El historial de aportes omitidos no es válido.");
    recurrence.skippedDates.forEach(civilDate);
  }
  if (recurrence.anchorDay !== undefined && (!Number.isInteger(recurrence.anchorDay) || recurrence.anchorDay < 1 || recurrence.anchorDay > 31)) throw new Error("El día de repetición no es válido.");
}

function validateDayInterval(days: number | undefined): asserts days is number {
  if (!Number.isSafeInteger(days) || (days ?? 0) <= 0) {
    throw new Error("Ingresa una cantidad de días entera mayor que cero.");
  }
}

export type PostponeOption = { unit: "days" | "months"; amount: number };

export function previewPostponement(todayDate: string, option: PostponeOption, anchorDay?: number): string {
  validateDayInterval(option.amount);
  if (option.unit !== "days" && option.unit !== "months") throw new Error("Selecciona cómo quieres posponer el aporte.");
  const next = civilDate(todayDate);
  if (option.unit === "months") {
    const day = anchorDay ?? next.getUTCDate();
    if (!Number.isInteger(day) || day < 1 || day > 31) throw new Error("El día de repetición mensual debe estar entre 1 y 31.");
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + option.amount);
    const endOfMonth = new Date(next);
    endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);
    endOfMonth.setUTCDate(0);
    next.setUTCDate(Math.min(day, endOfMonth.getUTCDate()));
  } else next.setUTCDate(next.getUTCDate() + option.amount);
  if (!Number.isFinite(next.getTime()) || next.getUTCFullYear() > 9999) throw new Error("La nueva fecha queda fuera del rango permitido. Usa un intervalo menor.");
  return formatCivilDate(next);
}

export function recurrenceDueDate(recurrence: Recurrence): string {
  validateRecurrence(recurrence);
  if (recurrence.snoozedUntil) civilDate(recurrence.snoozedUntil);
  return recurrence.snoozedUntil && recurrence.snoozedUntil > recurrence.nextDate ? recurrence.snoozedUntil : recurrence.nextDate;
}

export function isRecurrenceDue(envelope: RecurringEnvelope, todayDate: string): boolean {
  if (envelope.archived || !envelope.recurrence) return false;
  try {
    validateRecurrence(envelope.recurrence);
    civilDate(todayDate);
    return (!envelope.recurrence.endDate || recurrenceDueDate(envelope.recurrence) <= envelope.recurrence.endDate) && recurrenceDueDate(envelope.recurrence) <= todayDate;
  } catch {
    // A malformed saved setting must not make the dashboard unusable.
    // Saving or confirming the configuration reports the validation error.
    return false;
  }
}

function currentRecurrence(ledger: Ledger, envelopeId: string, expectedNextDate: string): Recurrence {
  const envelope = ledger.envelopes.find((item) => item.id === envelopeId) as RecurringEnvelope | undefined;
  if (!envelope || envelope.archived) throw new Error("El sobre no existe o está archivado.");
  if (!envelope.recurrence) throw new Error("Este sobre no tiene un aporte recurrente.");
  validateRecurrence(envelope.recurrence);
  if (envelope.recurrence.nextDate !== expectedNextDate) {
    throw new Error("El recordatorio ya cambió. Revisa la próxima fecha del aporte.");
  }
  return envelope.recurrence;
}

export function nextContributionDate(referenceDate: string, frequency: Recurrence["frequency"], intervalDays?: number): string {
  if (frequency === "Anual") return previewPostponement(referenceDate, { unit: "months", amount: 12 });
  if (frequency === "Mensual") return previewPostponement(referenceDate, { unit: "months", amount: 1 });
  if (frequency === "Semanal") return previewPostponement(referenceDate, { unit: "days", amount: 7 });
  if (frequency === "Quincenal") return previewPostponement(referenceDate, { unit: "days", amount: 15 });
  if (frequency !== "Personalizado") throw new Error("Selecciona una frecuencia válida para el aporte.");
  validateDayInterval(intervalDays);
  return previewPostponement(referenceDate, { unit: "days", amount: intervalDays });
}

export function contributionStep(recurrence: Recurrence): PostponeOption {
  validateRecurrence(recurrence);
  if (recurrence.frequency === "Mensual" || recurrence.frequency === "Anual") return {unit:"months",amount:recurrence.frequency === "Anual" ? 12 : 1};
  return {unit:"days",amount:recurrence.frequency === "Semanal" ? 7 : recurrence.frequency === "Quincenal" ? 15 : recurrence.intervalDays!};
}

// Bounded, read-only recurrence projection. Jump to the visible period instead of
// iterating through years of unconfirmed payments. Uses the same civil-date engine.
export function recurrenceDates(start: string, from: string, to: string, step: PostponeOption, anchorDay?: number, endDate?: string): string[] {
  const seed=civilDate(start), first=civilDate(from), last=civilDate(to);
  if (last < first || (last.getTime()-first.getTime())/86400000 > 366) throw new Error("Consulta hasta un año por período.");
  if (endDate) civilDate(endDate);
  validateDayInterval(step.amount);
  const distance=step.unit==="days" ? (first.getTime()-seed.getTime())/86400000 : (first.getUTCFullYear()-seed.getUTCFullYear())*12+first.getUTCMonth()-seed.getUTCMonth();
  let index=Math.max(1,Math.floor(distance/step.amount));
  const dates:string[]=[];
  while (true) {
    let value:string;
    try { value=previewPostponement(start,{...step,amount:step.amount*index},anchorDay); } catch { break; }
    if (value>to || (endDate && value>endDate)) break;
    if (value>=from) dates.push(value);
    index++;
  }
  return dates;
}

export function confirmRecurringContribution(
  ledger: Ledger,
  envelopeId: string,
  expectedNextDate: string,
  dateTime: string,
): Ledger {
  const recurrence = currentRecurrence(ledger, envelopeId, expectedNextDate);
  const contributed = ledger.movements
    .filter(movement => movement.type === "Asignación" && movement.reference === `Aporte recurrente · ${expectedNextDate}`)
    .reduce((sum, movement) => sum + (movement.allocations.find(allocation => allocation.envelopeId === envelopeId)?.amount ?? 0), 0);
  const remaining=recurrence.amount-contributed;
  if(remaining<=0)throw new Error("El movimiento ya existe para esta ocurrencia.");
  return recordRecurringContribution(ledger, envelopeId, expectedNextDate, remaining, dateTime);
}

/** Explicitly records a full or partial recurring contribution using the normal assignment flow. */
export function recordRecurringContribution(
  ledger: Ledger,
  envelopeId: string,
  expectedNextDate: string,
  amount: number,
  dateTime: string,
): Ledger {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(dateTime)) {
    throw new Error("La fecha y hora del aporte no son válidas.");
  }
  const todayDate = dateTime.slice(0, 10);
  civilDate(todayDate);
  const recurrence = currentRecurrence(ledger, envelopeId, expectedNextDate);
  const dueDate = recurrenceDueDate(recurrence);
  if (recurrence.endDate && dueDate > recurrence.endDate) throw new Error("La programación de aportes ya finalizó.");
  if (recurrence.snoozedUntil && recurrence.snoozedUntil > todayDate) throw new Error("Este aporte pospuesto todavía no vence.");
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("Ingresa un monto entero mayor que cero.");
  const reference = `Aporte recurrente · ${expectedNextDate}`;
  const contributed = ledger.movements
    .filter(movement => movement.type === "Asignación" && movement.reference === reference)
    .reduce((sum, movement) => sum + (movement.allocations.find(allocation => allocation.envelopeId === envelopeId)?.amount ?? 0), 0);
  const remaining = Math.max(0, recurrence.amount - contributed);
  if (remaining === 0) throw new Error("El movimiento ya existe para esta ocurrencia.");
  if (amount > remaining) throw new Error("El aporte supera el saldo pendiente de esta ocurrencia.");
  // Advance from the scheduled contribution, so an early or late confirmation
  // does not silently shift the plan. Partial contributions keep this date active.
  const anchorDay=recurrence.anchorDay ?? Number(recurrence.nextDate.slice(-2));
  const nextDate = previewPostponement(recurrence.nextDate, contributionStep(recurrence), anchorDay);
  const completes = contributed + amount >= recurrence.amount;
  // Stable cumulative IDs reject retries from a stale snapshot without blocking
  // the next intentional partial contribution.
  const movementId = contributed === 0 && amount === recurrence.amount
    ? `recurrence:${encodeURIComponent(envelopeId)}:${expectedNextDate}`
    : `recurrence:${encodeURIComponent(envelopeId)}:${expectedNextDate}:${contributed}`;
  const next = assign(ledger, envelopeId, amount, dateTime, movementId);
  return {
    ...next,
    envelopes: next.envelopes.map((envelope) => envelope.id === envelopeId ? {
      ...envelope,
      recurrence: completes ? { ...recurrence, anchorDay, nextDate, snoozedUntil: undefined } : { ...recurrence, anchorDay },
    } : envelope),
    movements: next.movements.map((movement) => movement.id === movementId ? {
      ...movement,
      reference,
    } : movement),
  };
}

export function postponeRecurringContribution(
  ledger: Ledger,
  envelopeId: string,
  expectedNextDate: string,
  todayDate: string,
  option?: PostponeOption,
): Ledger {
  civilDate(todayDate);
  const recurrence = currentRecurrence(ledger, envelopeId, expectedNextDate);
  // Explicit choices are measured from today and shown before confirmation.
  // Keep the old four-argument call compatible with previously opened forms.
  const scheduledDate = recurrenceDueDate(recurrence);
  const nextDate = option
    ? previewPostponement(scheduledDate > todayDate ? scheduledDate : todayDate, option)
    : previewPostponement(scheduledDate > todayDate ? scheduledDate : todayDate, { unit: "days", amount: 1 });
  return {
    ...ledger,
    envelopes: ledger.envelopes.map((envelope) => envelope.id === envelopeId ? {
      ...envelope,
      // Snooze this occurrence only. Keep nextDate as the recurrence anchor so
      // confirming it does not shift the rest of the series.
      recurrence: { ...recurrence, snoozedUntil: nextDate },
    } : envelope),
  };
}

/** Omit one configured contribution without creating a movement or shifting later dates. */
export function skipRecurringContribution(
  ledger: Ledger,
  envelopeId: string,
  expectedNextDate: string,
): Ledger {
  const recurrence = currentRecurrence(ledger, envelopeId, expectedNextDate);
  const occurrenceDate = recurrenceDueDate(recurrence);
  const nextDate = previewPostponement(recurrence.nextDate, contributionStep(recurrence), recurrence.anchorDay ?? Number(recurrence.nextDate.slice(-2)));
  return {
    ...ledger,
    envelopes: ledger.envelopes.map((envelope) => {
      if (envelope.id !== envelopeId) return envelope;
      const current = envelope as RecurringEnvelope;
      const history = current.recurringContributionHistory ?? [];
      return {
        ...current,
        recurringContributionHistory: history.some(item => item.expectedDate === recurrence.nextDate) ? history : [...history, { expectedDate: recurrence.nextDate, date: occurrenceDate, amount: recurrence.amount, frequency: recurrence.frequency }].sort((a,b)=>a.expectedDate.localeCompare(b.expectedDate)),
        recurrence: {
          ...recurrence,
          anchorDay: recurrence.anchorDay ?? Number(recurrence.nextDate.slice(-2)),
          nextDate,
          snoozedUntil: undefined,
          // Keep the series anchor as the stable occurrence key even when its due
          // date had been snoozed; movement references use this original date too.
          skippedDates: [...new Set([...(recurrence.skippedDates ?? []), recurrence.nextDate])].sort(),
        },
      };
    }),
  };
}
