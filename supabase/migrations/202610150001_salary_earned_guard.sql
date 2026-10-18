-- Autorizada por el propietario el 17 octubre 2026. Obtener respaldo antes de aplicar.
-- Revisión: usa los días laborales conservados en cada período; no usa configuración actual.
-- Sin horario conservado, mantiene el cierre histórico al final del período.
-- La comprobación inicial aborta toda la migración si existen documentos incompatibles.
begin;
create or replace function public.check_salary_earned_document(p_data jsonb)
returns void language plpgsql set search_path = ''
as $$
declare
  v_today date := (pg_catalog.statement_timestamp() at time zone 'America/Costa_Rica')::date;
  v_period jsonb;
  v_start date;
  v_end date;
  v_work_end date;
  v_candidate date;
  v_day_text text;
  v_day date;
  v_back integer;
  v_schedule jsonb;
  v_periods jsonb := coalesce(p_data #> '{salary,periods}', '[]'::jsonb);
begin
  if p_data is null or pg_catalog.jsonb_typeof(p_data) <> 'object' then
    raise exception using errcode='23514',message='El documento financiero debe ser un objeto.';
  end if;
  if pg_catalog.jsonb_typeof(v_periods) <> 'array' then
    raise exception using errcode='23514',message='Los períodos salariales deben ser una lista.';
  end if;
  for v_period in select value from pg_catalog.jsonb_array_elements(v_periods) loop
    if pg_catalog.jsonb_typeof(v_period) <> 'object'
      or pg_catalog.jsonb_typeof(v_period->'earned') is distinct from 'boolean'
      or coalesce(v_period->>'start','') !~ '^\d{4}-\d{2}-\d{2}$'
      or coalesce(v_period->>'end','') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception using errcode='23514',message='Revisa las fechas y el estado del período salarial.';
    end if;
    begin
      v_start := (v_period->>'start')::date;
      v_end := (v_period->>'end')::date;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception using errcode='23514',message='La fecha del período salarial no es válida.';
    end;
    if v_start > v_end then
      raise exception using errcode='23514',message='La fecha inicial no puede superar la final.';
    end if;
    v_work_end := v_end;
    if v_period ? 'scheduledWorkDays' then
      v_schedule := v_period->'scheduledWorkDays';
      if pg_catalog.jsonb_typeof(v_schedule) <> 'array' then
        raise exception using errcode='23514',message='Los días laborales deben ser una lista.';
      end if;
      if pg_catalog.jsonb_array_length(v_schedule)=0
        or exists(select 1 from pg_catalog.jsonb_array_elements(v_schedule) d where pg_catalog.jsonb_typeof(d.value)<>'number' or d.value::text !~ '^[0-6]$')
        or (select count(*)<>count(distinct value) from pg_catalog.jsonb_array_elements(v_schedule)) then
        raise exception using errcode='23514',message='Revisa los días laborales guardados del período.';
      end if;
      for v_back in 0..6 loop
        v_candidate := v_end-v_back;
        exit when v_candidate<v_start;
        if v_schedule @> pg_catalog.jsonb_build_array(extract(dow from v_candidate)::integer) then
          v_work_end := v_candidate;
          exit;
        end if;
      end loop;
    end if;
    if (v_period->>'earned')::boolean and v_work_end>=v_today then
      raise exception using errcode='23514',message='Este período todavía no ha finalizado. Podrás marcarlo como completamente devengado a partir del día siguiente al último día laboral del período.';
    end if;
    if v_period ? 'workedDays' then
      if pg_catalog.jsonb_typeof(v_period->'workedDays') <> 'array' then
        raise exception using errcode='23514',message='Los días trabajados deben ser una lista de fechas.';
      end if;
      if (select count(*)<>count(distinct value) from pg_catalog.jsonb_array_elements(v_period->'workedDays')) then
        raise exception using errcode='23514',message='No repitas días trabajados.';
      end if;
      for v_day_text in select value from pg_catalog.jsonb_array_elements_text(v_period->'workedDays') loop
        if coalesce(v_day_text,'') !~ '^\d{4}-\d{2}-\d{2}$' then
          raise exception using errcode='23514',message='Revisa la fecha del día trabajado.';
        end if;
        begin
          v_day := v_day_text::date;
        exception when invalid_datetime_format or datetime_field_overflow then
          raise exception using errcode='23514',message='La fecha del día trabajado no es válida.';
        end;
        if v_day>v_today or v_day<v_start or v_day>v_end then
          raise exception using errcode='23514',message='Un día trabajado debe estar dentro del período y no ser futuro.';
        end if;
      end loop;
    end if;
  end loop;
end;
$$;
create or replace function public.validate_salary_earned_dates()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform public.check_salary_earned_document(new.data);
  return new;
end;
$$;
revoke all on function public.check_salary_earned_document(jsonb) from public,anon,authenticated;
revoke all on function public.validate_salary_earned_dates() from public,anon,authenticated;
-- No modificar históricos incompatibles automáticamente: abortar antes de instalar la guarda.
lock table public.user_finance_data in share row exclusive mode;
do $$
declare v_row record;
begin
  for v_row in select data from public.user_finance_data loop
    perform public.check_salary_earned_document(v_row.data);
  end loop;
end;
$$;
drop trigger if exists validate_salary_earned_dates on public.user_finance_data;
create trigger validate_salary_earned_dates before insert or update of data on public.user_finance_data
for each row execute function public.validate_salary_earned_dates();
commit;
