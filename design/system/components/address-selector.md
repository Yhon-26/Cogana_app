# Cogana Address Selector

Figma component set: 140:41

## Purpose

Reusable checkout selector for adding, reviewing, or changing the address used
for delivery. It keeps the selected address visible when coverage fails.

## Variants

- State: Selected, Empty, Out of coverage
- Total: 3 variants

`Empty` starts the add-address flow. `Out of coverage` preserves the submitted
address, explains the problem, and directs the customer to change it.

## Dimensions

- Selected: 360 x 222 px
- Empty: 360 x 174 px
- Out of coverage: 360 x 298 px
- Action button: 328 x 44 px

## Properties

- Section label (`Section label#140:0`)
- Address label (`Address label#140:4`)
- Address line (`Address line#140:8`)
- District (`District#140:12`)
- Reference (`Reference#140:16`)
- Empty message (`Empty message#140:20`)
- Helper message (`Helper message#140:24`)
- Accessibility label (`Accessibility label#140:28`)
- Show default (`Show default#140:32`)
- Show reference (`Show reference#140:36`)

Address properties are exposed only in states containing an address. The
default marker and reference can be hidden independently.

## Dependencies

- Button component set: 33:2
- Badge component set: 59:63

The action uses Small / Secondary / Default Button. The default-address marker
uses Small / Neutral Badge with the fixed label `Principal`.

## Tokens and typography

Surface, alert background, borders, text colors, spacing, radii, and stroke
width are bound to Cogana variables. All visible text uses Inter.

## Accessibility

- The add/change action is 44 px high.
- Out-of-coverage status uses explicit text with inverse contrast on danger.
- The address stays readable when action is required.
- A complete editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues.
- Typography audit: Inter only, 0 issues.
- Dependency and touch-target audit: 0 issues.
- Contrast and wrapping review after correction: 0 issues.
