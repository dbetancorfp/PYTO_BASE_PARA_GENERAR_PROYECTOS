// Reads process.env once per call — no caching, so tests can mutate process.env freely.
export type DataBackend = 'memory' | 'postgres';

export interface Env {
  dataBackend: DataBackend;
  databaseUrl: string | undefined;
  port: number;
}

export function loadEnv(): Env {
  const dataBackend: DataBackend = process.env.DATA_BACKEND === 'postgres' ? 'postgres' : 'memory';
  const databaseUrl = process.env.DATABASE_URL;
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;

  return { dataBackend, databaseUrl, port };
}
