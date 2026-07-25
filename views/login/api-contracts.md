# API Contracts — Login

### POST /api/auth/login

**Description**: Authenticates a user by email and password. On success, resets the
account's failed-attempt counter to zero. On failure with an existing, unlocked account,
increments the failed-attempt counter and locks the account once it reaches 5. On failure
against an email that doesn't match any account, responds identically to a wrong-password
failure — the two are indistinguishable to the client, so the view never leaks whether an
email exists.

**Allowed roles**: public (unauthenticated)
**Elements**: `email-input`, `password-input`, `login-button`, `login-error-message`

#### Request

- **Body**: `{ email: string, password: string }`

#### Response 200

```json
{ "redirectTo": "/dashboard" }
```

#### Errors

| Code | Condition |
|------|-----------|
| 400 | `email` or `password` missing from the body, or `email` isn't a syntactically valid email shape |
| 401 | The email/password combination is incorrect, or the email doesn't match any account — body: `{ "error": "invalid_credentials" }` |
| 403 | The account matching `email` is locked (`account_locked = true`, regardless of whether `password` was actually correct this time) — body: `{ "error": "account_locked" }` |

**Server-side behavior notes** `[INFERENCE — verify with the user]` (not stated explicitly
in the functional spec, derived from `globalRules`'s lockout rule):

- A 401 response increments `users.failed_login_attempts` by 1 for the matched account
  only (never for a non-matching email — there's no row to increment, and the response
  looks the same either way to the client).
- The moment an increment brings `failed_login_attempts` to `5`, the same request also sets
  `account_locked = true`. That request itself still returns 401 (the account transitions
  to locked *because of* this failed attempt, but the attempt that caused it is reported as
  a normal invalid-credentials failure, not as already-locked) — the account-locked (403)
  response only appears on the *next* attempt after that.
- While `account_locked = true`, every attempt returns 403 and does **not** further
  increment `failed_login_attempts` — the counter freezes once locked, per UC-01's
  postconditions.
- A 200 response sets `failed_login_attempts = 0` (does not touch `account_locked` — this
  view has no unlock mechanism; unlocking is out of scope, per the description, "Contact
  support").
