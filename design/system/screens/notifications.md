# Cogana Notifications — unavailable screen validated

Figma file: `PMCmmZNLY9A8kqcG7IVsHA`; page `377:2`; screen `377:3`;
in-page documentation `377:53`.

## Purpose and visible state

Account > Notifications uses the 360×844 customer shell with the Standard Top
App Bar and Cuenta selected in Bottom Navigation. It is an informational
*function unavailable* state, not an empty inbox or a read of customer data.
It explains that order progress is available in each authorized order detail
and that Preferences will show notification choices only after authorized
loading. There is no unread badge, fictitious message, delivery promise, or
active permission request.

## Data boundary

The current schema has `customer_preferences.order_notifications` and
`promotion_notifications`, but no customer notification table, inbox
history, `read_at`, delivery channel, or customer delivery event record.
Preferences are not evidence that an inbox exists or that any message has
been delivered. The future inbox needs a data and access contract, including
customer/store isolation and authorized reads, before a loaded or confirmed
empty state can be designed as real behavior.

## States and accessibility

Current state: unavailable. Future states require separate definitions for
loading, authorized list, confirmed empty, detail, read/unread, error/offline,
and notification delivery preferences. A failed read must never appear as
“no notifications.” Text conveys the state without color alone. Future
interactive rows and actions should have at least 44 px targets, visible
focus, and reader labels.

## Validation

The 360×844 screen and 460×900 in-page documentation were reviewed visually:
no clipping, overlap, fake data, or shimmer placeholders. The screen has 14
text nodes and documentation has 9; all use Inter. Existing Top App Bar and
Bottom Navigation component instances and design-system tokens are reused.
This is a visual specification only, not an implementation of messaging.
