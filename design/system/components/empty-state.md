# Cogana Empty State

Figma component set: `304:42`  
Page: `39 · Empty State` (`301:2`)  
Documentation frame: `307:11`

## Purpose

Customer-facing state for a successfully loaded surface with no content. It
keeps the explanation brief and offers one navigation action to continue.

## Variants

- `Context=Cart` (`304:2`): “Tu carrito está vacío” → `Explorar productos`.
- `Context=Search` (`304:17`): “Sin resultados” → `Ver categorías`.
- `Context=Orders` (`304:29`): “Aún no tienes pedidos” → `Explorar productos`.

The title, message, and accessibility label are fixed per variant. Only the
`Context` variant property is exposed. This avoids shared text-property defaults
crossing over when the context changes.

## Dimensions and dependencies

- Each variant: 360 × 320 px.
- Primary action: 328 × 44 px.
- Button dependency: Button set `33:2`, `Size=Small / Style=Primary / State=Default`
  (`32:2`).
- Documentation frame: 500 × 481 px.

## Tokens

Surface, illustration fills, text, border, padding, gap, and radii use Cogana
variables. Outer spacing binds to `spacing/lg` (16 px) and `spacing/sm` (8 px);
illustration radii bind to `radius/md`.

## Accessibility

Each variant contains a hidden `Accessibility label` text layer with a complete
spoken summary. This is implementation guidance only: the app must expose the
label through its native accessibility semantics, preserve reading order and
contrast, and make the action reachable with a 44 px minimum target.

## Behavior boundaries

Render only after the relevant cart, order-list, or search request succeeds and
confirms zero visible results. Do not use this component for loading, errors,
offline state, or incomplete data. The CTA performs navigation only; it does
not create, cancel, pay, repeat, or confirm an order.

## Validation

- Three context variants and one `Context` variant property.
- Metadata and final screenshots reviewed; copy and CTA match each context.
- No visible clipping or overlap; all component-owned solid fills and layout
  spacing are token-bound.
- Validation issues: 0.
