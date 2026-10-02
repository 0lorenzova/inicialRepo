import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { getEnvelopeGoal } from "../lib/envelope-goals.ts";
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(["./finance-ledger", "./finance-recurrence", "./envelope-goals"].includes(specifier) ? `${specifier}.ts` : specifier, context);
  },
});
const { saveGoalSettings, saveEnvelopeSettings } = await import("../lib/envelope-settings.ts");
hooks.deregister();

const original = Object.freeze({ id: "viaje", name: "Viaje", icon: "✈️", balance: 25000, goal: 10000, goalEnabled: true, goalDate: "2026-10-07", goalTimingEnabled: true });
const visible = getEnvelopeGoal(original, "2026-10-02");
assert.equal(visible.showProgress, true, "Las metas existentes mantienen su barra visible");
const hidden = saveGoalSettings([original], { ...original, goalProgressVisible: false }, original)[0];
const concealed = getEnvelopeGoal(hidden, "2026-10-02");
assert.equal(concealed.showProgress, false);
assert.equal(concealed.active, true, "Ocultar el progreso no desactiva la meta");
assert.equal(concealed.percentage, visible.percentage);
assert.equal(concealed.surplus, visible.surplus);
assert.deepEqual(concealed.temporal, visible.temporal, "Ocultar la barra no modifica el indicador temporal");
assert.equal(hidden.balance, original.balance);
assert.equal(hidden.goal, original.goal);
assert.equal(original.goalProgressVisible, undefined, "Se conserva el documento original");
const reopened = JSON.parse(JSON.stringify(hidden));
assert.equal(reopened.goalProgressVisible, false, "La preferencia persiste en el documento JSON");
const renamed = saveEnvelopeSettings([reopened], { ...reopened, name: "Vacaciones" }, reopened)[0];
assert.equal(renamed.goalProgressVisible, false, "Editar el nombre conserva la preferencia visual");
const shownAgain = saveGoalSettings([renamed], { ...renamed, goalProgressVisible: true, goalTimingEnabled: false }, renamed)[0];
const independent = getEnvelopeGoal(shownAgain, "2026-10-02");
assert.equal(independent.showProgress, true);
assert.equal(independent.temporal, null, "La barra y el indicador pueden mostrarse de forma independiente");
assert.equal(shownAgain.balance, original.balance);
assert.throws(() => saveGoalSettings([{ ...original, goalProgressVisible: true }], { ...original, goalProgressVisible: false }, original), /cambió/, "No sobrescribir una configuración visual concurrente");
console.log("Visibilidad de meta: barra independiente, compatibilidad, persistencia y saldo conservados.");
