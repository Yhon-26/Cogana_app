# Cogana Fulfillment Details Card

Figma component set: `219:24`  
Page: `25 · Fulfillment Details Card` (`218:2`)  
Documentation frame: `218:3`

## Purpose

Customer-facing location and timing information in the order detail. This
card complements, but does not duplicate, Order Status Timeline. It does not
navigate, call, track a driver, or perform fulfillment actions.

## Variants

- `Method=Pickup` (`218:6`): store name and address, plus the requested or
  estimated pickup time.
- `Method=Delivery` (`219:10`): formatted delivery address from the order and
  the requested delivery time when one exists.

Both variants are 360 × 248 px. The Figma addresses and times are illustrative
examples, not production defaults or promised service times.

## Data and display rules

| Display | Source |
| --- | --- |
| Method | `orders.fulfillment_type` |
| Pickup store | `stores.name` |
| Pickup address | `stores.address` |
| Delivery address | `orders.delivery_address` |
| Requested time | `orders.scheduled_for` |
| Estimated pickup readiness | `orders.estimated_ready_at` |

The schema requires `delivery_address` to be a JSON object for delivery but
does not guarantee its internal keys. The application must format only fields
it actually has. If a store address is absent, show `Dirección por confirmar`.
If no applicable time is available, show `Horario por confirmar`. An
`estimated_ready_at` value is an estimate, not a guarantee. Format dates and
times in the store's `timezone` (currently defaulting to `America/Lima`).

The card must not imply that an order status has advanced; Order Status
Timeline remains the source for milestones. Do not show a driver identity,
live position, or a notification promise without a separate supported flow.

## Composition and properties

- Uses `color/bg/surface`, `color/bg/subtle`, `color/border/default`, semantic
  text colors, `spacing/md`, `spacing/lg`, `radius/md`, and `radius/lg`.
- Editable per-method properties: location name, location address, time label,
  time value, time note, and accessibility label.
- Method names and location labels are fixed in each variant. No controls are
  inside the card.
- Status, location, and time are expressed in text rather than color alone.

## Validation

The two variants and documentation were inspected. The component set is
760 × 248 px with a 40 px gap; the documentation frame ends 80 px above it.
No visible text had zero dimensions and no unbound visible fill, stroke, or
text color was found in the card.
