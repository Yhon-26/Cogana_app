begin;

-- Catálogo provisional recibido el 18 de septiembre de 2026.
-- Es una fotografía editable: no crea existencias ni lotes de inventario.
with source_categories(slug, name, sort_order) as (
  values
    ('arroces', 'Arroces', 10),
    ('azucares', 'Azúcares', 20),
    ('sal-condimentos', 'Sal y condimentos', 30),
    ('aceites', 'Aceites', 40),
    ('pastas', 'Pastas', 50),
    ('menestras-granos', 'Menestras y granos', 60),
    ('cereales', 'Cereales', 70),
    ('harinas', 'Harinas', 80),
    ('lacteos', 'Lácteos', 90),
    ('conservas', 'Conservas', 100),
    ('cafe-infusiones', 'Café e infusiones', 110)
)
insert into public.categories (store_id, slug, name, sort_order, is_active)
select
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  slug,
  name,
  sort_order,
  true
from source_categories
on conflict (store_id, slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

with source_products(
  sku, name, brand, category_slug, base_unit, tracks_expiration
) as (
  values
    ('COG-ARROZ-SUPERIOR', 'Arroz superior', 'Costeño / Paisana', 'arroces', 'gram', true),
    ('COG-ARROZ-EXTRA', 'Arroz extra', 'Paisana', 'arroces', 'gram', true),
    ('COG-AZUCAR-RUBIA', 'Azúcar rubia', 'Casa Grande / Cartavio', 'azucares', 'gram', true),
    ('COG-AZUCAR-BLANCA', 'Azúcar blanca', 'Cartavio', 'azucares', 'gram', true),
    ('COG-SAL-MESA', 'Sal de mesa', 'Marina / Emsal', 'sal-condimentos', 'gram', true),
    ('COG-ACEITE-VEGETAL', 'Aceite vegetal', 'Primor / Cocinero', 'aceites', 'milliliter', true),
    ('COG-FIDEOS-SPAGHETTI', 'Fideos spaghetti', 'Don Vittorio / Molitalia', 'pastas', 'gram', true),
    ('COG-FIDEOS-TALLARIN', 'Fideos tallarín', 'Molitalia', 'pastas', 'gram', true),
    ('COG-LENTEJA', 'Lenteja', 'Anita / Costeño', 'menestras-granos', 'gram', true),
    ('COG-FRIJOL-CANARIO', 'Frijol canario', 'Norteño', 'menestras-granos', 'gram', true),
    ('COG-FRIJOL-CASTILLA', 'Frijol castilla', 'Norteño', 'menestras-granos', 'gram', true),
    ('COG-FRIJOL-PANAMITO', 'Frijol panamito', 'Costeño', 'menestras-granos', 'gram', true),
    ('COG-GARBANZO', 'Garbanzo', 'Costeño', 'menestras-granos', 'gram', true),
    ('COG-PALLAR-BEBE', 'Pallar bebé', 'Norteño', 'menestras-granos', 'gram', true),
    ('COG-ARVEJA-PARTIDA', 'Arveja partida', 'Anita', 'menestras-granos', 'gram', true),
    ('COG-QUINUA-BLANCA', 'Quinua blanca', 'Sibarita', 'menestras-granos', 'gram', true),
    ('COG-AVENA-HOJUELAS', 'Avena en hojuelas', 'Quaker / 3 Ositos', 'cereales', 'gram', true),
    ('COG-HARINA-SIN-PREPARAR', 'Harina sin preparar', 'Blanca Flor', 'harinas', 'gram', true),
    ('COG-LECHE-EVAPORADA', 'Leche evaporada', 'Gloria', 'lacteos', 'gram', true),
    ('COG-ATUN-ACEITE', 'Atún en aceite', 'Florida / A-1', 'conservas', 'gram', true),
    ('COG-SARDINA-TOMATE', 'Sardina en salsa de tomate', 'Florida', 'conservas', 'gram', true),
    ('COG-CAFE-INSTANTANEO', 'Café instantáneo', 'Kirma / Altomayo', 'cafe-infusiones', 'gram', true),
    ('COG-CONSOME-GALLINA', 'Consomé de gallina', 'Maggi / Ajinomoto', 'sal-condimentos', 'unit', true),
    ('COG-AJINOMOTO', 'Ajino-moto', 'Ajinomoto', 'sal-condimentos', 'gram', true)
)
insert into public.products (
  store_id,
  category_id,
  sku,
  name,
  brand,
  base_unit,
  tracks_expiration,
  is_active
)
select
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  c.id,
  sp.sku,
  sp.name,
  sp.brand,
  sp.base_unit,
  sp.tracks_expiration,
  true
from source_products sp
join public.categories c
  on c.store_id = '03c25d8b-847f-4021-86bb-22d1955bbe6e'
 and c.slug = sp.category_slug
on conflict (store_id, sku) do update
set category_id = excluded.category_id,
    name = excluded.name,
    brand = excluded.brand,
    base_unit = excluded.base_unit,
    tracks_expiration = excluded.tracks_expiration,
    is_active = true,
    updated_at = now();

with source_presentations(
  sku, product_sku, name, kind, base_quantity, price_cents
) as (
  values
    ('COG-ARROZ-SUPERIOR-5KG', 'COG-ARROZ-SUPERIOR', 'Bolsa 5 kg', 'package', 5000, 1950),
    ('COG-ARROZ-SUPERIOR-50KG', 'COG-ARROZ-SUPERIOR', 'Bolsa 50 kg (saco)', 'sack', 50000, 18500),
    ('COG-ARROZ-EXTRA-1KG', 'COG-ARROZ-EXTRA', 'Bolsa 1 kg', 'package', 1000, 420),
    ('COG-AZUCAR-RUBIA-1KG', 'COG-AZUCAR-RUBIA', 'Bolsa 1 kg', 'package', 1000, 480),
    ('COG-AZUCAR-RUBIA-5KG', 'COG-AZUCAR-RUBIA', 'Bolsa 5 kg', 'package', 5000, 2200),
    ('COG-AZUCAR-BLANCA-1KG', 'COG-AZUCAR-BLANCA', 'Bolsa 1 kg', 'package', 1000, 530),
    ('COG-SAL-MESA-1KG', 'COG-SAL-MESA', 'Bolsa 1 kg', 'package', 1000, 200),
    ('COG-ACEITE-VEGETAL-1L', 'COG-ACEITE-VEGETAL', 'Botella 1 L', 'package', 1000, 1050),
    ('COG-ACEITE-VEGETAL-5L', 'COG-ACEITE-VEGETAL', 'Botella 5 L', 'package', 5000, 4400),
    ('COG-FIDEOS-SPAGHETTI-500G', 'COG-FIDEOS-SPAGHETTI', 'Bolsa 500 g', 'package', 500, 350),
    ('COG-FIDEOS-TALLARIN-500G', 'COG-FIDEOS-TALLARIN', 'Bolsa 500 g', 'package', 500, 350),
    ('COG-LENTEJA-500G', 'COG-LENTEJA', 'Bolsa 500 g', 'package', 500, 520),
    ('COG-LENTEJA-5KG', 'COG-LENTEJA', 'Bolsa 5 kg', 'package', 5000, 4800),
    ('COG-FRIJOL-CANARIO-500G', 'COG-FRIJOL-CANARIO', 'Bolsa 500 g', 'package', 500, 650),
    ('COG-FRIJOL-CASTILLA-500G', 'COG-FRIJOL-CASTILLA', 'Bolsa 500 g', 'package', 500, 600),
    ('COG-FRIJOL-PANAMITO-500G', 'COG-FRIJOL-PANAMITO', 'Bolsa 500 g', 'package', 500, 680),
    ('COG-GARBANZO-500G', 'COG-GARBANZO', 'Bolsa 500 g', 'package', 500, 700),
    ('COG-PALLAR-BEBE-500G', 'COG-PALLAR-BEBE', 'Bolsa 500 g', 'package', 500, 850),
    ('COG-ARVEJA-PARTIDA-500G', 'COG-ARVEJA-PARTIDA', 'Bolsa 500 g', 'package', 500, 450),
    ('COG-QUINUA-BLANCA-500G', 'COG-QUINUA-BLANCA', 'Bolsa 500 g', 'package', 500, 950),
    ('COG-AVENA-HOJUELAS-400G', 'COG-AVENA-HOJUELAS', 'Bolsa 400 g', 'package', 400, 520),
    ('COG-AVENA-HOJUELAS-170G', 'COG-AVENA-HOJUELAS', 'Sobre 170 g', 'package', 170, 220),
    ('COG-HARINA-SIN-PREPARAR-1KG', 'COG-HARINA-SIN-PREPARAR', 'Bolsa 1 kg', 'package', 1000, 390),
    ('COG-LECHE-EVAPORADA-400G', 'COG-LECHE-EVAPORADA', 'Lata 400 g', 'package', 400, 450),
    ('COG-LECHE-EVAPORADA-170G', 'COG-LECHE-EVAPORADA', 'Lata 170 g', 'package', 170, 230),
    ('COG-ATUN-ACEITE-170G', 'COG-ATUN-ACEITE', 'Lata 170 g', 'package', 170, 720),
    ('COG-SARDINA-TOMATE-425G', 'COG-SARDINA-TOMATE', 'Lata 425 g', 'package', 425, 680),
    ('COG-CAFE-INSTANTANEO-100G', 'COG-CAFE-INSTANTANEO', 'Frasco 100 g', 'package', 100, 1350),
    ('COG-CONSOME-GALLINA-X8', 'COG-CONSOME-GALLINA', 'Bolsa x8 cubos', 'package', 8, 400),
    ('COG-AJINOMOTO-8G', 'COG-AJINOMOTO', 'Sobre 8 g', 'package', 8, 80)
)
insert into public.product_presentations (
  store_id,
  product_id,
  sku,
  name,
  kind,
  base_quantity,
  price_mode,
  price_cents,
  allows_quantity_input,
  allows_money_input,
  minimum_quantity,
  quantity_step,
  is_sealed,
  is_active
)
select
  '03c25d8b-847f-4021-86bb-22d1955bbe6e',
  p.id,
  sp.sku,
  sp.name,
  sp.kind,
  sp.base_quantity,
  'fixed',
  sp.price_cents,
  false,
  false,
  1,
  1,
  true,
  true
from source_presentations sp
join public.products p
  on p.store_id = '03c25d8b-847f-4021-86bb-22d1955bbe6e'
 and p.sku = sp.product_sku
on conflict (store_id, sku) do update
set product_id = excluded.product_id,
    name = excluded.name,
    kind = excluded.kind,
    base_quantity = excluded.base_quantity,
    price_mode = excluded.price_mode,
    price_cents = excluded.price_cents,
    allows_quantity_input = excluded.allows_quantity_input,
    allows_money_input = excluded.allows_money_input,
    minimum_quantity = excluded.minimum_quantity,
    quantity_step = excluded.quantity_step,
    is_sealed = excluded.is_sealed,
    is_active = true,
    updated_at = now();

commit;
