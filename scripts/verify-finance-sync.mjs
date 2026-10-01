import assert from "node:assert/strict";
import { FinanceSyncController, SyncConflictError } from "../lib/finance-sync.ts";

const clone = (value) => structuredClone(value);
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const storage = () => {
  const entries = new Map();
  return { entries, getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => { entries.set(key, value); }, removeItem: (key) => { entries.delete(key); } };
};
const server = () => {
  const rows = new Map();
  const calls = [];
  let sequence = 0;
  const api = {
    rows, calls, beforeRead: null, beforeWrite: null, afterWrite: null,
    put(userId, data) { const row = { data: clone(data), revision: `revision-${++sequence}` }; rows.set(userId, row); return row; },
    async read(userId) {
      calls.push({ operation: "read", userId });
      if (api.beforeRead) await api.beforeRead(userId);
      return rows.has(userId) ? clone(rows.get(userId)) : null;
    },
    async write(userId, data, expectedRevision) {
      calls.push({ operation: "write", userId, data: clone(data), expectedRevision });
      if (api.beforeWrite) await api.beforeWrite(userId, data);
      if ((rows.get(userId)?.revision ?? null) !== expectedRevision) throw new SyncConflictError();
      const saved = api.put(userId, data);
      if (api.afterWrite) await api.afterWrite(userId);
      return clone(saved);
    },
  };
  return api;
};
const controller = (transport, local = storage(), extra = {}) => new FinanceSyncController({ initial: { amount: 0 }, hydrate: clone, storage: local, transport, onChange: () => {}, ...extra });
const writes = (remote) => remote.calls.filter((call) => call.operation === "write");
let scenarios = 0;
const scenario = async (name, run) => { await run(); ++scenarios; console.log(`OK: ${name}`); };

await scenario("creación diferida y cambios idénticos sin escritura", async () => {
  const remote = server(), client = controller(remote);
  await client.open("ana");
  assert.equal(client.getState().pending, true);
  assert.equal(writes(remote).length, 0);
  await client.flush();
  assert.equal(writes(remote).length, 1);
  assert.equal(writes(remote)[0].expectedRevision, null);
  client.setData((previous) => ({ ...previous }));
  await client.flush();
  assert.equal(writes(remote).length, 1);
  assert.equal(client.getState().status, "synced");
});

await scenario("dos dispositivos: una escritura gana y la otra conserva su conflicto", async () => {
  const remote = server(); remote.put("ana", { amount: 10 });
  const a = controller(remote), b = controller(remote);
  await Promise.all([a.open("ana"), b.open("ana")]);
  a.setData({ amount: 20 }); b.setData({ amount: 30 });
  await Promise.all([a.flush(), b.flush()]);
  assert.equal(a.getState().status, "synced");
  assert.equal(b.getState().status, "conflict");
  assert.equal(b.getState().data.amount, 30);
  assert.equal(b.getState().pending, true);
  assert.equal(remote.rows.get("ana").data.amount, 20);
  await b.flush();
  assert.equal(writes(remote).length, 2);
});

await scenario("ediciones durante guardado se serializan con la nueva revisión", async () => {
  const remote = server(); remote.put("ana", { amount: 0 });
  const gate = deferred(), entered = deferred();
  let active = 0, maxActive = 0;
  remote.beforeWrite = async () => { ++active; maxActive = Math.max(maxActive, active); entered.resolve(); await gate.promise; --active; };
  const client = controller(remote); await client.open("ana");
  client.setData({ amount: 1 });
  const flush = client.flush(); await entered.promise;
  client.setData({ amount: 2 });
  const otherFlush = client.flush();
  gate.resolve(); await Promise.all([flush, otherFlush]);
  assert.equal(maxActive, 1);
  assert.equal(writes(remote).length, 2);
  assert.notEqual(writes(remote)[0].expectedRevision, writes(remote)[1].expectedRevision);
  assert.equal(remote.rows.get("ana").data.amount, 2);
  assert.equal(client.getState().pending, false);
});

await scenario("lectura inicial fallida nunca habilita escrituras", async () => {
  const remote = server(), local = storage();
  local.setItem("finanzas:cache:ana", JSON.stringify({ data: { amount: 99 }, revision: "unknown", pending: true }));
  remote.beforeRead = async () => { throw new Error("Sin conexión"); };
  const client = controller(remote, local);
  await client.open("ana"); await client.flush();
  assert.equal(client.getState().ready, false);
  assert.equal(client.getState().status, "error");
  assert.equal(client.getState().data.amount, 99);
  assert.throws(() => client.setData({ amount: 100 }), /Espera/);
  assert.equal(writes(remote).length, 0);
});

await scenario("las cachés pertenecen al usuario y no se importa la copia global", async () => {
  const remote = server(), local = storage();
  local.setItem("finanzas", JSON.stringify({ amount: 999 }));
  remote.put("ana", { amount: 10 }); remote.put("bea", { amount: 40 });
  const client = controller(remote, local);
  await client.open("ana"); client.setData({ amount: 11 });
  await client.open("bea");
  assert.equal(client.getState().data.amount, 40);
  assert.equal(JSON.parse(local.getItem("finanzas:cache:ana")).data.amount, 11);
  assert.equal(JSON.parse(local.getItem("finanzas:cache:bea")).data.amount, 40);
  await client.open("ana");
  assert.equal(client.getState().data.amount, 11);
  assert.equal(client.getState().pending, true);
});

await scenario("refresh limpio carga cambios remotos sin escribir", async () => {
  const remote = server(); remote.put("ana", { amount: 10 });
  const client = controller(remote); await client.open("ana");
  remote.put("ana", { amount: 20 }); await client.refresh();
  assert.equal(client.getState().data.amount, 20);
  assert.equal(client.getState().status, "synced");
  assert.equal(writes(remote).length, 0);
});

await scenario("pendientes al reabrir conservan su base o detectan conflicto", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 10 });
  const first = controller(remote, local, { instanceId: "tab" }); await first.open("ana");
  first.setData({ amount: 12 }); first.close();
  const reopened = controller(remote, local, { instanceId: "tab" }); await reopened.open("ana");
  assert.equal(reopened.getState().data.amount, 12);
  assert.equal(reopened.getState().status, "syncing");
  remote.put("ana", { amount: 15 });
  const conflicting = controller(remote, local, { instanceId: "tab" }); await conflicting.open("ana"); await conflicting.flush();
  assert.equal(conflicting.getState().data.amount, 12);
  assert.equal(conflicting.getState().status, "conflict");
  assert.equal(writes(remote).length, 0);
});

await scenario("limpiar caché conserva datos y nube sin recrearla en refresh", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 10 });
  const client = controller(remote, local); await client.open("ana");
  assert.equal(client.clearCache(), true);
  assert.equal(local.getItem("finanzas:cache:ana"), null);
  await client.refresh(); await client.flush();
  assert.equal(local.getItem("finanzas:cache:ana"), null);
  assert.equal(client.getState().data.amount, 10);
  assert.equal(writes(remote).length, 0);
  client.setData({ amount: 11 });
  assert.ok(local.getItem("finanzas:cache:ana"));
  assert.equal(client.clearCache(), false);
});

await scenario("respuesta perdida tras commit se reconoce sin duplicar escritura", async () => {
  const remote = server(); remote.put("ana", { amount: 0 });
  const client = controller(remote); await client.open("ana");
  remote.afterWrite = async () => { throw new Error("Respuesta perdida"); };
  client.setData({ amount: 25 }); await client.flush();
  assert.equal(client.getState().status, "error");
  assert.equal(client.getState().pending, true);
  assert.equal(remote.rows.get("ana").data.amount, 25);
  remote.afterWrite = null; await client.refresh(); await client.flush();
  assert.equal(client.getState().status, "synced");
  assert.equal(client.getState().pending, false);
  assert.equal(writes(remote).length, 1);
});

await scenario("cambiar sesión invalida respuestas de lectura y escritura antiguas", async () => {
  const remote = server(); remote.put("ana", { amount: 10 }); remote.put("bea", { amount: 20 });
  const readGate = deferred(), readEntered = deferred();
  remote.beforeRead = async (userId) => { if (userId === "ana") { readEntered.resolve(); await readGate.promise; } };
  const client = controller(remote);
  const firstOpen = client.open("ana"); await readEntered.promise;
  await client.open("bea"); readGate.resolve(); await firstOpen;
  assert.equal(client.getState().userId, "bea"); assert.equal(client.getState().data.amount, 20);
  remote.beforeRead = null; await client.open("ana");
  const writeGate = deferred(), writeEntered = deferred();
  remote.beforeWrite = async () => { writeEntered.resolve(); await writeGate.promise; };
  client.setData({ amount: 11 }); const saving = client.flush(); await writeEntered.promise;
  await client.open("bea"); writeGate.resolve(); await saving;
  assert.equal(client.getState().userId, "bea"); assert.equal(client.getState().data.amount, 20);
  assert.equal(remote.rows.get("ana").data.amount, 11);
});

await scenario("cargar nube respalda pendientes y una lectura fallida no los descarta", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 10 });
  const client = controller(remote, local); await client.open("ana"); client.setData({ amount: 30 });
  remote.beforeRead = async () => { throw new Error("Sin conexión"); };
  await client.reloadFromCloud();
  assert.equal(client.getState().data.amount, 30); assert.equal(client.getState().pending, true);
  assert.equal(client.getState().ready, true); assert.equal(client.getBackup().data.amount, 30);
  remote.beforeRead = null; await client.reloadFromCloud();
  assert.equal(client.getState().data.amount, 10); assert.equal(client.getState().pending, false);
  assert.equal(client.getBackup().data.amount, 30); assert.equal(writes(remote).length, 0);
  const snapshot = client.getSnapshot(); snapshot.data.amount = 777;
  assert.equal(client.getState().data.amount, 10);
});

await scenario("dos pestañas preservan borradores independientes ante conflicto", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 0 });
  const a = controller(remote, local, { instanceId: "tab-a" }), b = controller(remote, local, { instanceId: "tab-b" });
  await Promise.all([a.open("ana"), b.open("ana")]);
  a.setData({ amount: 1 }); b.setData({ amount: 2 });
  remote.put("ana", { amount: 3 }); await Promise.all([a.flush(), b.flush()]);
  assert.equal(a.getState().status, "conflict"); assert.equal(b.getState().status, "conflict");
  assert.equal(JSON.parse(local.getItem("finanzas:draft:ana:tab-a")).data.amount, 1);
  assert.equal(JSON.parse(local.getItem("finanzas:draft:ana:tab-b")).data.amount, 2);
  const reopenedA = controller(remote, local, { instanceId: "tab-a" }), reopenedB = controller(remote, local, { instanceId: "tab-b" });
  await Promise.all([reopenedA.open("ana"), reopenedB.open("ana")]);
  assert.equal(reopenedA.getState().data.amount, 1); assert.equal(reopenedB.getState().data.amount, 2);
});

await scenario("refresh durante guardado espera toda la cola de cambios", async () => {
  const remote = server(); remote.put("ana", { amount: 0 });
  const client = controller(remote); await client.open("ana");
  const gate = deferred(), entered = deferred();
  remote.beforeWrite = async () => { entered.resolve(); await gate.promise; };
  client.setData({ amount: 1 }); const saving = client.flush(); await entered.promise;
  const refreshing = client.refresh(); client.setData({ amount: 2 });
  gate.resolve(); await Promise.all([saving, refreshing]);
  assert.equal(client.getState().data.amount, 2); assert.equal(client.getState().status, "synced");
});

await scenario("ack compara contenido aunque jsonb cambie orden de claves", async () => {
  const remote = server(); remote.put("ana", { amount: 0 });
  const client = controller(remote); await client.open("ana");
  client.setData({ amount: 1, details: { a: 2, b: 3 } });
  remote.put("ana", { details: { b: 3, a: 2 }, amount: 1 });
  await client.refresh(); await client.flush();
  assert.equal(client.getState().status, "synced"); assert.equal(writes(remote).length, 0);
});

await scenario("guardar y refrescar la misma revisión no restablece preferencias de apertura", async () => {
  const remote = server(); remote.put("ana", { amount: 0, expanded: false });
  const client = controller(remote, storage(), { hydrate: (data) => ({ ...data, expanded: false }) });
  await client.open("ana"); client.setData({ amount: 1, expanded: true }); await client.flush();
  assert.equal(client.getState().data.expanded, true);
  await client.refresh();
  assert.equal(client.getState().data.expanded, true);
  remote.afterWrite = async () => { throw new Error("Respuesta perdida"); };
  client.setData({ amount: 2, expanded: true }); await client.flush(); await client.refresh();
  assert.equal(client.getState().data.expanded, true);
  assert.equal(client.getState().status, "synced");
});

await scenario("el acuse de una versión anterior no elimina el borrador más reciente", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 0 });
  const gates = [deferred(), deferred()], entered = [deferred(), deferred()];
  let writeIndex = 0;
  remote.beforeWrite = async () => { const index = writeIndex++; entered[index].resolve(); await gates[index].promise; };
  const client = controller(remote, local, { instanceId: "tab" }); await client.open("ana");
  client.setData({ amount: 1 }); const saving = client.flush(); await entered[0].promise;
  client.setData({ amount: 2 }); gates[0].resolve(); await entered[1].promise;
  const draft = JSON.parse(local.getItem("finanzas:draft:ana:tab"));
  assert.equal(draft.data.amount, 2); assert.equal(draft.pending, true);
  assert.equal(draft.revision, remote.rows.get("ana").revision);
  gates[1].resolve(); await saving;
  assert.equal(local.getItem("finanzas:draft:ana:tab"), null);
});

await scenario("un fallo al escribir conserva pendiente y termina sin reintentos infinitos", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 0 });
  const client = controller(remote, local, { instanceId: "tab" }); await client.open("ana");
  remote.beforeWrite = async () => { throw new Error("Red desconectada"); };
  client.setData({ amount: 5 }); await client.flush();
  assert.equal(writes(remote).length, 1); assert.equal(client.getState().status, "error");
  assert.equal(JSON.parse(local.getItem("finanzas:draft:ana:tab")).data.amount, 5);
  remote.beforeWrite = null; await client.refresh(); await client.flush();
  assert.equal(writes(remote).length, 2); assert.equal(client.getState().status, "synced");
});

await scenario("reapertura y pestaña duplicada usan nuevos borradores sin pisar el anterior", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 0 });
  const original = controller(remote, local, { instanceId: "old" }); await original.open("ana");
  original.setData({ amount: 1 });
  const a = controller(remote, local, { instanceId: "new-a", previousInstanceId: "old" });
  const b = controller(remote, local, { instanceId: "new-b", previousInstanceId: "old" });
  await Promise.all([a.open("ana"), b.open("ana")]);
  assert.equal(a.getState().data.amount, 1); assert.equal(b.getState().data.amount, 1);
  a.setData({ amount: 2 }); b.setData({ amount: 3 });
  assert.equal(JSON.parse(local.getItem("finanzas:draft:ana:new-a")).data.amount, 2);
  assert.equal(JSON.parse(local.getItem("finanzas:draft:ana:new-b")).data.amount, 3);
  assert.equal(JSON.parse(local.getItem("finanzas:draft:ana:old")).data.amount, 1);
});

await scenario("recuperaciones sucesivas conservan los respaldos anteriores", async () => {
  const remote = server(), local = storage(); remote.put("ana", { amount: 0 });
  const client = controller(remote, local); await client.open("ana");
  client.setData({ amount: 1 }); await client.reloadFromCloud();
  client.setData({ amount: 2 }); await client.reloadFromCloud();
  const backups = [...local.entries].filter(([key]) => key.startsWith("finanzas:backup:ana:"));
  assert.equal(backups.length, 2);
  assert.deepEqual(backups.map(([, value]) => JSON.parse(value).data.amount), [1, 2]);
});

console.log(`OK: ${scenarios} escenarios de sincronización verificados.`);
