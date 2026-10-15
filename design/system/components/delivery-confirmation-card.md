# Cogana Delivery Confirmation Card

Figma component set: `230:774`  
Page: `27 · Delivery Confirmation Card` (`230:2`)  
Documentation frame: `230:3`

## Purpose

Customer-facing confirmation after a delivery has been completed. It shows
the time and confirmation method, with an optional recipient name. It is not
used for delivery in progress, a failed attempt, or live tracking.

## Variants

- `Verification=Code` (`230:6`): delivery was completed with a verified code.
- `Verification=Evidence` (`230:757`): delivery evidence was recorded. If both
  code and evidence were supplied, use this variant because the completion
  event records `evidence_recorded`.

Both variants are 360 × 176 px. The sample date and recipient name in Figma
are illustrative. `Show recipient` hides the row when no recipient name was
recorded; never substitute a made-up name.

## Data and display rules

| Display | Source |
| --- | --- |
| Completion gate | `delivery_assignments.status = 'delivered'` and `orders.status = 'completed'` |
| Delivery time | `delivery_assignments.delivered_at` |
| Recipient | `delivery_assignments.recipient_name` (optional) |
| Confirmation type | Completion `delivery_events.note` (`code_verified` or `evidence_recorded`) |

Format `delivered_at` in the store's timezone. Do not render this card if
delivery status and order status disagree; that requires reconciliation.

The `delivery-evidence` bucket is private. This card never displays
`evidence_storage_path`, an image, or a direct file URL. Future viewing of a
proof must use a short-lived signed URL from an authorized server flow.

## Composition and properties

- Existing Brand / Small Badge (`59:63`) is reused. No action target exists.
- Surface, border, border width, spacing, radius, and visible text colors are
  bound to Cogana variables.
- Shared properties: `Delivered at#231:0`, `Recipient name#231:3`, and
  `Show recipient#231:6` (BOOLEAN).
- Each variant has its own note and accessibility-label properties (`Code
  note#231:9`, `Code accessibility label#231:12`, `Evidence note#231:15`,
  `Evidence accessibility label#231:18`).
- Completion and verification are expressed by text, not color alone.

## Validation and security follow-up

The two variants, optional-recipient binding, documentation, layout bounds,
and visual tokens were checked with no design issues.

The current schema grants authenticated users table-level SELECT on
`delivery_assignments` and an RLS policy allows the order requester to read
their assignment row. This exposes the row's `confirmation_code_hash` and
`evidence_storage_path` via the Data API, even though the evidence file itself
is private. Before production, restrict the customer-visible projection or
column grants so the client receives only necessary display fields. This
design change does not modify database permissions.
