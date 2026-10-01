-- PROPUESTA: ejecutar solo despues de la autorizacion del propietario.
-- Requiere 202609270001_user_finance_data.sql.
-- Conserva todos los documentos y agrega control de concurrencia.
-- IMPORTANTE: tras aplicarla, los clientes antiguos no podran guardar
-- hasta que se despliegue el cliente que usa save_finance_data.

begin;

alter table public.user_finance_data
  add column if not exists revision bigint not null default 0;

alter table public.user_finance_data enable row level security;

create or replace function public.save_finance_data(
  p_data jsonb,
  p_expected_revision bigint
)
returns table (revision bigint, data jsonb)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_saved public.user_finance_data%rowtype;
begin
  -- Nunca aceptar un user_id enviado por el cliente.
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'FINANCE_AUTH_REQUIRED';
  end if;

  if p_data is null or pg_catalog.jsonb_typeof(p_data) <> 'object' then
    raise exception using
      errcode = '22023',
      message = 'FINANCE_INVALID_DATA';
  end if;

  if p_expected_revision is not null and p_expected_revision < 0 then
    raise exception using
      errcode = '22023',
      message = 'FINANCE_INVALID_REVISION';
  end if;

  if p_expected_revision is null then
    -- Dos dispositivos pueden crear la primera fila al mismo tiempo.
    -- Solo uno gana; el otro recibe un conflicto sin modificar la fila.
    insert into public.user_finance_data as saved
      (user_id, data, updated_at, revision)
    values (v_user_id, p_data, pg_catalog.now(), 1)
    on conflict (user_id) do nothing
    returning saved.* into v_saved;
  else
    -- PostgreSQL compara la revision y actualiza bajo el mismo bloqueo.
    -- Si otra escritura gana primero, esta condicion deja de coincidir.
    update public.user_finance_data as saved
    set data = p_data,
        updated_at = pg_catalog.now(),
        revision = saved.revision + 1
    where saved.user_id = v_user_id
      and saved.revision = p_expected_revision
    returning saved.* into v_saved;
  end if;

  if not found then
    raise exception using
      errcode = '40001',
      message = 'FINANCE_REVISION_CONFLICT',
      detail = 'La version guardada cambio o la fila ya existe. Conserva los cambios locales y vuelve a consultar antes de guardar.';
  end if;

  return query select v_saved.revision, v_saved.data;
end;
$$;

-- RLS mantiene las lecturas privadas de la migracion inicial.
-- SECURITY DEFINER permite guardar solo mediante la funcion y su auth.uid().
-- Revocar escritura directa evita que una pestaña antigua eluda la revision.
revoke all on table public.user_finance_data from public, anon, authenticated;
grant select on table public.user_finance_data to authenticated;

revoke all on function public.save_finance_data(jsonb, bigint) from public, anon, authenticated;
grant execute on function public.save_finance_data(jsonb, bigint) to authenticated;

commit;
