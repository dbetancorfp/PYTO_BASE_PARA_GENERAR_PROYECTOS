// elementId: login-button (API contract for UC-01, api-contracts.md)
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import type { Server } from 'http';
import { createApp } from '../src/app';
import type { UserRepository } from '../src/repositories/user.repository';

let httpServer: Server;
let baseUrl: string;
let users: UserRepository;

beforeAll(async () => {
  const built = createApp({ backend: 'memory' });
  users = built.repositories.users;

  const successHash = await Bun.password.hash('correct-horse-battery-staple', {
    algorithm: 'bcrypt',
    cost: 10,
  });
  await users.create({ email: 'success@example.com', passwordHash: successHash });

  const wrongPassHash = await Bun.password.hash('right-password', {
    algorithm: 'bcrypt',
    cost: 10,
  });
  await users.create({ email: 'wrongpass@example.com', passwordHash: wrongPassHash });

  const lockoutHash = await Bun.password.hash('right-password', {
    algorithm: 'bcrypt',
    cost: 10,
  });
  await users.create({ email: 'lockout@example.com', passwordHash: lockoutHash });

  await new Promise<void>((resolve) => {
    httpServer = built.app.listen(0, () => resolve());
  });
  const address = httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => new Promise<void>((resolve) => httpServer.close(() => resolve())));

async function login(email: string, password: string): Promise<Response> {
  return fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}

describe('elementId: login-button (POST /api/auth/login)', () => {
  it('returns 200 with redirectTo on correct credentials', async () => {
    const res = await login('success@example.com', 'correct-horse-battery-staple');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ redirectTo: '/dashboard' });
  });

  it('returns 401 invalid_credentials for a wrong password', async () => {
    const res = await login('wrongpass@example.com', 'totally-wrong');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 401 invalid_credentials for an email that matches no account', async () => {
    const res = await login('nobody@example.com', 'whatever');
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  it('returns 400 when the password is missing from the body', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'success@example.com' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when the email is not a syntactically valid email', async () => {
    const res = await login('not-an-email', 'whatever');
    expect(res.status).toBe(400);
  });

  it('locks the account after 5 consecutive failed attempts, returning 403 on the next attempt even with the correct password', async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await login('lockout@example.com', 'totally-wrong');
      expect(res.status).toBe(401);
    }

    const res = await login('lockout@example.com', 'right-password');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'account_locked' });
  });

  it('resets the failed-attempt counter to zero on a successful login', async () => {
    const first = await login('success@example.com', 'wrong-once');
    expect(first.status).toBe(401);

    const second = await login('success@example.com', 'correct-horse-battery-staple');
    expect(second.status).toBe(200);

    const user = await users.findByEmail('success@example.com');
    expect(user?.failedLoginAttempts).toBe(0);
  });
});
