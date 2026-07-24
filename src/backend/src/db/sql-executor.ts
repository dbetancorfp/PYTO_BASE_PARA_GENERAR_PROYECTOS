// Structural interface (not Bun's) that scopes the query surface repositories need — allows
// swapping the real Bun.SQL client for a test double without repositories depending on Bun's
// concrete SQL type.
export type SqlRow = Record<string, unknown>;

export interface SqlExecutor {
  <T = SqlRow>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
}
