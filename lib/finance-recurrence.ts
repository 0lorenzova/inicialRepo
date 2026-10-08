import { assign, type Ledger, type LedgerEnvelope } from "./finance-ledger";

export type Recurrence = {
  amount: number;
  frequency: "Semanal" | "Quincenal" | "Mensual" | "Personalizado";
  intervalDays?: number;
  nextDate: string;
  snoozedUntil?: string;
};

type RecurringEnvelope = LedgerEnvelope & { recurrence?: Recurrence };

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
  if (!["Semanal", "Quincenal", "Mensual", "Personalizado"].includes(recurrence.frequency)) {
    throw new Error("Selecciona una frecuencia válida para el aporte.");
  }
  if (recurrence.frequency === "Personalizado") validateDayInterval(recurrence.intervalDays);
  civilDate(recurrence.nextDate);
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
    return recurrenceDueDate(envelope.recurrence) <= todayDate;
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
  if (frequency === "Mensual") return previewPostponement(referenceDate, { unit: "months", amount: 1 });
  if (frequency === "Semanal") return previewPostponement(referenceDate, { unit: "days", amount: 7 });
  if (frequency === "Quincenal") return previewPostponement(referenceDate, { unit: "days", amount: 15 });
  if (frequency !== "Personalizado") throw new Error("Selecciona una frecuencia válida para el aporte.");
  validateDayInterval(intervalDays);
  return previewPostponement(referenceDate, { unit: "days", amount: intervalDays });
}

export function confirmRecurringContribution(
  ledger: Ledger,
  envelopeId: string,
  expectedNextDate: string,
  dateTime: string,
): Ledger {
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?$/.test(dateTime)) {
    throw new Error("La fecha y hora del aporte no son válidas.");
  }
  const todayDate = dateTime.slice(0, 10);
  civilDate(todayDate);
  const recurrence = currentRecurrence(ledger, envelopeId, expectedNextDate);
  if (recurrenceDueDate(recurrence) > todayDate) throw new Error("Este aporte todavía no vence.");
  // Advance from the scheduled contribution, so late confirmation does not
  // silently shift the plan. An overdue next period still needs confirmation.
  const nextDate = nextContributionDate(recurrence.nextDate, recurrence.frequency, recurrence.intervalDays);
  // One ID per envelope and due date also protects retries after reloading.
  const movementId = `recurrence:${encodeURIComponent(envelopeId)}:${expectedNextDate}`;
  const next = assign(ledger, envelopeId, recurrence.amount, dateTime, movementId);
  return {
    ...next,
    envelopes: next.envelopes.map((envelope) => envelope.id === envelopeId ? {
      ...envelope,
      recurrence: { ...recurrence, nextDate, snoozedUntil: undefined },
    } : envelope),
    movements: next.movements.map((movement) => movement.id === movementId ? {
      ...movement,
      reference: `Aporte recurrente · ${expectedNextDate}`,
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
  const nextDate = option
    ? previewPostponement(todayDate, option)
    : previewPostponement(recurrence.nextDate > todayDate ? recurrence.nextDate : todayDate, { unit: "days", amount: 1 });
  return {
    ...ledger,
    envelopes: ledger.envelopes.map((envelope) => envelope.id === envelopeId ? {
      ...envelope,
      recurrence: { ...recurrence, nextDate, snoozedUntil: nextDate },
    } : envelope),
  };
}
