# Cogana Coupon

Figma page: `46 · Coupon` (`353:14`)  
Screen: `Coupon · Not yet available · 360×844` (`353:15`)  
Context panel: `353:19`

## Scope and current state

The screen reserves a place to enter a coupon during checkout. It shows the
current truthful state: no coupon or discount applied. The Text Input and
`Aplicar cupón` button are disabled, with an explanatory notice. No example
code, active promotion, or savings amount is fabricated.

This is a visual pending state, not a complete functional coupon flow.

## Data and implementation boundary

- `promotions` is the source of coupon code, promotion type and value,
  eligibility, validity window, usage limits, and stacking rules.
- `promotion_products` scopes product eligibility. The meaning and units of
  `promotions.value` for each type require an explicit backend contract.
- `order_promotions` is the resulting order-level/item-level discount record
  with name and coupon snapshots; it is not a code lookup or validation API.
- Current `create_checkout_order` accepts no coupon in its payload, writes
  `estimated_discount_cents = 0` and `delivery_discount_cents = 0`, and
  computes the total without promotions. It does not insert `order_promotions`.
  Therefore the UI must not claim a coupon was accepted or lower the payable
  total.
- Before enabling the field/action, implement server-side eligibility,
  exclusive/stacking rules, usage-limit enforcement, authoritative pricing,
  transactional discount recording, and final total/payment reconciliation.
  A changed cart, fulfillment method, or delivery zone must trigger
  revalidation. A client-only discount preview is not payment authority.

Future states: empty, editing, validating, invalid/ineligible, applied, and
removed. Only a server-confirmed result may show a concrete benefit. The
catalog seed has no active promotion to use as a real example.

## Privacy and accessibility

- Do not expose private coupon codes, customer-specific limits, or internal
  promotion IDs in public messages.
- Keep a visible input label, field-associated and announced validation
  errors, visible focus, and targets of at least 44 px. Do not communicate
  status by color alone.

## Validation

- Reused Standard Top App Bar, Text Input (Disabled), and Primary Button
  (Disabled) instances. Remaining surfaces use Cogana tokens and text styles.
- Full-screen and in-page context screenshots checked; no visible clipping,
  overlap, or leftover shimmer placeholders.
- Font audit: 11 screen text nodes, Inter only, zero mismatches.
