# Cogana Payment Methods

Figma page: `51 · Payment Methods` (`368:36`)  
Information screen: `368:37`  
Context panel: `368:38`

## Purpose and scope

This Account destination explains how payment is chosen per order. It is not a
wallet, a customer-specific list, or the checkout selector. The 360×844 screen
reuses the Standard Top App Bar and Bottom Navigation with Cuenta selected.
It is a design example; it does not read store settings or process payments.

## Product and data contract

- `orders.payment_method` supports `cash`, `yape`, `plin`, and `card` in the
  schema. `store_settings` controls enabled methods. Cash is limited to pickup.
- The current Payment Method Selector offers Yape/Plin for delivery and pickup,
  plus cash for pickup. Runtime checkout must hide options disabled by the
  current store or modality. Selection never implies payment verification.
- Card is not presented until a payment provider is integrated and validated.
- There is no customer saved-instrument table or provider vault in the current
  model. `payment_transactions` and `payment_events` describe order payments,
  not reusable payment methods. Do not show add/edit/delete/default-card
  actions or imply saved Yape/Plin accounts.

## Privacy and accessibility

Do not request or display card numbers, CVV, PIN, provider credentials,
payment tokens, or order proofs on the Account screen. Explain method and
fulfillment restrictions in text, not color alone. Navigation targets remain
at least 44 px. Because this page describes categories rather than live
availability, checkout is the only place that may present current selectable
options after store settings and order context are checked.

## Validation and remaining work

Full-screen and in-page context screenshots were reviewed. A wording fix
clarified that saved methods are not a supported Profile feature, rather than
suggesting an empty customer list. Screen frame: 360×844, with 64 px header,
700 px content, and 80 px navigation. Font audit: 14 screen text nodes and
11 context text nodes, Inter only, zero mismatches. No visible clipping or
overlap.

This is visual specification only. A real payment-instrument management flow
would require a provider, secure storage contract, consent and authorization,
and new customer-facing requirements. Next account area: Preferences.
