# Cogana Search / Input

Figma component set: 48:164

## Purpose

Shared mobile field family for product search and text entry. Both types use a
consistent 56 px control height, while labels, icons, and supporting messages
adapt to their role.

## Variants

- Type: Search, Text
- State: Empty, Filled, Focused, Error, Disabled
- Total: 10 variants

## Properties

- Label
- Search text
- Input text
- Helper
- Leading icon

## Accessibility

- Error states always include a supporting message.
- Disabled states reduce contrast but retain readable text.
- Search includes a leading icon and optional clear action.
- React Native implementations must provide labels and keyboard semantics.

Default borders use 1 px and focused or error states use 2 px. Every border
side is explicitly bound to the corresponding design token.
