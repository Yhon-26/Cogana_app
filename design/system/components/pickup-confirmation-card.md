# Cogana Pickup Confirmation Card

Figma component set: `237:289`  
Page: `28 · Pickup Confirmation Card`

## Purpose

Customer-facing confirmation shown only after a store team member completes a
pickup. It records the completed state and the verified pickup condition; it
does not expose a pickup code, its hash, an owner workflow, or an action to
retry the operation.

## Variants

- `Payment=Confirmed` (`237:288`): use after a non-cash pickup is completed.
  The customer-facing payment state is already confirmed.
- `Payment=Cash` (`237:290`): use after the cash charge has been recorded as
  part of the completed pickup operation.

Both variants are 360 × 176 px and are presented side by side in the library.
Their visible sample time is illustrative. The editable text layers are
`Title`, `Pickup time`, `Verification`, `Payment`, `Confirmation note`, and
`Accessibility label`. At implementation
time, use them as explicit content inputs; do not replace an absent value with
invented customer or staff data.

## Data and display rules

| Display | Source / condition |
| --- | --- |
| Completion gate | `orders.fulfillment_type = 'pickup'` and `orders.status = 'completed'` |
| Pickup time | `orders.completed_at`, in the store timezone |
| Verification text | `order_status_history.reason_code = 'pickup_code_verified'`; render only “Código verificado” |
| Confirmed payment variant | `orders.payment_method != 'cash'` and `orders.payment_status = 'paid'` |
| Cash variant | `orders.payment_method = 'cash'` and the completed pickup operation has recorded its charge as succeeded |

Never render `pickup_confirmation_code_hash`, the raw confirmation code, an
operation id, payment transaction ids, or a staff member name. The card must
not appear while a pickup remains `ready_for_pickup`, when payment is not
settled, or when the order is cancelled.

## Composition and accessibility

- The existing Brand / Small Badge (`59:63`) is reused with the visible state
  “Completada”. There is no action target.
- Surface, border, border width, spacing, radius, and visible text colors stay
  bound to the Cogana variables retained from the validated status-card family.
- Completion is expressed in title, timestamp, verification copy, and note;
  the green badge is not the sole state signal.
- Accessible name should summarize the completed pickup, local timestamp,
  verified-code status, and applicable payment state without announcing the
  code itself.

## Validation and security follow-up

The component set has two real Figma variants, `Payment=Confirmed` and
`Payment=Cash`, laid out as a 360 px card grid. Titles, pickup labels, and the
two completion notes were visually checked on the component set.

`private.complete_pickup` correctly validates a code hash server-side,
requires `ready_for_pickup`, records cash at completion, and ends the order as
`completed`. The schema nevertheless stores `pickup_confirmation_code_hash` on
`orders`; before production, ensure every customer-facing orders projection or
Data API grant excludes that column. This design task changes no database
permissions.
