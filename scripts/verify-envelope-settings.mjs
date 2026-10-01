import assert from "node:assert/strict";
import { saveEnvelopeSettings } from "../lib/envelope-settings.ts";

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
console.log("OK: edición de sobres conserva saldo vigente y aportes actualizados; detecta edición concurrente y archivado.");
