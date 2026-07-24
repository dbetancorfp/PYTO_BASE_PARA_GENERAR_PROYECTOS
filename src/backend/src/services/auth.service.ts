import type { UserRepository } from '../repositories/user.repository';

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_credentials' | 'account_locked' };

// Business logic for UC-01 (views/login/use-cases.md). The lockout threshold itself is
// enforced by UserRepository.incrementFailedAttempts (see domain/auth-policy.ts) — this
// service only orchestrates the flow: find, check lock, verify password, react.
export class AuthService {
  constructor(private readonly users: UserRepository) {} // injection — never `new PgUserRepository()` here

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Never reveals whether the email exists — same response as a wrong password.
      return { ok: false, reason: 'invalid_credentials' };
    }

    if (user.accountLocked) {
      // Locked accounts fail as 'account_locked' even with the correct password, and the
      // counter is frozen — no further increment while locked.
      return { ok: false, reason: 'account_locked' };
    }

    const passwordMatches = await Bun.password.verify(password, user.passwordHash);
    if (!passwordMatches) {
      await this.users.incrementFailedAttempts(user.id);
      return { ok: false, reason: 'invalid_credentials' };
    }

    await this.users.resetFailedAttempts(user.id);
    return { ok: true };
  }
}
