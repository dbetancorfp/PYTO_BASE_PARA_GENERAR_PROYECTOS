// Bun.SQL double (see tecnologias/tecnologia_qa.md, tecnologias/tecnologia_bbdd.md).
// Records every tagged-template call and returns pre-programmed rows, without ever
// touching a real database — used to unit-test Postgres-backed repositories in isolation.
import type { SqlExecutor, SqlRow } from '../../src/db/sql-executor';

export interface RecordedCall {
  strings: readonly string[];
  values: unknown[];
}

export interface FakeSql extends SqlExecutor {
  calls: RecordedCall[];
}

export function makeFakeSql<T extends SqlRow = SqlRow>(responses: T[][]): FakeSql {
  const calls: RecordedCall[] = [];
  let callIndex = 0;

  async function fake(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
    calls.push({ strings: [...strings], values });
    const response = responses[callIndex] ?? [];
    callIndex += 1;
    return response;
  }

  return Object.assign(fake as SqlExecutor, { calls });
}
