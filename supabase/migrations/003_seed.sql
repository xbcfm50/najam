create or replace function public.initialize_user_defaults()
returns void
language plpgsql
security invoker
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.app_settings (user_id, default_cutoff_day)
  values (auth.uid(), 3)
  on conflict (user_id) do nothing;

  if not exists (
    select 1 from public.utility_types where user_id = auth.uid()
  ) then
    insert into public.utility_types (user_id, name, due_days_after_period_end, active)
    values
      (auth.uid(), 'Struja', 10, true),
      (auth.uid(), 'Voda', 10, true),
      (auth.uid(), 'Plin', 10, true),
      (auth.uid(), 'Smeće', 10, true);
  end if;
end;
$$;
