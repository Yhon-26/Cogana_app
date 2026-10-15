# Cogana Order Item Result Card

Figma component set: `213:111`  
Page: `24 · Order Item Result Card` (`213:2`)  
Documentation frame: `213:112`

## Purpose

Customer-facing item result in the order detail. It compares the estimated
quantity and net line amount with the prepared quantity and final net line
amount after preparation. It is informative and has no payment action.

## Variants

- `State=Estimated` (`213:3`): preparation has not produced final item values.
- `State=Prepared` (`213:35`): final values exist and `prepared_quantity > 0`.
- `State=Not prepared` (`213:73`): final values exist and
  `prepared_quantity = 0`; displays final net amount `S/ 0.00`.

Zero prepared quantity does not encode a reason. Do not label it as out of
stock, removed, rejected, or canceled without an explicit source. The sample
product and amounts in Figma are illustrative, not application defaults.

## Data mapping

| Display | Source |
| --- | --- |
| Product name | `order_items.product_name_snapshot` |
| Presentation | `order_items.presentation_name_snapshot` |
| Estimated quantity | `order_items.estimated_quantity` |
| Prepared quantity | `order_items.prepared_quantity` |
| Estimated amount | `estimated_line_cents - estimated_discount_cents` |
| Final amount | `final_line_cents - final_discount_cents` |

Amounts are net item amounts in cents, formatted as currency for display. The
quantity formatter uses `base_unit_snapshot` (`gram`, `milliliter`, or `unit`)
and may express 1,000 grams as 1 kg. Do not show a final-state variant while
`prepared_quantity` or `final_line_cents` is null. If a substitution is
accepted, the current order-item snapshot is shown here; the substitution
decision belongs in Substitution Card.

## Composition and properties

- Width: 360 px. Estimated height: 194 px. Final-state height: 250 px.
- Surface, border, radius, padding, spacing, and visible text colors use
  Cogana variables. Product Media (`68:2`) and Badge (`59:63`) are reused.
- Editable text properties: product name, presentation, estimated quantity,
  estimated amount, state-specific prepared quantity, final amount, status
  note, and accessibility label.
- The three status labels are visible as text, not color alone. Accessibility
  labels are separate and editable for each state.

## Validation

All three variants and the documentation frame were inspected. The set is
1160 × 250 px with no overlapping variants or clipped visible text. The only
unbound solid fills found were internal layers of the reused Product Media
illustration, not newly drawn card layers.
