# Cogana Order Adjustment Card

Figma component set: 200:50
Page: `23 · Order Adjustment Card` (199:2)
Documentation frame: 202:8

## Purpose

Customer-facing explanation of a payment adjustment after preparation changes
an order's final total. It compares estimated and final totals, names the
amount to collect or return, and shows an action only when the customer needs
to review an additional payment. This card does not itself charge or refund.

## Variants

- `State=Additional payment`: an additional-payment transaction is pending;
  shows an Accent badge, the amount due, and `Revisar ajuste`.
- `State=Refund pending`: a refund transaction is pending or processing;
  shows a Neutral badge and no payment action.
- `State=Resolved`: the relevant adjustment/refund transaction succeeded;
  shows a Brand badge and no payment action. Its example depicts an additional
  payment, but the actual final total and note must reflect the real operation.

The examples use S/ 42.50 estimated and S/ 4.20 difference. The refund example
has S/ 38.30 final; the other two show S/ 46.70 final. These are illustrative
values, never defaults to use as actual order data.

## Dimensions and dependencies

- Root: 360 px wide; 296 px high with the action, 236 px without it.
- Padding: `spacing/lg`; gap: `spacing/md`; border: `border/width/default`;
  radius: `radius/lg`.
- Difference panel: `color/bg/subtle`, `radius/md`, `spacing/md` padding.
- Button: `33:2`, Medium / Primary / Default, 48 px high.
- Badge: `59:63`, Small; Accent / Neutral / Brand by state.

## Properties

- Estimated total (`Estimated total#201:0`), shared by all states.
- Difference amount (`Difference amount#201:4`), absolute displayed amount.
- Show review action (`Show review action#201:8`, BOOLEAN), on Additional payment.
- Additional final total (`Additional final total#201:12`), reason
  (`Additional reason#201:16`) and note (`Additional note#201:36`).
- Refund final total (`Refund final total#201:20`), reason
  (`Refund reason#201:24`) and note (`Refund note#201:40`).
- Resolved final total (`Resolved final total#201:28`), reason
  (`Resolved reason#201:32`), note (`Resolved note#201:44`) and difference label
  (`Resolved difference label#205:0`). Use `Devolución completada` for a
  successful refund instead of the example's `Ajuste aplicado`.
- Separate editable accessibility labels for Additional payment (`#201:48`),
  Refund pending (`#201:52`) and Resolved (`#201:56`).

The final-total and explanatory defaults are separate per state so editing a
refund example cannot silently change an additional-payment example.

## Data and display rules

- `orders.estimated_total_cents` and `orders.final_total_cents` provide the two
  totals. Do not show the card until the final total exists.
- The payment difference is based on the actual net amount charged and
  refunded in `payment_transactions`, not simply final minus estimated total.
  Use the server-calculated operation amount (`amount_cents`) to display the
  pending charge or refund as a positive magnitude with a contextual label.
- `payment_transactions.transaction_type` (`adjustment` or `refund`) and
  `status` distinguish additional payment, refund pending and resolved.
- `orders.status = awaiting_adjustment` can accompany a positive difference;
  it is not the source for a pending refund and must not be assumed for one.
- Show `Revisar ajuste` only when an additional payment actually requires
  customer action. The button opens the appropriate payment flow; it does not
  confirm a charge merely by being tapped.
- If an operation fails or expires, the app needs a separate error/retry flow;
  do not present this card as `Resolved`.

## Accessibility and validation

- Status and amount are conveyed by text, not by color alone.
- The only action has a 48 px touch target.
- All three variants fit within the component set, and the sample totals and
  action visibility were visually checked.
- Surface, border, border width, spacing, radii and visible text colors use
  Cogana variables; no unbound visible fills or strokes were found.
