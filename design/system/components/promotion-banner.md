# Cogana Promotion Banner

Figma component set: 169:412
Page: `18 · Promotion Banner` (169:375)
Documentation frame: 169:413

## Purpose

Communicates a published promotion and its benefit on the home and catalog
screens. The type and value come from the `promotions` table so the banner never
invents discounts.

## Variants

- Type: Percentage, Fixed amount, Fixed price, Quantity price, Free delivery
- Total: 5 variants

Variants provide example values in the accent pill (`−20%`, `− S/ 5`,
`S/ 9.90`, `3 x S/ 5`, `Gratis`). These are editable per type and must be
replaced with the promotion's actual benefit. Title, description and condition
are shared properties.

## Dimensions

- Root: 360 px wide, HUG height (96 px), radius `radius/lg`
- Padding: `spacing/lg` (16 px), gap `spacing/md` (12 px)
- Value pill: 40 px high, `radius/full`, padding `spacing/sm` / `spacing/md`

## Properties

- Title (`Title#169:56`): promotion headline
- Description (`Description#169:62`): short benefit
- Condition (`Condition#169:68`): minimum, coupon or validity note
- Show condition (`Show condition#169:80`, BOOLEAN): hides the condition line
- Accessibility label (`Accessibility label#169:74`)

- Percentage value (`Percentage value#184:0`)
- Fixed amount value (`Fixed amount value#184:6`)
- Fixed price value (`Fixed price value#184:12`)
- Quantity price value (`Quantity price value#184:18`)
- Free delivery value (`Free delivery value#184:24`)

The benefit formatter must use the promotion type and its actual data. The
schema alone does not fully define the units of `promotions.value` for every
type; confirm that contract before implementing formatting.

## Source of truth (Supabase)

- `promotions.promotion_type`: `percentage`, `fixed_amount`, `fixed_price`,
  `quantity_price`, `free_delivery` — one variant each.
- `promotions.value`: percentage value, fixed amount, fixed price or quantity
  price rendered in the pill.
- `promotions.minimum_order_cents` and `minimum_quantity`: feed `Condition`.
- `promotions.starts_at` / `ends_at`: validity; `is_active` and `is_stackable`
  control publication.
- `promotions.coupon_code`: shown in `Condition` when present.

Only active promotions within their date range should be rendered.

## Tokens and typography

Surface `color/chip/accent-bg`, radius `radius/lg`, pill fill `color/bg/accent`
with `color/text/inverse`. Text uses `Label/Large`, `Body/Small` and `Caption`
with `color/text/primary`, `color/text/secondary` and `color/text/accent`. All
text is Inter.

## Accessibility

- The banner is informational and has no separate touch target.
- Benefit is communicated with text inside the pill, not by color alone.
- The condition line can be hidden but never left empty when shown.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (surface, pill, radius bound to variables).
- Typography audit: Inter only, named Cogana styles.
- Visual review: all five variants fit within the component set.
