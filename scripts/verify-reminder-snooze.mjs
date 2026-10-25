import assert from "node:assert/strict";
import { reminderTargets, reminderKey, normalizeReminderSnoozes, snoozeReminder, cancelReminderSnooze, isReminderSnoozed, validateSnoozeChanges, pruneReminderSnoozes, validReminderDate } from "../lib/reminder-snooze.ts";
import { deriveFinanceNotifications, normalizeNotificationState, projectReminderNotifications, pendingNotificationDelivery, markNotifications } from "../lib/finance-notifications.ts";
import { previewPostponement } from "../lib/finance-recurrence.ts";
import { payScheduledAmount } from "../lib/envelope-planning.ts";
import { totals } from "../lib/finance-ledger.ts";
import { FinanceSyncController } from "../lib/finance-sync.ts";

const today = "2026-10-25";
const envelopes = [{ id: "test", name: "Sobre de prueba", balance: 5000, goalEnabled: true, goal: 10000, goalDate: "2026-10-26",
  recurrence: { amount: 100, frequency: "Semanal", nextDate: "2026-10-24" },
  scheduledAmounts: [
    { id: "bill", name: "Obligación de prueba", amount: 1000, deadline: "2026-10-24", active: true, timingEnabled: true, occurrenceDate: "2026-10-24", repetition: { frequency: "monthly", anchorDay: 24, seriesId: "bill-series" } },
    { id: "later", name: "Obligación futura", amount: 200, deadline: "2027-05-15", active: true, timingEnabled: true },
  ],
}];
const loans = [{ id: "loan", sourceId: "test", sourceName: "Sobre de prueba", targetId: "other", targetName: "Otro sobre", amount: 1000, outstanding: 500, date: "2026-10-01", dueDate: "2026-10-24" }];
const ledger = { envelopes, movements: [], loans, accounts: [{ id: "account", name: "Cuenta de prueba", balance: 10000, active: true, type: "Banco" }] };
const snapshot = JSON.stringify(ledger);
const initialTotals = totals(ledger);
const targets = reminderTargets(envelopes, [], loans, today);
const bill = targets.find(target => target.itemId === "bill");
const contribution = targets.find(target => target.kind === "contribution");
assert.equal(bill.nextDate, "2026-11-24");
assert.equal(contribution.nextDate, "2026-10-31");
assert.equal(targets.find(target => target.itemId === "later").nextDate, undefined);
assert.ok(targets.every(target => !("nextShift" in target)), "No se inventan turnos");

let state = normalizeNotificationState({ initialized: true, readIds: ["read-before"], dismissedIds: ["dismissed-before"], deliveredIds: ["delivered-before"] });
const until = previewPostponement(today, { unit: "days", amount: 5 });
assert.equal(until, "2026-10-30");
state = { ...state, snoozes: snoozeReminder(state.snoozes, bill, until, today) };
assert.equal(state.snoozes[bill.key].originalDate, "2026-10-24");
assert.deepEqual(state.readIds, ["read-before"]);
assert.deepEqual(state.dismissedIds, ["dismissed-before"]);
assert.deepEqual(state.deliveredIds, ["delivered-before"]);
assert.equal(isReminderSnoozed(state.snoozes, bill.key, today), true);
assert.equal(isReminderSnoozed(state.snoozes, bill.key, until), false);
assert.deepEqual(normalizeNotificationState(JSON.parse(JSON.stringify(state))), state, "Persistencia compatible con el documento JSON actual");
for (const invalid of ["2026-02-30", "", today, "2026-10-24", "0000-01-01", "2026-10-30T12:00:00Z"]) assert.throws(() => snoozeReminder({}, bill, invalid, today));
for (const amount of [0, -1, 0.5, NaN, Infinity, 1e12]) assert.throws(() => previewPostponement(today, { unit: "days", amount }));
assert.equal(validReminderDate("2028-02-29"), true);
assert.equal(validReminderDate("2026-02-29"), false);
assert.deepEqual(normalizeReminderSnoozes({ bad: { until: "2026-10-30", originalDate: "2026-10-24" }, [bill.key]: { until: "2026-02-30" } }), {});

const derive = (day, currentState = state, currentLedger = ledger) => projectReminderNotifications(deriveFinanceNotifications(currentLedger.movements, currentLedger.envelopes, day, currentLedger.loans), currentState, day, reminderTargets(currentLedger.envelopes, currentLedger.movements, currentLedger.loans, day));
const snoozed = derive(today).find(event => event.reminderKey === bill.key);
assert.equal(snoozed.date.slice(0, 10), bill.originalDate);
assert.equal(snoozed.snoozedUntil, until);
assert.equal(pendingNotificationDelivery(state, derive(today), today).some(event => event.reminderKey === bill.key), false);
const resumed = derive(until).find(event => event.reminderKey === bill.key);
assert.ok(pendingNotificationDelivery(state, derive(until), until).some(event => event.id === resumed.id));
const delivered = markNotifications(state, "deliveredIds", [resumed.id]);
assert.equal(pendingNotificationDelivery(delivered, derive(until, delivered), until).some(event => event.reminderKey === bill.key), false);
assert.equal(pendingNotificationDelivery(delivered, derive("2026-11-02", delivered), "2026-11-02").some(event => event.reminderKey === bill.key), false, "La urgencia no crea otra entrega de la misma posposición");
assert.equal(new Set(derive(until).map(event => event.reminderKey)).size, derive(until).length);

const canceled = { ...state, snoozes: cancelReminderSnooze(state.snoozes, bill.key) };
assert.equal(derive(today, canceled).find(event => event.reminderKey === bill.key).snoozedUntil, undefined);
assert.ok(pendingNotificationDelivery(canceled, derive(today, canceled), today).some(event => event.reminderKey === bill.key));
assert.equal(state.snoozes[bill.key].until, until, "Cancelar es inmutable");
const newOccurrence = { ...bill, date: bill.nextDate };
assert.notEqual(reminderKey(newOccurrence), bill.key);
assert.equal(isReminderSnoozed(state.snoozes, reminderKey(newOccurrence), today), false);

const distant = targets.find(target => target.itemId === "later");
const distantState = { ...state, snoozes: snoozeReminder(state.snoozes, distant, "2026-10-27", today) };
assert.ok(derive("2026-10-27", distantState).some(event => event.reminderKey === distant.key), "Un aviso explícito fuera del rango de proximidad se reactiva");
const paid = payScheduledAmount(ledger, "test", "bill", 1000, "account", "2026-10-26T12:00:00-06:00");
assert.equal(derive(until, state, paid).some(event => event.reminderKey === bill.key), false, "Completar antes del aviso cancela su entrega");
assert.equal(pruneReminderSnoozes(state.snoozes, reminderTargets(paid.envelopes, paid.movements, paid.loans, until))[bill.key], undefined);
assert.throws(() => validateSnoozeChanges({}, state.snoozes, reminderTargets(paid.envelopes, paid.movements, paid.loans, today), today), /ya no está pendiente/);
validateSnoozeChanges({}, state.snoozes, targets, today);
const afterPayment = reminderTargets(paid.envelopes, paid.movements, paid.loans, today).find(target => target.kind === "scheduled" && target.itemId !== "later");
assert.equal(afterPayment.originalDate, bill.nextDate);
assert.equal(isReminderSnoozed(state.snoozes, afterPayment.key, today), false);
const fullyPaidLoan = { ...ledger, loans: loans.map(loan => ({ ...loan, outstanding: 0 })) };
assert.equal(reminderTargets(fullyPaidLoan.envelopes, [], fullyPaidLoan.loans, today).some(target => target.kind === "loan"), false);
const reachedGoal = { ...ledger, envelopes: envelopes.map(envelope => ({ ...envelope, balance: 10000 })) };
assert.equal(reminderTargets(reachedGoal.envelopes, [], loans, today).some(target => target.kind === "goal"), false);
assert.equal(JSON.stringify(ledger), snapshot, "Ninguna operación de posposición altera el libro financiero");
assert.deepEqual(totals(ledger), initialTotals);

const monthly = { ...envelopes[0], recurrence: { amount: 100, frequency: "Mensual", nextDate: "2026-01-31", anchorDay: 31 } };
assert.equal(reminderTargets([monthly], [], [], "2026-02-01").find(target => target.kind === "contribution").nextDate, "2026-02-28");
monthly.recurrence.endDate = "2026-02-15";
assert.equal(reminderTargets([monthly], [], [], "2026-02-01").find(target => target.kind === "contribution").nextDate, undefined);
for (const TZ of ["America/Guatemala", "America/New_York", "Pacific/Auckland"]) {
  process.env.TZ = TZ;
  assert.equal(previewPostponement("2026-03-07", { unit: "days", amount: 2 }), "2026-03-09");
}

// Exercise the actual persistence controller using only memory storage and a fake transport.
const memory = () => { const values = new Map(); return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) }; };
let remote = null, revision = 0;
const transport = { read: async () => structuredClone(remote), write: async (_user, data) => { remote = { data: structuredClone(data), revision: String(++revision) }; return structuredClone(remote); } };
const hydrate = data => ({ ...data, notifications: normalizeNotificationState(data.notifications) });
const options = { initial: { ...ledger, notifications: normalizeNotificationState() }, hydrate, transport, onChange: () => {} };
const storage = memory();
const first = new FinanceSyncController({ ...options, storage, instanceId: "test-first" });
await first.open("isolated-user");
first.setData(current => ({ ...current, notifications: state }));
await first.flush();
const second = new FinanceSyncController({ ...options, storage: memory(), instanceId: "test-second" });
await second.open("isolated-user");
assert.deepEqual(second.getState().data.notifications.snoozes, state.snoozes, "Sincronización mediante el controlador existente");
first.close(); second.close();
const offline = new FinanceSyncController({ ...options, storage, instanceId: "test-reopen", previousInstanceId: "test-first", transport: { read: async () => { throw Error("offline"); }, write: async () => { throw Error("offline"); } } });
await offline.open("isolated-user");
assert.deepEqual(offline.getState().data.notifications.snoozes, state.snoozes, "Recuperación de copia local sin conexión");
offline.close();
console.log("OK: fechas, recurrencias, cancelación, reactivación, entrega única, finalización anticipada, integridad financiera, persistencia, sincronización y recuperación sin conexión (datos aislados).");
