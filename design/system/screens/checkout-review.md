# Cogana Checkout Review

Figma page: `47 · Checkout Review` (`355:22`)  
Blocked sample screen: `Checkout Review · Blocked sample · 360×844` (`355:23`)  
Context panel: `355:27`

## Purpose and state

This is the final customer-facing review before creating an order. The screen
shows products, fulfillment, schedule, payment, and the estimated breakdown.
The current design is a blocked example, not a reachable or paid checkout.
`Confirmar pedido` is disabled; the view creates no order, reservation, or
payment.

The product sample comes from
`database/seeds/20260918_initial_catalog_snapshot.sql`: two bags of Arroz
superior 5 kg at S/ 19.50, giving an illustrative S/ 39.00 subtotal. The seed
does not contain a customer cart or authoritative inventory. The on-screen
`Stock sin verificar` label prevents treating the line as available.

## Data and confirmation rules

- Before confirmation, validate customer/contact data, current item prices
  and stock, selected pickup/delivery method, delivery zone and address when
  applicable, available schedule, allowed payment method, and final payable
  total on the server.
- Cash is pickup-only. Yape/Plin selection is not proof of payment. Card stays
  hidden until a provider is integrated.
- Delivery is `Por definir`; total is `Pendiente`. The coupon row says `No
  aplicado`, not zero savings. Current checkout does not process coupon codes
  or write `order_promotions`, so a client-side discount must not lower the
  payable amount.
- The checkout operation must be idempotent. Revalidate after any change in
  price, stock, cart, fulfillment, delivery zone, schedule, or coupon before
  creating an order or initiating a payment. Display the actual server result
  and recover safely from errors/offline without duplicate orders.
- The cart-level Cart Summary is not a substitute for this final review:
  payment/fulfillment details and the final confirmation action belong here.

## Privacy and accessibility

- The example contains no real customer identity, exact address, payment
  details, or internal identifiers. A production view should show the minimum
  details needed to confirm a delivery address without exposing them elsewhere.
- Every pending field has a text label. Announce changes to totals and reasons
  confirmation is blocked. The confirmation control is at least 44 px high,
  with visible focus in the implementation.
- Use Skeleton/Loading while validating and Error/Offline with safe retry on
  failure. Do not mistake missing data for a valid empty value.

## Validation

- Reused Standard Top App Bar and disabled Primary Button instances. Review
  cards use existing Cogana color, spacing, radius, and typography tokens.
- A full-screen screenshot revealed a clipped notice; a targeted compact-text
  adjustment was made, then the passing screenshot showed all content within
  the viewport. The context panel screenshot was also checked.
- Font audit: 29 screen text nodes, Inter only, zero mismatches; no leftover
  shimmer placeholders.

The ready/confirmed and error-result screens remain pending until there is a
real validated checkout contract and test data for the end-to-end flow.
