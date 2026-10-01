import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { totals } from "../lib/finance-ledger.ts";

// Next resolves extensionless TypeScript imports; the standalone Node runner
// needs the extension for this one local module. No app configuration changes.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "./finance-ledger" && context.parentURL?.endsWith("/finance-recurrence.ts")
      ? "./finance-ledger.ts" : specifier, context);
  },
});
const { confirmRecurringContribution, isRecurrenceDue, postponeRecurringContribution, validateRecurrence } = await import("../lib/finance-recurrence.ts");
hooks.deregister();

const seed = (recurrence = {}, balance = 100_000) => ({
  accounts: [{ id: "checking", name: "Corriente", type: "Banco", balance, active: true }],
  envelopes: [
    { id: "savings", name: "Ahorro", icon: "🐷", color: "amber", balance: 0, recurrence: { amount: 25_000, frequency: "Mensual", nextDate: "2026-10-01", ...recurrence } },
    { id: "home", name: "Hogar", balance: 0 },
  ],
  movements: [], loans: [],
});
const checkInvariant = (ledger) => {
  const { accounts, assigned, unassigned } = totals(ledger);
  assert.equal(accounts, assigned + unassigned);
  assert.ok(unassigned >= 0);
};
const freeze = (value) => {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    Object.values(value).forEach(freeze);
  }
  return value;
};
const rejectWithoutMutation = (ledger, operation, expected) => {
  const before = JSON.stringify(ledger);
  assert.throws(() => operation(freeze(ledger)), expected);
  assert.equal(JSON.stringify(ledger), before);
};

// Reading reminders never creates a movement or changes balances.
const initial = freeze(seed());
const snapshot = JSON.stringify(initial);
assert.equal(isRecurrenceDue(initial.envelopes[0], "2026-09-30"), false);
assert.equal(isRecurrenceDue(initial.envelopes[0], "2026-10-01"), true);
assert.equal(isRecurrenceDue(initial.envelopes[0], "2026-10-02"), true);
assert.equal(isRecurrenceDue(initial.envelopes[1], "2026-10-02"), false);
assert.equal(JSON.stringify(initial), snapshot);

// Confirmation is one assignment: real money stays unchanged and the due date
// advances atomically in the returned snapshot, preserving envelope metadata.
const confirmed = confirmRecurringContribution(initial, "savings", "2026-10-01", "2026-10-01T10:00");
assert.deepEqual(totals(confirmed), { accounts: 100_000, assigned: 25_000, unassigned: 75_000 });
assert.equal(confirmed.envelopes[0].recurrence.nextDate, "2026-11-01");
assert.equal(confirmed.envelopes[0].icon, "🐷");
assert.equal(confirmed.movements.length, 1);
assert.equal(confirmed.movements[0].type, "Asignación");
assert.equal(confirmed.movements[0].allocations[0].envelopeId, "savings");
assert.equal(confirmed.movements[0].reference, "Aporte recurrente · 2026-10-01");
assert.equal(JSON.stringify(initial), snapshot);
assert.equal(isRecurrenceDue(confirmed.envelopes[0], "2026-10-01"), false);
checkInvariant(confirmed);

// Old UI clicks cannot confirm or postpone a date already processed.
rejectWithoutMutation(confirmed, (ledger) => confirmRecurringContribution(ledger, "savings", "2026-10-01", "2026-10-01T10:00"), /recordatorio ya cambió/);
rejectWithoutMutation(confirmed, (ledger) => postponeRecurringContribution(ledger, "savings", "2026-10-01", "2026-10-01"), /recordatorio ya cambió/);
rejectWithoutMutation(confirmed, (ledger) => confirmRecurringContribution(ledger, "savings", "2026-11-01", "2026-10-01T10:00"), /todavía no vence/);

// Persist/reload preserves idempotency even if a due date is edited backwards.
const reopened = JSON.parse(JSON.stringify(confirmed));
reopened.envelopes[0].recurrence.nextDate = "2026-10-01";
rejectWithoutMutation(reopened, (ledger) => confirmRecurringContribution(ledger, "savings", "2026-10-01", "2026-10-01T10:01"), /movimiento ya existe/);

// Insufficient money, archived/missing envelopes, and invalid settings cannot
// partially advance the reminder or alter any financial data.
rejectWithoutMutation(seed({}, 24_999), (ledger) => confirmRecurringContribution(ledger, "savings", "2026-10-01", "2026-10-01T10:00"), /sin asignar suficiente/);
const archived = seed(); archived.envelopes[0].archived = true;
assert.equal(isRecurrenceDue(archived.envelopes[0], "2026-10-01"), false);
rejectWithoutMutation(archived, (ledger) => confirmRecurringContribution(ledger, "savings", "2026-10-01", "2026-10-01T10:00"), /archivado/);
rejectWithoutMutation(seed(), (ledger) => confirmRecurringContribution(ledger, "missing", "2026-10-01", "2026-10-01T10:00"), /no existe/);
rejectWithoutMutation(seed(), (ledger) => confirmRecurringContribution(ledger, "home", "2026-10-01", "2026-10-01T10:00"), /no tiene un aporte/);
for (const amount of [0, -1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => validateRecurrence({ amount, frequency: "Mensual", nextDate: "2026-10-01" }), /monto entero/);
}
assert.throws(() => validateRecurrence({ amount: 1, frequency: "Diario", nextDate: "2026-10-01" }), /frecuencia válida/);
for (const nextDate of ["", "2026-02-30", "2026-13-01", "01/10/2026", "2026-2-01"]) {
  const ledger = seed({ nextDate });
  assert.equal(isRecurrenceDue(ledger.envelopes[0], "2026-10-01"), false);
  rejectWithoutMutation(ledger, (value) => confirmRecurringContribution(value, "savings", nextDate, "2026-10-01T10:00"), /fecha del aporte/);
}
rejectWithoutMutation(seed(), (ledger) => confirmRecurringContribution(ledger, "savings", "2026-10-01", "2026-10-01T24:00"), /fecha y hora/);

// Calendar arithmetic: weekly, biweekly, leap years, year boundary, and
// month-end clamping (31 January must stay in February).
for (const [frequency, currentDate, expected] of [
  ["Semanal", "2026-12-28", "2027-01-04"],
  ["Quincenal", "2026-12-28", "2027-01-11"],
  ["Mensual", "2026-01-31", "2026-02-28"],
  ["Mensual", "2028-01-31", "2028-02-29"],
  ["Mensual", "2026-03-31", "2026-04-30"],
  ["Mensual", "2026-12-31", "2027-01-31"],
]) {
  const result = confirmRecurringContribution(freeze(seed({ frequency, nextDate: currentDate })), "savings", currentDate, `${currentDate}T23:59`);
  assert.equal(result.envelopes[0].recurrence.nextDate, expected);
  checkInvariant(result);
}
const late = confirmRecurringContribution(seed({ nextDate: "2026-08-01" }), "savings", "2026-08-01", "2026-10-03T09:00");
assert.equal(late.envelopes[0].recurrence.nextDate, "2026-11-03");
assert.equal(late.movements.length, 1); // No automatic catch-up contributions.

// Postponing an overdue date genuinely moves it into tomorrow; future dates
// move one additional day. Neither operation transfers or assigns money.
for (const [oldDate, expected] of [["2026-08-01", "2026-10-02"], ["2026-10-01", "2026-10-02"], ["2026-11-01", "2026-11-02"]]) {
  const ledger = freeze(seed({ nextDate: oldDate }));
  const postponed = postponeRecurringContribution(ledger, "savings", oldDate, "2026-10-01");
  assert.equal(postponed.envelopes[0].recurrence.nextDate, expected);
  assert.equal(postponed.envelopes[0].recurrence.snoozedUntil, expected);
  assert.equal(postponed.movements, ledger.movements);
  assert.equal(postponed.accounts, ledger.accounts);
  assert.deepEqual(totals(postponed), totals(ledger));
  assert.equal(isRecurrenceDue(postponed.envelopes[0], "2026-10-01"), false);
}
const snoozed = postponeRecurringContribution(initial, "savings", "2026-10-01", "2026-10-01");
rejectWithoutMutation(snoozed, (ledger) => confirmRecurringContribution(ledger, "savings", "2026-10-02", "2026-10-01T09:00"), /todavía no vence/);
const afterSnooze = confirmRecurringContribution(snoozed, "savings", "2026-10-02", "2026-10-02T09:00");
assert.equal(afterSnooze.envelopes[0].recurrence.snoozedUntil, undefined);
checkInvariant(afterSnooze);

// The second month records exactly one additional assignment after reload.
const nextMonth = confirmRecurringContribution(JSON.parse(JSON.stringify(confirmed)), "savings", "2026-11-01", "2026-11-01T09:00");
assert.equal(nextMonth.movements.length, 2);
assert.equal(new Set(nextMonth.movements.map((movement) => movement.id)).size, 2);
assert.deepEqual(totals(nextMonth), { accounts: 100_000, assigned: 50_000, unassigned: 50_000 });
checkInvariant(nextMonth);

console.log("OK: recurrencia verificada en memoria: confirmación atómica, duplicados, fondos, fechas, posposición y reapertura.");
