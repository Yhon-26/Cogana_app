# Cogana Top App Bar

Figma component set: `281:23`  
Page: `34 · Top App Bar` (`279:2`)  
Documentation frame: `281:24`

## Purpose

Customer-area header family. It provides screen context and visual navigation without exposing personal or transactional information.

## Variants

- `Context=Home` is 360 × 80 px. It includes the Cogana brand, generic local-commerce context, and a 44 px cart action.
- `Context=Standard` is 360 × 64 px. It includes a 44 px back action, a screen title, and a 44 px cart action.

## Composition and accessibility

- Compose `Context=Home` with the existing Search Input below it; search stays outside this family.
- Every action target is 44 × 44 px.
- Home exposes Brand, Context, and an accessibility label; Standard exposes Title and an accessibility label.
- Implementations must provide accessible names for the Back and Cart controls.

## Boundaries

- Only use brand, generic contextual copy, and a screen title.
- Do not show profile names, exact addresses, unapproved cart counts, order details, payment details, inventory, or delivery information.
- Cart only opens its screen. It must not start checkout, payment, cancellation, or order transitions.

## Validation

Validation confirmed two variants, five independent text properties, and no clipping or overlap.
