# Cogana Search Results

Figma page: `43 · Search Results` (`344:29`)  
Suggestions screen: `Search · Suggestions · 360×844` (`344:30`)  
Results screen: `Search · Results · 360×844` (`344:31`)  
Filter and sort examples: `344:32`  
Context panel: `346:232`

## Purpose and states

The mobile catalog search shows suggestions while the user types and a product
list after the query is submitted. This page documents the `arro` suggestion
state, the `arroz` results state, and the category-filter and sort-selection
bottom sheets. The two screens reuse a 64 px Standard Top App Bar, a 700 px
vertical content viewport, and an 80 px Bottom Navigation with `Categorías`
selected.

## Composition

- Suggestions (`344:30`): Focused Search Input (`345:16`), two Assist Chip
  suggestions (`345:62`, `345:76`), and guidance to select a product or finish
  the query. Suggestions are derived from active catalog product names; no
  personal search history is displayed.
- Results (`344:31`): Filled Search Input (`345:100`), the explicit result
  count, selected `Arroces` filter Chip (`345:146`), `Menor precio` sort Chip
  (`345:160`), and two Product Card Grid instances (`345:175`, `345:253`).
  The result list scrolls vertically, with navigation fixed below it.
- Selection examples (`344:32`): Bottom Sheet Selection instances for category
  (`345:307`) and sort (`345:318`). The selected choice is written explicitly
  in the visible label, as well as in each sheet's accessibility label.

The existing Product Card List variant is 680 px wide; this 360 px mobile view
uses the existing 320 px Grid variant instead of squeezing a desktop-sized
instance. A mobile List variant would require a separate responsive design.

## Data and behavior contract

The demonstration uses `database/seeds/20260918_initial_catalog_snapshot.sql`.
The prefix `arro` suggests `Arroz superior` and `Arroz extra`. Query `arroz`
with category `Arroces` returns two active products. The selected ascending
price order is verifiable against the displayed presentations:

| Order | Product | Presentation | Price |
| ---: | --- | --- | ---: |
| 1 | Arroz extra | Bolsa 1 kg | S/ 4.20 |
| 2 | Arroz superior | Bolsa 5 kg | S/ 19.50 |

The category sheet offers `Arroces` (current) or `Todas las categorías`; the
sort sheet offers `Menor precio` (current) or `Nombre: A–Z`. Recalculate the
result count after filtering and sort by the current price of the displayed
presentation. Do not claim relevance ranking without an implemented ranking
rule. The count is for products, not presentations. An empty result should use
the existing Empty State pattern.

The catalog seed does not create inventory or active promotions. The
`Available` Product Card state is a visual example only; production availability
must come from inventory. Rice imagery is provisional vector media, not
production photography.

## Privacy, accessibility, and prototype limits

- Do not expose customer identity, search history, exact address, orders,
  payments, delivery data, or internal identifiers in these views.
- Search, chips, product actions, back/cart, and navigation require accessible
  names and mobile touch targets of at least 44 px. Selected filter and sort
  choices must be conveyed in text, not color alone.
- In implementation, move focus into an open bottom sheet and restore it to
  the triggering control on dismissal. Use an appropriate search keyboard and
  announce changed result counts.
- The Figma controls are visual affordances, not a connected search, filter,
  cart, inventory, or ordering workflow. The two selection sheets are examples
  beside the screens rather than prototype-wired overlays.

## Validation

- Reused existing Top App Bar, Search Input, Chip, Product Card, Bottom
  Navigation, and Bottom Sheet instances; no new component variant was made.
- Full composition screenshots checked for both mobile states and the two
  selection examples. A targeted post-fix check verified explicit selected
  labels in both sheets. No visible clipping or overlap remained.
- Typography audit: 10 text nodes in Suggestions, 19 in Results, and 11 in
  Filter/Sort; Inter only, zero font-family mismatches.
- In-page context documents purpose, states, sample data, commercial rules,
  privacy, accessibility, and prototype boundaries.
