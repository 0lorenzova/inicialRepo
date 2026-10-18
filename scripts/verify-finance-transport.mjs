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
let rpcResult={data:null,error:{code:"PGRST202",message:"RPC not installed"}};
const calls = [];
const query = {
  select(...args) { calls.push(["select", ...args]); return this; },
  eq(...args) { calls.push(["eq", ...args]); return this; },
  insert(...args) { calls.push(["insert", ...args]); return this; },
  update(...args) { calls.push(["update", ...args]); return this; },
  async maybeSingle() { return result; },
};
const client = { rpc(name,args){calls.push(["rpc",name,args]);return {async maybeSingle(){return rpcResult;}};}, from(name) { assert.equal(name, "user_finance_data"); return query; } };
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

rpcResult={data:{data:{value:30},updated_at:revision},error:null};calls.length=0;
assert.deepEqual(await transport.write("user-a",{value:30},revision),{data:{value:30},revision});
assert.deepEqual(calls,[["rpc","save_finance_data",{p_data:{value:30},p_expected_updated_at:revision}]]);
for(const code of ["40001","42501","23514","NETWORK"]){
 rpcResult={data:null,error:{code,message:"RPC failure"}};calls.length=0;
 await assert.rejects(()=>transport.write("user-a",{},revision),code==="40001"?{name:"SyncConflictError"}:/RPC failure/);
 assert.equal(calls.length,1,"Never retry as direct write after RPC errors");
}
rpcResult={data:null,error:null};await assert.rejects(()=>transport.write("user-a",{},null),{name:"SyncConflictError"});
console.log("OK: RPC preserves cache timestamps; fallback only for absent RPC; conflicts, permissions, validation and network errors cannot bypass it.");
