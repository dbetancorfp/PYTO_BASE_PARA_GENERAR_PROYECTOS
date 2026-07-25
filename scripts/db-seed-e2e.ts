// Deterministic fixtures for Cypress e2e runs — idempotent (safe to run before every
// `bun run e2e`), extended per view with whatever accounts that view's specs assume.
// Requires DATABASE_URL (real Postgres — see tecnologias/tecnologia_bbdd.md).

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed e2e fixtures');
}

const sql = new Bun.SQL(databaseUrl);

// login view (views/login) — UC-01's main flow and A2 (account locked) need known accounts.
const LOGIN_VALID_EMAIL = 'e2e-valid-user@example.com';
const LOGIN_VALID_PASSWORD = 'CorrectHorseBattery1';
const LOGIN_LOCKED_EMAIL = 'e2e-locked-user@example.com';
const LOGIN_LOCKED_PASSWORD = 'CorrectHorseBattery1';

async function seedLoginFixtures(): Promise<void> {
  const validPasswordHash = await Bun.password.hash(LOGIN_VALID_PASSWORD);
  const lockedPasswordHash = await Bun.password.hash(LOGIN_LOCKED_PASSWORD);

  await sql`
    INSERT INTO users (email, password_hash, failed_login_attempts, account_locked)
    VALUES (${LOGIN_VALID_EMAIL}, ${validPasswordHash}, 0, false)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          failed_login_attempts = 0,
          account_locked = false
  `;

  await sql`
    INSERT INTO users (email, password_hash, failed_login_attempts, account_locked)
    VALUES (${LOGIN_LOCKED_EMAIL}, ${lockedPasswordHash}, 5, true)
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          failed_login_attempts = 5,
          account_locked = true
  `;
}

await seedLoginFixtures();
console.log('e2e fixtures seeded.');
process.exit(0);
