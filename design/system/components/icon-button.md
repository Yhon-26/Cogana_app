# Cogana Icon Button

Figma component set: 41:137

## Purpose

Compact mobile actions such as search, cart, favorite, and close. Every use
must include an accessibility label in the React Native implementation.

## Variants

- Size: Small, Medium, Large
- Style: Surface, Tonal, Ghost
- State: Default, Pressed, Disabled
- Total: 27 variants

## Dimensions

- Small: 44 x 44 px
- Medium: 48 x 48 px
- Large: 56 x 56 px

## Properties

- Icon: instance swap restricted to Cogana icons
- Accessibility label: semantic text for implementation handoff

## Initial icon set

- Search
- Cart
- Heart
- Close
- Minus
- Plus

Minus and Plus were added as private supporting icons for Quantity Stepper.
They remain available through the Icon instance-swap property so the stepper
reuses the same visual and accessibility behavior as every other icon action.

Enabled and disabled opacity values are stored as Figma percentage tokens:
100 and 38 respectively.
