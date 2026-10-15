# Cogana Cart Summary

Figma component set: 122:467

## Purpose

Reusable customer-cart summary that consolidates subtotal, optional discount,
delivery cost, total, and the single primary action for checkout.

## Variants

- State: Ready, Blocked
- Total: 2 variants

Ready permits checkout. Blocked keeps every amount visible, explains what must
be corrected, and disables the action without hiding it.

## Dimensions

- Ready: 360 x 282 px
- Blocked: 360 x 316 px

The difference is caused by the visible helper message in Blocked.

## Properties

- Subtotal (`Subtotal#122:0`)
- Discount (`Discount#122:3`)
- Delivery (`Delivery#122:6`)
- Total (`Total#122:9`)
- Helper message (`Helper message#122:12`)
- Accessibility label (`Accessibility label#122:15`)
- Show discount (`Show discount#122:18`)

Discount visibility is controlled by a Boolean property instead of a variant
axis. Delivery accepts values such as `Gratis`, a monetary amount, or a pickup
label without changing the component structure.

## Dependency

- Button component set: 33:2

The checkout action reuses Medium · Primary Button. Ready uses Default and
Blocked uses Disabled. Its visible label is fixed as `Ir a pagar`.

## Tokens and typography

The shell, border, border widths, padding, gaps, radius, and divider are bound
to Cogana variables. All component text uses Inter through the existing Cogana
text styles.

## Accessibility

- Checkout is 318 x 48 px and exceeds the 44 px minimum touch target.
- Blocked communicates its condition with explanatory text and the disabled
  control, not color alone.
- Amounts remain readable in every state.
- An editable full-summary accessibility label is provided for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues.
- Typography audit: Inter only, 0 issues.
- CTA state and touch-target audit: 0 issues.
- Visual review: 0 issues.
