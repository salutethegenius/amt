-- CNG transaction sync + one pending checkout per invoice.
-- Service-role only for checkout_sessions and app_settings (no anon policies).

create table if not exists public.checkout_sessions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  order_number text not null unique,
  expected_amount_cents integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.invoice_payments
  add column if not exists order_number text,
  add column if not exists fee_cents integer,
  add column if not exists net_cents integer,
  add column if not exists payer_email text,
  add column if not exists payer_phone text,
  add column if not exists payment_method text,
  add column if not exists card_type text,
  add column if not exists processed boolean,
  add column if not exists cng_created_at timestamptz,
  add column if not exists synced_at timestamptz,
  add column if not exists raw_payload jsonb,
  add column if not exists customer_ref text;

do $$
declare
  rec record;
begin
  for rec in
    select c.conname
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any (c.conkey)
    where c.conrelid = 'public.invoice_payments'::regclass
      and c.contype = 'f'
      and a.attname = 'invoice_id'
  loop
    execute format('alter table public.invoice_payments drop constraint %I', rec.conname);
  end loop;
end $$;

alter table public.invoice_payments
  alter column invoice_id drop not null;

alter table public.invoice_payments
  add constraint invoice_payments_invoice_id_fkey
  foreign key (invoice_id) references public.invoices(id) on delete set null;

create unique index if not exists idx_invoice_payments_order_number
  on public.invoice_payments (order_number)
  where order_number is not null;

create index if not exists idx_invoice_payments_cng_created_at
  on public.invoice_payments (cng_created_at desc);

update public.checkout_sessions cs
set status = 'expired'
where status = 'pending'
  and exists (
    select 1
    from public.checkout_sessions newer
    where newer.invoice_id = cs.invoice_id
      and newer.status = 'pending'
      and (
        newer.created_at > cs.created_at
        or (newer.created_at = cs.created_at and newer.id > cs.id)
      )
  );

create unique index if not exists idx_checkout_sessions_one_pending
  on public.checkout_sessions (invoice_id)
  where status = 'pending';

create table if not exists public.app_settings (
  key text primary key,
  value text
);

alter table public.checkout_sessions enable row level security;
alter table public.app_settings enable row level security;

revoke all on table public.checkout_sessions from anon, authenticated;
revoke all on table public.app_settings from anon, authenticated;
grant all on table public.checkout_sessions to service_role;
grant all on table public.app_settings to service_role;
