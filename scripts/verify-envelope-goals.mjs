import assert from "node:assert/strict";
import { DEFAULT_GOAL_THRESHOLDS, getEnvelopeGoal, validateGoalSettings } from "../lib/envelope-goals.ts";

const legacy = { id: "savings", balance: 25_000, goal: 100_000 };
const before = JSON.stringify(legacy);
for (const percentage of [25, 100, 110, 200, 700]) {
  const result = getEnvelopeGoal({ ...legacy, balance: percentage * 1000 }, "2026-10-01");
  assert.equal(result.active, true);
  assert.ok(Math.abs(result.percentage - percentage) < 1e-10);
  assert.equal(result.fillPercentage, Math.min(percentage, 100));
  assert.equal(result.reached, percentage >= 100);
  assert.equal(result.surplus, Math.max(0, percentage * 1000 - legacy.goal));
  assert.equal(result.temporal, null);
}
assert.equal(JSON.stringify(legacy), before);
assert.equal(getEnvelopeGoal({ balance: 30_000 }, "2026-10-01").active, false);
assert.equal(getEnvelopeGoal({ ...legacy, goalEnabled: false }, "2026-10-01").active, false);
assert.equal(getEnvelopeGoal({ ...legacy, goal: 0 }, "2026-10-01").active, false);
assert.equal(getEnvelopeGoal({ ...legacy, goal: -1 }, "2026-10-01").active, false);
assert.equal(getEnvelopeGoal({ ...legacy, balance: 1, goal: 3 }, "2026-10-01").percentage, 1 / 3 * 100);

const dateAfter = (days) => {
  const date = new Date("2026-10-01T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};
const timed = { ...legacy, goalEnabled: true, goalThresholds: { green: 60, yellow: 20, red: 5 } };
for (const [days, tone, label] of [
  [61, null, null], [60, "green", "Estás a tiempo"], [21, "green", "Estás a tiempo"],
  [20, "yellow", "Queda poco tiempo"], [6, "yellow", "Queda poco tiempo"],
  [5, "red", "Tiempo crítico"], [1, "red", "Tiempo crítico"],
  [0, "red", "Fecha límite alcanzada"], [-1, "red", "Fecha límite vencida"],
]) {
  const result = getEnvelopeGoal({ ...timed, goalDate: dateAfter(days) }, "2026-10-01");
  assert.equal(result.daysRemaining, days);
  assert.equal(result.temporal?.tone ?? null, tone);
  assert.equal(result.temporal?.label ?? null, label);
  assert.equal(result.percentage, 25); // Money never depends on the deadline.
  if (tone) assert.ok(result.temporal.explanation.length > 0);
}
const overGoal = getEnvelopeGoal({ ...timed, balance: 700_000, goalDate: dateAfter(-1) }, "2026-10-01");
assert.equal(overGoal.percentage, 700);
assert.equal(overGoal.temporal.label, "Fecha límite vencida");
assert.equal(getEnvelopeGoal({ ...timed, goalDate: dateAfter(1), goalTimingEnabled: false }, "2026-10-01").temporal, null);
assert.equal(getEnvelopeGoal({ ...legacy, goalDate: dateAfter(DEFAULT_GOAL_THRESHOLDS.yellow) }, "2026-10-01").temporal.tone, "yellow");
assert.equal(getEnvelopeGoal({ ...timed, goalDate: "2026-02-30" }, "2026-10-01").active, true);
assert.equal(getEnvelopeGoal({ ...timed, goalDate: "2026-02-30" }, "2026-10-01").temporal, null);
assert.equal(getEnvelopeGoal({ ...timed, goalDate: "2028-03-01" }, "2028-02-28").daysRemaining, 2);
assert.equal(getEnvelopeGoal({ ...timed, goalDate: "2027-01-01" }, "2026-12-31").daysRemaining, 1);
const custom = { ...timed, goalThresholds: { green: 10, yellow: 3, red: 0 } };
assert.equal(getEnvelopeGoal({ ...custom, goalDate: dateAfter(11) }, "2026-10-01").temporal, null);
assert.equal(getEnvelopeGoal({ ...custom, goalDate: dateAfter(4) }, "2026-10-01").temporal.tone, "green");
assert.equal(getEnvelopeGoal({ ...custom, goalDate: dateAfter(1) }, "2026-10-01").temporal.tone, "yellow");

for (const goal of [0, -1, 0.1, undefined, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
  assert.throws(() => validateGoalSettings({ goalEnabled: true, goal }), /monto objetivo/);
}
for (const goalThresholds of [
  { green: 20, yellow: 20, red: 5 }, { green: 10, yellow: 20, red: 5 },
  { green: 60, yellow: 5, red: 5 }, { green: 60, yellow: 20, red: -1 },
  { green: 60.5, yellow: 20, red: 5 }, { green: Infinity, yellow: 20, red: 5 },
  { green: 60, yellow: 20 },
]) assert.throws(() => validateGoalSettings({ ...timed, goalThresholds }), /este orden/);
for (const goalDate of ["2026-02-30", "2026-13-01", "0000-01-01", "01/10/2026"]) {
  assert.throws(() => validateGoalSettings({ ...timed, goalDate }), /fecha límite/);
}
for (const goalDisplay of ["percentage", "reached", "surplus"]) validateGoalSettings({ ...timed, goalDisplay });
assert.throws(() => validateGoalSettings({ ...timed, goalDisplay: "other" }), /cómo quieres/);
validateGoalSettings({ goalEnabled: false });
validateGoalSettings(legacy);
validateGoalSettings({ ...timed, goalThresholds: { green: 2, yellow: 1, red: 0 } });
console.log("OK: metas compatibles, 25/100/110/200/700%, excedentes, umbrales independientes y límites de fechas.");
