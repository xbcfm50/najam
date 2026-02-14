create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.apartments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  active boolean not null default true,
  unique(user_id, name)
);

create table public.rent_prices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  valid_from date not null,
  amount_eur numeric(10,2) not null check (amount_eur >= 0),
  unique(user_id, apartment_id, valid_from)
);
create index rent_prices_user_apartment_valid_from_idx on public.rent_prices (user_id, apartment_id, valid_from desc);

create table public.utility_types (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  due_days_after_period_end int not null default 10 check (due_days_after_period_end between 0 and 60),
  active boolean not null default true,
  unique(user_id, name)
);

create table public.billing_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  billing_year int not null check (billing_year between 2000 and 2100),
  billing_month int not null check (billing_month between 1 and 12),
  cutoff_day int not null default 3 check (cutoff_day between 1 and 28),
  cutoff_date date not null,
  rent_amount_eur numeric(10,2) not null check (rent_amount_eur >= 0),
  utilities_total_eur numeric(10,2) not null default 0 check (utilities_total_eur >= 0),
  total_eur numeric(10,2) not null check (total_eur >= 0),
  is_locked boolean not null default false,
  locked_at timestamptz null,
  is_paid boolean not null default false,
  paid_at timestamptz null,
  unique(user_id, apartment_id, billing_year, billing_month)
);
create index billing_runs_user_apartment_period_idx on public.billing_runs (user_id, apartment_id, billing_year desc, billing_month desc);

create table public.utility_bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  apartment_id uuid not null references public.apartments(id) on delete cascade,
  utility_type_id uuid not null references public.utility_types(id) on delete restrict,
  period_year int not null check (period_year between 2000 and 2100),
  period_month int not null check (period_month between 1 and 12),
  received_on date not null,
  amount_eur numeric(10,2) not null check (amount_eur >= 0),
  status text not null check (status in ('RECEIVED','ASSIGNED')),
  billing_run_id uuid null references public.billing_runs(id) on delete set null,
  unique(user_id, apartment_id, utility_type_id, period_year, period_month)
);
create index utility_bills_user_apartment_received_idx on public.utility_bills (user_id, apartment_id, received_on desc);
create index utility_bills_user_billing_run_idx on public.utility_bills (user_id, billing_run_id);

create table public.app_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  default_cutoff_day int not null default 3 check (default_cutoff_day between 1 and 28),
  unique(user_id)
);

create trigger set_updated_at_apartments before update on public.apartments for each row execute function public.set_updated_at();
create trigger set_updated_at_rent_prices before update on public.rent_prices for each row execute function public.set_updated_at();
create trigger set_updated_at_utility_types before update on public.utility_types for each row execute function public.set_updated_at();
create trigger set_updated_at_billing_runs before update on public.billing_runs for each row execute function public.set_updated_at();
create trigger set_updated_at_utility_bills before update on public.utility_bills for each row execute function public.set_updated_at();
create trigger set_updated_at_app_settings before update on public.app_settings for each row execute function public.set_updated_at();

create or replace function public.lock_billing_run(p_run_id uuid)
returns public.billing_runs
language plpgsql
security invoker
as $$
declare
  v_run public.billing_runs;
  v_utilities_total numeric(10,2) := 0;
begin
  select *
  into v_run
  from public.billing_runs
  where id = p_run_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Billing run not found';
  end if;

  if v_run.is_locked then
    raise exception 'Billing run is already locked';
  end if;

  update public.utility_bills
  set billing_run_id = v_run.id,
      status = 'ASSIGNED'
  where user_id = auth.uid()
    and apartment_id = v_run.apartment_id
    and received_on <= v_run.cutoff_date
    and billing_run_id is null;

  select coalesce(sum(amount_eur), 0)::numeric(10,2)
  into v_utilities_total
  from public.utility_bills
  where user_id = auth.uid()
    and billing_run_id = v_run.id;

  update public.billing_runs
  set utilities_total_eur = v_utilities_total,
      total_eur = (v_run.rent_amount_eur + v_utilities_total)::numeric(10,2),
      is_locked = true,
      locked_at = now()
  where id = v_run.id
  returning * into v_run;

  return v_run;
end;
$$;
