// Structural interfaces around Bun.SQL's tagged-template call signature (see
// tecnologias/tecnologia_bbdd.md). Repositories depend on these, never on Bun's own `SQL`
// class directly, so a test double (helpers/fake-sql.ts) can stand in for unit tests.

export type SqlRow = Record<string, unknown>;

export interface SqlExecutor {
  <T extends SqlRow = SqlRow>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
}

export interface TransactionalSqlExecutor extends SqlExecutor {
  begin<T>(fn: (sql: SqlExecutor) => Promise<T>): Promise<T>;
}
