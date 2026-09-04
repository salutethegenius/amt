drop function if exists public.create_invoice_with_items(uuid, date, jsonb);

create or replace function public.create_invoice_with_items(
  p_customer_id uuid,
  p_due_date date,
  p_items jsonb,
  p_order_id uuid default null
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

  if p_order_id is not null then
    if not exists (
      select 1 from public.orders
      where id = p_order_id and customer_id = p_customer_id
    ) then
      raise exception 'order does not belong to customer';
    end if;
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

  insert into public.invoices (invoice_number, customer_id, order_id, amount_cents, due_date, status)
  values (public.next_invoice_number(), p_customer_id, p_order_id, v_total, p_due_date, 'draft')
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

revoke all on function public.create_invoice_with_items(uuid, date, jsonb, uuid) from public, anon;
grant execute on function public.create_invoice_with_items(uuid, date, jsonb, uuid) to authenticated;
