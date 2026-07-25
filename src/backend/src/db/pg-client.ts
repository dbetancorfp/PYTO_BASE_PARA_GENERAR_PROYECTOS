// Minimal factory for the real Bun.SQL client (see tecnologias/tecnologia_bbdd.md).
// Returned typed as our own `SqlExecutor` so repositories never depend on Bun's concrete
// `SQL` class, only on the tagged-template surface they actually use.
import { SQL } from 'bun';
import type { SqlExecutor } from './sql-executor';

export function createPgClient(databaseUrl: string): SqlExecutor {
  return new SQL(databaseUrl) as unknown as SqlExecutor;
}
