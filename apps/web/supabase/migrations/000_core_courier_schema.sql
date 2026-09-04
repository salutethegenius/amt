-- Core AMT courier schema (profiles, customers, orders, invoices).
-- Snapshot of the live AMT project so new environments can bootstrap.
-- Additive CNG columns live in 002 / 003.

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

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role = any (array['admin'::text, 'customer'::text])),
  full_name text,
  company_name text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  company_name text,
  phone text,
  address text,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  description text,
  status text not null default 'processing'
    check (status = any (array['processing'::text, 'ready_for_pickup'::text, 'out_for_delivery'::text, 'completed'::text])),
  pickup_address text,
  delivery_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount_cents integer not null default 0,
  currency text not null default 'USD',
  status text not null default 'draft'
    check (status = any (array['draft'::text, 'sent'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
  due_date date,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity integer not null default 1,
  unit_price_cents integer not null default 0
);

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete set null,
  amount_cents integer not null,
  status text not null default 'pending'
    check (status = any (array['pending'::text, 'completed'::text, 'failed'::text, 'refunded'::text])),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

drop trigger if exists customers_updated_at on public.customers;
create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.update_updated_at();

drop trigger if exists invoices_updated_at on public.invoices;
create trigger invoices_updated_at
  before update on public.invoices
  for each row execute function public.update_updated_at();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using ((id = auth.uid()) or is_admin());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check ((id = auth.uid()) and (role = 'customer'));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using ((id = auth.uid()) or is_admin());

drop policy if exists customers_admin_all on public.customers;
create policy customers_admin_all on public.customers
  for all using (is_admin()) with check (is_admin());

drop policy if exists customers_self_select on public.customers;
create policy customers_self_select on public.customers
  for select using (user_id = auth.uid());

drop policy if exists orders_admin_all on public.orders;
create policy orders_admin_all on public.orders
  for all using (is_admin()) with check (is_admin());

drop policy if exists orders_customer_select on public.orders;
create policy orders_customer_select on public.orders
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = orders.customer_id and c.user_id = auth.uid()
    )
  );

drop policy if exists invoices_admin_all on public.invoices;
create policy invoices_admin_all on public.invoices
  for all using (is_admin()) with check (is_admin());

drop policy if exists invoices_customer_select on public.invoices;
create policy invoices_customer_select on public.invoices
  for select using (
    exists (
      select 1 from public.customers c
      where c.id = invoices.customer_id and c.user_id = auth.uid()
    )
  );

drop policy if exists invoice_items_admin_all on public.invoice_items;
create policy invoice_items_admin_all on public.invoice_items
  for all using (is_admin()) with check (is_admin());

drop policy if exists invoice_items_customer_select on public.invoice_items;
create policy invoice_items_customer_select on public.invoice_items
  for select using (
    exists (
      select 1
      from public.invoices i
      join public.customers c on c.id = i.customer_id
      where i.id = invoice_items.invoice_id and c.user_id = auth.uid()
    )
  );

drop policy if exists invoice_payments_admin_all on public.invoice_payments;
create policy invoice_payments_admin_all on public.invoice_payments
  for all using (is_admin()) with check (is_admin());

drop policy if exists invoice_payments_customer_select on public.invoice_payments;
create policy invoice_payments_customer_select on public.invoice_payments
  for select using (
    exists (
      select 1
      from public.invoices i
      join public.customers c on c.id = i.customer_id
      where i.id = invoice_payments.invoice_id and c.user_id = auth.uid()
    )
  );

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke select, insert, update, delete on table public.profiles from anon;
revoke select, insert, update, delete on table public.customers from anon;
revoke select, insert, update, delete on table public.orders from anon;
revoke select, insert, update, delete on table public.invoices from anon;
revoke select, insert, update, delete on table public.invoice_items from anon;
revoke select, insert, update, delete on table public.invoice_payments from anon;
