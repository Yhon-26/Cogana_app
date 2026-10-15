# Cogana Login OTP

Figma page: `48 · Login OTP` (`359:20`)  
Entry/guest screen: `Access · Guest and OTP proposal · 360×844` (`359:21`)  
Verification screen: `Access · Code not sent · 360×844` (`359:25`)  
Context panel: `359:29`

## Purpose and product boundary

The account path is optional. The entry screen retains `Seguir sin cuenta`
because the Cogana data model explicitly allows guest shopping through a
Supabase anonymous identity, with optional account linking afterward.

The customer OTP path is a **visual proposal, not an implemented sign-in**.
Both the cellular-number field and `Enviar código` are disabled. The second
screen illustrates a no-code-sent state: code entry, resend, and verification
are disabled. No code length, expiry, resend timer, destination, or success is
invented. The guest action is only a Figma affordance, not a live launch path.

## Evidence and decisions still needed

- `database/README.md` records anonymous Auth as enabled and tested. It also
  records CAPTCHA/Turnstile and abuse-limit work as pending before public
  anonymous signup. The existing owner account uses a magic link, not a
  password or documented customer OTP flow.
- `docs/modelo-datos-v2.md` states that guest purchase must not require a
  permanent account. `customers.phone` is required in the data model, so a
  cellular channel is proposed for this design. The OTP channel/provider,
  number format, code length, lifetime, retry and resend policy, and identity
  conversion contract remain undecided.
- Before activation, implement authorized send/verify operations, abuse and
  enumeration protections, rate limits, safe anonymous-account linking, and
  RLS checks that distinguish `is_anonymous`. Do not lose guest orders during
  conversion.

Future states include valid input, sending, sent, incomplete/incorrect/expired
code, resend allowed, attempt limit, offline/error, and verified session. None
are represented as successful in these two pending screens.

## Privacy and accessibility

- Never show a full phone number, raw OTP, account-existence result, or
  internal user identifier in a public confirmation message.
- Keep visible field labels and associated errors; support a suitable mobile
  keyboard, paste/autocomplete when enabled, visible focus, and at least 44 px
  touch targets. Announce sending, verification, and errors without relying
  only on color.

## Validation

- Reused Standard Top App Bar, Text Input Disabled, and Button variants.
- Entry and verification full-screen screenshots checked. A targeted footer
  resize gave both screens adequate space for two-line helper text; the
  post-fix screenshots show no clipping or overlap.
- In-page context screenshot checked; no shimmer placeholders remain.
- Font audit: 14 entry and 10 verification text nodes, Inter only, zero
  mismatches.
