# Cogana Order Actions

Figma component set: `261:30`  
Page: `31 · Order Actions` (`261:2`)  
Documentation frame: `264:2`

## Purpose

Contextual, read-only action bar for an existing customer order. Each action
opens a separate flow; this component never changes the order state itself.

## Variants

- `State=In progress`: `Ayuda` only.
- `State=Completed`: `Volver a pedir`, `Calificar`, and `Ayuda`.
- `State=Cancelled`: `Volver a pedir` and `Ayuda`.

All cards are 360 px wide. Actions are vertically stacked, full-width controls
with a 44 px minimum touch target. Their card heights are 134, 238, and 186 px
respectively.

## Boundaries

- `Cancelar` is intentionally omitted. It may be added only after there is an
  authorized, idempotent customer cancellation operation with an explicit
  eligibility window and refund policy.
- `Volver a pedir` starts a new cart from the current catalog and current
  prices; it must not reuse prior order prices, stock reservations, or payment
  state.
- `Calificar` is available only after `orders.status = 'completed'` and needs
  a dedicated reviews domain before it persists customer feedback.
- `Ayuda` hands off to the approved support flow. Do not expose private
  delivery evidence, payment references, staff data, or free-form internal
  notes.

## Validation

The component set contains the three real state variants. Visual review found
no truncation, clipping, or overlap; all available action labels are legible.
