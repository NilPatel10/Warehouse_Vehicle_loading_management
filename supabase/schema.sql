-- Warehouse Loading Manager V1 schema: tables, RLS, audit logging, and route lock RPCs.
create extension if not exists "pgcrypto";
create schema if not exists private;
drop function if exists public.handle_new_user() cascade;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bottle_categories (
  id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  bottles_per_crate integer not null check (bottles_per_crate > 0),
  free_250ml_enabled boolean not null default false,
  free_250ml_per_crate integer not null default 0 check (free_250ml_per_crate >= 0),
  water_bottles_per_crate integer not null default 0 check (water_bottles_per_crate >= 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.bottle_categories(id) on delete restrict,
  brand_name text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, brand_name)
);

create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  route_name text not null,
  route_date date not null default current_date,
  status text not null default 'Draft' check (status in ('Draft', 'Ready To Load', 'Dispatched', 'Dropped')),
  notes text,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shop_orders (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  shop_name text not null,
  free_water_per_crate integer not null default 0 check (free_water_per_crate >= 0),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  shop_order_id uuid not null references public.shop_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scheme_configurations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.bottle_categories(id) on delete cascade,
  scheme_name text not null,
  scheme_type text not null check (scheme_type in ('free_water', 'free_250ml')),
  value_per_crate integer not null default 0 check (value_per_crate >= 0),
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.route_locks (
  route_id uuid primary key references public.routes(id) on delete cascade,
  locked_by uuid not null references public.users(id) on delete cascade,
  locked_at timestamptz not null default now(),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_by uuid references public.users(id),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do update set email = excluded.email, full_name = excluded.full_name, updated_at = now();
  return new;
end;
$$;

create or replace function public.write_audit_log()
returns trigger
language plpgsql
as $$
begin
  -- Audit trail records route/order edits so dropped routes still keep change history.
  insert into public.audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
  values (
    tg_table_name,
    coalesce(new.id, old.id),
    tg_op,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    auth.uid()
  );
  return coalesce(new, old);
end;
$$;

create or replace function public.claim_route_lock(p_route_id uuid, p_timeout_seconds integer default 180)
returns public.route_locks
language plpgsql
as $$
declare
  v_lock public.route_locks;
begin
  delete from public.route_locks
  where route_id = p_route_id and expires_at < now();

  insert into public.route_locks(route_id, locked_by, locked_at, expires_at)
  values (p_route_id, auth.uid(), now(), now() + make_interval(secs => p_timeout_seconds))
  on conflict (route_id) do update
    set locked_by = excluded.locked_by,
        locked_at = excluded.locked_at,
        expires_at = excluded.expires_at,
        updated_at = now()
  where public.route_locks.locked_by = auth.uid()
     or public.route_locks.expires_at < now()
  returning * into v_lock;

  return v_lock;
end;
$$;

create or replace function public.release_route_lock(p_route_id uuid)
returns void
language sql
as $$
  delete from public.route_locks
  where route_id = p_route_id and locked_by = auth.uid();
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update on auth.users
for each row execute procedure private.handle_new_user();

drop trigger if exists update_bottle_categories_updated_at on public.bottle_categories;
create trigger update_bottle_categories_updated_at before update on public.bottle_categories
for each row execute procedure public.set_updated_at();

drop trigger if exists update_products_updated_at on public.products;
create trigger update_products_updated_at before update on public.products
for each row execute procedure public.set_updated_at();

drop trigger if exists update_routes_updated_at on public.routes;
create trigger update_routes_updated_at before update on public.routes
for each row execute procedure public.set_updated_at();

drop trigger if exists update_shop_orders_updated_at on public.shop_orders;
create trigger update_shop_orders_updated_at before update on public.shop_orders
for each row execute procedure public.set_updated_at();

drop trigger if exists update_order_items_updated_at on public.order_items;
create trigger update_order_items_updated_at before update on public.order_items
for each row execute procedure public.set_updated_at();

drop trigger if exists audit_routes on public.routes;
create trigger audit_routes after insert or update or delete on public.routes
for each row execute procedure public.write_audit_log();

drop trigger if exists audit_shop_orders on public.shop_orders;
create trigger audit_shop_orders after insert or update or delete on public.shop_orders
for each row execute procedure public.write_audit_log();

drop trigger if exists audit_order_items on public.order_items;
create trigger audit_order_items after insert or update or delete on public.order_items
for each row execute procedure public.write_audit_log();

alter table public.users enable row level security;
alter table public.bottle_categories enable row level security;
alter table public.products enable row level security;
alter table public.routes enable row level security;
alter table public.shop_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.scheme_configurations enable row level security;
alter table public.route_locks enable row level security;
alter table public.audit_logs enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "staff can read users" on public.users;
create policy "staff can read users" on public.users for select to authenticated using (true);
drop policy if exists "staff can update own profile" on public.users;
create policy "staff can update own profile" on public.users for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "staff can read categories" on public.bottle_categories;
create policy "staff can read categories" on public.bottle_categories for select to authenticated using (true);
drop policy if exists "staff can manage categories" on public.bottle_categories;
create policy "staff can manage categories" on public.bottle_categories for all to authenticated using (true) with check (true);

drop policy if exists "staff can read products" on public.products;
create policy "staff can read products" on public.products for select to authenticated using (true);
drop policy if exists "staff can manage products" on public.products;
create policy "staff can manage products" on public.products for all to authenticated using (true) with check (true);

drop policy if exists "staff can read routes" on public.routes;
create policy "staff can read routes" on public.routes for select to authenticated using (true);
drop policy if exists "staff can manage routes" on public.routes;
drop policy if exists "staff can create routes" on public.routes;
create policy "staff can create routes" on public.routes for insert to authenticated with check (true);
drop policy if exists "locked staff can update routes" on public.routes;
create policy "locked staff can update routes" on public.routes for update to authenticated
using (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = routes.id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
)
with check (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = routes.id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);
drop policy if exists "locked staff can delete routes" on public.routes;
create policy "locked staff can delete routes" on public.routes for delete to authenticated
using (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = routes.id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
  or route_date < current_date - make_interval(days => coalesce((select value::integer from public.app_settings where key = 'history_retention_days'), 7))
);

drop policy if exists "staff can read shop orders" on public.shop_orders;
create policy "staff can read shop orders" on public.shop_orders for select to authenticated using (true);
drop policy if exists "staff can manage shop orders" on public.shop_orders;
drop policy if exists "locked staff can create shop orders" on public.shop_orders;
create policy "locked staff can create shop orders" on public.shop_orders for insert to authenticated
with check (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = shop_orders.route_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);
drop policy if exists "locked staff can update shop orders" on public.shop_orders;
create policy "locked staff can update shop orders" on public.shop_orders for update to authenticated
using (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = shop_orders.route_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
)
with check (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = shop_orders.route_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);
drop policy if exists "locked staff can delete shop orders" on public.shop_orders;
create policy "locked staff can delete shop orders" on public.shop_orders for delete to authenticated
using (
  exists (
    select 1 from public.route_locks
    where route_locks.route_id = shop_orders.route_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);

drop policy if exists "staff can read order items" on public.order_items;
create policy "staff can read order items" on public.order_items for select to authenticated using (true);
drop policy if exists "staff can manage order items" on public.order_items;
drop policy if exists "locked staff can create order items" on public.order_items;
create policy "locked staff can create order items" on public.order_items for insert to authenticated
with check (
  exists (
    select 1
    from public.shop_orders
    join public.route_locks on route_locks.route_id = shop_orders.route_id
    where shop_orders.id = order_items.shop_order_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);
drop policy if exists "locked staff can update order items" on public.order_items;
create policy "locked staff can update order items" on public.order_items for update to authenticated
using (
  exists (
    select 1
    from public.shop_orders
    join public.route_locks on route_locks.route_id = shop_orders.route_id
    where shop_orders.id = order_items.shop_order_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
)
with check (
  exists (
    select 1
    from public.shop_orders
    join public.route_locks on route_locks.route_id = shop_orders.route_id
    where shop_orders.id = order_items.shop_order_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);
drop policy if exists "locked staff can delete order items" on public.order_items;
create policy "locked staff can delete order items" on public.order_items for delete to authenticated
using (
  exists (
    select 1
    from public.shop_orders
    join public.route_locks on route_locks.route_id = shop_orders.route_id
    where shop_orders.id = order_items.shop_order_id
      and route_locks.locked_by = auth.uid()
      and route_locks.expires_at > now()
  )
);

drop policy if exists "staff can read schemes" on public.scheme_configurations;
create policy "staff can read schemes" on public.scheme_configurations for select to authenticated using (true);
drop policy if exists "staff can manage schemes" on public.scheme_configurations;
create policy "staff can manage schemes" on public.scheme_configurations for all to authenticated using (true) with check (true);

drop policy if exists "staff can read locks" on public.route_locks;
create policy "staff can read locks" on public.route_locks for select to authenticated using (true);
drop policy if exists "staff can manage locks" on public.route_locks;
drop policy if exists "staff can create own locks" on public.route_locks;
create policy "staff can create own locks" on public.route_locks for insert to authenticated with check (locked_by = auth.uid());
drop policy if exists "staff can renew own or expired locks" on public.route_locks;
create policy "staff can renew own or expired locks" on public.route_locks for update to authenticated
using (locked_by = auth.uid() or expires_at < now())
with check (locked_by = auth.uid());
drop policy if exists "staff can delete own or expired locks" on public.route_locks;
create policy "staff can delete own or expired locks" on public.route_locks for delete to authenticated
using (locked_by = auth.uid() or expires_at < now());

drop policy if exists "staff can read audits" on public.audit_logs;
create policy "staff can read audits" on public.audit_logs for select to authenticated using (true);
drop policy if exists "staff can write audits" on public.audit_logs;
create policy "staff can write audits" on public.audit_logs for insert to authenticated with check (true);

drop policy if exists "staff can read app settings" on public.app_settings;
create policy "staff can read app settings" on public.app_settings for select to authenticated using (true);
drop policy if exists "staff can manage app settings" on public.app_settings;
create policy "staff can manage app settings" on public.app_settings for all to authenticated using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on function public.claim_route_lock(uuid, integer) to authenticated;
grant execute on function public.release_route_lock(uuid) to authenticated;
