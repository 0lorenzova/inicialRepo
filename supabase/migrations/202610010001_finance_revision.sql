-- Autorizada por el propietario el 17 octubre 2026.
-- Publicar primero el cliente compatible con RPC y obtener respaldo.
-- Conserva updated_at exacto como token: los borradores existentes siguen siendo comparables.
begin;
alter table public.user_finance_data add column if not exists revision bigint not null default 0;
alter table public.user_finance_data enable row level security;
create or replace function public.save_finance_data(p_data jsonb, p_expected_updated_at timestamptz)
returns table (data jsonb, updated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_saved public.user_finance_data%rowtype;
begin
  if v_user_id is null then
    raise exception using errcode='42501', message='FINANCE_AUTH_REQUIRED';
  end if;
  if p_data is null or pg_catalog.jsonb_typeof(p_data) <> 'object' then
    raise exception using errcode='22023', message='FINANCE_INVALID_DATA';
  end if;
  if p_expected_updated_at is null then
    insert into public.user_finance_data as saved (user_id,data,updated_at,revision)
    values (v_user_id,p_data,pg_catalog.clock_timestamp(),1)
    on conflict (user_id) do nothing returning saved.* into v_saved;
  else
    update public.user_finance_data as saved
      set data=p_data,
          updated_at=greatest(pg_catalog.clock_timestamp(),saved.updated_at + interval '1 microsecond'),
          revision=saved.revision+1
      where saved.user_id=v_user_id and saved.updated_at=p_expected_updated_at
      returning saved.* into v_saved;
  end if;
  if not found then
    raise exception using errcode='40001', message='FINANCE_REVISION_CONFLICT',
      detail='La versión guardada cambió. Conserva los cambios locales y vuelve a consultar antes de guardar.';
  end if;
  return query select v_saved.data,v_saved.updated_at;
end;
$$;
revoke all on table public.user_finance_data from public,anon,authenticated;
grant select on table public.user_finance_data to authenticated;
revoke all on function public.save_finance_data(jsonb,timestamptz) from public,anon,authenticated;
grant execute on function public.save_finance_data(jsonb,timestamptz) to authenticated;
notify pgrst, 'reload schema';
commit;
