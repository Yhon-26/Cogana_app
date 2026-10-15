# Cogana Payment Method Selector

Figma component set: 151:86

## Purpose

Lets a customer choose a payment method during checkout without implying that
the payment has already been made or verified.

## Variants

- Configuration: Pickup Yape, Pickup Plin, Pickup Cash, Delivery Yape, Delivery Plin
- Total: 5 variants

Cash is selectable only for pickup. Delivery keeps it visible but disabled with
`Solo para recojo`. There is no invalid Delivery Cash variant. Card is not
presented until a payment provider is integrated.

## Dimensions

- Component: 360 x 272 px
- Each option: 360 x 72 px

## Properties

- Label (`Label#152:0`)
- Yape detail (`Yape detail#152:6`)
- Plin detail (`Plin detail#152:12`)
- Cash detail (`Cash detail#152:18`, pickup only)
- Accessibility label (`Accessibility label#152:24`)

The disabled cash explanation in delivery is not editable through the cash
detail property.

## Source of truth

Checkout supports `cash`, `yape`, `plin`, and `card` in its data model. The
current MVP only offers Yape and Plin for delivery; cash is pickup-only.
Store settings can disable each method, so the app must omit a disabled
method at runtime. Card remains hidden until its provider is configured.
Selection must not mark Yape or Plin as paid; their verification is a separate
step.

## Tokens and accessibility

Surface, subtle disabled background, brand/default borders, text colors,
spacing, and radii use Cogana variables. Visible text uses Inter. Each option
exceeds the 44 px touch minimum. Selected options have both a border and radio
dot; the unavailable cash option has explicit explanatory text. A full
accessibility label is editable for implementation.

## Validation

- Variant, token, typography, and touch-target audit: 0 issues.
- Visual review: 0 issues.
