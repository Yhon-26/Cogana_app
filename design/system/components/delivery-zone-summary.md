# Cogana Delivery Zone Summary

Figma component set: 148:20

## Purpose

Shows the active delivery zone, its fee, estimated arrival range, and minimum
order. When the cart subtotal is below that minimum, it states the additional
amount required before checkout can continue.

## Variants

- State: Available, Below minimum
- Total: 2 variants

No out-of-coverage variant is included: Address Selector already handles that
condition. The summary appears only after a delivery address maps to an active
zone.

## Dimensions

- Available: 360 x 118 px
- Below minimum: 360 x 146 px

## Properties

- Zone name (`Zone name#148:0`)
- Delivery fee (`Delivery fee#148:3`)
- ETA (`ETA#148:6`)
- Minimum order (`Minimum order#148:9`)
- Restriction (`Restriction#148:12`)
- Minimum warning (`Minimum warning#148:15`)
- Accessibility label (`Accessibility label#148:18`)
- Show restriction (`Show restriction#148:21`)

The warning property applies only to Below minimum. Restriction visibility is
optional in either variant.

## Source of truth

`delivery_zones` supplies name, district, fee, minimum, ETA range, optional
restrictions, and active status. Checkout rejects inactive zones and orders
whose subtotal is below the zone minimum. The example values shown in Figma
are editable illustrations, not configured prices or business constants.

## Tokens and typography

Background, border, text colors, spacing, radii, and stroke width are bound to
Cogana variables. All visible text uses Inter.

## Accessibility

- The below-minimum state states the missing amount in words and currency,
  not by color alone.
- An editable full accessibility label is provided for implementation.
- This is informational and has no separate touch target.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues.
- Typography audit: Inter only, 0 issues.
- Visual review: 0 issues.
