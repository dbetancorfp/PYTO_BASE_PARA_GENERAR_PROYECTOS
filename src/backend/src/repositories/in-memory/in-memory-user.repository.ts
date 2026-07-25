// elementId: login-button — in-memory UserRepository double, used by DATA_BACKEND=memory
// and by tests that exercise the HTTP layer (auth.routes.test.ts) without a real database.
import type {
  FailedAttemptsUpdate,
  NewUser,
  UserRecord,
  UserRepository,
} from '../user.repository';
import { ACCOUNT_LOCK_THRESHOLD } from '../user.repository';

export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, UserRecord>();

  async findByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.usersById.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(data: NewUser): Promise<UserRecord> {
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email: data.email,
      passwordHash: data.passwordHash,
      failedLoginAttempts: 0,
      accountLocked: false,
      createdAt: new Date(),
    };
    this.usersById.set(user.id, user);
    return user;
  }

  async incrementFailedAttempts(userId: string): Promise<FailedAttemptsUpdate> {
    const user = this.requireUser(userId);
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const accountLocked = user.accountLocked || failedLoginAttempts >= ACCOUNT_LOCK_THRESHOLD;
    this.usersById.set(userId, { ...user, failedLoginAttempts, accountLocked });
    return { failedLoginAttempts, accountLocked };
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    const user = this.usersById.get(userId);
    if (!user) return;
    this.usersById.set(userId, { ...user, failedLoginAttempts: 0 });
  }

  private requireUser(userId: string): UserRecord {
    const user = this.usersById.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    return user;
  }
}
