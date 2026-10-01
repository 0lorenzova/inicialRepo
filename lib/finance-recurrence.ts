import { assign, type Ledger, type LedgerEnvelope } from "./finance-ledger";

export type Recurrence = {
  amount: number;
  frequency: "Semanal" | "Quincenal" | "Mensual";
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
  if (!["Semanal", "Quincenal", "Mensual"].includes(recurrence.frequency)) {
    throw new Error("Selecciona una frecuencia válida para el aporte.");
  }
  civilDate(recurrence.nextDate);
}

export function isRecurrenceDue(envelope: RecurringEnvelope, todayDate: string): boolean {
  if (envelope.archived || !envelope.recurrence) return false;
  try {
    validateRecurrence(envelope.recurrence);
    civilDate(todayDate);
    return envelope.recurrence.nextDate <= todayDate;
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

function nextContributionDate(todayDate: string, frequency: Recurrence["frequency"]): string {
  const next = civilDate(todayDate);
  if (frequency === "Mensual") {
    const day = next.getUTCDate();
    next.setUTCDate(1);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const endOfMonth = new Date(next);
    endOfMonth.setUTCMonth(endOfMonth.getUTCMonth() + 1);
    endOfMonth.setUTCDate(0);
    next.setUTCDate(Math.min(day, endOfMonth.getUTCDate()));
  } else {
    next.setUTCDate(next.getUTCDate() + (frequency === "Semanal" ? 7 : 14));
  }
  return formatCivilDate(next);
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
  if (recurrence.nextDate > todayDate) throw new Error("Este aporte todavía no vence.");
  const nextDate = nextContributionDate(todayDate, recurrence.frequency);
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
): Ledger {
  civilDate(todayDate);
  const recurrence = currentRecurrence(ledger, envelopeId, expectedNextDate);
  const next = civilDate(recurrence.nextDate > todayDate ? recurrence.nextDate : todayDate);
  next.setUTCDate(next.getUTCDate() + 1);
  const nextDate = formatCivilDate(next);
  return {
    ...ledger,
    envelopes: ledger.envelopes.map((envelope) => envelope.id === envelopeId ? {
      ...envelope,
      recurrence: { ...recurrence, nextDate, snoozedUntil: nextDate },
    } : envelope),
  };
}
