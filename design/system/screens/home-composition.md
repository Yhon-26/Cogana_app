# Cogana Home Composition

Figma page: `41 · Home Composition` (`332:2`)  
Screen frame: `Home · Inicio · 360×844` (`332:3`)  
Context panel: `336:201`

## Purpose

Customer landing screen for finding products, browsing categories, and reaching
the main customer destinations. The 360 × 844 frame models a mobile viewport.

## Composition

- Top App Bar, Home variant: `333:8` (`281:2`). It stays outside the scroll area
  and uses only the generic context “Compra cerca de ti”.
- Search Input, Search/Empty: `333:18` (`47:2`), at the top of the scroll area.
- Category heading and horizontal rail: `333:5`; five Category Card instances
  (`334:51`, `334:64`, `334:73`, `334:82`, `334:91`) in catalog sort order.
- Product shelf and horizontal rail: `333:6`; three Product Card instances
  (`335:95`, `335:173`, `335:217`).
- Bottom Navigation, Inicio selected: `333:31` (`276:2`), anchored below the
  vertical scroll area.

The content viewport is 360 × 684 px. Vertical page scrolling, the category
rail, and the product rail are separate. The Home frame uses `color/bg/canvas`;
manual section spacing and padding use Cogana layout variables. Existing
component instances retain their own variable bindings and styles.

## Sample data and production rules

Category names and counts, product labels, presentations, and prices come from
`database/seeds/20260918_initial_catalog_snapshot.sql`. Counts are active
product rows in that snapshot (not presentation counts): Arroces 2, Azúcares 2,
Sal y condimentos 3, Aceites 1, and Pastas 2. The displayed examples are arroz
superior (S/ 19.50), aceite vegetal (S/ 10.50), and leche evaporada (S/ 4.50).

Product imagery uses the private Rice, Oil, and Milk vector placeholders from
the Cogana Figma system. These are not production photography.

No promotion banner is shown: the catalog snapshot does not seed an active
promotion. Add Promotion Banner only when an active, in-date promotion and its
actual value are available. The Product Card `Available` state is illustrative;
the seed does not include stock. Production availability must come from the
inventory/read model, not from this screen or the catalog snapshot.

## Privacy, accessibility, and interaction boundaries

- Do not add a customer name, exact address, order details, payment details,
  internal IDs, or delivery data to the Home header.
- Navigation labels remain visible. The shared search, category, product,
  cart, and bottom-navigation components carry their accessible labels.
- Existing touch targets meet or exceed 44 px; product Add is 44 px and
  bottom-navigation destinations are 76 × 56 px.
- “Ver todas”, “Ver todos”, category/product navigation, favorites, and Add are
  visual affordances only. This frame has no prototype wiring or connected
  transaction. It must not be read as confirmation of cart, inventory, or
  order state.

## Validation

- Reused existing Cogana component instances; no new component variants.
- Viewport and scroll structure verified: header 80 px, content 684 px, bottom
  navigation 80 px; content scrolls vertically and both rails horizontally.
- Rendered text family audit: Inter only; 36 text nodes checked.
- Full composition screenshot checked for clipping, overlap, placeholder text,
  and component hierarchy. No visual issues found.
- Data-sensitive omissions (live promotion and authoritative stock) are called
  out in the context panel on the Figma page.
