import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const {PGlite}=await import(pathToFileURL(process.argv[2]).href);const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role;create schema auth;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table public.user_finance_data(user_id uuid primary key,data jsonb not null,updated_at timestamptz not null default now());
insert into public.user_finance_data values('00000000-0000-0000-0000-000000000001','{"test":"preserve"}','2026-10-01T10:00:00.123456Z');`);
const sql=readFileSync(new URL('../supabase/apply_pending_20261017.sql',import.meta.url),'utf8');
await db.exec(sql);
assert.equal((await db.query('select data= (select data from finanzas_migration_backup.user_finance_data_20261017) as same from public.user_finance_data')).rows[0].same,true);
for(const role of ['anon','authenticated','service_role']){
 const check=await db.query("select has_schema_privilege($1,'finanzas_migration_backup','USAGE') as allowed",[role]);assert.equal(check.rows[0].allowed,false);
}
await assert.rejects(()=>db.exec(sql),e=>e.code==='42P07');await db.exec('rollback');
assert.equal((await db.query('select count(*)::int as n from public.user_finance_data')).rows[0].n,1);
await db.close();console.log('OK: coordinated migration transaction, exact protected backup, denied schema access, no document changes, repeat refuses without damage.');
