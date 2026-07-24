// elementId: login-button (createApp composition root — postgres branch, added after
// review-report.md's FAIL, see MEMORY note "coverage-gate-dip-tension")
import { describe, it, expect, afterAll, beforeAll } from 'bun:test';
import type { Server } from 'http';
import { createApp } from '../src/app';
import { PgUserRepository } from '../src/repositories/postgres/pg-user.repository';
import { InMemoryUserRepository } from '../src/repositories/in-memory/in-memory-user.repository';

const FAKE_DATABASE_URL = 'postgresql://fake:fake@127.0.0.1:1/fake';

describe('elementId: login-button (createApp composition root)', () => {
  it('wires an InMemoryUserRepository when backend is "memory"', () => {
    const built = createApp({ backend: 'memory' });

    expect(built.repositories.users).toBeInstanceOf(InMemoryUserRepository);
  });

  it('wires a PgUserRepository when backend is "postgres" and a databaseUrl is given', () => {
    const built = createApp({ backend: 'postgres', databaseUrl: FAKE_DATABASE_URL });

    expect(built.repositories.users).toBeInstanceOf(PgUserRepository);
  });

  it('falls back to process.env.DATABASE_URL when no databaseUrl is passed explicitly', () => {
    const original = process.env.DATABASE_URL;
    process.env.DATABASE_URL = FAKE_DATABASE_URL;
    try {
      const built = createApp({ backend: 'postgres' });
      expect(built.repositories.users).toBeInstanceOf(PgUserRepository);
    } finally {
      if (original === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = original;
    }
  });

  it('throws when backend is "postgres" and no DATABASE_URL is available anywhere', () => {
    const original = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    try {
      expect(() => createApp({ backend: 'postgres' })).toThrow(
        'DATABASE_URL is required when backend is "postgres"',
      );
    } finally {
      if (original !== undefined) process.env.DATABASE_URL = original;
    }
  });
});

describe('elementId: login-heading (static frontend serving)', () => {
  let httpServer: Server;
  let baseUrl: string;

  beforeAll(async () => {
    const built = createApp({ backend: 'memory' });
    await new Promise<void>((resolve) => {
      httpServer = built.app.listen(0, () => resolve());
    });
    const address = httpServer.address();
    const port = typeof address === 'object' && address ? address.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(() => new Promise<void>((resolve) => httpServer.close(() => resolve())));

  it('serves the frontend entry point at GET /login', async () => {
    const res = await fetch(`${baseUrl}/login`);

    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('<app-login-view>');
  });
});
