# Cogana Cart Page

Figma page: `44 · Cart Page` (`348:344`)  
Empty screen: `Cart · Empty · 360×844` (`348:345`)  
Blocked sample screen: `Cart · Blocked sample · 360×844` (`348:346`)  
Context panel: `350:187`

## Purpose and states

The customer cart shows either a successfully loaded empty cart or its selected
items and a cart-level summary. Both 360 × 844 mobile frames use a 64 px
Standard Top App Bar, a 700 px content viewport, and an 80 px Bottom Navigation
with `Carrito` selected. These are design examples, not a read of any customer's
cart.

- Empty (`348:345`): the existing Cart Empty State instance (`349:41`) is
  centered in content. Its `Explorar productos` action is navigation only.
- Populated sample (`348:346`): one Cart Item instance (`349:100`) for two
  units of Arroz superior, an explicit `stock no verificado` notice (`350:190`),
  and a Cart Summary Blocked instance (`349:198`). The content can scroll on
  smaller viewports; Bottom Navigation remains outside the scroll area.

## Sample data and financial boundaries

`database/seeds/20260918_initial_catalog_snapshot.sql` provides the sample
product and presentation price but creates no customer cart or inventory:

| Product | Presentation | Quantity | Unit price | Subtotal |
| --- | --- | ---: | ---: | ---: |
| Arroz superior | Bolsa 5 kg | 2 | S/ 19.50 | S/ 39.00 |

No discount or active promotion is seeded, so the discount row is hidden. The
delivery amount is `Por definir` and the total is `Pendiente`; neither is
invented. The summary says `Falta validar stock y entrega.` and keeps `Ir a
pagar` disabled. Production checkout must validate current prices, stock,
fulfillment method, business hours/slot, delivery zone and cost, and any
promotion on the server before permitting payment. The rice image is a
provisional vector placeholder.

The Cart Item `Available` variant is illustrative, not evidence of actual
stock. The visible notice and blocked summary prevent treating this frame as
ready to purchase. A neutral `pending stock validation` Cart Item state is a
design-system gap for a future iteration; production must not present the
`Disponible` badge as authoritative before inventory validation.

## Empty, loading, and error semantics

Only show Empty State after a successful cart read confirms zero visible
items. Use the existing Skeleton/Loading or Error/Offline patterns while data
is pending or failed. Do not infer an empty cart from missing, delayed, or
unauthorized data.

## Privacy, accessibility, and interaction boundaries

- Do not expose customer identity, exact address, payment details, orders,
  delivery data, or internal identifiers on these examples.
- Product, presentation, quantity, unit price, subtotal, and blocked reason
  remain visible. Quantity, Remove, Empty State CTA, navigation, and checkout
  use component touch targets of at least 44 px.
- The Top App Bar's Cart icon is redundant on this route; implementation should
  treat it as the current destination or a no-op, never a transaction.
- Quantity, Remove, Explore, Cart, and checkout are visual affordances only in
  Figma. The frames do not mutate a cart, reserve stock, create an order, or
  initiate payment.

## Validation

- Reused Top App Bar, Bottom Navigation, Empty State, Cart Item, and Cart
  Summary instances; no new reusable component variant was created.
- Full-viewport screenshots checked for empty and populated states. A targeted
  post-fix screenshot confirmed the visible unverified-stock notice, pending
  total, and disabled checkout. No visible clipping or overlap remained.
- Font audit: 8 text nodes in Empty and 25 in Blocked sample; Inter only.
- In-page context documents purpose, data, stock and payment rules, privacy,
  accessibility, and prototype limits.
