# Cogana Skeleton / Loading

Figma component set: `298:25`  
Page: `38 · Skeleton Loading` (`297:2`)  
Documentation frame: `298:768`

## Purpose

Static placeholders that preserve a content shape while its real data loads.

## Variants

- `Type=Text`: three text-line placeholders, 360 × 112 px.
- `Type=Product`: media, title, and price placeholders, 360 × 244 px.
- `Type=List Item`: thumbnail and three text lines, 360 × 96 px.

## Accessibility and motion

- Each variant exposes an independent accessible label beginning with “Cargando”.
- Remove the loading announcement when actual content is ready.
- The Figma component is static for reduced motion. Any implementation shimmer must follow the system motion preference.

## Boundaries

Skeletons communicate loading only. They must not imply confirmed price, availability, inventory, order, payment, or delivery data.

## Validation

The set contains three variants and three accessibility-label properties. Placeholder fills and corner radii are bound to Cogana variables. Visual review found no clipping or overlap.
