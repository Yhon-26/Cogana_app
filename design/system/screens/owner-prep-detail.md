# Cogana Owner/Admin Prep Detail — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `389:2`; screen `389:3`;
in-page documentation `389:31`.

## Scope and visible state

The 360×844 Owner/Admin preparation detail is a store-scoped, data-pending
visual specification. It groups order context, products to prepare,
substitutions/adjustments, and payment/close. “Por cargar” is not a confirmed
empty order. The disabled “Continuar preparación” action is a design-system
Button instance, not a working transition. No order, customer, quantity, price,
or payment state is fabricated.

## Data and transition contract

The loaded detail needs `orders` (including `status`, `payment_status`,
`fulfillment_type`, `scheduled_for`, `preparation_not_before`, totals and notes),
`order_items` snapshots and requested/prepared quantities,
`inventory_reservations`, `order_substitutions`, and `order_status_history`,
all scoped by store and order. Preserve the request mode and base unit rather
than presenting all items as simple unit counts.

An active owner/admin role gate is required; `private.is_store_member` also
admits drivers and is insufficient for this page. `confirmed → preparing` and
the subsequent `preparing → awaiting_adjustment` or ready-for-fulfillment paths
must use authorized, transactional, idempotent server operations. The weighted
finalization operation requires every order item, nonnegative prepared amounts
within current reservations, and may create an adjustment or refund. Never
offer a ready transition while an adjustment remains unresolved. Revalidate
inventory, payment, status, and permission at action time. Do not issue direct
client-side order updates.

## Privacy and accessibility

Display customer name, contact, delivery address, and notes only where an
authorized worker needs them. Never expose raw pickup confirmation codes or
hashes, payment identifiers, or staff identifiers. Do not copy sensitive
details into screenshots or metrics. Loaded states need readable units,
textual status, semantic groups, visible focus, ≥44 px targets, specific
errors and disabled-action explanations. Keep permission-denied, not-found,
loading, error/offline, and genuinely empty results distinct.

## Validation and remaining work

The full viewport and 500×1000 in-page documentation were visually reviewed.
All four cards have 15 px bottom space after their last text line; the button
and footer fit within the viewport. The screen has 18 text nodes and the
documentation has 9, all Inter. Design-system colors/text styles and a disabled
Button instance are reused. No fake records, active transitions, clipping, or
overlap remain.

Real data loading, editing of prepared quantities, substitution decisions,
payment/adjustment handling, authorization, transactional actions, and all
loaded/error states remain unimplemented. The administrative header is still
a shell proposal, not a finalized reusable navigation component.

## Estados del recorrido de alta fidelidad (fase 7.5)

En la página compartida `539:6`, la vista de ejemplo `545:2` se complementa
con Preparación cargando `594:2` y Preparación sin conexión `594:32`, ambas
de 393×852 pt. Mantienen la identidad crema/verde y Fraunces/Inter. El
contexto permanece aquí, fuera del lienzo.

- Cargando indica que pedido, modalidad, artículos, cantidades, pago y
  existencias están en consulta. No muestra EJ-1042, precios ni una lista
  ficticia como datos de preparación; la acción permanece deshabilitada.
- Sin conexión evita reutilizar datos anteriores como actuales. No afirma
  que el pedido esté vacío o cancelado. «Reintentar» conduce solo al estado
  Cargando del prototipo; no consulta ni modifica el servidor.
- Antes de permitir preparación real se necesita lectura autorizada por
  tienda y pedido, estado y pago vigentes, reservas y ajustes verificados,
  además de una transición transaccional e idempotente en servidor.

Ambas pantallas se revisaron a tamaño iPhone 16, sin recorte visible. Los
tres enlaces (dos «Volver» y un «Reintentar») llevan a pantallas existentes
y miden al menos 44 pt. Aún faltan estado cargado, errores específicos,
permisos y pruebas de accesibilidad en la aplicación.
