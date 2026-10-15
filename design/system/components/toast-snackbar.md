# Cogana Toast / Snackbar

Figma component set: `290:14`  
Page: `37 · Toast Snackbar` (`290:2`)  
Documentation frame: `290:757`

## Purpose

Brief, temporary feedback for interface information, local success, or an interface-loading error.

## Variants

- `Type=Informative`: neutral interface update.
- `Type=Success`: local cart feedback.
- `Type=Error`: interface-loading problem with an optional `Intentar` action.

Each variant is 328 × 64 px. The retry action is only for loading the interface.

## Boundaries

Do not use a toast as the source of truth for payment, refund, order, or delivery state. Do not retry payments or order mutations from this component.

## Validation

Visual review found three readable variants with no clipping or overlap.
