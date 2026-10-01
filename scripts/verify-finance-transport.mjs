import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    return nextResolve(specifier === "../finance-sync" && context.parentURL?.endsWith("/finance-transport.ts") ? "../finance-sync.ts" : specifier, context);
  },
});
const { createFinanceTransport } = await import("../lib/supabase/finance-transport.ts");
hooks.deregister();

let result;
const calls = [];
const query = {
  select(...args) { calls.push(["select", ...args]); return this; },
  eq(...args) { calls.push(["eq", ...args]); return this; },
  insert(...args) { calls.push(["insert", ...args]); return this; },
  update(...args) { calls.push(["update", ...args]); return this; },
  async maybeSingle() { return result; },
};
const client = { from(name) { assert.equal(name, "user_finance_data"); return query; } };
const transport = createFinanceTransport(client);
const revision = "2026-10-01T10:00:00.123456+00:00";
result = { data: { data: { value: 10 }, updated_at: revision }, error: null };
assert.deepEqual(await transport.read("user-a"), { data: { value: 10 }, revision });
assert.ok(calls.some(c => c[0] === "eq" && c[1] === "user_id" && c[2] === "user-a"));
calls.length = 0;
await transport.write("user-a", { value: 20 }, revision);
assert.ok(calls.some(c => c[0] === "eq" && c[1] === "updated_at" && c[2] === revision));
const update = calls.find(c => c[0] === "update")[1];
assert.deepEqual(update.data, { value: 20 });
assert.ok(Date.parse(update.updated_at) > Date.parse(revision));
assert.equal("user_id" in update, false);
calls.length = 0;
await transport.write("user-b", { value: 0 }, null);
assert.equal(calls.find(c => c[0] === "insert")[1].user_id, "user-b");
assert.equal(calls.some(c => c[0] === "update"), false);
result = { data: null, error: null };
await assert.rejects(() => transport.write("user-a", {}, revision), { name: "SyncConflictError" });
result = { data: null, error: { code: "23505" } };
await assert.rejects(() => transport.write("user-a", {}, null), { name: "SyncConflictError" });
result = { data: null, error: { code: "42501", message: "Sin permiso" } };
await assert.rejects(() => transport.write("user-a", {}, revision), /Sin permiso/);
await assert.rejects(() => transport.read("user-a"), /Sin permiso/);
await assert.rejects(() => transport.write("user-a", {}, "invalid"), /versión/);
console.log("OK: transporte Supabase simulado: CAS exacto, creación única, conflictos y errores; sin conexión a datos reales.");
