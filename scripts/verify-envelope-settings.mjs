import assert from "node:assert/strict";
import { registerHooks } from "node:module";
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(["./finance-ledger", "./finance-recurrence", "./envelope-goals"].includes(specifier) ? `${specifier}.ts` : specifier, context);
  },
});
const { saveEnvelopeSettings, saveGoalSettings } = await import("../lib/envelope-settings.ts");
hooks.deregister();

const original = { id: "savings", name: "Ahorro", icon: "🐷", balance: 1000, goal: 10000, recurrence: { amount: 100, frequency: "Mensual", nextDate: "2026-10-01" } };
const refreshed = { ...original, balance: 2500, recurrence: { ...original.recurrence, nextDate: "2026-11-01" } };
const saved = saveEnvelopeSettings([refreshed], { ...original, name: "Viajes" }, original)[0];
assert.equal(saved.balance, 2500);
assert.equal(saved.name, "Viajes");
assert.equal(saved.recurrence.nextDate, "2026-11-01");
assert.throws(() => saveEnvelopeSettings([{ ...refreshed, name: "Vacaciones" }], { ...original, name: "Viajes" }, original), /cambió/);
assert.throws(() => saveEnvelopeSettings([{ ...refreshed, archived: true }], original, original), /activo/);
assert.throws(() => saveEnvelopeSettings([], original, original), /activo/);
assert.throws(() => saveEnvelopeSettings([original], original, null), /ya existe/);
assert.equal(saveEnvelopeSettings([], original, null)[0].balance, 0);
assert.deepEqual(refreshed.balance, 2500);
const snoozed = { ...original, recurrence: { nextDate: "2026-10-01", frequency: "Mensual", amount: 100, snoozedUntil: "2026-10-01" } };
assert.equal(saveEnvelopeSettings([refreshed], { ...original, name: "Viajes" }, snoozed)[0].recurrence.nextDate, "2026-11-01");
const goalOriginal = { ...original, goalEnabled: true, goalDate: "2027-01-01", goalThresholds: { green: 60, yellow: 20, red: 5 }, goalDisplay: "percentage" };
const live = { ...goalOriginal, name: "Viajes actuales", balance: 3000 };
const goalSaved = saveGoalSettings([live], { ...goalOriginal, goal: 20000, name: "No debe renombrar", icon: "X", balance: 999 }, goalOriginal)[0];
assert.equal(goalSaved.goal, 20000);
assert.equal(goalSaved.name, "Viajes actuales");
assert.equal(goalSaved.icon, original.icon);
assert.equal(goalSaved.balance, 3000);
const disabled = saveGoalSettings([live], { ...goalOriginal, goalEnabled: false }, goalOriginal)[0];
assert.equal(disabled.goalEnabled, false);
assert.equal(disabled.goal, 10000);
assert.equal(disabled.balance, 3000);
assert.throws(() => saveGoalSettings([{ ...live, goal: 30000 }], { ...goalOriginal, goal: 20000 }, goalOriginal), /cambió/);
assert.throws(() => saveGoalSettings([live], { ...goalOriginal, goalThresholds: { green: 2, yellow: 2, red: 1 } }, goalOriginal), /este orden/);
const reorderedThresholds = { ...goalOriginal, goalThresholds: { red: 5, green: 60, yellow: 20 } };
assert.equal(saveGoalSettings([live], { ...goalOriginal, goalDisplay: "surplus" }, reorderedThresholds)[0].goalDisplay, "surplus");
const customOriginal = { ...goalOriginal, recurrence: { amount: 100, frequency: "Personalizado", intervalDays: 10, nextDate: "2026-10-01" } };
assert.equal(saveGoalSettings([customOriginal], { ...customOriginal, recurrence: { ...customOriginal.recurrence, intervalDays: 15 } }, customOriginal)[0].recurrence.intervalDays, 15);
assert.throws(() => saveGoalSettings([{ ...customOriginal, recurrence: { ...customOriginal.recurrence, intervalDays: 20 } }], { ...customOriginal, recurrence: { ...customOriginal.recurrence, intervalDays: 15 } }, customOriginal), /cambió/);
assert.throws(() => saveGoalSettings([customOriginal], { ...customOriginal, recurrence: { ...customOriginal.recurrence, intervalDays: 0 } }, customOriginal), /cantidad de días/);
console.log("OK: edición de sobres conserva saldo vigente y aportes actualizados; detecta edición concurrente y archivado.");
