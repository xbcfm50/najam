alter table public.apartments enable row level security;
alter table public.rent_prices enable row level security;
alter table public.utility_types enable row level security;
alter table public.billing_runs enable row level security;
alter table public.utility_bills enable row level security;
alter table public.app_settings enable row level security;

create policy apartments_select on public.apartments for select using (user_id = auth.uid());
create policy apartments_insert on public.apartments for insert with check (user_id = auth.uid());
create policy apartments_update on public.apartments for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy apartments_delete on public.apartments for delete using (user_id = auth.uid());

create policy rent_prices_select on public.rent_prices for select using (user_id = auth.uid());
create policy rent_prices_insert on public.rent_prices for insert with check (user_id = auth.uid());
create policy rent_prices_update on public.rent_prices for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rent_prices_delete on public.rent_prices for delete using (user_id = auth.uid());

create policy utility_types_select on public.utility_types for select using (user_id = auth.uid());
create policy utility_types_insert on public.utility_types for insert with check (user_id = auth.uid());
create policy utility_types_update on public.utility_types for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy utility_types_delete on public.utility_types for delete using (user_id = auth.uid());

create policy billing_runs_select on public.billing_runs for select using (user_id = auth.uid());
create policy billing_runs_insert on public.billing_runs for insert with check (user_id = auth.uid());
create policy billing_runs_update on public.billing_runs for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy billing_runs_delete on public.billing_runs for delete using (user_id = auth.uid());

create policy utility_bills_select on public.utility_bills for select using (user_id = auth.uid());
create policy utility_bills_insert on public.utility_bills for insert with check (user_id = auth.uid());
create policy utility_bills_update on public.utility_bills for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy utility_bills_delete on public.utility_bills for delete using (user_id = auth.uid());

create policy app_settings_select on public.app_settings for select using (user_id = auth.uid());
create policy app_settings_insert on public.app_settings for insert with check (user_id = auth.uid());
create policy app_settings_update on public.app_settings for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy app_settings_delete on public.app_settings for delete using (user_id = auth.uid());
