// Entry point — not exercised by tests; only wires createApp's composition root to an
// actual listening port, reading its backend selection from the environment (see
// tecnologias/tecnologia_bbdd.md — DATA_BACKEND=memory|postgres, DATABASE_URL, PORT).
import { createApp } from './app';

const backend = process.env.DATA_BACKEND === 'postgres' ? 'postgres' : 'memory';
const port = Number(process.env.PORT ?? 3000);

const { app } = createApp({ backend, databaseUrl: process.env.DATABASE_URL });

app.listen(port, () => {
  console.log(`Backend listening on port ${port} (DATA_BACKEND=${backend})`);
});
