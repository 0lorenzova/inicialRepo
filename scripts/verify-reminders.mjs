import assert from "node:assert/strict";
import { deriveReminderRecords, summarizeReminders } from "../lib/finance-reminders.ts";
import { omitScheduledOccurrence, payScheduledAmount, postponeScheduledOccurrence } from "../lib/envelope-planning.ts";
import { postponeRecurringContribution, recordRecurringContribution, skipRecurringContribution } from "../lib/finance-recurrence.ts";
import { totals } from "../lib/finance-ledger.ts";

const today = "2026-10-22";
const scheduled = (id, deadline, extra = {}) => ({ id, name: id, amount: 500, deadline, active: true, timingEnabled: true, ...extra });
const baseEnvelope = {
  id: "home", name: "Hogar", icon: "🏠", balance: 2500,
  goalEnabled: true, goal: 3200, goalName: "Fondo hogar", goalDate: "2026-10-27",
  recurrence: { amount: 200, frequency: "Semanal", nextDate: "2026-10-25" },
  scheduledAmounts: [
    scheduled("power", "2026-10-26"),
    scheduled("water", "2026-10-20", { amount: 650 }),
    scheduled("internet", "2026-10-01", { amount: 800, payment: { movementId: "payment-last", amount: 500, date: "2026-10-10T10:00", accountId: "checking" }, payments: [{ movementId: "payment-first", amount: 300, date: "2026-10-08T10:00", accountId: "checking" }, { movementId: "payment-last", amount: 500, date: "2026-10-10T10:00", accountId: "checking" }] }),
    scheduled("phone", "2026-10-26", { amount: 600, payments: [{ movementId: "partial", amount: 200, date: "2026-10-20T10:00", accountId: "checking" }] }),
  ],
};
const contributionMovement = { id: "recurrence:home:2026-10-18", type: "Asignación", name: "Asignación", amount: 200, date: "2026-10-21T10:00", reference: "Aporte recurrente · 2026-10-18", allocations: [{ envelopeId: "home", name: "Hogar", amount: 200 }] };
const records = deriveReminderRecords([baseEnvelope], [contributionMovement], today);
assert.equal(records.find(item => item.itemId === "phone").status, "partial");
assert.equal(records.find(item => item.itemId === "phone").amount, 400, "El pago parcial mantiene solo el saldo pendiente");
assert.equal(records.find(item => item.key.includes("goal:")).amount, 700, "La meta muestra el importe restante, sin sumarlo como deuda");
assert.equal(records.filter(item => item.status === "overdue").length, 1);
assert.equal(records.find(item => item.itemId === "internet").amount, 800, "La tarjeta conserva el total de los abonos registrados");
const summary = summarizeReminders(records, today);
assert.deepEqual(summary.upcoming, { count: 4, amount: 1100 });
assert.deepEqual(summary.overdue, { count: 1, amount: 650 });
assert.deepEqual(summary.completed, { count: 2, amount: 1000 });

const envelope = { ...baseEnvelope, scheduledAmounts: [scheduled("rent", "2026-10-25", { amount: 1000, occurrenceDate: "2026-10-25", repetition: { frequency: "monthly", anchorDay: 25, seriesId: "rent" } })] };
const postponed = postponeScheduledOccurrence([envelope], "home", "rent", "2026-10-28")[0].scheduledAmounts[0];
assert.equal(postponed.deadline, "2026-10-28");
assert.equal(postponed.occurrenceDate, "2026-10-25", "Posponer no altera la fecha ancla recurrente");
const omitted = omitScheduledOccurrence([envelope], "home", "rent", today)[0].scheduledAmounts;
assert.equal(omitted.find(item => item.id === "rent").omittedAt, today);
assert.equal(omitted.find(item => item.id === "scheduled:rent:2026-11-25").deadline, "2026-11-25");
assert.throws(() => omitScheduledOccurrence([{ ...envelope, scheduledAmounts: omitted }], "home", "rent", today), /ya fue omitida/);
const partlyPaidSchedule={...envelope,scheduledAmounts:[scheduled("rent","2026-10-25",{amount:1000,occurrenceDate:"2026-10-25",repetition:{frequency:"monthly",anchorDay:25,seriesId:"rent"},payments:[{movementId:"installment",amount:300,date:"2026-10-20T10:00",accountId:"checking"}]})]};
const omitPartlyPaid=omitScheduledOccurrence([partlyPaidSchedule],"home","rent",today)[0].scheduledAmounts;
assert.equal(omitPartlyPaid.find(item=>item.id==="rent").payments[0].amount,300,"Omitir conserva los abonos de la ocurrencia anterior");
assert.equal(omitPartlyPaid.find(item=>item.id==="scheduled:rent:2026-11-25").payments,undefined,"La siguiente ocurrencia no hereda abonos parciales anteriores");
const omittedPayment=deriveReminderRecords([{...partlyPaidSchedule,scheduledAmounts:omitPartlyPaid}],[],today).find(item=>item.itemId==="rent");
assert.equal(omittedPayment.status,"omitted");
assert.equal(omittedPayment.amount,700,"La omisión solo cierra el importe restante");

const ledger = {
  accounts: [{ id: "checking", name: "Banco", type: "Banco", balance: 3000, active: true }],
  envelopes: [{ id: "home", name: "Hogar", balance: 2500, scheduledAmounts: [scheduled("rent", "2026-10-22", { amount: 1000, repetition: { frequency: "monthly", anchorDay: 22, seriesId: "rent" } })] }],
  loans: [], movements: [],
};
const partial = payScheduledAmount(ledger, "home", "rent", 300, "checking", "2026-10-22T10:00");
assert.equal(partial.envelopes[0].scheduledAmounts[0].payment, undefined);
assert.equal(partial.envelopes[0].scheduledAmounts[0].payments[0].amount, 300);
assert.equal(partial.envelopes[0].scheduledAmounts[0].amount - partial.envelopes[0].scheduledAmounts[0].payments[0].amount, 700);
assert.equal(partial.accounts[0].balance, 2700);
assert.equal(partial.envelopes[0].balance, 2200);
assert.throws(() => payScheduledAmount(partial, "home", "rent", 701, "checking", "2026-10-22T10:01"), /supera el saldo pendiente/);
const staleRetry = payScheduledAmount(ledger, "home", "rent", 300, "checking", "2026-10-22T10:00");
assert.equal(staleRetry.movements[0].id, partial.movements[0].id, "Un reintento sobre una copia anterior conserva el mismo identificador estable");
assert.equal(staleRetry.movements.length, 1, "Un reintento no duplica el movimiento dentro de la copia");
const completed = payScheduledAmount(partial, "home", "rent", 700, "checking", "2026-10-22T10:02");
assert.ok(completed.envelopes[0].scheduledAmounts.find(item => item.id === "rent").payment);
assert.equal(completed.envelopes[0].scheduledAmounts.length, 2, "La serie avanza una sola vez al completar la ocurrencia");
assert.equal(completed.movements.length, 2);
assert.deepEqual(totals(completed), { accounts: 2000, assigned: 1500, unassigned: 500 });

const recurrenceLedger = { accounts: [], envelopes: [{ id: "home", name: "Hogar", balance: 0, recurrence: { amount: 200, frequency: "Semanal", nextDate: "2026-10-25" } }], loans: [], movements: [] };
const recurrencePostponed = postponeRecurringContribution(recurrenceLedger, "home", "2026-10-25", today, { unit: "days", amount: 3 });
assert.equal(recurrencePostponed.envelopes[0].recurrence.nextDate, "2026-10-25");
assert.equal(recurrencePostponed.envelopes[0].recurrence.snoozedUntil, "2026-10-28");
assert.equal(recurrencePostponed.movements.length, 0);
const recurrenceSkipped = skipRecurringContribution(recurrenceLedger, "home", "2026-10-25");
assert.deepEqual(recurrenceSkipped.envelopes[0].recurrence.skippedDates, ["2026-10-25"]);
assert.equal(recurrenceSkipped.envelopes[0].recurrence.nextDate, "2026-11-01");
assert.equal(recurrenceSkipped.movements.length, 0);

const contributionLedger = {
  accounts: [{ id: "checking", name: "Banco", type: "Banco", balance: 1000, active: true }],
  envelopes: [{ id: "home", name: "Hogar", balance: 0, recurrence: { amount: 200, frequency: "Semanal", nextDate: "2026-10-25" } }],
  loans: [], movements: [],
};
const contributionPartial = recordRecurringContribution(contributionLedger, "home", "2026-10-25", 80, "2026-10-22T09:00");
assert.equal(contributionPartial.envelopes[0].recurrence.nextDate, "2026-10-25", "El aporte parcial conserva la ocurrencia pendiente");
assert.equal(contributionPartial.envelopes[0].balance, 80, "El parcial se asigna al sobre como movimiento interno");
assert.equal(contributionPartial.accounts[0].balance, 1000, "Asignar no altera el saldo bancario");
assert.equal(totals(contributionPartial).unassigned, 920);
assert.equal(contributionPartial.movements[0].type, "Asignación");
const partialReminder = deriveReminderRecords(contributionLedger.envelopes.map((item,index)=>index===0?contributionPartial.envelopes[0]:item), contributionPartial.movements, today).find(item=>item.kind==="contribution");
assert.equal(partialReminder.status, "partial");
assert.equal(partialReminder.paidAmount, 80);
assert.equal(partialReminder.amount, 120);
const contributionComplete = recordRecurringContribution(contributionPartial, "home", "2026-10-25", 120, "2026-10-23T09:00");
assert.equal(contributionComplete.envelopes[0].recurrence.nextDate, "2026-11-01", "La cadencia avanza al completar el monto programado");
assert.equal(contributionComplete.movements.length, 2);
assert.equal(contributionComplete.envelopes[0].balance, 200);
assert.equal(deriveReminderRecords(contributionComplete.envelopes, contributionComplete.movements, today).filter(item=>item.status==="completed"&&item.kind==="contribution").length,1);
const partialThenOmitted = skipRecurringContribution(contributionPartial, "home", "2026-10-25");
const omittedReminder = deriveReminderRecords(partialThenOmitted.envelopes, partialThenOmitted.movements, today).find(item=>item.status==="omitted"&&item.kind==="contribution");
assert.equal(omittedReminder.paidAmount, 80, "Omitir no borra las asignaciones parciales ya realizadas");
assert.equal(omittedReminder.amount, 120, "Solo se omite el restante de la ocurrencia");
assert.equal(partialThenOmitted.envelopes[0].balance, 80, "Omitir no crea un reembolso ni cambia el saldo del sobre");
const recurrenceDisabled={...partialThenOmitted.envelopes[0],recurrence:undefined};
assert.ok(deriveReminderRecords([recurrenceDisabled],partialThenOmitted.movements,today).some(item=>item.status==="omitted"&&item.kind==="contribution"),"El historial de omisiones permanece después de desactivar la recurrencia");
const snoozedOccurrence=postponeRecurringContribution(recurrenceLedger,"home","2026-10-25",today,{unit:"days",amount:3});
const skippedAfterSnooze=skipRecurringContribution(snoozedOccurrence,"home","2026-10-25");
const snoozedOmission=deriveReminderRecords(skippedAfterSnooze.envelopes,[],today);
assert.equal(snoozedOmission.filter(item=>item.status==="completed"&&item.kind==="contribution").length,0,"Omitir una ocurrencia pospuesta no la presenta como realizada");
assert.equal(snoozedOmission.find(item=>item.status==="omitted"&&item.kind==="contribution").date,"2026-10-28","El historial conserva la fecha efectiva pospuesta");
assert.throws(()=>recordRecurringContribution({...contributionLedger,accounts:[{...contributionLedger.accounts[0],balance:10}]},"home","2026-10-25",11,"2026-10-22T09:00"),/sin asignar suficiente/);

console.log("OK: resumen real, vencimientos, progreso de metas, pagos parciales completos, idempotencia, posponer/omitir ocurrencias y cadencia de recurrencias sin movimientos automáticos.");
