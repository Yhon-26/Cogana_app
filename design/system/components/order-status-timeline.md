# Cogana Order Status Timeline

Figma component set: 173:440
Page: `19 · Order Status Timeline` (170:417)
Documentation frame: 173:441

## Purpose

Reusable step used to build the order tracking timeline. One step is stacked per
milestone; the current state comes from `orders.status` and the sequence from
`order_status_history`.

## Variants

- State: Completed, Current, Upcoming, Cancelled
- Total: 4 variants

A full timeline is composed by stacking several steps. The final step is drawn
with `Show connector = false`.

## Dimensions

- Root: 360 x 64 px, gap `spacing/md` (12 px)
- Rail: 20 px wide; Dot 20 x 20 px, `radius/full`; Connector 2 x 44 px
- Content: title (`Label/Large`) + meta (`Body/Small`)

## Properties

- Title (`Title#173:86`): milestone name
- Meta (`Meta#173:90`): time or detail
- Show connector (`Show connector#173:94`, BOOLEAN): hides the connector line
- Accessibility label (`Accessibility label#173:98`)
- Cancelled title (`Cancelled title#184:34`) and Cancelled meta
  (`Cancelled meta#184:39`): terminal-state text

## Composition example (pickup)

1. Pedido creado - Completed
2. Confirmado - Completed
3. En preparación - Current
4. Listo para recojo - Upcoming
5. Completado - Upcoming, Show connector = false

Delivery inserts `Listo para delivery` and `En camino` before `Entregado`.
Show `Pago confirmado` only after the payment actually clears; a cash-at-pickup
order can remain `pending_payment` until pickup. A cancelled order ends with
the Cancelled variant and no connector.

## Source of truth (Supabase)

- `orders.status`: `pending_payment`, `queued`, `confirmed`, `preparing`,
  `awaiting_adjustment`, `ready_for_pickup`, `ready_for_delivery`,
  `out_for_delivery`, `completed`, `cancelled`.
- `order_status_history`: chronological steps with `from_status`, `to_status`,
  `reason_code`, `note` and `created_at`.
- `Meta` can show `created_at`, `updated_at` or the reason.
- `cancelled` is a terminal state; render it as a distinct step rather than a
  normal milestone.

## Tokens and typography

- Completed: dot and connector `color/bg/brand`.
- Current: dot `color/bg/surface` with `color/border/brand` 2 px ring;
  connector `color/border/default`.
- Upcoming: dot `color/bg/subtle`; connector `color/border/default`.
- Cancelled: dot `color/bg/danger`, title `color/text/danger`; no connector.
- Text colors `color/text/primary` (Completed/Current) and
  `color/text/secondary` (Upcoming). All text is Inter.

## Accessibility

- State is communicated by the title plus a distinct dot treatment, not color
  alone.
- The connector is decorative and hidden from semantics.
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (dot, connector, radii bound to variables).
- Typography audit: Inter only, named Cogana styles.
- Visual review: all four variants fit within the component set.
