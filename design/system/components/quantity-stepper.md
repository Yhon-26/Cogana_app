# Cogana Quantity Stepper

Figma component set: 82:103

## Purpose

Reusable mobile control for changing a product quantity in product detail and
cart experiences. It keeps both actions visible at minimum and maximum limits,
making the current constraint understandable without changing the layout.

## Variants

- Size: Compact, Default
- State: Default, Minimum, Maximum, Disabled
- Total: 8 variants

## Dimensions

- Compact: 146 x 52 px; nested touch targets are 44 x 44 px.
- Default: 162 x 56 px; nested touch targets are 48 x 48 px.

Widths are driven by tokenized auto layout and may grow if the quantity string
requires more room in a future localized implementation.

## Properties

- Quantity (`Quantity#82:0`): editable text with a default value of 1.

The decrease and increase accessibility labels are fixed internally as
`Disminuir cantidad` and `Aumentar cantidad` so consumers cannot accidentally
remove their semantic meaning.

## State behavior

- Default: both actions are enabled.
- Minimum: decrease is disabled and increase remains enabled.
- Maximum: increase is disabled and decrease remains enabled.
- Disabled: both actions and the quantity value use disabled styling.

## Dependencies

- Icon Button component set: 41:137
- Private Minus icon: 80:4
- Private Plus icon: 80:7

## Tokens

Every fill, stroke, spacing, corner radius, and border width is explicitly
bound to the Cogana variable system. No local color or spacing values are used
by the component shell.

## Accessibility

- Compact meets the 44 px minimum mobile touch target.
- Default provides 48 px touch targets for primary commerce flows.
- Limits are communicated by visible disabled controls, not by color alone.
- The quantity remains visible and centered in every state.

## Validation

- Variant and property audit: 0 issues.
- Accessibility-label and touch-target audit: 0 issues.
- Token-binding audit: 0 issues.
