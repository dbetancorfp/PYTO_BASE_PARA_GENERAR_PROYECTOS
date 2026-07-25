# Use Cases — Login

## UC-01: Sign in with valid credentials

**Primary actor**: Unauthenticated visitor
**Preconditions**: An account with a matching email/password exists and is not locked
**Elements**: `email-input`, `password-input`, `login-button` (sign-in flow), `login-error-message` (failure feedback)

### Main flow

1. The user enters a syntactically valid email in `email-input` and a non-empty value in
   `password-input`.
2. The user clicks `login-button`.
3. `login-button` enters its loading state and sends the credentials to the server.
4. The server confirms the email/password combination is correct and the account isn't
   locked; it resets the account's failed-attempt counter to zero.
5. The browser redirects to `/dashboard`.

### Alternative flows

- **A1 — Invalid credentials**: at step 4, the email/password combination doesn't match any
  account, or matches an account but with the wrong password. The server increments that
  account's failed-attempt counter. `login-button` returns to its default state and
  `login-error-message` shows "Incorrect email or password" — never indicating which of the
  two fields was wrong.
- **A2 — Account locked**: at step 4, the account matching the email has
  `failed_login_attempts >= 5` (already locked from a previous attempt, or this attempt
  itself is the 5th consecutive failure). `login-button` returns to its default state and
  `login-error-message` shows "This account has been locked due to too many failed
  attempts. Contact support." — even if the password entered this time was actually
  correct.

### Postconditions

- On success: the user is redirected to `/dashboard`, and that account's
  `failed_login_attempts` is `0`.
- On failure (A1): that account's `failed_login_attempts` is incremented by one (or a
  generic incorrect-credentials response is returned, with no counter change, if the email
  doesn't match any account at all — see `api-contracts.md` for exactly how this is
  distinguished server-side without leaking which case occurred to the client).
- On failure (A2): `failed_login_attempts` is left unchanged (it does not keep incrementing
  once locked — see `api-contracts.md`).

### Acceptance criteria

- [x] Redirects to `/dashboard` after a successful login response
- [x] Shows "Incorrect email or password" in `login-error-message` after a wrong-credentials
      response, without indicating which field was wrong
- [x] Shows "This account has been locked due to too many failed attempts. Contact support."
      in `login-error-message` after an account-locked response
- [x] Returns `login-button` to its default (non-loading) state after any response, success
      or failure
- [x] After 5 consecutive failed attempts for the same account, a 6th attempt — even with
      the correct password — still fails with the account-locked message
- [x] A successful login resets that account's failed-attempt counter to zero

---

## UC-02: Client-side field validation

**Primary actor**: Unauthenticated visitor
**Preconditions**: None — applies on first load and at any point before a request is sent
**Elements**: `email-input`, `password-input`, `login-button`

### Main flow

1. The user clicks `login-button` while `email-input` and/or `password-input` don't satisfy
   their validation rules (empty, or, for email, not shaped like an email).
2. No request is sent to the server.
3. Each invalid field shows its own inline validation message.

### Alternative flows

- **A1 — User corrects the field**: after seeing an inline validation message, the user
  edits the field into a valid value; that field's inline message clears immediately,
  without requiring another click on `login-button`.

### Postconditions

- No login request was sent while any required field was invalid.

### Acceptance criteria

- [x] Shows an inline validation message and does not send a request if submitted while
      `email-input` is empty
- [x] Shows an inline validation message and does not send a request if submitted with an
      `email-input` value containing no `@`
- [x] Shows an inline validation message and does not send a request if submitted with an
      `email-input` value that has `@` but nothing after it
- [x] Shows an inline validation message and does not send a request if submitted while
      `password-input` is empty
- [x] Clears `email-input`'s inline validation message as soon as its value becomes a
      syntactically valid email
- [x] Clears `password-input`'s inline validation message as soon as its value is non-empty

---

## UC-03: Toggle password visibility

**Primary actor**: Unauthenticated visitor
**Preconditions**: None
**Elements**: `password-input`, `password-toggle-button`

### Main flow

1. The user clicks `password-toggle-button` while `password-input` is masked.
2. `password-input` switches to showing its value as plain text.
3. `password-toggle-button`'s accessible label updates to reflect the new action available
   ("Hide password").

### Alternative flows

- **A1 — Toggle back**: the user clicks `password-toggle-button` again while
  `password-input` is revealed; it switches back to masked, and the button's label reverts
  to "Show password".

### Postconditions

- `password-input`'s masked/revealed state matches the number of times
  `password-toggle-button` has been clicked (odd = revealed, even = masked).

### Acceptance criteria

- [x] Clicking `password-toggle-button` once changes `password-input` from masked to
      revealed
- [x] Clicking `password-toggle-button` again changes `password-input` back from revealed
      to masked
- [x] `password-toggle-button` has an accessible label announcing its current action

---

## UC-04: Forgot password link (out of scope placeholder)

**Primary actor**: Unauthenticated visitor
**Preconditions**: None
**Elements**: `forgot-password-link`

### Main flow

1. The user clicks `forgot-password-link`.
2. Nothing happens — `[INFERENCE — verify with the user]` this is intentional per the
   description ("doesn't need to go anywhere yet"), not a bug to fix in this view. A future
   view will own the real password-recovery flow.

### Alternative flows

None — there is no alternative behavior to specify while this remains a placeholder.

### Postconditions

- No navigation occurs, no request is sent.

### Acceptance criteria

- [x] `forgot-password-link` is present and visible below `login-button` on first load
