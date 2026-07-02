-- Decoupled Warehouse Stock Schema Migration
-- Creates completely separate product and category masters for the Stock module.

-- 1. Inventory Bottle Categories Table
create table if not exists public.inventory_bottle_categories (
  id uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  bottles_per_crate integer not null check (bottles_per_crate > 0),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Inventory Products Table
create table if not exists public.inventory_products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.inventory_bottle_categories(id) on delete restrict,
  brand_name text not null,
  display_name text not null,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (category_id, brand_name)
);

-- Drop old transaction items and stock references so we can point them to inventory_products
drop table if exists public.inventory_transaction_items cascade;
drop table if exists public.inventory_stock cascade;

-- 3. Re-create Inventory Stock Table pointing to inventory_products
create table if not exists public.inventory_stock (
  product_id uuid primary key references public.inventory_products(id) on delete restrict,
  current_stock_bottles integer not null default 0 check (current_stock_bottles >= 0),
  updated_at timestamptz not null default now()
);

-- 4. Re-create Inventory Transaction Items Table pointing to inventory_products
create table if not exists public.inventory_transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.inventory_transactions(id) on delete cascade,
  product_id uuid not null references public.inventory_products(id) on delete restrict,
  quantity_bottles integer not null check (quantity_bottles > 0),
  stock_after_bottles integer not null,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transaction_id, product_id)
);

-- 5. Re-create trigger functions with references to inventory_products / inventory_stock
create or replace function public.process_inventory_transaction_item()
returns trigger
language plpgsql
security invoker
as $$
declare
  v_transaction_type text;
  v_current_stock integer;
  v_new_stock integer;
begin
  -- Get the transaction type
  select transaction_type into v_transaction_type
  from public.inventory_transactions
  where id = NEW.transaction_id;

  -- Ensure the stock row exists for locking
  insert into public.inventory_stock (product_id, current_stock_bottles)
  values (NEW.product_id, 0)
  on conflict (product_id) do nothing;
  
  -- Lock row for update to ensure concurrency safety
  select current_stock_bottles into v_current_stock
  from public.inventory_stock
  where product_id = NEW.product_id
  for update;

  -- Compute the new stock level
  if v_transaction_type = 'Stock Entry' then
    v_new_stock := v_current_stock + NEW.quantity_bottles;
  elsif v_transaction_type = 'Damage Entry' then
    v_new_stock := v_current_stock - NEW.quantity_bottles;
    if v_new_stock < 0 then
      raise exception 'Requested quantity exceeds available stock.';
    end if;
  else
    raise exception 'Invalid transaction type: %', v_transaction_type;
  end if;

  -- Update real-time inventory_stock
  update public.inventory_stock
  set current_stock_bottles = v_new_stock,
      updated_at = now()
  where product_id = NEW.product_id;

  -- Record the historical snapshot balance after this transaction
  NEW.stock_after_bottles := v_new_stock;

  return NEW;
end;
$$;

drop trigger if exists on_inventory_transaction_item_insert on public.inventory_transaction_items;
create trigger on_inventory_transaction_item_insert
before insert on public.inventory_transaction_items
for each row execute procedure public.process_inventory_transaction_item();

-- 6. Setup RLS policies on new tables
alter table public.inventory_bottle_categories enable row level security;
alter table public.inventory_products enable row level security;

create policy "staff can read inventory categories" on public.inventory_bottle_categories for select to authenticated using (true);
create policy "staff can manage inventory categories" on public.inventory_bottle_categories for all to authenticated using (true) with check (true);

create policy "staff can read inventory products" on public.inventory_products for select to authenticated using (true);
create policy "staff can manage inventory products" on public.inventory_products for all to authenticated using (true) with check (true);

-- 7. Grant access controls
grant select, insert, update, delete on public.inventory_bottle_categories to authenticated;
grant select, insert, update, delete on public.inventory_products to authenticated;

-- Setup triggers for updated_at tracking
drop trigger if exists update_inventory_bottle_categories_updated_at on public.inventory_bottle_categories;
create trigger update_inventory_bottle_categories_updated_at before update on public.inventory_bottle_categories
for each row execute procedure public.set_updated_at();

drop trigger if exists update_inventory_products_updated_at on public.inventory_products;
create trigger update_inventory_products_updated_at before update on public.inventory_products
for each row execute procedure public.set_updated_at();
