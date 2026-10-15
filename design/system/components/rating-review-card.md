# Cogana Rating / Review Card

Figma component set: `268:24`  
Page: `32 · Rating Review Card` (`267:2`)  
Documentation frame: `268:25`

## Purpose

Customer-facing post-order rating flow. It represents the entry point, score
selection, and confirmed submission for a completed order. It does not itself
store or transmit feedback.

## Variants

- `State=Prompt`: invites the customer to rate a completed order.
- `State=Form`: shows an accessible five-star text score and a visual submit
  control.
- `State=Submitted`: confirms that a future reviews service has successfully
  recorded the feedback.

All variants are 360 px wide. Prompt and Form include a 44 px action control;
Submitted is informational only.

## Editable properties

Every state has independent title, message, and hidden accessibility-label
properties. Form and Submitted have separate score properties; Prompt and
Form have separate action-label properties. This preserves distinct content
per state when designers edit an instance.

## Boundaries

- Render the entry only after `orders.status = 'completed'`.
- Until a dedicated reviews domain exists, the form and submit control are
  representational only: do not persist a score, display a success state, or
  infer that a customer has rated an order.
- Show `Submitted` only after the future server-side service confirms a
  successful, idempotent review write.
- Do not capture or expose delivery evidence, staff identities, payment
  references, or internal operational notes.

## Accessibility

- The visual star score is accompanied by a hidden textual accessibility label.
- Future selection, validation, and submission errors must be communicated in
  text, not only through star color or icon state.
- Interactive controls are at least 44 px high.

## Validation

The component set contains three state variants and thirteen independent text
properties plus the State axis. Visual review found no clipping, overlap, or
truncated labels.
