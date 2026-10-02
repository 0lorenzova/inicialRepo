import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(context.parentURL?.includes("/lib/") && ["./finance-ledger", "./finance-recurrence"].includes(specifier) ? `${specifier}.ts` : specifier, context);
  },
});
const { normalizeNotificationState, deriveFinanceNotifications, initializeNotifications, visibleNotifications, pendingNotificationDelivery, markNotifications, saveNotificationUpdate } = await import("../lib/finance-notifications.ts");
hooks.deregister();

const tiedMovements = [
  { id: "z", type: "Devolución", name: "Devolución reciente", amount: 3000, date: "2026-10-02T10:30", allocations: [] },
  { id: "a", type: "Devolución", name: "Devolución anterior", amount: 2000, date: "2026-10-02T10:30", allocations: [] },
];
assert.deepEqual(deriveFinanceNotifications(tiedMovements, [], "2026-10-02").map(event => event.id), ["movement:z", "movement:a"], "Fechas iguales conservan el orden del historial, no el orden alfabético de IDs");
assert.deepEqual(deriveFinanceNotifications([...tiedMovements].reverse(), [], "2026-10-02").map(event => event.id), ["movement:a", "movement:z"], "El desempate siempre respeta la fuente");
console.log("Notificaciones: empates de fecha conservan el orden de Movimientos.");
if (process.argv.includes("--ties-only")) process.exit(0);

const movement = { id: "income-1", type: "Ingreso", name: "Ingreso ficticio", amount: 100_000, date: "2026-10-01T08:15", allocations: [] };
const envelope = { id: "new-envelope", name: "Nuevo creado por usuario", balance: 5_000, recurrence: { amount: 2_000, frequency: "Mensual", nextDate: "2026-10-01" } };
const seed = JSON.stringify({ movement, envelope });
const defaults = normalizeNotificationState();
assert.deepEqual(defaults, { internal: true, system: false, sound: false, tone: "Suave", initialized: false, readIds: [], dismissedIds: [], deliveredIds: [] });
assert.deepEqual(normalizeNotificationState({ readIds: ["a", "a", null, 20], tone: "unknown", internal: false }).readIds, ["a"]);
assert.equal(normalizeNotificationState({ tone: "unknown" }).tone, "Suave");
assert.equal(normalizeNotificationState({ tone: "Campana", sound: true, system: true }).tone, "Campana");

const events = deriveFinanceNotifications([movement, movement], [envelope], "2026-10-01");
assert.equal(events.length, 2, "No duplicar el mismo movimiento");
assert.deepEqual(events[0].destination, { page: "Movimientos", movementId: movement.id });
assert.deepEqual(events[1].destination, { page: "Recordatorios", envelopeId: envelope.id });
assert.equal(events[1].amount, 2_000);
assert.equal(deriveFinanceNotifications([], [envelope], "2026-09-30").length, 0, "No avisar antes del vencimiento");
assert.equal(deriveFinanceNotifications([], [{ ...envelope, archived: true }], "2026-10-01").length, 0);
assert.equal(deriveFinanceNotifications([], [{ ...envelope, recurrence: { ...envelope.recurrence, amount: -1 } }], "2026-10-01").length, 0);

let state = initializeNotifications(defaults, events);
assert.deepEqual(state.readIds, ["movement:income-1"], "Historial anterior inicia leído");
assert.equal(pendingNotificationDelivery(state, events).length, 1, "Recordatorio actual sigue pendiente");
assert.equal(initializeNotifications(state, events), state, "Inicialización idempotente");
state = markNotifications(state, "deliveredIds", [events[1].id, events[1].id]);
assert.equal(pendingNotificationDelivery(state, events).length, 0, "No repetir avisos tras recargar");
state = markNotifications(state, "readIds", [events[1].id]);
assert.equal(visibleNotifications(state, events).length, 2, "Leer no borra registros");
state = markNotifications(state, "dismissedIds", [events[1].id]);
assert.equal(visibleNotifications(state, events).length, 1, "Descartar solo oculta el aviso");
const next = deriveFinanceNotifications([{ ...movement, id: "income-2", date: "2026-10-01T10:00" }, movement], [envelope], "2026-10-01");
assert.equal(pendingNotificationDelivery(state, next)[0].id, "movement:income-2");
const nextMonth = deriveFinanceNotifications([], [{ ...envelope, recurrence: { ...envelope.recurrence, nextDate: "2026-11-01" } }], "2026-11-01");
assert.equal(pendingNotificationDelivery(state, nextMonth).length, 1, "Cada nuevo vencimiento tiene identidad independiente");
assert.equal(JSON.stringify({ movement, envelope }), seed, "Los avisos no modifican saldos ni movimientos");
assert.match(saveNotificationUpdate(() => { throw new Error("QuotaExceededError"); }, value => value), /No se pudo guardar/, "Error de preferencias no interrumpe la app");
assert.equal(saveNotificationUpdate(update => { state = update(state); }, value => ({ ...value, sound: true })), null);
assert.equal(state.sound, true);
const disabled = normalizeNotificationState({ internal: false, system: false, sound: false, initialized: true });
const consumedDisabled = markNotifications(disabled, "deliveredIds", events.map(event => event.id));
assert.equal(pendingNotificationDelivery({ ...consumedDisabled, system: true }, events).length, 0, "Activar avisos no reproduce una avalancha del pasado");
const postponed = deriveFinanceNotifications([], [{ ...envelope, recurrence: { ...envelope.recurrence, nextDate: "2026-10-08" } }], "2026-10-02");
assert.equal(postponed.length, 0, "Posponer retira el aviso vencido de la proyección actual");
const custom = deriveFinanceNotifications([], [{ ...envelope, recurrence: { amount: 2000, frequency: "Personalizado", intervalDays: 3, nextDate: "2026-10-02" } }], "2026-10-02");
assert.equal(custom.length, 1, "Recurrencias personalizadas participan igual que las existentes");
console.log("Notificaciones: preferencias, migración, recordatorios, lectura, descarte, orden e idempotencia correctos.");
