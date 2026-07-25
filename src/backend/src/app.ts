// Composition root — decides which concrete repository implementation to inject based on
// AppDeps.backend (see tecnologias/tecnologia_bbdd.md). Routes and services only ever see
// the `UserRepository` interface, never `PgUserRepository`/`InMemoryUserRepository`.
import path from 'node:path';
import express, { type Express } from 'express';
import { createPgClient } from './db/pg-client';
import { InMemoryUserRepository } from './repositories/in-memory/in-memory-user.repository';
import { PgUserRepository } from './repositories/postgres/pg-user.repository';
import type { UserRepository } from './repositories/user.repository';
import { authRouter } from './routes/auth.routes';
import { AuthService } from './services/auth.service';

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

function buildRepositories(deps: AppDeps): AppRepositories {
  if (deps.backend === 'postgres') {
    const databaseUrl = deps.databaseUrl ?? process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required when backend is "postgres"');
    }
    return { users: new PgUserRepository(createPgClient(databaseUrl)) };
  }
  return { users: new InMemoryUserRepository() };
}

// Static frontend assets — served by every view sharing the same `bun build` output and
// one static `index.html` (see e2e-engineer.md Step 0 and CLAUDE.md's repository structure).
const frontendRoot = path.resolve(import.meta.dir, '../../frontend');

export function createApp(deps: AppDeps): BuiltApp {
  const repositories = buildRepositories(deps);
  const authService = new AuthService(repositories.users);

  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRouter(authService));

  app.use('/dist', express.static(path.join(frontendRoot, 'dist')));
  app.get('/login', (_req, res) => {
    res.sendFile(path.join(frontendRoot, 'index.html'));
  });

  return { app, repositories };
}
