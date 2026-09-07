-- Link a new Auth user to an existing customer row with the same email.
-- One user_id per customer; leftover demo links must be cleared before this unique index.

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

  update public.customers
  set user_id = new.id
  where id = (
    select c.id
    from public.customers c
    where c.user_id is null
      and new.email is not null
      and lower(c.email) = lower(new.email)
    order by c.created_at asc
    limit 1
  );

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create unique index if not exists customers_user_id_key
  on public.customers (user_id)
  where user_id is not null;
