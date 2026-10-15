# Cogana Owner/Admin Dashboard — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `383:2`; screen `383:3`;
in-page documentation `383:29`.

## Scope and visible state

The 360×844 administrative Dashboard is a first visual proposal, separate
from the customer app shell. It shows a proposed Owner/Admin header and four
areas with data pending: authorized store context, operational state, orders
to attend, payments to review, and inventory to review. It contains no
invented counts, store name, status, or active operational controls. The
administrative shell and navigation are not yet finalized as reusable
components.

## Data and authorization

Candidate sources are `store_memberships`, `stores`,
`store_operational_state`, `orders`, `payment_transactions`, and
`inventory_lots`. Active owner/admin membership must be verified for the
selected store before loading or aggregating. Current RLS read policies based
on `private.is_store_member` may also admit `driver`; they are not by
themselves an Owner/Admin dashboard gate. The display must not mix stores or
expose customer details in aggregate cards. `payment_events` is server-only,
not a direct client source.

Counts need agreed definitions for included statuses, time window, store
timezone, freshness, and partial-read behavior. A failed read or unauthorized
store must not show zero. Operational state must be refreshed before any
future action to change it.

## States and accessibility

Current: data pending. Future: no authorized store, loaded selected store,
loading, partial data, permission denied, and error/offline. Convey state and
period in text; avoid color-only signals. Future actions need visible focus,
accessible names, at least 44 px targets, and considerate live updates.

## Validation

The full mobile viewport and 500×1000 in-page documentation were visually
reviewed: no clipping, overlap, fake metrics, or shimmer placeholders. The
screen has 18 text nodes and documentation has 11, all Inter. Design-system
colors, radii, and text styles are used. This is a visual template, not a
live dashboard or a validated metric implementation.

## Visual exploration — rejected as final UI reference

The shared Owner App Flow page `414:2` contains a new 360×844 Dashboard
example `414:3` and adjacent documentation `419:2`. The original data-pending
screen above remains intact. The example explores a compact green header,
store context, operational summary, priority cards, quick links, and bottom
navigation. All counts, currency amounts, store names, and order references
are visibly labelled simulated; they are not product or backend truth.

The Pedidos tab `416:54` links to the queue example `421:2` using a short
prototype dissolve. The in-page documentation captures purpose, data,
authorization, privacy, states still needed, accessibility, motion, and
handoff limitations. Screenshot review checked the full frame and notes;
the example has 30 Inter text nodes with no font mismatch. This is a
discarded visual exploration, not an approved dashboard, a design-system
reference, or a React Native export target. The user judged its visual
quality insufficient. Redesign within the complete access-to-owner flow;
metric contracts, real states, and actions remain open.

## Estados del recorrido Owner/Admin de alta fidelidad (fase 7.5)

La página compartida `539:6` usa como referencia visual el Panel `540:35` y
añade Panel cargando `604:2` y Panel sin conexión `604:37`, ambos de
393×852 pt. Conservan la identidad crema/verde, Fraunces/Inter y la foto
editorial de abarrotes; el contexto se documenta aquí, no en el lienzo.

- Cargando reemplaza las cifras 12 y 3 por guiones; estado operativo y
  prioridad permanecen en consulta. No confirma cero pedidos ni cero pagos.
- Sin conexión no muestra cifras o pedidos anteriores como actuales. El
  enlace «Reintentar» lleva solo a Cargando en el prototipo; no ejecuta una
  lectura. La navegación inferior sirve únicamente para revisar el flujo.
- El nombre Santa Anita y la fotografía son de ejemplo, no prueba de
  membresía, operación activa ni stock. La implementación requiere rol
  owner/admin activo de esa tienda y contratos de estados, periodo, zona
  horaria, frescura y lecturas parciales antes de calcular métricas.

Se revisaron ambas pantallas a tamaño iPhone 16 sin recortes. Los cinco
enlaces nuevos apuntan a destinos existentes, usan disolución de 180 ms y
tienen objetivos de al menos 44 pt. Faltan datos reales, acciones,
accesibilidad y variantes de lectura parcial/error específico.
