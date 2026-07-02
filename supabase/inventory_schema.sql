-- Warehouse Stock Module Schema
-- Extends the existing database without modifying existing tables or data.

-- 1. Damage Reasons CRUD Table
create table if not exists public.damage_reasons (
  id uuid primary key default gen_random_uuid(),
  reason_name text not null unique,
  is_active boolean not null default true,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Inventory Transactions Table
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('Stock Entry', 'Damage Entry')),
  transaction_number text not null unique,
  transaction_date date not null default current_date,
  reference_number text,
  remarks text,
  damage_reason_id uuid references public.damage_reasons(id) on delete set null,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Inventory Transaction Items Table
create table if not exists public.inventory_transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.inventory_transactions(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_bottles integer not null check (quantity_bottles > 0),
  stock_after_bottles integer not null,
  created_by uuid references public.users(id),
  updated_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (transaction_id, product_id)
);

-- 4. Inventory Stock Table (Stores real-time stock, check ensures no negative stock)
create table if not exists public.inventory_stock (
  product_id uuid primary key references public.products(id) on delete restrict,
  current_stock_bottles integer not null default 0 check (current_stock_bottles >= 0),
  updated_at timestamptz not null default now()
);

-- 5. Transaction Numbering Generator Function
create or replace function public.generate_transaction_number(p_type text, p_date date)
returns text
language plpgsql
as $$
declare
  v_prefix text;
  v_date_str text;
  v_pattern text;
  v_max_seq integer;
  v_next_seq integer;
  v_seq_str text;
begin
  if p_type = 'Stock Entry' then
    select coalesce((select value from public.app_settings where key = 'inventory_se_prefix'), 'SE') into v_prefix;
  else
    select coalesce((select value from public.app_settings where key = 'inventory_de_prefix'), 'DE') into v_prefix;
  end if;

  v_date_str := to_char(p_date, 'YYYYMMDD');
  v_pattern := v_prefix || '-' || v_date_str || '-%';

  select coalesce(
    max(
      substring(transaction_number from '[0-9]+$')::integer
    ),
    0
  ) into v_max_seq
  from public.inventory_transactions
  where transaction_number like v_pattern;

  v_next_seq := v_max_seq + 1;
  v_seq_str := lpad(v_next_seq::text, 4, '0');

  return v_prefix || '-' || v_date_str || '-' || v_seq_str;
end;
$$;

-- 6. Trigger on Transactions to generate sequential Transaction Numbers
create or replace function public.process_inventory_transaction()
returns trigger
language plpgsql
as $$
begin
  if NEW.transaction_number is null then
    NEW.transaction_number := public.generate_transaction_number(NEW.transaction_type, NEW.transaction_date);
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_inventory_transaction_insert on public.inventory_transactions;
create trigger on_inventory_transaction_insert
before insert on public.inventory_transactions
for each row execute procedure public.process_inventory_transaction();

-- 7. Trigger on Transaction Items to calculate stock snapshot and update real-time stock
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

-- 8. Audit Logging Triggers (matching the existing system patterns)
drop trigger if exists update_damage_reasons_updated_at on public.damage_reasons;
create trigger update_damage_reasons_updated_at before update on public.damage_reasons
for each row execute procedure public.set_updated_at();

drop trigger if exists update_inventory_transactions_updated_at on public.inventory_transactions;
create trigger update_inventory_transactions_updated_at before update on public.inventory_transactions
for each row execute procedure public.set_updated_at();

drop trigger if exists update_inventory_transaction_items_updated_at on public.inventory_transaction_items;
create trigger update_inventory_transaction_items_updated_at before update on public.inventory_transaction_items
for each row execute procedure public.set_updated_at();

drop trigger if exists audit_inventory_transactions on public.inventory_transactions;
create trigger audit_inventory_transactions after insert or update or delete on public.inventory_transactions
for each row execute procedure public.write_audit_log();

drop trigger if exists audit_inventory_transaction_items on public.inventory_transaction_items;
create trigger audit_inventory_transaction_items after insert or update or delete on public.inventory_transaction_items
for each row execute procedure public.write_audit_log();

-- 9. Row Level Security Policies
alter table public.damage_reasons enable row level security;
alter table public.inventory_transactions enable row level security;
alter table public.inventory_transaction_items enable row level security;
alter table public.inventory_stock enable row level security;

create policy "staff can read damage reasons" on public.damage_reasons for select to authenticated using (true);
create policy "staff can manage damage reasons" on public.damage_reasons for all to authenticated using (true) with check (true);

create policy "staff can read inventory transactions" on public.inventory_transactions for select to authenticated using (true);
create policy "staff can create inventory transactions" on public.inventory_transactions for insert to authenticated with check (true);

create policy "staff can read inventory transaction items" on public.inventory_transaction_items for select to authenticated using (true);
create policy "staff can create inventory transaction items" on public.inventory_transaction_items for insert to authenticated with check (true);

create policy "staff can read inventory stock" on public.inventory_stock for select to authenticated using (true);
create policy "staff can manage inventory stock" on public.inventory_stock for all to authenticated using (true) with check (true);

-- 10. Database Grant Access Controls for public schemas
grant select, insert, update, delete on public.damage_reasons to authenticated;
grant select, insert, update, delete on public.inventory_transactions to authenticated;
grant select, insert, update, delete on public.inventory_transaction_items to authenticated;
grant select, insert, update, delete on public.inventory_stock to authenticated;

-- 11. Seeding Default Damage Reasons
insert into public.damage_reasons (reason_name, is_active)
values
  ('Broken Bottle', true),
  ('Leakage', true),
  ('Expired', true),
  ('Missing', true),
  ('Internal Use', true),
  ('Sample', true),
  ('Other', true)
on conflict (reason_name) do nothing;
