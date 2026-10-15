# Cogana Address Management

Figma page: `50 · Address Management` (`366:96`)  
Confirmed-empty screen: `366:97`  
New-address form: `366:98`  
Context panel: `366:99`

## Purpose and states

This is the store-scoped customer address area reached from Profile. Both
360×844 views reuse the Standard Top App Bar and Bottom Navigation with Cuenta
selected. They are design examples, not live customer reads.

- Confirmed empty: shown only after a successful, authorized read of
  `customer_addresses` returns no rows. The add action leads to the form.
- New address: blank fields for label, address line, district, and optional
  reference. The principal-address option is unchecked. Save is disabled until
  required fields validate and an authorized customer session exists.
- Loading, error, offline, and unauthorized outcomes must use their own shell
  patterns; they must not be presented as a confirmed empty list.

## Data and behavior contract

- `customer_addresses` requires nonblank `label`, `address_line`, and
  `district`; `reference` is optional. `store_id` and `customer_id` come from
  the authorized context, never free-form client fields.
- Only one address per customer may have `is_default=true`. Changing the
  principal address needs an atomic server-side update; this design does not
  claim that flow has been implemented.
- Latitude and longitude must be supplied together, within their schema
  ranges, or both omitted. Never infer coordinates from a typed address.
- Saving an address does not assert delivery coverage. Coverage, delivery
  price, and ETA are verified separately when the address is selected for
  delivery, against current `delivery_zones` and checkout rules.
- Existing SQL grants owner-scoped SELECT, INSERT, and UPDATE; there is no
  customer DELETE policy. Do not expose a delete action until an authorized
  deletion contract is designed and tested.

## Privacy and accessibility

Read and write only addresses belonging to the active customer and store.
Never show another customer's data or invent a real address in examples.
Field labels, optionality, the principal-address preference, and state
messages remain explicit text. Actions and selection targets are at least
44 px high. A failed or unavailable read must not imply zero addresses.

## Validation and remaining work

The two full-screen views and the in-page context were visually checked;
the empty card was narrowed to avoid horizontal overflow. Both screen frames
are 360×844 with 64 px header, 700 px content, and 80 px navigation. Font
audit: 11 and 18 text nodes, Inter only, zero mismatches.

This work is visual specification only. Live list, add/edit/default behavior,
loading/error results, geocoding, coverage checks, and persistence remain for
implementation and authorized end-to-end verification. Next account area:
payment methods, subject to the payment-instrument data model.
