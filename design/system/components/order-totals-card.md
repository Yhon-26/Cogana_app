# Cogana Order Totals Card

Figma component set: `260:43`  
Page: `30 · Order Totals Card` (`260:2`)  
Documentation frame: `260:44`

## Purpose

Read-only order-level breakdown. It is distinct from Cart Summary, which is
used before checkout and includes a CTA.

## Variants

- `Total=Estimated`: show the `estimated_*` amounts while all final totals are
  null.
- `Total=Final`: show `final_subtotal_cents`, `final_discount_cents`, and
  `final_total_cents` only once all are available. Delivery fee and delivery
  discount still come from `orders`.

Both variants are 360 × 276 px and show subtotal, product discount, delivery,
delivery discount, total, and a textual stage note.

## Boundaries

Payment Status Card owns the order payment state and Order Adjustment Card
owns preparation-time differences. Do not calculate net charged or refunded
amounts in the client from `payment_transactions`; a safe server aggregation
is required before adding those monetary fields.

## Validation

The two real variants are displayed in a two-column set. Visual review found
no clipping or overlap; totals and discounts remain textual and no touch
targets are present.
