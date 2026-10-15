# Cogana Product Detail Header

Figma component set: 185:36
Page: `21 · Product Detail Header` (177:676)
Documentation frame: 177:759

## Purpose

Header block for the product detail screen (PDP). It combines the gallery with
overlay actions (favorite, promotion badge, page indicator), brand, product
name, presentation, price and availability. It is composed with the request
mode selector and the quantity stepper on the product screen.

## Variants

- State: Available, Unavailable
- Total: 2 variants

## Dimensions

- Root: 360 x 602 px; the content region is 242 px high so the availability
  message is not clipped
- Media: 360 x 360 px, fill `color/bg/subtle`
- Product image: 300 x 300 px, `radius/xl`, centered
- Favorite: 44 x 44 px, `radius/full`
- Badge: HUG pill, 24 px high, `radius/full`

## Properties

- Product name (`Product name#185:0`)
- Brand (`Brand#185:1`)
- Presentation (`Presentation#185:2`)
- Price (`Price#185:3`)
- Original price (`Original price#185:4`)
- Show original price (`Show original price#185:5`, BOOLEAN)
- Stock message (`Stock message#185:6`)
- Show badge (`Show badge#185:7`, BOOLEAN)
- Badge label (`Badge label#185:8`)
- Show favorite (`Show favorite#185:9`, BOOLEAN)
- Show gallery dots (`Show gallery dots#185:10`, BOOLEAN)
- Product image (`Product image#185:11`, INSTANCE_SWAP)
- Accessibility label (`Accessibility label#185:12`)

Notes:
- `Stock message` drives the Available variant. The Unavailable variant renders a
  fixed "Agotado" so the unavailable state is explicit.
- The promotion badge is a local accent pill visually matching Badge /
  Tone=Accent / Size=Small.

## Dependencies

- Product media placeholders: `__Product Media/Rice` (68:2), `/Oil` (68:18),
  `/Milk` (68:26); swapped through the `Product image` property.
- Favorite glyph: `__Icon/Heart` (40:11).

## Tokens and typography

- Media: `color/bg/subtle`; image `radius/xl`.
- Surface actions over media: `color/bg/surface`, `radius/full`.
- Badge: fill `color/bg/accent`, text `color/text/primary`, `radius/full`.
- Brand, presentation, original price: `color/text/secondary`.
- Product name, price: `color/text/primary`.
- Available: `color/text/brand`. Unavailable price: `color/text/secondary`;
  message: `color/text/danger`.
- Dots: `color/bg/brand` (active) and `color/border/default`.
- Typography (Inter): `Heading/H2`, `Body/Medium`, `Body/Small`, `Price/Large`,
  `Label/Medium`.

## Source of truth (Supabase)

- `products`: `name`, `brand`, `category_id`, `description`.
- `product_presentations`: `name`, `kind`, `price_cents`, `minimum_quantity`,
  `is_active`.
- `product_images`: `storage_path`, `sort_order`, `alt_text` (gallery).
- `promotions` / `promotion_products`: offer badge.
- Availability from stock and active presentation.

## Composition

- Available: Oferta badge, favorite, dots, price with struck original, Disponible.
- Unavailable: secondary price and "Agotado"; the purchase action is disabled
  downstream.

## Accessibility

- The favorite is an action with its own 44 px touch target.
- Availability and offer are communicated with text, not color alone.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (fills, radii and text bound to variables).
- Typography audit: Inter only, named Cogana styles.
- Visual review: both variants reviewed after fixing the clipped stock message.
