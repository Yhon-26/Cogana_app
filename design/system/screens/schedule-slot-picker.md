# Cogana Schedule & Slot Picker

Figma page: `45 · Schedule & Slot Picker` (`351:139`)  
Pending screen: `Schedule · Availability pending · 360×844` (`351:140`)  
Context panel: `351:144`

Continuación de alta fidelidad en el recorrido cliente: `625:39`, marco
393 × 852 pt. La tarjeta de horario en Datos de entrega (`503:37`) enlaza
este concepto y la flecha vuelve a `500:8`. La fecha y franja visibles son
**ejemplos rotulados**, no cupos disponibles ni una reserva; las tarjetas no
seleccionan y el CTA continúa deshabilitado. Esta composición no sustituye
el contrato de disponibilidad ni valida el estado listo/seleccionado.

## Scope

This is the initial, blocked state of the pickup/delivery schedule flow. The
screen has method, date, and slot sections, but shows no allegedly available
dates or times. `Continuar` remains disabled. The prior Cart Page example is
also checkout-blocked, so no cart or fulfillment method is presumed here.

This is not a complete ready/selected-state design. That state remains pending
until the product has a real availability contract and store schedule data.

## Data and interaction contract

- Read `stores.timezone` to interpret dates in the store's local time zone
  (`America/Lima` is the schema default, not an assumption for every store).
- Read `store_business_hours` for each weekday and apply
  `store_schedule_exceptions` for an overridden local date. A closed day offers
  no slots.
- A chosen fulfillment method and store must be known before querying dates.
  Actual availability must also account for operational state and capacity;
  business hours alone do not guarantee a reservable slot.
- Changing method, store, or date clears any prior slot selection. Only a
  server-returned valid selection can enable `Continuar`.
- Persist the selected instant as `orders.scheduled_for` (`timestamptz`) only
  through the authorized checkout flow. Revalidate availability during order
  confirmation, including conflicts or capacity changes.
- Handle loading, no slots, error/offline, and ready states. In no-slots state,
  explain why and offer another date. Do not render an empty list while a read
  is still loading or failed.

No seed in `database/seeds` configures business hours or schedule exceptions.
No sample time has therefore been represented as available. The Figma view is
visual only: it does not query data, reserve a slot, or create an order.

## Accessibility and privacy

- Date and slot choices in the future ready state need full spoken labels,
  visible focus and selection beyond color, minimum 44 px targets, and
  announcements when availability changes.
- A disabled action must state which prerequisite remains unmet. Do not expose
  exact address, customer identity, payment data, or internal identifiers.

## Validation

- Reused Standard Top App Bar and disabled Primary Button instances. The
  remaining containers use Cogana color, radius, spacing, and text tokens.
- Full-screen and context-panel screenshots checked; no visible clipping or
  overlap. No shimmer placeholders remain.
- Screen font audit: 15 text nodes, Inter only, zero mismatches.
- The Figma context panel documents purpose, data, rules, states, privacy,
  accessibility, and prototype limits.
