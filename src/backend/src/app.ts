import path from 'path';
import express, { type Express } from 'express';
import { authRouter } from './routes/auth';
import { AuthService } from './services/auth.service';
import { createPgClient } from './db/pg-client';
import { InMemoryUserRepository } from './repositories/in-memory/in-memory-user.repository';
import { PgUserRepository } from './repositories/postgres/pg-user.repository';
import type { UserRepository } from './repositories/user.repository';

// Project has one static HTML entry point serving every view for now (see
// src/frontend/index.html) — no per-view HTML files, no client-side router yet. Path
// resolved relative to this file so it works regardless of the process's cwd.
const FRONTEND_ROOT = path.resolve(import.meta.dir, '../../frontend');

export interface AppDeps {
  backend: 'memory' | 'postgres';
  databaseUrl?: string;
}

export interface AppRepositories {
  users: UserRepository;
}

export interface BuiltApp {
  app: Express;
  repositories: AppRepositories;
}

// Composition root: the only place that decides which concrete repository implementation
// gets injected. Routes and services only ever depend on the UserRepository interface (DIP).
export function createApp(deps: AppDeps): BuiltApp {
  const users: UserRepository = buildUserRepository(deps);
  const authService = new AuthService(users);

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter(authService));

  // Static frontend: one HTML entry point for every view (no per-view files, no
  // client-side router yet — see FRONTEND_ROOT above). `/login` is the only real route
  // today; others (e.g. `/dashboard`) intentionally 404 until those views exist.
  app.use('/dist', express.static(path.join(FRONTEND_ROOT, 'dist')));
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(FRONTEND_ROOT, 'index.html'));
  });

  return { app, repositories: { users } };
}

function buildUserRepository(deps: AppDeps): UserRepository {
  if (deps.backend === 'memory') {
    return new InMemoryUserRepository();
  }

  const databaseUrl = deps.databaseUrl ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required when backend is "postgres"');
  }
  return new PgUserRepository(createPgClient(databaseUrl));
}
