import { createApp } from './app';
import { loadEnv } from './db/env';

const env = loadEnv();
const { app } = createApp({ backend: env.dataBackend, databaseUrl: env.databaseUrl });

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port} (DATA_BACKEND=${env.dataBackend})`);
});
