// Deterministic data seeded before e2e runs (see tecnologias/tecnologia_bbdd.md, "bun run
// db:seed:e2e"). Upserts the fixed account UC-01's Cypress spec logs in with, always reset
// to a clean, unlocked state so the suite is repeatable across runs.
import { SQL } from 'bun';

const EMAIL = 'e2e-login@example.com';
const PASSWORD = 'E2e-Test-Password-1';

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to seed e2e data');
  }

  const sql = new SQL(databaseUrl);
  const passwordHash = await Bun.password.hash(PASSWORD, { algorithm: 'bcrypt', cost: 10 });

  await sql`
    INSERT INTO users (email, password_hash, failed_login_attempts, account_locked)
    VALUES (${EMAIL}, ${passwordHash}, 0, false)
    ON CONFLICT (email) DO UPDATE
    SET password_hash = EXCLUDED.password_hash,
        failed_login_attempts = 0,
        account_locked = false
  `;

  console.log(`Seeded e2e account: ${EMAIL}`);
}

await main();
