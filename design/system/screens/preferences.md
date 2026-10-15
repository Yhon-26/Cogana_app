# Cogana Preferences — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `372:36`; screen `372:37`;
in-page documentation `372:38`.

## Scope and visible state

Account > Preferences uses the existing 360×844 shell: Standard Top App Bar,
700 px content, and Bottom Navigation with Cuenta selected. The screen is a
data-pending template, not a loaded customer record. It groups order notices,
promotion notices, marketing consent, and the usual substitution choice. Each
value says “Por cargar”; no switch is selected and Save is disabled. The
screen does not imply that a notification channel or marketing consent has
already been implemented.

## Data and authorization

`customer_preferences` is keyed by `(store_id, customer_id)` with fields
`order_notifications`, `promotion_notifications`, `marketing_consent`, and
`substitution_default` (`allow_similar`, `contact`, `remove`). Schema defaults
are `true`, `false`, `false`, and `contact`, respectively. They are not evidence
of a customer's saved values. A missing row after a successful authorized read
may be shown as an *unsaved* starting point, not as a persisted record.

The schema grants owner/staff SELECT and owner INSERT/UPDATE through RLS; no
customer DELETE policy exists. Store and customer identity must come from the
verified session. Marketing consent must be an explicit separate action,
never inferred from promotion notices. An individual order may override the
usual substitution choice. Notification channel, consent evidence/version,
legal copy, and read/write integration must be defined before the editable
state is enabled.

## Accessibility and validation

The in-page documentation records purpose, states, data, privacy, and
accessibility. Labels and descriptions must remain explicit, with at least
44 px interaction targets when controls are enabled. Saving must show pending,
success, and error feedback after confirmed persistence, not optimism.

The 360×844 screen and 460×900 documentation frames were visually reviewed:
no overlap, clipping, fake customer values, or placeholder artifacts. Figma
audit found 19 screen text nodes and 9 documentation text nodes, all Inter.
Design-system color/radius bindings and existing shell instances are used.
Only the data-pending visual state is validated; loaded, editable, skeleton,
error, and offline states remain to be implemented and verified.
