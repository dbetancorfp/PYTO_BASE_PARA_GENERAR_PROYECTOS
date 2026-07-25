// elementId: login-button — Postgres-backed UserRepository (see
// src/backend/tests/pg-user.repository.test.ts for the authoritative contract).
import type { SqlExecutor, SqlRow } from '../../db/sql-executor';
import type {
  FailedAttemptsUpdate,
  NewUser,
  UserRecord,
  UserRepository,
} from '../user.repository';
import { ACCOUNT_LOCK_THRESHOLD } from '../user.repository';

interface UserRow extends SqlRow {
  id: string;
  email: string;
  password_hash: string;
  failed_login_attempts: number;
  account_locked: boolean;
  created_at: string;
}

function mapRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    failedLoginAttempts: row.failed_login_attempts,
    accountLocked: row.account_locked,
    createdAt: new Date(row.created_at),
  };
}

export class PgUserRepository implements UserRepository {
  constructor(private readonly sql: SqlExecutor) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.sql<UserRow>`SELECT * FROM users WHERE email = ${email}`;
    return rows[0] ? mapRow(rows[0]) : null;
  }

  async create(data: NewUser): Promise<UserRecord> {
    const [row] = await this.sql<UserRow>`
      INSERT INTO users (email, password_hash)
      VALUES (${data.email}, ${data.passwordHash})
      RETURNING *
    `;
    return mapRow(row as UserRow);
  }

  async incrementFailedAttempts(userId: string): Promise<FailedAttemptsUpdate> {
    const [row] = await this.sql<UserRow>`
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          account_locked = account_locked OR (failed_login_attempts + 1) >= ${ACCOUNT_LOCK_THRESHOLD}
      WHERE id = ${userId}
      RETURNING failed_login_attempts, account_locked
    `;
    const updated = row as UserRow;
    return {
      failedLoginAttempts: updated.failed_login_attempts,
      accountLocked: updated.account_locked,
    };
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.sql`UPDATE users SET failed_login_attempts = 0 WHERE id = ${userId}`;
  }
}
