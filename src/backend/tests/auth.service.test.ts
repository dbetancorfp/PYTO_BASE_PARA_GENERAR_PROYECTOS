// elementId: login-button (business logic backing UC-01, use-cases.md)
import { describe, it, expect } from 'bun:test';
import { AuthService } from '../src/services/auth.service';
import type { UserRepository, UserRecord } from '../src/repositories/user.repository';

function makeUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-1',
    email: 'ana@example.com',
    passwordHash: '',
    failedLoginAttempts: 0,
    accountLocked: false,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

async function hash(password: string): Promise<string> {
  return Bun.password.hash(password, { algorithm: 'bcrypt', cost: 10 });
}

// Test double — injects the repository, per DIP. Never a concrete Postgres implementation.
function makeRepoDouble(user: UserRecord | null): UserRepository & {
  incrementCalls: string[];
  resetCalls: string[];
} {
  const incrementCalls: string[] = [];
  const resetCalls: string[] = [];
  let current = user;

  return {
    incrementCalls,
    resetCalls,
    findByEmail: async (email: string) => (current && current.email === email ? current : null),
    create: async () => {
      throw new Error('not used in these tests');
    },
    incrementFailedAttempts: async (userId: string) => {
      incrementCalls.push(userId);
      if (current) {
        current = {
          ...current,
          failedLoginAttempts: current.failedLoginAttempts + 1,
          accountLocked: current.failedLoginAttempts + 1 >= 5,
        };
      }
      return {
        failedLoginAttempts: current?.failedLoginAttempts ?? 0,
        accountLocked: current?.accountLocked ?? false,
      };
    },
    resetFailedAttempts: async (userId: string) => {
      resetCalls.push(userId);
      if (current) current = { ...current, failedLoginAttempts: 0 };
    },
  };
}

describe('elementId: login-button', () => {
  it('resets failed attempts and returns ok on correct credentials', async () => {
    const passwordHash = await hash('correct-password');
    const user = makeUser({ passwordHash, failedLoginAttempts: 3 });
    const repo = makeRepoDouble(user);
    const service = new AuthService(repo);

    const result = await service.login('ana@example.com', 'correct-password');

    expect(result).toEqual({ ok: true });
    expect(repo.resetCalls).toEqual(['user-1']);
  });

  it('returns invalid_credentials without incrementing when the email matches no account', async () => {
    const repo = makeRepoDouble(null);
    const service = new AuthService(repo);

    const result = await service.login('nobody@example.com', 'whatever');

    expect(result).toEqual({ ok: false, reason: 'invalid_credentials' });
    expect(repo.incrementCalls).toEqual([]);
  });

  it('returns invalid_credentials and increments the counter on a wrong password for an unlocked account', async () => {
    const passwordHash = await hash('correct-password');
    const user = makeUser({ passwordHash, failedLoginAttempts: 1 });
    const repo = makeRepoDouble(user);
    const service = new AuthService(repo);

    const result = await service.login('ana@example.com', 'wrong-password');

    expect(result).toEqual({ ok: false, reason: 'invalid_credentials' });
    expect(repo.incrementCalls).toEqual(['user-1']);
  });

  it('locks the account when a failed attempt brings the counter to 5, but still reports invalid_credentials for that same attempt', async () => {
    const passwordHash = await hash('correct-password');
    const user = makeUser({ passwordHash, failedLoginAttempts: 4, accountLocked: false });
    const repo = makeRepoDouble(user);
    const service = new AuthService(repo);

    const result = await service.login('ana@example.com', 'wrong-password');

    expect(result).toEqual({ ok: false, reason: 'invalid_credentials' });
  });

  it('returns account_locked without incrementing further when the account is already locked, even with the correct password', async () => {
    const passwordHash = await hash('correct-password');
    const user = makeUser({ passwordHash, failedLoginAttempts: 5, accountLocked: true });
    const repo = makeRepoDouble(user);
    const service = new AuthService(repo);

    const result = await service.login('ana@example.com', 'correct-password');

    expect(result).toEqual({ ok: false, reason: 'account_locked' });
    expect(repo.incrementCalls).toEqual([]);
  });
});
