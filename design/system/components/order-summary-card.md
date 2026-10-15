# Cogana Order Summary Card

Figma component set: 177:905
Page: `22 · Order Summary Card` (177:764)
Documentation frame: 177:906

## Purpose

Order row for the customer order history and order detail. It consolidates the
order number, status, date, fulfillment type, product thumbnails, item count and
total. The whole card is the touch target that opens the order detail.

## Variants

- State: In progress, Completed, Cancelled
- Total: 3 variants

The status maps to the ten `orders.status` values, grouped here into three
badge tones. The card's non-terminal label is deliberately generic; the order
detail and timeline show the exact status.

## Dimensions

- Root: 360 px wide, height HUG, padding 16, gap 12
- Thumbnails: 44 x 44 px, `radius/md`; extra tile 44 x 44 px
- Status badge: Badge Small (24 px high)

## Properties

- Order number (`Order number#177:54`)
- Meta (`Meta#177:58`): date and fulfillment
- Item count (`Item count#177:62`)
- Total (`Total#177:66`)
- Extra count (`Extra count#177:70`): e.g. "+2"
- Show extra (`Show extra#177:74`, BOOLEAN)
- Thumbnail 1 (`Thumbnail 1#177:78`, INSTANCE_SWAP)
- Thumbnail 2 (`Thumbnail 2#177:82`, INSTANCE_SWAP)
- Thumbnail 3 (`Thumbnail 3#177:86`, INSTANCE_SWAP)
- Accessibility label (`Accessibility label#177:90`)

## Dependency

- Badge component set (59:63). In progress uses Tone=Brand, Completed uses
  Tone=Neutral and Cancelled uses Tone=Danger, all Size=Small. The badge label is
  the nested Badge instance label.
- Product media placeholders (68:2 / 68:18 / 68:26) via the Thumbnail properties.

## Tokens and typography

- Surface: `color/bg/surface` with `color/border/default` 1 px, `radius/lg`.
- Divider: `color/border/default`.
- Thumbnails: `radius/md`; extra tile `color/bg/subtle`.
- Order number and total: `color/text/primary`.
- Meta, item count and extra count: `color/text/secondary`.
- Typography (Inter): `Label/Large`, `Body/Small`, `Body/Medium`, `Price/Medium`.

## Source of truth (Supabase)

- `orders`: `order_number`, `status`, `fulfillment_type`, `created_at`,
  `estimated_total_cents` / `final_total_cents`.
- `order_items`: `product_name_snapshot`, `estimated_quantity` for thumbnails and
  count.
- `product_images`: first image per `product_id` for thumbnails.

## Composition

- In progress: Brand badge "En curso".
- Completed: Neutral badge "Completado".
- Cancelled: Danger badge "Cancelado".
- `+N` appears when there are more than three products, controlled by Show extra.

## Accessibility

- The whole card is tappable (min 44 px) and announces number, total and status.
- Status is not color-only; the badge carries text.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (surface, border, divider, radii and text bound).
- Typography audit: Inter only, named Cogana styles.
- Visual review: all three variants checked after removing redundant white
  fills and correcting the non-terminal badge.
