# Cogana Request Mode Selector

Figma component set: 167:208
Page: `16 · Request Mode Selector` (167:175)
Documentation frame: 167:209

## Purpose

Customer control that lets a shopper choose how to buy a product presentation:
by quantity, by money amount, or as an eligible presentation. It is the UI entry
point for Cogana's non-unit selling model and keeps the three request modes of
the database visible as one control.

## Variants

- Mode: Quantity selected, Money selected, Presentation selected
- Total: 3 variants

Each variant highlights the active segment with the brand fill, brand border,
inverse text and Semi Bold weight. The other two segments remain in the default
surface style so the control never hides an available alternative.

## Dimensions

- Root: 360 x 98 px (HUG height)
- Segments row: 360 x 48 px
- Each segment: 120 x 48 px, `radius/full`
- Segment internal padding: `spacing/sm` (8 px) horizontal
- Gaps: `spacing/sm` (8 px) between label, segments and helper; `spacing/xs`
  (4 px) between segments

## Properties

- Label (`Label#167:2`): section title, default `¿Cómo quieres comprar?`
- Helper (`Helper#167:6`): supporting line, default `Elige cómo quieres comprar.`
- Show quantity (`Show quantity#167:14`, BOOLEAN): hides the quantity segment
- Show money (`Show money#167:18`, BOOLEAN): hides the money segment
- Show presentation (`Show presentation#167:22`, BOOLEAN): hides the presentation segment
- Accessibility label (`Accessibility label#167:10`): full semantic label

Segment labels are fixed as `Cantidad`, `Monto` and `Presentación` because they
map one-to-one to `order_items.request_mode`. They are not editable content.

## Source of truth (Supabase)

The selector mirrors `product_presentations` and `order_items`:

- `quantity` corresponds to `allows_quantity_input = true`
  (`order_items.request_mode = 'quantity'`).
- `money` corresponds to `allows_money_input = true` and
  `price_mode = 'proportional'` (`order_items.request_mode = 'money'`).
- `presentation` corresponds to a presentation offered as a fixed unit or pack
  (`order_items.request_mode = 'presentation'`). Its availability must follow
  the presentation's selling rules; `is_sealed` is a separate attribute, not
  a substitute for the request mode.

The app must hide a mode the presentation does not offer using the
`Show quantity`, `Show money` and `Show presentation` boolean properties.
`money` is invalid for `price_mode = 'fixed'`. A fixed-price presentation
must not expose money entry; quantity entry follows its own explicit flag.

## Tokens and typography

Every fill, border, radius, gap and text color is bound to Cogana variables:

- Selected: `color/bg/brand` fill, `color/border/brand` border,
  `color/text/inverse` text, style `Label/Large`.
- Default: `color/bg/surface` fill, `color/border/default` border,
  `color/text/primary` text, style `Body/Medium`.
- Section label: style `Label/Medium`, `color/text/secondary`.
- Helper: style `Body/Small`, `color/text/secondary`.
- Radii: `radius/full`. Strokes: `border/width/default` (1 px).
- Font family is Inter for all visible text.

## Accessibility

- Every segment is 48 px high and exceeds the 44 px mobile touch minimum.
- Selection is communicated by fill, border, text color and weight, not color
  alone.
- Hiding a segment never leaves an empty control: at least one mode must remain
  visible.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (colors, radius, strokes bound to variables).
- Typography audit: Inter only, named Cogana styles.
- Touch-target audit: 0 issues.
- Visual review: all three variants fit within the component set.
