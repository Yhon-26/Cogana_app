# Cogana Account Deletion — request-unavailable screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `379:2`; screen `379:3`;
in-page documentation `379:57`.

## Purpose and visible state

Account > Privacy and account explains a future deletion-request flow. The
360×844 screen uses the Standard Top App Bar and Bottom Navigation with Cuenta
selected. It distinguishes submitting a request from actual account deletion,
shows request status as “Por cargar” rather than inventing a request or a
confirmed empty result, and disables “Solicitar eliminación.” No request is
sent from this design.

## Data and authorization

`account_deletion_requests` has `user_id`, `status` (`requested`, `prepared`,
`completed`, `failed`), timestamps, and `error_message`. Authenticated users
may SELECT and INSERT only their own requests under the current RLS policies;
they cannot UPDATE status. The table alone does not verify identity, process
deletion, define timing or retention, or delete `auth.users`. The future flow
must define those steps, prevent duplicate active requests, and confirm the
persisted result before showing “solicitud enviada.” Never equate `requested`
with `completed`.

The screen must not expose IDs, technical `error_message`, or another user's
records. Account-level authentication and a fresh identity check are required
before enabling a sensitive request action. The retention explanation and
user-facing terms must be approved before the action becomes available.

## States and accessibility

Current: unavailable action, status pending read. Future separate states:
authorized no-request result, pre-submit confirmation, submission pending,
requested, prepared, completed, failed, loading, and error/offline. A failed
read must not appear as “no request.” Convey each state with text, not color
alone. Future interactive controls need visible focus, accessible names, and
at least 44 px targets.

## Validation

The 360×844 screen and 460×900 documentation were visually checked. A warning
contrast issue was corrected by changing the danger card to the bound
`color/red/50` background. The final screen has no clipping, overlap, fake
account state, or leftover shimmer. Font audit: 15 screen text nodes and 9
documentation text nodes, all Inter. Existing shell and disabled Button
instances and design-system tokens are reused. This is a visual specification
only, not a live deletion flow.
