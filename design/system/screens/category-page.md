# Cogana Category Page · Arroces

Figma page: `42 · Category Page` (`339:201`)  
Screen frame: `Category · Arroces · 360×844` (`339:202`)  
Context panel: `340:251`

## Purpose

Mobile customer catalog screen for browsing categories and viewing the products
in the selected category. This example opens `Arroces`; the Back action returns
to the previous catalog surface and Bottom Navigation marks `Categorías`.

## Composition

- Top App Bar, Standard (`340:3`): title `Arroces`, Back and Cart actions.
- Search Input, Search/Empty (`340:16`): entry to product search.
- Category rail (`340:36`): five existing Category Card instances in catalog
  sort order, with `Arroces` selected (`340:37`). It scrolls horizontally.
- Product list (`340:94`): two existing Product Card Grid/Available instances,
  `Arroz superior` (`340:95`) and `Arroz extra` (`340:173`). The page content
  scrolls vertically.
- Bottom Navigation, `Categorías` selected (`340:226`), outside the scrolling
  content.

The 360 × 844 viewport consists of a 64 px header, 700 px content viewport,
and 80 px bottom navigation. The screen and manual containers use Cogana color
and spacing variables; text uses named Cogana styles and Inter. Product and
category cards remain linked to their component sets.

## Sample data and production rules

All category counts, names, brands, presentations, and prices come from
`database/seeds/20260918_initial_catalog_snapshot.sql`. The selected category
contains two active products (not two presentations):

| Product | Brand | Presentation | Price |
| --- | --- | --- | ---: |
| Arroz superior | Costeño / Paisana | Bolsa 5 kg | S/ 19.50 |
| Arroz extra | Paisana | Bolsa 1 kg | S/ 4.20 |

The five rail counts are Arroces 2, Azúcares 2, Sal y condimentos 3, Aceites 1,
and Pastas 2. The category icons and rice media are provisional vectors, not
production photography. No promotion is shown because the seed includes no
active promotion. `Available` is an illustrative card state only: the catalog
seed creates no stock. Production availability must come from inventory, and
production price must come from the current catalog read model.

## Privacy, accessibility, and interaction boundaries

- Do not expose a customer name, exact address, order/payment details, internal
  IDs, or delivery data on this browsing screen.
- Category names and counts, product details, and navigation labels are visible;
  shared instances carry accessible labels. Back, Cart, search, card actions,
  and bottom navigation retain touch targets of at least 44 px.
- Back, search, category selection, favorite, Add, Cart, and bottom destinations
  are visual affordances. This Figma frame has no prototype wiring or connected
  transaction and does not confirm live stock, cart contents, or order state.
- Changing category must update title, selected card, count, and list together;
  filtering/sorting belongs to the next search-results screen, not this example.

## Validation

- Reused Cogana Top App Bar, Search Input, Category Card, Product Card, and
  Bottom Navigation instances; no new component variant was created.
- Scroll structure verified: content vertical, category rail horizontal, bottom
  navigation fixed outside content.
- Full-viewport screenshot checked after text sizing correction: no clipped or
  overlapping visible content, placeholder copy, or unexpected variant.
- Font-family audit: 29 rendered text nodes, Inter only, zero mismatches.
- The in-page context panel documents purpose, data, commercial rules, privacy,
  accessibility, and prototype boundaries.
