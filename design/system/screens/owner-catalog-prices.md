# Cogana Owner/Admin Catalog & Prices — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `396:2`; screen `396:3`;
in-page documentation `396:31`.

## Scope and visible state

The 360×844 Owner/Admin overview separates store context, categories/products,
presentations, current prices, and price history. It is a data-pending visual
specification: “por cargar” is not a confirmed empty catalog. It shows no
fabricated counts, items, images, or prices, and enables no edit/publish action.

## Catalog and price contract

`categories`, `products`, and `product_presentations` each have an independent
`is_active` flag. A product absent from a future import is not automatically
deactivated. `product_images` has paths and alt text, but the initial catalog
snapshot has no images; placeholders must not masquerade as real media.

Current price is `product_presentations.price_cents`, expressed per
`base_quantity` under `price_mode` (`fixed` or `proportional`). A loaded view
must show S/, presentation, unit, and basis together; promotions are a
separate layer. Checkout captures order-item price snapshots, so a later
catalog change must not rewrite an existing order's price. The
`product_presentations_price_history_trigger` records initial and changed
prices in `product_price_history`, with `initial_price`/`price_updated` reason
codes. That history is not the source of the current price and does not hold a
human-authored change justification by default.

## Authorization and future editing

The relevant catalog tables have authenticated CRUD scoped by owner/admin RLS
and `store_id`. The page must still verify active owner/admin membership for
the selected store. Before enabling editing, specify and test validation for
SKU/slug uniqueness, base units, price mode and step, active-state effects,
concurrent edits, errors, and price-history results. Availability to buy also
depends on inventory and operations, not merely `is_active`.

## A11y and validation

Loaded prices need currency and unit in accessible text. Active/inactive
states must not rely on color; forms need associated errors, visible focus,
≥44 px targets and announced results. Future states include no-store,
permission-denied, loading, error/offline, empty-confirmed, partial, list,
detail, editing, confirmation, and failed save.

The full viewport and 500×1160 in-page documentation were visually reviewed.
All five cards have at least 15 px below their last text line; footer and docs
fit their frames. Screen has 20 text nodes and documentation 10, all Inter.
Cogana color and text styles are reused. No clipping, overlap, fake prices,
active mutations, or shimmer placeholders remain. The admin header is still a
proposal, not final reusable navigation.

## Continuación visual en la hoja operativa

La página compartida `539:6` contiene Catálogo y precios `545:4`, lectura
parcial `562:4`, sin conexión `562:5` y cargando `565:2` en 393 × 852 pt.
El precio S/ 19.50 de arroz es un ejemplo de diseño, no una lectura vigente.
La lectura parcial no valida el resto del catálogo ni habilita publicación;
sin conexión no presenta precios anteriores como actuales. «Reintentar» enlaza
únicamente al estado de carga del prototipo. Estas variantes conservan la
dirección visual aprobada, sin habilitar CRUD ni sustituir los contratos de
datos y autorización anteriores.
