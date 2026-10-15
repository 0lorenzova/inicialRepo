-- Protección de devengo salarial para el documento JSON existente.
-- PROPUESTA: ejecutar solo con autorización del propietario.
-- Independiente de 202610010001_finance_revision.sql; no modifica permisos,
-- no cambia el transporte, no elimina datos ni requiere esa propuesta antigua.
-- Zona contable vigente de App Finanzas: America/Costa_Rica.
-- Si hay períodos heredados marcados como devengados antes de terminar,
-- la siguiente escritura será rechazada hasta corregirlos en la app.

begin;

create or replace function public.validate_salary_earned_dates()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_today date := (pg_catalog.statement_timestamp() at time zone 'America/Costa_Rica')::date;
  v_period jsonb;
  v_start date;
  v_end date;
  v_day_text text;
  v_day date;
  v_periods jsonb := coalesce(new.data #> '{salary,periods}', '[]'::jsonb);
begin
  if pg_catalog.jsonb_typeof(v_periods) <> 'array' then
    raise exception using errcode = '23514', message = 'Los períodos salariales deben ser una lista.';
  end if;
  for v_period in select value from pg_catalog.jsonb_array_elements(v_periods) loop
    if pg_catalog.jsonb_typeof(v_period) <> 'object'
       or pg_catalog.jsonb_typeof(v_period->'earned') is distinct from 'boolean'
       or coalesce(v_period->>'start','') !~ '^\d{4}-\d{2}-\d{2}$'
       or coalesce(v_period->>'end','') !~ '^\d{4}-\d{2}-\d{2}$' then
      raise exception using errcode = '23514', message = 'Revisa las fechas y el estado del período salarial.';
    end if;
    begin
      v_start := (v_period->>'start')::date;
      v_end := (v_period->>'end')::date;
    exception when invalid_datetime_format or datetime_field_overflow then
      raise exception using errcode = '23514', message = 'La fecha del período salarial no es válida.';
    end;
    if v_start > v_end then
      raise exception using errcode = '23514', message = 'La fecha inicial no puede superar la final.';
    end if;
    if (v_period->>'earned')::boolean and v_end >= v_today then
      raise exception using errcode = '23514', message = 'Este período todavía no ha finalizado. Podrás marcarlo como completamente devengado a partir del día siguiente a su fecha final.';
    end if;
    if v_period ? 'workedDays' then
      if pg_catalog.jsonb_typeof(v_period->'workedDays') <> 'array' then
        raise exception using errcode = '23514', message = 'Los días trabajados deben ser una lista de fechas.';
      end if;
      for v_day_text in select value from pg_catalog.jsonb_array_elements_text(v_period->'workedDays') loop
        if coalesce(v_day_text,'') !~ '^\d{4}-\d{2}-\d{2}$' then
          raise exception using errcode = '23514', message = 'Revisa la fecha del día trabajado.';
        end if;
        v_day := v_day_text::date;
        if v_day > v_today or v_day < v_start or v_day > v_end then
          raise exception using errcode = '23514', message = 'Un día trabajado debe estar dentro del período y no ser futuro.';
        end if;
      end loop;
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function public.validate_salary_earned_dates() from public, anon, authenticated;
drop trigger if exists validate_salary_earned_dates on public.user_finance_data;
create trigger validate_salary_earned_dates
before insert or update of data on public.user_finance_data
for each row execute function public.validate_salary_earned_dates();

commit;
