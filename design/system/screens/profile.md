# Cogana Profile

Figma page: `49 · Profile` (`362:2`)  
Guest screen: `Profile · Guest · 360×844` (`363:2`)  
Account data template: `Profile · Data template · 360×844` (`363:6`)  
Context panel: `363:10`

## Purpose and states

Profile is the customer account hub. It provides visual destinations for
orders, addresses, preferences, notifications, and privacy while preserving
guest shopping. Both frames use the Standard Top App Bar and Bottom Navigation
with `Cuenta` selected. They are design examples, not reads of a customer's
session.

- Guest: identifies the session as invited, shows no personal information or
  invented orders, and keeps `Vincular cuenta` disabled until an authorized
  account-linking flow exists. The menu is navigational only.
- Account data template: shows the structure for name, phone, and email using
  `por cargar`, not fictitious values or a confirmed empty result. `Editar
  datos` is disabled pending authorized data read and verified identity. The
  eventual loaded state must substitute real data after access checks.

## Data boundaries

- `profiles` holds global user-level `full_name` and `phone`; `customers`
  holds store-specific customer contact (`name`, `phone`, optional `email`,
  `phone_verified_at`). The UI must not silently merge or overwrite these
  sources; define precedence and sync explicitly during implementation.
- `customer_addresses` and `customer_preferences` are scoped to a customer
  and store. `Mis pedidos` must query only orders authorized to the current
  session. An anonymous session can lose cross-device recoverability until
  identity linking is implemented.
- The current schema has no saved payment-instrument table or provider vault.
  Profile therefore does not promise stored cards or payment-method management.
- `Privacidad y cuenta` is a destination for a future authorized deletion
  request flow using `account_deletion_requests`; it is not a direct delete
  action in this screen.

## Loading, privacy, and accessibility

- Show Skeleton while account/customer data is loading, and Error/Offline on
  failed reads. Never render `por cargar` as a confirmed missing value in
  production. Do not infer a zero-order or zero-address state from missing or
  unauthorized data.
- Do not expose real name, phone, email, exact address, tokens, user/customer
  IDs, or cross-store records in design examples or unauthenticated views.
- Communicate guest/template status in text, keep `Cuenta` selected visibly,
  provide focus and reader labels for routes, and maintain at least 44 px
  targets. Buttons are Figma affordances only; no route reads or writes data.

## Validation

- Reused Top App Bar, Bottom Navigation, and Button instances; menu actions
  are linked Ghost Button instances rather than duplicated hand-drawn rows.
- Guest and account full-screen screenshots and in-page context screenshot
  checked. No visible clipping, overlap, or shimmer placeholders.
- Font audit: 17 text nodes per screen, Inter only, zero mismatches.

The next account design area is address management; the loaded/editable profile
state remains contingent on a real account session and source-of-truth rules.
