-- Cogana v2 - esquema objetivo del MVP.
--
-- Este archivo es una especificacion ejecutable para una base limpia. NO es una
-- migracion sobre Solaris: varias tablas ya existen alli y primero deben
-- transformarse mediante migraciones no destructivas.
--
-- Convenciones:
--   * dinero: bigint en centimos de PEN;
--   * cantidades: bigint en la unidad base del producto (gramo, unidad o ml);
--   * fechas operativas: timestamptz; fechas de vencimiento: date;
--   * aislamiento: store_id en toda entidad operativa;
--   * escrituras transaccionales: Edge Functions + funciones privadas;
--   * ninguna tarjeta o secreto de proveedor se almacena en Postgres.

begin;

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Identidad, tienda y operacion
-- ---------------------------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  legal_name text,
  tax_id text check (tax_id is null or tax_id ~ '^[0-9]{11}$'),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  address text,
  district text,
  timezone text not null default 'America/Lima',
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  unique (slug)
);

create index stores_organization_id_idx on public.stores(organization_id);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_memberships (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'driver')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

create index store_memberships_user_active_idx
  on public.store_memberships(user_id, store_id)
  where is_active;
create index store_memberships_user_id_idx
  on public.store_memberships(user_id);

create table public.store_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  display_name text not null,
  legal_name text,
  tax_id text check (tax_id is null or tax_id ~ '^[0-9]{11}$'),
  phone text,
  whatsapp_phone text,
  currency text not null default 'PEN' check (currency = 'PEN'),
  locale text not null default 'es-PE',
  accepts_pickup boolean not null default true,
  accepts_delivery boolean not null default true,
  accepts_cash_pickup boolean not null default true,
  accepts_yape boolean not null default true,
  accepts_plin boolean not null default true,
  accepts_card boolean not null default false,
  default_preparation_minutes integer not null default 30
    check (default_preparation_minutes between 1 and 1440),
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_business_hours (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  weekday smallint not null check (weekday between 1 and 7),
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_closed and opens_at is null and closes_at is null)
    or
    (not is_closed and opens_at is not null and closes_at is not null and closes_at > opens_at)
  ),
  unique (store_id, weekday)
);

create index store_business_hours_store_id_idx
  on public.store_business_hours(store_id);

create table public.store_schedule_exceptions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  local_date date not null,
  opens_at time,
  closes_at time,
  is_closed boolean not null default false,
  public_message text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (is_closed and opens_at is null and closes_at is null)
    or
    (not is_closed and opens_at is not null and closes_at is not null and closes_at > opens_at)
  ),
  unique (store_id, local_date)
);

create index store_schedule_exceptions_date_idx
  on public.store_schedule_exceptions(store_id, local_date);

create table public.store_operational_state (
  store_id uuid primary key references public.stores(id) on delete cascade,
  status text not null default 'closed'
    check (status in ('closed', 'accepting_orders', 'preparing_orders', 'paused')),
  public_message text,
  estimated_resume_at timestamptz,
  preparation_started_at timestamptz,
  changed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Catalogo y precios
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, slug)
);

create index categories_store_active_idx
  on public.categories(store_id, sort_order)
  where is_active;

create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid,
  sku text,
  name text not null check (btrim(name) <> ''),
  brand text,
  description text,
  base_unit text not null check (base_unit in ('gram', 'unit', 'milliliter')),
  tracks_expiration boolean not null default false,
  minimum_stock_quantity bigint not null default 0
    check (minimum_stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, sku),
  foreign key (store_id, category_id)
    references public.categories(store_id, id) on delete restrict
);

create index products_category_id_idx on public.products(category_id);
create index products_store_active_name_idx
  on public.products(store_id, name)
  where is_active;

create table public.product_presentations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  sku text,
  name text not null check (btrim(name) <> ''),
  kind text not null check (kind in ('bulk', 'unit', 'package', 'box', 'sack')),
  base_quantity bigint not null check (base_quantity > 0),
  price_mode text not null check (price_mode in ('proportional', 'fixed')),
  price_cents bigint not null check (price_cents > 0),
  allows_quantity_input boolean not null default false,
  allows_money_input boolean not null default false,
  minimum_quantity bigint not null default 1 check (minimum_quantity > 0),
  quantity_step bigint not null default 1 check (quantity_step > 0),
  is_sealed boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, id, product_id),
  unique (store_id, sku),
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete cascade,
  check (not allows_money_input or price_mode = 'proportional'),
  check (allows_quantity_input or allows_money_input or kind in ('unit', 'package', 'box', 'sack'))
);

create index product_presentations_product_active_idx
  on public.product_presentations(product_id)
  where is_active;

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  storage_path text not null check (btrim(storage_path) <> ''),
  sort_order integer not null default 0,
  alt_text text,
  created_at timestamptz not null default now(),
  unique (store_id, storage_path),
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete cascade
);

create index product_images_product_sort_idx
  on public.product_images(product_id, sort_order);

create table public.product_price_history (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  presentation_id uuid not null,
  old_price_cents bigint check (old_price_cents is null or old_price_cents > 0),
  new_price_cents bigint not null check (new_price_cents > 0),
  reason text,
  changed_by uuid references auth.users(id) on delete set null,
  changed_at timestamptz not null default now(),
  foreign key (store_id, presentation_id)
    references public.product_presentations(store_id, id) on delete restrict
);

create index product_price_history_presentation_date_idx
  on public.product_price_history(presentation_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- Inventario por lote, sellado y granel
-- ---------------------------------------------------------------------------

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  tax_id text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create index suppliers_store_active_idx
  on public.suppliers(store_id, name)
  where is_active;

create table public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  supplier_id uuid,
  lot_code text not null check (btrim(lot_code) <> ''),
  received_at timestamptz not null default now(),
  expires_on date,
  loose_on_hand_quantity bigint not null default 0
    check (loose_on_hand_quantity >= 0),
  status text not null default 'available'
    check (status in ('available', 'blocked', 'expired', 'depleted')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, product_id, lot_code),
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete restrict,
  foreign key (store_id, supplier_id)
    references public.suppliers(store_id, id) on delete restrict
);

create index inventory_lots_product_fefo_idx
  on public.inventory_lots(store_id, product_id, expires_on, received_at)
  where status = 'available';

create index inventory_lots_expiration_alert_idx
  on public.inventory_lots(store_id, expires_on)
  where status = 'available' and expires_on is not null;

create table public.inventory_lot_packages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  lot_id uuid not null,
  presentation_id uuid not null,
  sealed_on_hand_units bigint not null default 0
    check (sealed_on_hand_units >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, lot_id, presentation_id),
  foreign key (store_id, lot_id)
    references public.inventory_lots(store_id, id) on delete cascade,
  foreign key (store_id, presentation_id)
    references public.product_presentations(store_id, id) on delete restrict
);

create index inventory_lot_packages_presentation_idx
  on public.inventory_lot_packages(presentation_id)
  where sealed_on_hand_units > 0;

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null,
  lot_id uuid not null,
  presentation_id uuid,
  movement_type text not null check (movement_type in (
    'opening', 'receipt', 'reservation', 'release', 'sale',
    'return', 'adjustment', 'waste', 'open_package', 'expire'
  )),
  base_quantity_delta bigint not null,
  loose_quantity_delta bigint not null default 0,
  sealed_units_delta bigint not null default 0,
  reason text,
  reference_type text,
  reference_id uuid,
  operation_id uuid not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (store_id, operation_id),
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete restrict,
  foreign key (store_id, lot_id)
    references public.inventory_lots(store_id, id) on delete restrict,
  foreign key (store_id, presentation_id, product_id)
    references public.product_presentations(store_id, id, product_id) on delete restrict,
  check ((reference_type is null) = (reference_id is null)),
  check (base_quantity_delta <> 0 or loose_quantity_delta <> 0 or sealed_units_delta <> 0)
);

create index inventory_movements_product_date_idx
  on public.inventory_movements(store_id, product_id, created_at desc);
create index inventory_movements_lot_date_idx
  on public.inventory_movements(lot_id, created_at desc);
create index inventory_movements_reference_idx
  on public.inventory_movements(reference_type, reference_id)
  where reference_id is not null;

-- ---------------------------------------------------------------------------
-- Clientes y direcciones
-- ---------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null check (btrim(name) <> ''),
  phone text not null check (btrim(phone) <> ''),
  phone_verified_at timestamptz,
  email text,
  status text not null default 'active'
    check (status in ('active', 'restricted', 'blocked', 'archived')),
  cash_pickup_restricted_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, auth_user_id)
);

create index customers_store_phone_idx on public.customers(store_id, phone);
create index customers_auth_user_id_idx
  on public.customers(auth_user_id)
  where auth_user_id is not null;

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null,
  label text not null default 'Principal',
  address_line text not null check (btrim(address_line) <> ''),
  district text not null check (btrim(district) <> ''),
  reference text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  foreign key (store_id, customer_id)
    references public.customers(store_id, id) on delete cascade,
  check ((latitude is null) = (longitude is null)),
  check (latitude is null or latitude between -90 and 90),
  check (longitude is null or longitude between -180 and 180)
);

create index customer_addresses_customer_idx
  on public.customer_addresses(customer_id);
create unique index customer_addresses_one_default_idx
  on public.customer_addresses(customer_id)
  where is_default;

create table public.customer_preferences (
  store_id uuid not null,
  customer_id uuid not null,
  order_notifications boolean not null default true,
  promotion_notifications boolean not null default false,
  marketing_consent boolean not null default false,
  substitution_default text not null default 'contact'
    check (substitution_default in ('allow_similar', 'contact', 'remove')),
  updated_at timestamptz not null default now(),
  primary key (store_id, customer_id),
  foreign key (store_id, customer_id)
    references public.customers(store_id, id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- Delivery, pedidos, sustituciones y reservas
-- ---------------------------------------------------------------------------

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  district text not null check (btrim(district) <> ''),
  fee_cents bigint not null check (fee_cents >= 0),
  minimum_order_cents bigint not null default 0 check (minimum_order_cents >= 0),
  eta_min_minutes integer not null check (eta_min_minutes > 0),
  eta_max_minutes integer not null check (eta_max_minutes >= eta_min_minutes),
  restrictions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id)
);

create index delivery_zones_store_active_idx
  on public.delivery_zones(store_id, district)
  where is_active;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_number text not null check (btrim(order_number) <> ''),
  operation_id uuid not null,
  requester_user_id uuid references auth.users(id) on delete set null,
  customer_id uuid not null,
  source text not null check (source in ('web', 'android', 'phone', 'whatsapp')),
  fulfillment_type text not null check (fulfillment_type in ('pickup', 'delivery')),
  status text not null default 'pending_payment' check (status in (
    'pending_payment', 'queued', 'confirmed', 'preparing',
    'awaiting_adjustment', 'ready_for_pickup', 'ready_for_delivery', 'out_for_delivery',
    'completed', 'cancelled'
  )),
  payment_status text not null default 'pending' check (payment_status in (
    'pending', 'requires_action', 'processing', 'paid',
    'partially_refunded', 'refunded', 'failed', 'expired', 'cancelled'
  )),
  payment_method text not null check (payment_method in ('cash', 'yape', 'plin', 'card')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  delivery_zone_id uuid,
  delivery_address jsonb,
  scheduled_for timestamptz,
  preparation_not_before timestamptz,
  estimated_ready_at timestamptz,
  estimated_subtotal_cents bigint not null check (estimated_subtotal_cents >= 0),
  estimated_discount_cents bigint not null default 0 check (estimated_discount_cents >= 0),
  delivery_fee_cents bigint not null default 0 check (delivery_fee_cents >= 0),
  delivery_discount_cents bigint not null default 0 check (delivery_discount_cents >= 0),
  estimated_total_cents bigint not null check (estimated_total_cents >= 0),
  final_subtotal_cents bigint check (final_subtotal_cents is null or final_subtotal_cents >= 0),
  final_discount_cents bigint check (final_discount_cents is null or final_discount_cents >= 0),
  final_total_cents bigint check (final_total_cents is null or final_total_cents >= 0),
  notes text,
  cancellation_reason_code text,
  cancelled_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, order_number),
  unique (store_id, operation_id),
  foreign key (store_id, customer_id)
    references public.customers(store_id, id) on delete restrict,
  foreign key (store_id, delivery_zone_id)
    references public.delivery_zones(store_id, id) on delete restrict,
  check (estimated_discount_cents <= estimated_subtotal_cents),
  check (delivery_discount_cents <= delivery_fee_cents),
  check (
    estimated_total_cents = estimated_subtotal_cents - estimated_discount_cents
      + delivery_fee_cents - delivery_discount_cents
  ),
  check (
    (final_subtotal_cents is null and final_discount_cents is null and final_total_cents is null)
    or
    (
      final_subtotal_cents is not null
      and final_discount_cents is not null
      and final_discount_cents <= final_subtotal_cents
      and final_total_cents = final_subtotal_cents - final_discount_cents
        + delivery_fee_cents - delivery_discount_cents
    )
  ),
  check (payment_method <> 'cash' or fulfillment_type = 'pickup'),
  check (
    (fulfillment_type = 'pickup' and delivery_zone_id is null and delivery_address is null and delivery_fee_cents = 0)
    or
    (fulfillment_type = 'delivery' and delivery_zone_id is not null and delivery_address is not null)
  )
);

create index orders_store_queue_idx
  on public.orders(store_id, status, preparation_not_before, created_at)
  where status not in ('completed', 'cancelled');
create index orders_customer_date_idx
  on public.orders(customer_id, created_at desc);
create index orders_requester_date_idx
  on public.orders(requester_user_id, created_at desc)
  where requester_user_id is not null;
create index orders_scheduled_idx
  on public.orders(store_id, scheduled_for)
  where scheduled_for is not null and status not in ('completed', 'cancelled');

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null,
  product_id uuid not null,
  presentation_id uuid not null,
  product_name_snapshot text not null,
  presentation_name_snapshot text not null,
  base_unit_snapshot text not null check (base_unit_snapshot in ('gram', 'unit', 'milliliter')),
  request_mode text not null check (request_mode in ('quantity', 'money', 'presentation')),
  requested_quantity bigint check (requested_quantity is null or requested_quantity > 0),
  requested_money_cents bigint check (requested_money_cents is null or requested_money_cents > 0),
  estimated_quantity bigint not null check (estimated_quantity > 0),
  prepared_quantity bigint check (prepared_quantity is null or prepared_quantity >= 0),
  price_cents_snapshot bigint not null check (price_cents_snapshot > 0),
  pricing_quantity_snapshot bigint not null check (pricing_quantity_snapshot > 0),
  estimated_line_cents bigint not null check (estimated_line_cents >= 0),
  estimated_discount_cents bigint not null default 0 check (estimated_discount_cents >= 0),
  final_line_cents bigint check (final_line_cents is null or final_line_cents >= 0),
  final_discount_cents bigint check (final_discount_cents is null or final_discount_cents >= 0),
  substitution_policy text not null default 'contact'
    check (substitution_policy in ('allow_similar', 'contact', 'remove')),
  max_substitution_extra_cents bigint not null default 0
    check (max_substitution_extra_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, id, order_id),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict,
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete restrict,
  foreign key (store_id, presentation_id, product_id)
    references public.product_presentations(store_id, id, product_id) on delete restrict,
  check (
    (request_mode = 'money' and requested_money_cents is not null and requested_quantity is null)
    or
    (request_mode in ('quantity', 'presentation') and requested_quantity is not null and requested_money_cents is null)
  ),
  check (estimated_discount_cents <= estimated_line_cents),
  check (final_discount_cents is null or final_line_cents is not null),
  check (final_discount_cents is null or final_discount_cents <= final_line_cents)
);

create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null,
  from_status text,
  to_status text not null,
  reason_code text,
  note text,
  actor_user_id uuid references auth.users(id) on delete set null,
  operation_id uuid not null,
  created_at timestamptz not null default now(),
  unique (store_id, operation_id),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict
);

create index order_status_history_order_date_idx
  on public.order_status_history(order_id, created_at);

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null,
  order_item_id uuid not null,
  product_id uuid not null,
  reserved_quantity bigint not null check (reserved_quantity > 0),
  consumed_quantity bigint not null default 0
    check (consumed_quantity >= 0 and consumed_quantity <= reserved_quantity),
  status text not null default 'reserved'
    check (status in ('reserved', 'partially_consumed', 'consumed', 'released', 'expired')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, order_item_id),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict,
  foreign key (store_id, order_item_id, order_id)
    references public.order_items(store_id, id, order_id) on delete restrict,
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete restrict
);

create index inventory_reservations_expiry_idx
  on public.inventory_reservations(expires_at)
  where status in ('reserved', 'partially_consumed');
create index inventory_reservations_order_idx
  on public.inventory_reservations(order_id);

create table public.inventory_reservation_allocations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  reservation_id uuid not null,
  lot_id uuid not null,
  package_presentation_id uuid,
  allocated_base_quantity bigint not null check (allocated_base_quantity > 0),
  allocated_package_units bigint not null default 0 check (allocated_package_units >= 0),
  created_at timestamptz not null default now(),
  foreign key (store_id, reservation_id)
    references public.inventory_reservations(store_id, id) on delete cascade,
  foreign key (store_id, lot_id)
    references public.inventory_lots(store_id, id) on delete restrict,
  foreign key (store_id, package_presentation_id)
    references public.product_presentations(store_id, id) on delete restrict
);

create index inventory_reservation_allocations_reservation_idx
  on public.inventory_reservation_allocations(reservation_id);
create index inventory_reservation_allocations_lot_idx
  on public.inventory_reservation_allocations(lot_id);

create table public.order_substitutions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null,
  order_item_id uuid not null,
  replacement_product_id uuid not null,
  replacement_presentation_id uuid not null,
  proposed_quantity bigint not null check (proposed_quantity > 0),
  proposed_line_cents bigint not null check (proposed_line_cents >= 0),
  price_difference_cents bigint not null,
  status text not null default 'pending'
    check (status in ('pending', 'auto_accepted', 'accepted', 'rejected', 'expired')),
  expires_at timestamptz,
  decided_at timestamptz,
  proposed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict,
  foreign key (store_id, order_item_id, order_id)
    references public.order_items(store_id, id, order_id) on delete restrict,
  foreign key (store_id, replacement_product_id)
    references public.products(store_id, id) on delete restrict,
  foreign key (store_id, replacement_presentation_id)
    references public.product_presentations(store_id, id) on delete restrict
);

create index order_substitutions_order_status_idx
  on public.order_substitutions(order_id, status);

-- ---------------------------------------------------------------------------
-- Pagos
-- ---------------------------------------------------------------------------

create table public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null,
  parent_transaction_id uuid,
  transaction_type text not null check (transaction_type in ('charge', 'refund', 'adjustment')),
  method text not null check (method in ('cash', 'yape', 'plin', 'card')),
  provider text not null check (btrim(provider) <> ''),
  provider_reference text,
  idempotency_key text not null check (btrim(idempotency_key) <> ''),
  amount_cents bigint not null check (amount_cents > 0),
  currency text not null default 'PEN' check (currency = 'PEN'),
  status text not null check (status in (
    'pending', 'requires_action', 'processing', 'succeeded',
    'failed', 'cancelled', 'expired'
  )),
  proof_storage_path text,
  failure_code text,
  failure_message text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, idempotency_key),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict,
  foreign key (store_id, parent_transaction_id)
    references public.payment_transactions(store_id, id) on delete restrict
);

create unique index payment_transactions_provider_reference_idx
  on public.payment_transactions(provider, provider_reference)
  where provider_reference is not null;
create index payment_transactions_order_date_idx
  on public.payment_transactions(order_id, created_at desc);
create index payment_transactions_pending_idx
  on public.payment_transactions(store_id, created_at)
  where status in ('pending', 'requires_action', 'processing');

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  signature_valid boolean not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  processing_error text,
  unique (provider, provider_event_id)
);

create index payment_events_unprocessed_idx
  on public.payment_events(received_at)
  where processed_at is null;

-- ---------------------------------------------------------------------------
-- Reparto propio
-- ---------------------------------------------------------------------------

create table public.delivery_assignments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  order_id uuid not null,
  driver_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'assigned'
    check (status in ('assigned', 'accepted', 'picked_up', 'delivering', 'delivered', 'failed', 'cancelled')),
  confirmation_code_hash text,
  recipient_name text,
  evidence_storage_path text,
  notes text,
  assigned_at timestamptz not null default now(),
  started_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, order_id),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict
);

create index delivery_assignments_driver_active_idx
  on public.delivery_assignments(driver_user_id, status, assigned_at)
  where status not in ('delivered', 'failed', 'cancelled');
create index delivery_assignments_driver_user_id_idx
  on public.delivery_assignments(driver_user_id)
  where driver_user_id is not null;

create table public.delivery_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete restrict,
  assignment_id uuid not null,
  event_type text not null check (event_type in (
    'assigned', 'accepted', 'picked_up', 'departed', 'arrived',
    'delivered', 'recipient_absent', 'address_problem', 'failed', 'cancelled'
  )),
  note text,
  latitude numeric(9,6),
  longitude numeric(9,6),
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (store_id, assignment_id)
    references public.delivery_assignments(store_id, id) on delete restrict,
  check ((latitude is null) = (longitude is null))
);

create index delivery_events_assignment_date_idx
  on public.delivery_events(assignment_id, created_at);

-- ---------------------------------------------------------------------------
-- Promociones basicas
-- ---------------------------------------------------------------------------

create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (btrim(name) <> ''),
  description text,
  promotion_type text not null check (promotion_type in (
    'percentage', 'fixed_amount', 'fixed_price', 'quantity_price', 'free_delivery'
  )),
  value bigint not null default 0 check (value >= 0),
  minimum_quantity bigint check (minimum_quantity is null or minimum_quantity > 0),
  minimum_order_cents bigint not null default 0 check (minimum_order_cents >= 0),
  coupon_code text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer check (per_customer_limit is null or per_customer_limit > 0),
  priority integer not null default 0,
  is_stackable boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, id),
  unique (store_id, coupon_code),
  check (ends_at > starts_at)
);

create index promotions_store_active_dates_idx
  on public.promotions(store_id, starts_at, ends_at)
  where is_active;

create table public.promotion_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  promotion_id uuid not null,
  product_id uuid not null,
  presentation_id uuid,
  foreign key (store_id, promotion_id)
    references public.promotions(store_id, id) on delete cascade,
  foreign key (store_id, product_id)
    references public.products(store_id, id) on delete cascade,
  foreign key (store_id, presentation_id, product_id)
    references public.product_presentations(store_id, id, product_id) on delete cascade
);

create index promotion_products_product_idx
  on public.promotion_products(product_id, promotion_id);
create unique index promotion_products_whole_product_unique_idx
  on public.promotion_products(promotion_id, product_id)
  where presentation_id is null;
create unique index promotion_products_presentation_unique_idx
  on public.promotion_products(promotion_id, product_id, presentation_id)
  where presentation_id is not null;

create table public.order_promotions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  order_id uuid not null,
  order_item_id uuid,
  promotion_id uuid not null,
  promotion_name_snapshot text not null,
  coupon_code_snapshot text,
  discount_cents bigint not null check (discount_cents > 0),
  created_at timestamptz not null default now(),
  foreign key (store_id, order_id)
    references public.orders(store_id, id) on delete restrict,
  foreign key (store_id, order_item_id, order_id)
    references public.order_items(store_id, id, order_id) on delete restrict,
  foreign key (store_id, promotion_id)
    references public.promotions(store_id, id) on delete restrict
);

create index order_promotions_order_idx
  on public.order_promotions(order_id);
create index order_promotions_item_idx
  on public.order_promotions(order_item_id)
  where order_item_id is not null;
create index order_promotions_promotion_idx
  on public.order_promotions(promotion_id);

-- ---------------------------------------------------------------------------
-- Privacidad
-- ---------------------------------------------------------------------------

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'requested'
    check (status in ('requested', 'prepared', 'completed', 'failed')),
  requested_at timestamptz not null default now(),
  prepared_at timestamptz,
  completed_at timestamptz,
  error_message text
);

create index account_deletion_requests_user_idx
  on public.account_deletion_requests(user_id, requested_at desc);

-- Indices de soporte para claves foraneas que no quedan cubiertas por los
-- indices de consulta anteriores.
create index store_settings_updated_by_idx on public.store_settings(updated_by)
  where updated_by is not null;
create index store_schedule_exceptions_created_by_idx
  on public.store_schedule_exceptions(created_by) where created_by is not null;
create index store_operational_state_changed_by_idx
  on public.store_operational_state(changed_by) where changed_by is not null;
create index product_price_history_changed_by_idx
  on public.product_price_history(changed_by) where changed_by is not null;
create index inventory_lots_supplier_id_idx
  on public.inventory_lots(supplier_id) where supplier_id is not null;
create index inventory_lots_created_by_idx
  on public.inventory_lots(created_by) where created_by is not null;
create index inventory_movements_presentation_id_idx
  on public.inventory_movements(presentation_id) where presentation_id is not null;
create index inventory_movements_actor_user_id_idx
  on public.inventory_movements(actor_user_id) where actor_user_id is not null;
create index orders_delivery_zone_id_idx
  on public.orders(delivery_zone_id) where delivery_zone_id is not null;
create index order_items_presentation_id_idx
  on public.order_items(presentation_id);
create index order_status_history_actor_user_id_idx
  on public.order_status_history(actor_user_id) where actor_user_id is not null;
create index inventory_reservations_product_id_idx
  on public.inventory_reservations(product_id);
create index inventory_reservation_allocations_presentation_idx
  on public.inventory_reservation_allocations(package_presentation_id)
  where package_presentation_id is not null;
create index order_substitutions_item_idx
  on public.order_substitutions(order_item_id);
create index order_substitutions_replacement_product_idx
  on public.order_substitutions(replacement_product_id);
create index order_substitutions_replacement_presentation_idx
  on public.order_substitutions(replacement_presentation_id);
create index order_substitutions_proposed_by_idx
  on public.order_substitutions(proposed_by) where proposed_by is not null;
create index payment_transactions_parent_idx
  on public.payment_transactions(parent_transaction_id)
  where parent_transaction_id is not null;
create index delivery_events_actor_user_id_idx
  on public.delivery_events(actor_user_id) where actor_user_id is not null;
create index promotion_products_presentation_idx
  on public.promotion_products(presentation_id) where presentation_id is not null;

-- ---------------------------------------------------------------------------
-- Helpers de autorizacion. No se exponen como RPC en public.
-- ---------------------------------------------------------------------------

create or replace function private.is_store_member(p_store_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.store_memberships sm
    where sm.store_id = p_store_id
      and sm.user_id = (select auth.uid())
      and sm.is_active
  );
$$;

create or replace function private.has_store_role(p_store_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.store_memberships sm
    where sm.store_id = p_store_id
      and sm.user_id = (select auth.uid())
      and sm.is_active
      and sm.role = any(p_roles)
  );
$$;

revoke all on function private.is_store_member(uuid) from public, anon;
revoke all on function private.has_store_role(uuid, text[]) from public, anon;
grant execute on function private.is_store_member(uuid) to authenticated;
grant execute on function private.has_store_role(uuid, text[]) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS y privilegios base
-- El catalogo publico y checkout se entregan mediante Edge Functions que
-- devuelven una proyeccion segura. No se concede lectura anonima a tablas.
-- ---------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.stores enable row level security;
alter table public.profiles enable row level security;
alter table public.store_memberships enable row level security;
alter table public.store_settings enable row level security;
alter table public.store_business_hours enable row level security;
alter table public.store_schedule_exceptions enable row level security;
alter table public.store_operational_state enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_presentations enable row level security;
alter table public.product_images enable row level security;
alter table public.product_price_history enable row level security;
alter table public.suppliers enable row level security;
alter table public.inventory_lots enable row level security;
alter table public.inventory_lot_packages enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.customer_preferences enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.inventory_reservation_allocations enable row level security;
alter table public.order_substitutions enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_events enable row level security;
alter table public.delivery_assignments enable row level security;
alter table public.delivery_events enable row level security;
alter table public.promotions enable row level security;
alter table public.promotion_products enable row level security;
alter table public.order_promotions enable row level security;
alter table public.account_deletion_requests enable row level security;

revoke all on all tables in schema public from anon, authenticated;

-- Perfil propio.
grant select, insert, update on public.profiles to authenticated;
create policy profiles_own_select on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_own_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));
create policy profiles_own_update on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Contexto de tienda para personal.
grant select on public.organizations, public.stores, public.store_memberships, public.store_settings,
  public.store_business_hours, public.store_schedule_exceptions,
  public.store_operational_state to authenticated;
create policy organizations_staff_select on public.organizations for select to authenticated
  using (exists (
    select 1
    from public.stores s
    where s.organization_id = organizations.id
      and (select private.is_store_member(s.id))
  ));
create policy stores_staff_select on public.stores for select to authenticated
  using ((select private.is_store_member(id)));
create policy memberships_staff_select on public.store_memberships for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy settings_staff_select on public.store_settings for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy hours_staff_select on public.store_business_hours for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy exceptions_staff_select on public.store_schedule_exceptions for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy operation_staff_select on public.store_operational_state for select to authenticated
  using ((select private.is_store_member(store_id)));

grant insert, update on public.store_settings, public.store_operational_state to authenticated;
grant insert, update, delete on public.store_business_hours,
  public.store_schedule_exceptions to authenticated;
create policy settings_admin_insert on public.store_settings for insert to authenticated
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy settings_admin_update on public.store_settings for update to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy hours_admin_insert on public.store_business_hours for insert to authenticated
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy hours_admin_update on public.store_business_hours for update to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy hours_admin_delete on public.store_business_hours for delete to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])));
create policy exceptions_admin_insert on public.store_schedule_exceptions for insert to authenticated
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy exceptions_admin_update on public.store_schedule_exceptions for update to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy exceptions_admin_delete on public.store_schedule_exceptions for delete to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])));
create policy operation_admin_insert on public.store_operational_state for insert to authenticated
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy operation_admin_update on public.store_operational_state for update to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));

-- Catalogo e inventario: administracion directa solo por owner/admin.
grant select, insert, update, delete on public.categories, public.products,
  public.product_presentations, public.product_images, public.suppliers,
  public.delivery_zones, public.promotions, public.promotion_products
  to authenticated;
grant select on public.product_price_history, public.inventory_lots,
  public.inventory_lot_packages, public.inventory_movements,
  public.inventory_reservations, public.inventory_reservation_allocations
  to authenticated;

create policy categories_admin_all on public.categories for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy products_admin_all on public.products for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy presentations_admin_all on public.product_presentations for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy images_admin_all on public.product_images for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy suppliers_admin_all on public.suppliers for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy zones_admin_all on public.delivery_zones for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy promotions_admin_all on public.promotions for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));
create policy promotion_products_admin_all on public.promotion_products for all to authenticated
  using ((select private.has_store_role(store_id, array['owner','admin'])))
  with check ((select private.has_store_role(store_id, array['owner','admin'])));

create policy price_history_staff_select on public.product_price_history for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy lots_staff_select on public.inventory_lots for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy lot_packages_staff_select on public.inventory_lot_packages for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy inventory_movements_staff_select on public.inventory_movements for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy reservations_staff_select on public.inventory_reservations for select to authenticated
  using ((select private.is_store_member(store_id)));
create policy reservation_allocations_staff_select on public.inventory_reservation_allocations for select to authenticated
  using ((select private.is_store_member(store_id)));

-- Clientes invitados o registrados: una identidad anonima de Supabase tambien
-- tiene auth.uid() y solo accede a sus propios datos.
grant select, insert, update on public.customers, public.customer_addresses,
  public.customer_preferences to authenticated;
create policy customers_owner_or_staff_select on public.customers for select to authenticated
  using (auth_user_id = (select auth.uid()) or (select private.is_store_member(store_id)));
create policy customers_owner_insert on public.customers for insert to authenticated
  with check (auth_user_id = (select auth.uid()));
create policy customers_owner_update on public.customers for update to authenticated
  using (auth_user_id = (select auth.uid()))
  with check (auth_user_id = (select auth.uid()));

create policy addresses_owner_or_staff_select on public.customer_addresses for select to authenticated
  using (
    (select private.is_store_member(store_id))
    or exists (
      select 1 from public.customers c
      where c.id = customer_addresses.customer_id
        and c.store_id = customer_addresses.store_id
        and c.auth_user_id = (select auth.uid())
    )
  );
create policy addresses_owner_insert on public.customer_addresses for insert to authenticated
  with check (exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.store_id = customer_addresses.store_id
      and c.auth_user_id = (select auth.uid())
  ));
create policy addresses_owner_update on public.customer_addresses for update to authenticated
  using (exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.store_id = customer_addresses.store_id
      and c.auth_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.customers c
    where c.id = customer_addresses.customer_id
      and c.store_id = customer_addresses.store_id
      and c.auth_user_id = (select auth.uid())
  ));

create policy preferences_owner_or_staff_select on public.customer_preferences for select to authenticated
  using (
    (select private.is_store_member(store_id))
    or exists (
      select 1 from public.customers c
      where c.id = customer_preferences.customer_id
        and c.store_id = customer_preferences.store_id
        and c.auth_user_id = (select auth.uid())
    )
  );
create policy preferences_owner_insert on public.customer_preferences for insert to authenticated
  with check (exists (
    select 1 from public.customers c
    where c.id = customer_preferences.customer_id
      and c.store_id = customer_preferences.store_id
      and c.auth_user_id = (select auth.uid())
  ));
create policy preferences_owner_update on public.customer_preferences for update to authenticated
  using (exists (
    select 1 from public.customers c
    where c.id = customer_preferences.customer_id
      and c.store_id = customer_preferences.store_id
      and c.auth_user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.customers c
    where c.id = customer_preferences.customer_id
      and c.store_id = customer_preferences.store_id
      and c.auth_user_id = (select auth.uid())
  ));

-- Pedidos y pagos son de solo lectura desde clientes. Checkout, transiciones,
-- cobros, reservas y devoluciones pasan por Edge Functions transaccionales.
grant select on public.orders, public.order_items, public.order_status_history,
  public.order_substitutions, public.order_promotions, public.payment_transactions,
  public.delivery_assignments, public.delivery_events to authenticated;

create policy orders_owner_or_staff_select on public.orders for select to authenticated
  using (requester_user_id = (select auth.uid()) or (select private.is_store_member(store_id)));
create policy order_items_owner_or_staff_select on public.order_items for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_items.order_id and o.store_id = order_items.store_id
      and (o.requester_user_id = (select auth.uid()) or (select private.is_store_member(o.store_id)))
  ));
create policy order_history_owner_or_staff_select on public.order_status_history for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_status_history.order_id and o.store_id = order_status_history.store_id
      and (o.requester_user_id = (select auth.uid()) or (select private.is_store_member(o.store_id)))
  ));
create policy substitutions_owner_or_staff_select on public.order_substitutions for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_substitutions.order_id and o.store_id = order_substitutions.store_id
      and (o.requester_user_id = (select auth.uid()) or (select private.is_store_member(o.store_id)))
  ));
create policy order_promotions_owner_or_staff_select on public.order_promotions for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = order_promotions.order_id and o.store_id = order_promotions.store_id
      and (o.requester_user_id = (select auth.uid()) or (select private.is_store_member(o.store_id)))
  ));
create policy payments_owner_or_staff_select on public.payment_transactions for select to authenticated
  using (exists (
    select 1 from public.orders o
    where o.id = payment_transactions.order_id and o.store_id = payment_transactions.store_id
      and (o.requester_user_id = (select auth.uid()) or (select private.is_store_member(o.store_id)))
  ));
create policy assignments_participant_select on public.delivery_assignments for select to authenticated
  using (
    driver_user_id = (select auth.uid())
    or (select private.is_store_member(store_id))
    or exists (
      select 1 from public.orders o
      where o.id = delivery_assignments.order_id and o.store_id = delivery_assignments.store_id
        and o.requester_user_id = (select auth.uid())
    )
  );
create policy delivery_events_participant_select on public.delivery_events for select to authenticated
  using (exists (
    select 1
    from public.delivery_assignments da
    join public.orders o on o.id = da.order_id and o.store_id = da.store_id
    where da.id = delivery_events.assignment_id and da.store_id = delivery_events.store_id
      and (
        da.driver_user_id = (select auth.uid())
        or o.requester_user_id = (select auth.uid())
        or (select private.is_store_member(da.store_id))
      )
  ));

grant select, insert on public.account_deletion_requests to authenticated;
create policy deletion_requests_own_select on public.account_deletion_requests for select to authenticated
  using (user_id = (select auth.uid()));
create policy deletion_requests_own_insert on public.account_deletion_requests for insert to authenticated
  with check (user_id = (select auth.uid()));

-- payment_events no recibe privilegios de cliente; solo service_role/servidor.
grant select, insert, update on public.payment_events to service_role;
create policy payment_events_service_role_all on public.payment_events
  for all to service_role
  using (true)
  with check (true);

commit;
