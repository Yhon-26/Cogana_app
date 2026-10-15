# Cogana Product Card

Figma component set: 72:93

## Purpose

Reusable commerce card for browsing and searching the Cogana catalog. It
combines an interchangeable product image with brand, product name,
presentation, prices, availability, favorite, and purchase action.

The current rice product and prices are demonstration content from the
provisional catalog. Every commercial value is exposed as a component
property and must be populated from live catalog data in the application.

## Variants

- Layout: Grid, List
- State: Available, Unavailable
- Total: 4 variants

## Dimensions

- Grid: 320 x 410 px
- List: 680 x 240 px

## Properties

- Product name
- Brand
- Presentation
- Price
- Original price
- Accessibility label
- Show badge
- Show favorite
- Show original price
- Product image: instance swap restricted to Cogana product media

## Initial product media

- Rice
- Oil
- Milk

These vector placeholders are private supporting components. Production
screens may replace them with real catalog photography without changing the
Product Card API.

## Dependencies

- Badge: promotion and availability status
- Icon Button: favorite action
- Button: add-to-cart or unavailable action

## Usage

- Grid: home, category pages, recommendations, and compact product carousels.
- List: search results, substitutions, and dense catalog lists.
- Unavailable keeps product information and favorite available while disabling
  the purchase action.

## Accessibility

- A complete semantic label is available as an editable property.
- Availability is communicated with text, color, image treatment, and button
  state rather than color alone.
- Nested actions preserve their own accessibility labels and mobile touch
  targets.

## UI direction audit

The component was reviewed against the approved local-grocery commerce
direction after the UI Direction page was created.

- Product media occupies 53.7% of the Grid card height.
- The selling price uses a 28 px-high price treatment.
- Add uses the full content width and a 44 px touch target.
- Commercial hierarchy and accessibility passed with 0 issues.

No structural redesign is required. The remaining production change is to
replace provisional vector media with real catalog photography when real
screens and catalog data are introduced.
