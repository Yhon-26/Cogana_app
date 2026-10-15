# Cogana Substitution Card

Figma component set: 168:369
Page: `17 · Substitution Card` (168:374)
Documentation frame: 168:370

## Purpose

Customer-facing card that shows the replacement proposed when an ordered item is
not available, and lets the shopper accept or reject it. It reuses the validated
Button, Badge and product media components and reflects the state stored in
`order_substitutions`.

## Variants

- State: Pending, Accepted, Rejected, Expired
- Total: 4 variants

Only Pending exposes the `Rechazar` / `Aceptar` actions. Accepted, Rejected and
Expired replace the actions with a status note and use a distinct Badge tone.

## Dimensions

- Root: 360 px wide, HUG height (254 px in Pending)
- Padding: `spacing/lg` (16 px), gap `spacing/md` (12 px), radius `radius/lg`
- Replacement media: 88 x 88 px, `radius/md`
- Actions: two buttons sharing the width, each 48 px high

## Properties

- Original item (`Original item#168:26`): `En lugar de: <producto> · <presentación>`
- Product name (`Product name#168:31`): replacement product
- Presentation (`Presentation#168:36`): replacement presentation
- Price difference (`Price difference#168:41`): signed difference text
- Accepted note (`Accepted note#183:0`), Rejected note
  (`Rejected note#183:5`) and Expired note (`Expired note#183:10`): independent
  explanations, so editing one state cannot overwrite the others
- Accessibility label (`Accessibility label#168:51`)

Badge tone and label are fixed per variant (`Pendiente` / `Aceptada` /
`Rechazada` / `Expirada`) and are not exposed as properties.

## Source of truth (Supabase)

- `order_substitutions.status`: `pending`, `auto_accepted`, `accepted`,
  `rejected`, `expired`.
  - `pending` maps to the Pending variant.
  - `accepted` and `auto_accepted` map to Accepted (Brand).
  - `rejected` maps to Rejected (Danger).
  - `expired` maps to Expired (Neutral).
- `price_difference_cents` defines the sign and the emphasis of the amount.
  A positive difference uses `color/text/accent`; a negative one should use
  `color/text/brand`; zero stays neutral.
- `proposed_quantity` and `proposed_line_cents` inform the product name and
  difference text.
- `expires_at` feeds an expiry warning in the Pending variant.

## Dependencies

- Button component set: 33:2 (Medium Primary `32:38`, Medium Ghost `32:62`)
- Badge component set: 59:63 (Accent `59:57`, Brand `59:53`, Danger `59:61`,
  Neutral `59:49`)
- Product media: Rice `68:2` (swap for the real replacement photo)

## Tokens and typography

Surface `color/bg/surface`, border `color/border/default`, radii `radius/lg` and
`radius/md`, text colors `color/text/primary`, `color/text/secondary` and
`color/text/accent`. Typography uses Inter through named Cogana styles
(`Label/Medium`, `Label/Large`, `Body/Medium`, `Body/Small`).

## Accessibility

- Action buttons are 48 px high and exceed the 44 px mobile touch minimum.
- State is communicated by fixed badge text plus tone, never by color alone.
- Decided variants always include an explicit status note.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (surface, border and radii bound to variables).
- Typography audit: Inter only, named Cogana styles.
- Touch-target audit: 0 issues.
- Visual review: all four variants fit within the component set; decided-state
  notes were checked independently.
