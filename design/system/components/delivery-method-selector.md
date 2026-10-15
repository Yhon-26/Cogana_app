# Cogana Delivery Method Selector

Figma component set: 131:58

## Purpose

Reusable checkout selector for choosing between store pickup and home delivery.
It keeps unavailable methods visible and explains their status explicitly.

## Variants

- Configuration: Pickup selected, Delivery selected, Pickup only, Delivery only
- Total: 4 variants

The `only` configurations represent store settings where one fulfillment method
is unavailable. They avoid invalid combinations in which a disabled method is
also selected.

## Dimensions

- Component: 360 x 196 px
- Each option: 360 x 76 px

## Properties

- Label (`Label#131:0`)
- Pickup detail (`Pickup detail#131:5`)
- Delivery detail (`Delivery detail#131:10`)
- Accessibility label (`Accessibility label#131:15`)

Detail properties are linked only while their corresponding method is
available. The `No disponible` status is protected from accidental replacement.

## Dependencies

No nested component dependency is required. The radio indicator uses fixed
geometry and existing Cogana color, border, spacing, and radius variables.

## Tokens and typography

Surface, subtle background, brand/default borders, text colors, spacing, radii,
and stroke width are bound to Cogana variables. All visible text uses Inter.

## Accessibility

- Each selectable option is 76 px high and exceeds the 44 px touch minimum.
- Selection uses both a border and an interior radio dot, not color alone.
- Disabled methods show the literal text `No disponible`.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues.
- Typography audit: Inter only, 0 issues.
- Touch-target audit: 0 issues.
- Visual review after transparency correction: 0 issues.
