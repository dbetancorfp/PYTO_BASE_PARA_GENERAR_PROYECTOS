// elementId: login-button — business logic backing UC-01 (views/login/use-cases.md).
import type { UserRepository } from '../repositories/user.repository';

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_credentials' | 'account_locked' };

export class AuthService {
  constructor(private readonly users: UserRepository) {} // injection — never `new Pg*Repository()` here

  async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      // Same response as a wrong password — never leaks whether the email exists.
      return { ok: false, reason: 'invalid_credentials' };
    }

    if (user.accountLocked) {
      return { ok: false, reason: 'account_locked' };
    }

    const passwordMatches = await Bun.password.verify(password, user.passwordHash);
    if (!passwordMatches) {
      // The attempt that brings the counter to the lock threshold still reports
      // invalid_credentials for itself — the account_locked response only appears on the
      // next attempt after that (see views/login/api-contracts.md).
      await this.users.incrementFailedAttempts(user.id);
      return { ok: false, reason: 'invalid_credentials' };
    }

    await this.users.resetFailedAttempts(user.id);
    return { ok: true };
  }
}
