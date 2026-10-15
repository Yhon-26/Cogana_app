# Cogana Order Cancelled Card

Figma component set: `256:46`  
Page: `29 · Order Cancelled Card` (`255:2`)  
Documentation frame: `257:744`

## Purpose

Customer-facing terminal summary for an order that has already been cancelled.
It communicates a safe cancellation reason, cancellation time, and the confirmed
refund state. It has no action: it cannot cancel an order, start or retry a
refund, or expose operational payment details.

## Variants

- `Refund=No refund`: no confirmed charge exists; for example, the payment
  deadline expired.
- `Refund=Refund pending`: a refund transaction is pending or processing.
- `Refund=Partially refunded`: `orders.payment_status = 'partially_refunded'`.
- `Refund=Refunded`: `orders.payment_status = 'refunded'`.

Each variant is 360 px wide. The no-refund variant is 200 px tall; the others
are 180 px tall. Badge `59:63` is always the small danger `Cancelado` badge.

## Data and display rules

- Render only when `orders.status = 'cancelled'`.
- Convert `orders.cancellation_reason_code` into approved customer copy. Do
  not render a raw internal code or `order_status_history.note`.
- Format `orders.cancelled_at` in the store timezone.
- Derive the refund state from `orders.payment_status`; use a refund
  `payment_transactions` record only to identify the pending/processing state.
- A cancelled order does **not** imply a refund. `private.transition_order`
  releases reservations but does not create one; never promise a refund or
  show an amount in this card.

## Composition and accessibility

- Uses Cogana surface, border, spacing, radius, and text-color variables.
- The refund state is written in text inside a subtle panel; color and Badge
  are supplementary.
- There are no touch targets. Hidden editable accessibility text supplies a
  complete label for each variant.
- Do not expose payment IDs, processor references, staff identities, or any
  free-form operational notes.

## Validation

The component set has four real variants in a two-column grid. Structural
checks confirmed all four variants, 21 component properties (including the
variant axis), hidden accessibility labels, a 360 px card width, and a
non-overlapping documentation frame. Visual review found no clipping.
