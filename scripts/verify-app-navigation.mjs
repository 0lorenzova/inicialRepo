import assert from "node:assert/strict";
import { baseNavigation, nextNavigation, restoreNavigation, navigationUrl, safeNavigationView } from "../lib/app-navigation.ts";

if (!process.argv.includes("--filters-only")) {
const base = baseNavigation("user-a", "mount-1", "Sobres");
assert.equal(base.value.view, "Sobres");
assert.equal(safeNavigationView("No existe"), "Inicio");
const chooser = nextNavigation(base, { overlay: "new" });
const flow = nextNavigation(chooser, { overlay: null, flow: "Ingreso", step: 0 });
const step = nextNavigation(flow, { step: 1 });
assert.equal(step.index, 3);
assert.equal(step.base, 0);
assert.equal(step.base - step.index, -3, "Cerrar un flujo vuelve a la vista previa al selector Nuevo");
assert.equal(restoreNavigation(flow, "user-a", "mount-1").entry.value.step, 0, "Atrás recupera el paso anterior");
assert.equal(restoreNavigation(chooser, "user-a", "mount-1").entry.value.overlay, "new");
assert.match(navigationUrl(step.value), /registro=Ingreso&paso=2/);
const context = { id: "custom-envelope", name: "Viaje", balance: 10000 };
const goal = nextNavigation(base, { overlay: "goal", context });
assert.deepEqual(restoreNavigation(goal, "user-a", "mount-1").entry.value.context, context);
const secondGoal = nextNavigation(goal, { context: { ...context, id: "other-envelope" } });
assert.equal(restoreNavigation(goal, "user-a", "mount-1").entry.value.context.id, "custom-envelope", "Cada entrada conserva su elemento");
assert.equal(secondGoal.value.context.id, "other-envelope");
const destination = nextNavigation(goal, { view: "Movimientos", overlay: null, flow: null, step: 0 }, true);
assert.equal(destination.value.context, null, "Salir de un modal elimina su contexto");
assert.equal(destination.index, goal.index);
assert.equal(destination.base, destination.index);
const reloaded = restoreNavigation(goal, "user-a", "mount-2");
assert.equal(reloaded.replace, true);
assert.deepEqual(reloaded.entry, baseNavigation("user-a", "mount-2", "Sobres"), "Tras recargar solo se restaura la vista, nunca un draft viejo");
assert.equal(restoreNavigation(goal, "user-b", "mount-1").entry.value.context, null, "Nunca compartir contexto entre usuarios");
assert.equal(restoreNavigation({ ...goal, value: { ...goal.value, context: null } }, "user-a", "mount-1").replace, true);
assert.equal(restoreNavigation({ ...goal, index: -1 }, "user-a", "mount-1").replace, true);
assert.equal(restoreNavigation({ ...goal, value: { ...goal.value, step: 99 } }, "user-a", "mount-1").replace, true);
assert.equal(restoreNavigation(null, "user-a", "mount-1"), null, "No interceptar navegación que no pertenece a Finanzas");
console.log("Navegación: contexto, pasos, cierre a vista base, recarga segura y aislamiento entre usuarios correctos.");
}

const filteredBase = baseNavigation("user-a", "mount-filters", "Sobres");
const envelopeHistory = nextNavigation(filteredBase, { view: "Movimientos", movementEnvelopeId: "viaje", movementId: null, reminderEnvelopeId: null });
const specificMovement = nextNavigation(envelopeHistory, { movementEnvelopeId: null, movementId: "mov-12" });
const filteredReminder = nextNavigation(specificMovement, { view: "Recordatorios", movementId: null, reminderEnvelopeId: "viaje" });
const restoreFilters = entry => restoreNavigation(structuredClone(entry), "user-a", "mount-filters").entry.value;
assert.equal(restoreFilters(envelopeHistory).movementEnvelopeId, "viaje", "Atrás conserva el filtro del sobre, aunque la entrada siguiente use otro filtro");
assert.equal(restoreFilters(specificMovement).movementId, "mov-12", "Adelante restaura el movimiento seleccionado");
assert.equal(restoreFilters(specificMovement).movementEnvelopeId, null, "El movimiento individual no hereda un filtro de sobre anterior");
assert.equal(restoreFilters(filteredReminder).reminderEnvelopeId, "viaje", "Adelante recupera el recordatorio seleccionado");
assert.equal(restoreFilters(filteredReminder).movementId, null);
const reminderDialog = nextNavigation(filteredReminder, { overlay: "postpone", context: { id: "viaje" } });
assert.equal(reminderDialog.base, filteredReminder.index, "Cerrar un panel vuelve a la lista contextual que lo abrió");
assert.equal(restoreFilters(reminderDialog).reminderEnvelopeId, "viaje");
const clearedFilter = nextNavigation(envelopeHistory, { movementEnvelopeId: null }, true);
assert.equal(clearedFilter.index, envelopeHistory.index, "Quitar un filtro sustituye la entrada actual");
assert.equal(restoreFilters(clearedFilter).movementEnvelopeId, null);
assert.equal(restoreFilters(envelopeHistory).movementEnvelopeId, "viaje", "La sustitución no muta entradas previas");
for (const key of ["movementEnvelopeId", "movementId", "reminderEnvelopeId"]) {
  const entry = nextNavigation(filteredBase, { [key]: "context-id" });
  assert.equal(restoreNavigation(entry, "user-a", "new-mount").entry.value[key], undefined, "Una recarga no recupera filtros de una sesión anterior");
  assert.equal(restoreNavigation(entry, "user-b", "mount-filters").entry.value[key], undefined, "Los filtros no pasan a otro usuario");
  assert.equal(restoreNavigation({ ...entry, value: { ...entry.value, [key]: {} } }, "user-a", "mount-filters").replace, true, "Un filtro inválido se descarta con seguridad");
}
console.log("Filtros de navegación: Atrás/Adelante, movimiento, sobre, recordatorio, cierre y aislamiento correctos.");
