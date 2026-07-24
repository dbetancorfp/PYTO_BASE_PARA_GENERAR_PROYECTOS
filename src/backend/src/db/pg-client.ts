import { SQL } from 'bun';
import type { SqlExecutor } from './sql-executor';

// Minimal factory: wraps Bun's native SQL client behind our own SqlExecutor surface, so
// repositories never import `bun`'s SQL type directly (DIP).
export function createPgClient(databaseUrl: string): SqlExecutor {
  const sql = new SQL(databaseUrl);
  return sql as unknown as SqlExecutor;
}
