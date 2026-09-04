-- Lock down role assignment, revoke public definer EXECUTE, drop Stripe columns,
-- sequential invoice numbers, atomic invoice+items create.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.update_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    'customer',
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then
      new.role := 'customer';
    end if;
    return new;
  end if;

  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before insert or update on public.profiles
  for each row execute function public.protect_profile_role();

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check ((id = auth.uid()) and (role = 'customer'));

drop policy if exists customers_admin_all on public.customers;
create policy customers_admin_all on public.customers
  for all using (is_admin()) with check (is_admin());

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (is_admin()) with check (is_admin());

drop policy if exists invoices_admin_all on public.invoices;
create policy invoices_admin_all on public.invoices
  for all using (is_admin()) with check (is_admin());

drop policy if exists invoice_items_admin_all on public.invoice_items;
create policy invoice_items_admin_all on public.invoice_items
  for all using (is_admin()) with check (is_admin());

drop policy if exists invoice_payments_admin_all on public.invoice_payments;
create policy invoice_payments_admin_all on public.invoice_payments
  for all using (is_admin()) with check (is_admin());

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.protect_profile_role() from public, anon, authenticated;

do $$
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'rls_auto_enable' and p.pronargs = 0
  ) then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end $$;

revoke select, insert, update, delete on table public.profiles from anon;
revoke select, insert, update, delete on table public.customers from anon;
revoke select, insert, update, delete on table public.orders from anon;
revoke select, insert, update, delete on table public.invoices from anon;
revoke select, insert, update, delete on table public.invoice_items from anon;
revoke select, insert, update, delete on table public.invoice_payments from anon;
revoke select, insert, update, delete on table public.checkout_sessions from anon, authenticated;
revoke select, insert, update, delete on table public.app_settings from anon, authenticated;

alter table public.invoices drop column if exists stripe_checkout_session_id;
alter table public.invoice_payments drop column if exists stripe_payment_intent_id;

create sequence if not exists public.invoice_number_seq;

grant usage, select on sequence public.invoice_number_seq to authenticated;

create or replace function public.next_invoice_number()
returns text
language plpgsql
set search_path = public
as $$
declare
  n bigint;
begin
  n := nextval('public.invoice_number_seq');
  return 'INV-' || to_char((now() at time zone 'America/Nassau'), 'YYYY') || '-' || lpad(n::text, 5, '0');
end;
$$;

create or replace function public.create_invoice_with_items(
  p_customer_id uuid,
  p_due_date date,
  p_items jsonb
)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_invoice_id uuid;
  v_total integer := 0;
  v_item jsonb;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'invoice requires line items';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    if coalesce(btrim(v_item->>'description'), '') = '' then
      raise exception 'each line item needs a description';
    end if;
    v_total := v_total
      + (greatest(coalesce((v_item->>'quantity')::int, 1), 1)
         * coalesce((v_item->>'unit_price_cents')::int, 0));
  end loop;

  insert into public.invoices (invoice_number, customer_id, amount_cents, due_date, status)
  values (public.next_invoice_number(), p_customer_id, v_total, p_due_date, 'draft')
  returning id into v_invoice_id;

  insert into public.invoice_items (invoice_id, description, quantity, unit_price_cents)
  select
    v_invoice_id,
    btrim(item->>'description'),
    greatest(coalesce((item->>'quantity')::int, 1), 1),
    coalesce((item->>'unit_price_cents')::int, 0)
  from jsonb_array_elements(p_items) as item;

  return v_invoice_id;
end;
$$;

revoke all on function public.next_invoice_number() from public, anon;
grant execute on function public.next_invoice_number() to authenticated;
revoke all on function public.create_invoice_with_items(uuid, date, jsonb) from public, anon;
grant execute on function public.create_invoice_with_items(uuid, date, jsonb) to authenticated;
