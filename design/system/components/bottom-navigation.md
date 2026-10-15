# Cogana Bottom Navigation

Figma component set: `276:102`  
Page: `33 · Bottom Navigation` (`275:2`)  
Documentation frame: `276:845`

## Purpose

Persistent customer-area navigation for the core MVP routes. It identifies the current section and provides direct access to four client destinations.

## Variants

- `Selected=Inicio`
- `Selected=Categorías`
- `Selected=Carrito`
- `Selected=Cuenta`

Every variant is 360 × 80 px and contains Inicio, Categorías, Carrito, and Cuenta. The selected item uses the subtle surface and a stronger label weight.

## Composition and accessibility

- Every destination has a 76 × 56 px target, exceeding the 44 px minimum.
- Labels remain visible; simple line icons are supplementary.
- Each selected-state variant has an independent hidden accessibility label that describes the current destination and all available destinations.
- Use one instance per screen, anchored to the safe bottom edge.

## Boundaries

- Inicio and Categorías navigate to catalog surfaces.
- Carrito opens the existing cart; it does not run checkout or confirm an order.
- Cuenta opens the customer account area.
- This component must not initiate payment, cancellation, inventory changes, or any order-status transition. It contains no order, payment, or delivery data.

## Validation

Validation confirmed four variants, no clipping, and 76 × 56 px targets.
