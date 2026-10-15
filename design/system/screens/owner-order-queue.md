# Cogana Owner/Admin Order Queue — data-pending screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `387:2`; screen `387:3`;
in-page documentation `387:54`.

## Scope and visible state

The 360×844 Owner/Admin queue is a store-scoped, data-pending visual
specification. It has an administrative header proposal, Activos/Historial
filter chips, status groups, and a list placeholder. “Por cargar” is not a
zero count or confirmed empty queue. No customer record or order action is
shown; the selected Activos chip is visual and does not issue a query.

## Status mapping and ordering

Activos includes `pending_payment`, `queued`, `confirmed`, `preparing`,
`awaiting_adjustment`, `ready_for_pickup`, `ready_for_delivery`, and
`out_for_delivery`. Historial includes `completed` and `cancelled`. The
on-screen “Listos / reparto” summary groups three statuses, but a loaded
order row and detail must preserve the exact underlying status. Payment
pending must not be treated as ready to prepare. `orders.payment_status` is
separate from `orders.status`.

Future ordering needs an explicit rule using `preparation_not_before`,
`scheduled_for`, `created_at`, and store timezone; creation time alone is not
safe priority. Pagination, freshness, and live updates also need a contract.
`order_status_history` is the audit source, not a substitute for current
`orders.status`.

## Authorization and actions

Verify active owner/admin membership for the selected store. Current
`private.is_store_member`-based reads also admit drivers; they are not a
sufficient Owner/Admin page gate. A read failure, permission denial, and an
authorized confirmed-empty result must be distinct. Customer name and contact
should only appear in an authorized order detail. Status transitions must go
through an authorized transactional, idempotent operation, never a direct
client UPDATE.

## Accessibility and validation

Filter chips are 48 px high and must expose selected state and names to
assistive technology when wired. Future counts and status changes must be
textual, focusable where applicable, and announced without duplicate noise.

The full viewport and 500×1000 documentation were visually reviewed with no
clipping, overlap, fake records, or shimmer placeholders. The screen has 18
text nodes and documentation has 11, all Inter. Two Chip component instances
and design-system colors, radii, and text styles are reused. Loaded, empty,
partial, error/offline, and transition states remain unimplemented.

## Visual exploration — rejected as final UI reference

The shared Owner App Flow page `414:2` contains a new 360×844 queue example
`421:2` and adjacent documentation `423:4`. The original data-pending
screen above remains intact. The example explores search, Activos/Historial
filters, three sample order rows, and the common bottom navigation. The
order references and counts are clearly labelled simulated. They are not
actual records or an approved priority/order-status policy.

The Inicio tab `421:54` links back to Dashboard example `414:3` using a
short prototype dissolve. The in-page documentation covers role gate,
status/payment separation, data, privacy, states, accessibility, motion,
and handoff limitations. Screenshot review checked the full frame and
notes; the example has 28 Inter text nodes with no font mismatch. It is
discarded as a final UI reference, not an approved React Native export
target. The user judged the shared visual direction insufficient. Redesign
within the complete access-to-owner flow. Loaded, empty, partial,
error/offline, pagination, and real transitions remain open.

## Current high-fidelity flow — queue states

The newer shared Owner/Admin canvas is page `539:6`. Its illustrative queue
`540:68` remains separate from the state variants: loading `555:4`,
authorized confirmed empty `555:5`, offline `555:6`, partial read `610:2`,
consultation error `610:26`, stale data `613:2`, and no search matches
`613:26`. The newer states use the approved 393×852 cream/forest-green
Fraunces/Inter direction, with screen-only Figma frames;
this Markdown holds the behavioral context.

A partial read is **not** an empty queue and does not present incomplete
results as a complete working list. A consultation error makes no claim
that the device is offline, that there are zero orders, or that old cached
orders are current. Both variants block preparation, assignment, and order
status changes. Their 52 pt retry controls link to loading in the visual
prototype only; they do not initiate a live request. The 40-screen Owner/Admin
page currently has 66 valid prototype links, with no linked target under
44 pt. This is design in review, not approved React Native handoff.

Implementation still requires an active owner/admin gate scoped to the
selected store, a complete-vs-partial response contract, pagination,
freshness and retry behavior, and authorized transactional operations.

The stale-data screen hides the previous queue and blocks preparation and
assignment until a fresh authorized read; its retry link only previews the
loading screen. The no-match screen uses the illustrative query `EJ-0000`
under Activos. It is a search-specific result after a complete read, not
proof that this store has no orders or that Historial is empty. Its grain
photograph is editorial. Search, filters and pagination remain visual-only
until their contracts and authorized reads are implemented.
