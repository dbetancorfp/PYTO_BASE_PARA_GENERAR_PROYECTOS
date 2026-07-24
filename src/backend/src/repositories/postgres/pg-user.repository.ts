import { LOCKOUT_THRESHOLD } from '../../domain/auth-policy';
import type { SqlExecutor } from '../../db/sql-executor';
import type {
  CreateUserInput,
  FailedAttemptsUpdate,
  UserRecord,
  UserRepository,
} from '../user.repository';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  failed_login_attempts: number;
  account_locked: boolean;
  created_at: Date | string;
}

function toUserRecord(row: UserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    failedLoginAttempts: row.failed_login_attempts,
    accountLocked: row.account_locked,
    createdAt: new Date(row.created_at),
  };
}

// Real implementation against Postgres via Bun.SQL — tagged templates only, never string
// concatenation (see tecnologias/tecnologia_bbdd.md).
export class PgUserRepository implements UserRepository {
  constructor(private readonly sql: SqlExecutor) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const rows = await this.sql<UserRow>`SELECT * FROM users WHERE email = ${email}`;
    const [row] = rows;
    return row ? toUserRecord(row) : null;
  }

  async create(data: CreateUserInput): Promise<UserRecord> {
    const rows = await this.sql<UserRow>`
      INSERT INTO users (email, password_hash)
      VALUES (${data.email}, ${data.passwordHash})
      RETURNING *
    `;
    const [row] = rows;
    return toUserRecord(row);
  }

  async incrementFailedAttempts(userId: string): Promise<FailedAttemptsUpdate> {
    const rows = await this.sql<UserRow>`
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1,
          account_locked = (failed_login_attempts + 1) >= ${LOCKOUT_THRESHOLD}
      WHERE id = ${userId}
      RETURNING *
    `;
    const [row] = rows;
    return {
      failedLoginAttempts: row.failed_login_attempts,
      accountLocked: row.account_locked,
    };
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    await this.sql`
      UPDATE users
      SET failed_login_attempts = 0
      WHERE id = ${userId}
    `;
  }
}
