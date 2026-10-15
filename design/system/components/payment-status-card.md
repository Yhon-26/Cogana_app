# Cogana Payment Status Card

Figma component set: `226:11`  
Page: `26 · Payment Status Card` (`223:2`)  
Documentation frame: `223:3`

## Purpose

Customer-facing summary of the order's overall payment status. It shows the
payment method and a short explanation, but does not charge, refund, verify a
receipt, or retry an operation.

## Variants

The nine `Status` variants match the allowed values of
`orders.payment_status`:

| Variant | Visible label | Meaning |
| --- | --- | --- |
| `Pending` | Pendiente | Payment not yet confirmed; cash at pickup may remain pending. |
| `Requires action` | Acción pendiente | A payment step remains. |
| `Processing` | En proceso | Payment is being verified. |
| `Paid` | Pagado | Charge confirmed. |
| `Partially refunded` | Devolución parcial | Part of the collected amount was refunded. |
| `Refunded` | Devuelto | The collected amount was refunded. |
| `Failed` | Falló | Payment confirmation failed. |
| `Expired` | Vencido | Payment deadline expired. |
| `Cancelled` | Cancelado | Payment operation was cancelled. |

The sample method `Yape` is illustrative. A receipt attached through Payment
Evidence does not imply `Paid`; the server's order payment status is the source
of truth. The details and amounts of charge, adjustment, and refund operations
come from `payment_transactions`. Order Adjustment Card handles differences
after preparation; this card must not duplicate them.

## Backend boundary

`private.refresh_order_payment_status` currently derives `paid`,
`partially_refunded`, `refunded`, `requires_action`, `processing`, `failed`,
and `pending` from transactions. Reservation expiry explicitly sets an order
to `expired`. The refresh function does not currently map a transaction whose
status is `expired` or `cancelled` to the matching order-level value, even
though both are allowed in the schema. The UI should read `orders.payment_status`
and must not infer those states from an individual transaction. Reconcile
those backend transitions before relying on them in a production recovery
flow.

Failed or expired payments need a separately defined recovery flow, including
reservation and inventory behavior. This card intentionally has no retry
button. A cancelled payment is not necessarily the same as a cancelled order.

## Composition and properties

- Each card is 360 × 120 px. The component set is 1160 × 440 px, with nine
  variants in a three-column grid.
- Uses the existing small Badge (`59:63`) with Neutral, Accent, Brand, or
  Danger tone as appropriate. Long Badge labels were widened to fit.
- Surface, border, border width, spacing, radius, and visible text colors are
  bound to Cogana variables.
- `Payment method#226:0` is shared. Each variant has separate editable `note`
  and `accessibility label` properties.
- Status and explanation are textual; color is supplemental. No touch targets
  are present.

## Validation

The nine variants, their properties, Badge widths, and documentation frame
were inspected. No clipped Badge label, zero-size visible text, or unbound
card-level color/border width remained after correction.
