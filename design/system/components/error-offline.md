# Cogana Error / Offline

Figma component set: `322:6`  
Page: `40 · Error Offline` (`317:2`)  
Documentation frame: `318:2`

## Purpose

Persistent customer-facing states for a failed data read and a confirmed loss
of network connectivity. They are separate from Skeleton / Loading and Empty
State so the interface does not misreport incomplete data as a successful
zero-result response.

## Variants and copy

- `Type=Error` (`320:2`): “No se pudo cargar” / “Intenta de nuevo en unos
  momentos.”
- `Type=Offline` (`320:12`): “Parece que no hay conexión” / “Revisa tu
  conexión y vuelve a intentarlo.”
- Both use “Reintentar”. The only exposed component property is `Type`; title,
  message, and accessibility copy remain fixed per variant.

## Dimensions and dependencies

- Variant: 360 × 320 px.
- Illustration: 88 × 88 px.
- Primary action: 328 × 44 px.
- Component set: 840 × 400 px; variants have 40 px outer padding and 40 px gap.
- Button dependency: Cogana Button set `33:2`, `Size=Small / Style=Primary /
  State=Default` (`32:2`). The leading icon is hidden because retry is not
  navigation.

## Tokens

- Component surface: `color/bg/canvas`.
- Error illustration: `color/bg/danger` with `color/text/inverse` icon.
- Offline illustration: `color/bg/subtle` with `color/text/secondary` icon.
- Spacing, radii, border, and documentation typography use existing Cogana
  variables and Inter styles.

## Data and privacy

- Show Error only after a data-read request fails.
- Show Offline only when the app confirms a connectivity loss; do not classify
  a server error or an unknown request failure as offline.
- Render only a safe failure category and connectivity state. Do not expose
  stack traces, internal codes, request payloads, credentials, or personal,
  address, order, and payment data.

## Accessibility

Each variant includes a hidden `Accessibility label` guidance layer (`320:11`,
`320:26`). The native app must provide an equivalent accessible status and
action label, preserve reading order, keep the retry target at least 44 px, and
communicate state with text/iconography rather than color alone. Verify final
contrast in the native implementation.

## Behavior boundaries

`Reintentar` is a read-only fetch. It must not repeat checkout, payment,
cancellation, refund, or any order mutation. Keep the error/offline state until
a successful response confirms recovery. Use Skeleton / Loading during an
active request and Empty State only after a successful response confirms zero
results. The Figma button documents intent; it is not wired to an application
request.

## Validation

- Two variants; `Type` options are `Error` and `Offline`.
- Metadata reports an 840 × 400 px set with 360 × 320 px children at `(40, 40)`
  and `(440, 40)`.
- Screenshot review confirmed the error mark and offline glyph are visible,
  both CTAs are aligned, and the documentation frame and variants do not clip.
- Validation issues: 0.
