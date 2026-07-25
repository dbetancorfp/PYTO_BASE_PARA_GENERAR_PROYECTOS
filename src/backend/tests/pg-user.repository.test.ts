// elementId: login-button (Postgres-backed UserRepository, unit-tested via a Bun.SQL
// double — see tdd-engineer.md's "Postgres repositories always get their own unit test")
import { describe, it, expect } from 'bun:test';
import { PgUserRepository } from '../src/repositories/postgres/pg-user.repository';
import { makeFakeSql } from './helpers/fake-sql';

const row = {
  id: 'user-1',
  email: 'ana@example.com',
  password_hash: 'hashed-value',
  failed_login_attempts: 0,
  account_locked: false,
  created_at: '2026-01-01T00:00:00.000Z',
};

describe('elementId: login-button (PgUserRepository)', () => {
  it('findByEmail maps a returned row to a UserRecord', async () => {
    const sql = makeFakeSql([[row]]);
    const repo = new PgUserRepository(sql);

    const user = await repo.findByEmail('ana@example.com');

    expect(user).toEqual({
      id: 'user-1',
      email: 'ana@example.com',
      passwordHash: 'hashed-value',
      failedLoginAttempts: 0,
      accountLocked: false,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    expect(sql.calls[0]?.values).toEqual(['ana@example.com']);
  });

  it('findByEmail returns null when no row matches', async () => {
    const sql = makeFakeSql([[]]);
    const repo = new PgUserRepository(sql);

    const user = await repo.findByEmail('nobody@example.com');

    expect(user).toBeNull();
  });

  it('create inserts and returns the newly created row, mapped', async () => {
    const sql = makeFakeSql([[{ ...row, id: 'user-2' }]]);
    const repo = new PgUserRepository(sql);

    const user = await repo.create({ email: 'ana@example.com', passwordHash: 'hashed-value' });

    expect(user.id).toBe('user-2');
    expect(sql.calls[0]?.values).toEqual(['ana@example.com', 'hashed-value']);
  });

  it('incrementFailedAttempts returns the updated counter and lock state', async () => {
    const sql = makeFakeSql([[{ ...row, failed_login_attempts: 1, account_locked: false }]]);
    const repo = new PgUserRepository(sql);

    const result = await repo.incrementFailedAttempts('user-1');

    expect(result).toEqual({ failedLoginAttempts: 1, accountLocked: false });
  });

  it('incrementFailedAttempts reports the account as locked once the threshold is reached', async () => {
    const sql = makeFakeSql([[{ ...row, failed_login_attempts: 5, account_locked: true }]]);
    const repo = new PgUserRepository(sql);

    const result = await repo.incrementFailedAttempts('user-1');

    expect(result).toEqual({ failedLoginAttempts: 5, accountLocked: true });
  });

  it('resetFailedAttempts issues an update and resolves with no value', async () => {
    const sql = makeFakeSql([[]]);
    const repo = new PgUserRepository(sql);

    await expect(repo.resetFailedAttempts('user-1')).resolves.toBeUndefined();
    expect(sql.calls[0]?.values).toEqual(['user-1']);
  });
});
