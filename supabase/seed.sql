-- Seed data for beverage categories, brands, and free-tier app settings.
insert into public.app_settings(key, value)
values
  ('history_auto_delete_enabled', 'false'),
  ('history_retention_days', '7'),
  ('route_lock_timeout_seconds', '180')
on conflict (key) do update set value = excluded.value;

insert into public.bottle_categories(category_name, bottles_per_crate, free_250ml_enabled, free_250ml_per_crate, water_bottles_per_crate, display_order, is_active)
values
  ('110 ml tetra pack', 30, false, 0, 0, 10, true),
  ('250 ml', 24, false, 0, 1, 20, true),
  ('500 ml', 24, false, 0, 0, 30, true),
  ('600 ml', 24, false, 0, 0, 40, true),
  ('750 ml', 12, false, 0, 0, 50, true),
  ('1 litre', 12, false, 0, 0, 60, true),
  ('2.25 litre', 9, true, 1, 0, 70, true),
  ('tin', 24, false, 0, 0, 80, true)
on conflict (category_name) do update
set bottles_per_crate = excluded.bottles_per_crate,
    free_250ml_enabled = excluded.free_250ml_enabled,
    free_250ml_per_crate = excluded.free_250ml_per_crate,
    water_bottles_per_crate = excluded.water_bottles_per_crate,
    display_order = excluded.display_order,
    is_active = excluded.is_active;

insert into public.products(category_id, brand_name, display_name, is_active)
select c.id, brand.brand_name, brand.brand_name || ' ' || c.category_name, true
from public.bottle_categories c
cross join (
  values ('Coke'), ('Thums Up'), ('Sprite'), ('Fanta'), ('Limca')
) as brand(brand_name)
where c.category_name in ('250 ml', '500 ml', '600 ml', '750 ml', '1 litre', '2.25 litre')
on conflict (category_id, brand_name) do update
set display_name = excluded.display_name,
    is_active = excluded.is_active;
