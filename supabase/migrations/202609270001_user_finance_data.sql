-- One private JSON document per authenticated user for the initial app release.
create table if not exists public.user_finance_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_finance_data enable row level security;

drop policy if exists "Users can read their own finance data" on public.user_finance_data;
create policy "Users can read their own finance data"
  on public.user_finance_data for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own finance data" on public.user_finance_data;
create policy "Users can create their own finance data"
  on public.user_finance_data for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own finance data" on public.user_finance_data;
create policy "Users can update their own finance data"
  on public.user_finance_data for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.user_finance_data from anon;
grant select, insert, update on public.user_finance_data to authenticated;
