# Cogana Category Card / Rail

Figma component set: 177:606
Page: `20 · Category Card/Rail` (177:571)
Documentation frame: 177:607

## Purpose

Atomic tile used to browse the catalog by category. Cards are stacked in a
horizontal rail on the home screen. The category comes from `categories` and the
count from active `products`.

## Variants

- State: Default, Selected
- Total: 2 variants

A rail is composed by placing several cards side by side (horizontal scroll).

## Dimensions

- Root: 104 px wide, height HUG, vertical auto-layout, gap `spacing/sm` (8 px)
- Media: 96 x 96 px, `radius/xl` (20 px), centered icon
- Icon: 24 x 24 px (`color/icon/brand`)
- Name: `Label/Large`, centered
- Count: `Body/Small`

## Properties

- Category name (`Category name#177:0`): tile label
- Count (`Count#177:3`): e.g. "24 productos"
- Show count (`Show count#177:6`, BOOLEAN): hides the count
- Category icon (`Category icon#177:9`, INSTANCE_SWAP): swaps the placeholder icon
- Accessibility label (`Accessibility label#177:12`)

## Tokens and typography

- Media default: fill `color/bg/subtle`, `radius/xl`.
- Media selected: fill `color/chip/brand-bg`, border `color/border/brand` 2 px.
- Name: `color/text/primary`; selected `color/text/brand`.
- Count: `color/text/secondary`.
- Icon: `color/icon/brand`.
- Typography: Inter only, styles `Label/Large` and `Body/Small`.

## Source of truth (Supabase)

- `categories`: `name`, `slug`, `sort_order`, `is_active`.
- Count derived from `products` grouped by `category_id` where `is_active = true`.
- `categories` has no image column. The media uses an icon placeholder; if a
  category image is introduced, replace the icon with an image keeping the same
  media slot.
- Generic category icon is a fallback; the rail swaps to a specific icon when
  available. Its accessible label must match the visible category and count.

## Composition example (rail)

1. Abarrotes - Selected
2. Bebidas
3. Limpieza
4. Frutas
5. Snacks

Card width 104 px, gap `spacing/md` (12 px); the rail scrolls horizontally.

## Accessibility

- The icon is decorative; the name and count provide the context.
- The full card is the touch target (min 44 px).
- A full editable accessibility label is exposed for implementation.

## Validation

- Variant and property audit: 0 issues.
- Token-binding audit: 0 issues (media fill/stroke, radii and text bound to variables).
- Typography audit: Inter only, named Cogana styles.
- Visual review: both 190 px variants fit within the component set, and rail
  labels and accessibility examples were checked.
