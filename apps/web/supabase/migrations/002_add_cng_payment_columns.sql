-- Cash N' Go payment tracking. Stripe columns are left in place for existing rows.

alter table public.invoices
  add column if not exists cng_passphrase text,
  add column if not exists cng_payment_id text;

alter table public.invoice_payments
  add column if not exists provider text,
  add column if not exists cng_payment_id text,
  add column if not exists payment_platform text;

create unique index if not exists invoice_payments_cng_payment_id_uidx
  on public.invoice_payments (cng_payment_id)
  where cng_payment_id is not null;
