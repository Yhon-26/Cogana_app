# Cogana Payment Evidence

Figma component set: 158:26

## Purpose

Lets a customer attach a Yape or Plin payment receipt for manual review. An
attached file is not proof that the payment has been confirmed.

## Variants

- State: Empty, Uploading, Attached, Error
- Total: 4 variants

The entire 360 x 112 px target is tappable in Empty (attach), Attached
(replace), and Error (retry). It is inactive in Uploading.

## Dimensions

- Component: 360 x 165 px
- Upload target: 360 x 112 px

## Properties

- Label (`Label#158:0`)
- Filename (`Filename#158:5`, Attached only)
- Error reason (`Error reason#158:10`, Error only)
- Accessibility label (`Accessibility label#158:15`)

The accepted formats and payment-verification language are intentionally not
editable via instance properties.

## Source of truth and integration boundary

The private `payment-proofs` bucket accepts JPG, PNG, WebP, and PDF up to
10 MB. `payment_transactions.proof_storage_path` can store the object path.
The current database design does not grant customers direct access to this
bucket; secure upload and signed retrieval require a server integration that
is not yet implemented. Do not connect the UI directly to Storage or show a
successful upload before the server confirms it. Only owner/admin manual
confirmation may mark a Yape/Plin payment as paid.

## Tokens and accessibility

Fill, border, text color, spacing, radius, and stroke width use Cogana
variables. Visible text uses Inter. The target exceeds the 44 px touch
minimum. Error and pending-review states use explicit text, not color alone.

## Validation

- Variant, property, token, typography, and touch-target audit: 0 issues.
- Visual review: 0 issues.
