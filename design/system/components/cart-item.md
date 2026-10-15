# Cogana Cart Item

Figma component set: 116:474

## Purpose

Reusable customer-cart row that combines product identity, presentation, unit
price or promotion, quantity control, line subtotal, stock status, and a clear
remove action. It follows Cogana's functional-minimal grocery direction and is
designed for dynamic catalog and cart data.

## Variants

- State: Available, Low stock, Unavailable
- Total: 3 variants

Only one Default size is included. Cart Item is a customer-cart component, so
a second compact density would not have a distinct approved use case. The
component is 360 x 248 px in every state.

## Properties

- Product name (`Product name#117:0`)
- Presentation (`Presentation#117:4`)
- Price (`Price#117:8`)
- Original price (`Original price#117:12`)
- Subtotal (`Subtotal#117:16`)
- Stock message (`Stock message#117:20`)
- Accessibility label (`Accessibility label#117:24`)
- Show original price (`Show original price#117:28`)
- Product media (`Product media#117:32`)

Promotion is controlled by `Show original price`; it is intentionally not a
variant axis. Product media is restricted to the same Rice, Oil, and Milk
placeholder components used by Product Card. The optional stock message is
empty by default and accepts dynamic detail such as a remaining-unit count.

## State behavior

- Available uses the Brand badge and an enabled Quantity Stepper.
- Low stock uses the Accent badge with the fixed label `Stock bajo`; the
  optional stock message may provide the dynamic remaining quantity.
- Unavailable uses the Danger badge, disables Quantity Stepper, and applies
  the shared disabled-opacity token to product media. Removal remains enabled.

Badge communicates the fixed availability state visibly. It prevents the
editable stock-detail property from creating an incorrect shared default
across variants.

## Dependencies

- Quantity Stepper component set: 82:103
- Button component set: 33:2
- Badge component set: 59:63
- Product media: Rice 68:2, Oil 68:18, Milk 68:26

The remove action uses a Small Ghost Button labeled `Eliminar` rather than an
ambiguous close icon. Its 44 px height meets the minimum mobile touch target.

## Tokens and typography

The shell fill, border, border widths, padding, gaps, and radii are bound to
Cogana variables. All text uses Inter through existing Cogana text styles.
Nested Button, Badge, and Quantity Stepper instances retain their validated
token bindings.

## Accessibility

- Quantity Stepper is 162 x 56 px with 48 px nested controls.
- Remove is 120 x 44 px.
- Availability is communicated with explicit text, tone, and control state,
  not color alone.
- Unavailable preserves the remove action so the user can always clean the
  cart.
- A complete editable accessibility label is available for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues.
- Typography audit: Inter only, 0 issues.
- Touch-target audit: 0 issues.
- Visual review: 0 issues after correcting state messaging with Badge.
