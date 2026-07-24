// Single source of truth for the lockout business rule (globalRules, views/login/functional-spec.json).
// Both UserRepository implementations enforce it when incrementing failed attempts, since the
// AuthService/UserRepository contract requires incrementFailedAttempts to already return the
// post-increment lock state (see views/login/api-contracts.md's server-side behavior notes).
export const LOCKOUT_THRESHOLD = 5;
