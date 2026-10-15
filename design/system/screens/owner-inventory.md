# Cogana Owner/Admin Inventory — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `393:2`; screen `393:3`;
in-page documentation `393:31`.

## Scope and visible state

The 360×844 Owner/Admin inventory overview is a store-scoped, data-pending
visual specification. It separates lots/on-hand, expiration, movement history,
and suppliers. “Por cargar” is neither zero stock nor a confirmed empty list.
No stock amount, expiry warning, supplier, or active mutation is fabricated.

## Data and stock meaning

`inventory_lots` holds loose on-hand in product base units and lot status
(`available`, `blocked`, `expired`, `depleted`). `inventory_lot_packages` holds
sealed units per presentation; these quantities cannot be added as if they
shared one unit. `inventory_movements` is an append-only operational trail with
movement type, deltas, reference, and timestamp. `suppliers` holds active state
and contact details. Every query must be scoped to `store_id`.

On-hand alone is not sellable availability. A loaded calculation must apply lot
status, expiration and active reservation allocations. `expires_on` is
nullable; a missing date is not an imminent-expiry alert. Define a store-local
today, warning threshold, refresh policy, and FEFO ordering before showing
counts or priority. Keep lot and movement detail in separate follow-up views.

## Authorization and actions

Require active owner/admin membership for this administrative page. Existing
lot/package/movement reads permit broader store membership through
`private.is_store_member`, including drivers; that is not a sufficient UI gate.
Suppliers have owner/admin RLS. The schema grants no direct client write to
lots or movements. The existing package-opening operation is private,
authorized, transactional, and idempotent; do not represent it as an enabled
control before its full flow is designed and verified. Adjustments, receipts,
blocking and expiration operations also need explicit server contracts before
the interface can offer them.

## Privacy, a11y, and validation

Only owner/admin should see supplier contact or tax ID. Internal actor,
reference, and operation IDs are not user-facing text and must not leak into
captured analytics. Loaded states need textual status and expiry, clear units,
readable store-local dates, focus visibility, and ≥44 px interactive targets.
Distinct loading, error/offline, permission-denied, no-store, empty-confirmed,
partial, and loaded states remain to be designed.

The full viewport and 500×1080 in-page documentation were visually reviewed.
All five cards have at least 15 px space below the last line, and the footer
fits within the viewport. The screen has 20 text nodes and documentation 10,
all Inter. Cogana color and text styles were reused. No clipping, overlaps,
fake inventory, active mutations, or shimmer placeholders remain. The
administrative header is still a shell proposal, not final navigation.

## Continuación visual en la hoja operativa

La página compartida `539:6` contiene Inventario `545:3`, Inventario parcial
`562:2` e Inventario vacío confirmado `562:3` en 393 × 852 pt. Comparten el
diseño fotográfico de Cogana y documentan fuera del lienzo la diferencia entre
producto visible, cantidad no confirmada y ausencia de existencias tras una
consulta completa. La foto es editorial; nunca prueba stock. Ajustar continúa
deshabilitado. Estas variantes son diseño en revisión, no lecturas reales ni
un reemplazo funcional de la especificación anterior.

## Estados de lectura del recorrido (fase 7.5)

En la misma hoja `539:6` se añadieron Inventario cargando `601:2` e
Inventario sin conexión `601:22`, ambas de 393×852 pt. Conservan el diseño
crema/verde, Fraunces/Inter y la foto editorial de abarrotes; el aviso
visible aclara que esa imagen no confirma existencias.

- Cargando consulta lotes, paquetes y reservas sin mostrar cantidades,
  disponibilidad ni alertas inventadas. No permite ajustes.
- Sin conexión no reutiliza números anteriores como stock vigente ni
  equivale a inventario vacío. «Reintentar» solo navega al estado Cargando
  dentro del prototipo; no ejecuta una consulta real.
- Una implementación necesita rol owner/admin activo en la tienda, lecturas
  completas y vigentes para calcular disponibilidad y un contrato autorizado
  de servidor antes de ofrecer cualquier ajuste.

Ambas se revisaron a tamaño iPhone 16 sin recorte visible. Sus tres enlaces
(dos «Volver» y un «Reintentar») apuntan a pantallas existentes, usan
disolución de 180 ms y tienen objetivos de al menos 44 pt. Continúan
pendientes los estados cargado, errores específicos, accesibilidad y datos
reales aprobados.
