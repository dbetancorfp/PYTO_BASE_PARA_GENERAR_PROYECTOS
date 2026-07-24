import { LOCKOUT_THRESHOLD } from '../../domain/auth-policy';
import type {
  CreateUserInput,
  FailedAttemptsUpdate,
  UserRecord,
  UserRepository,
} from '../user.repository';

// In-memory double used by unit tests and DATA_BACKEND=memory mode — same contract as
// PgUserRepository, no persistence.
export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, UserRecord>();
  private nextId = 1;

  async findByEmail(email: string): Promise<UserRecord | null> {
    for (const user of this.usersById.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async create(data: CreateUserInput): Promise<UserRecord> {
    const user: UserRecord = {
      id: `user-${this.nextId}`,
      email: data.email,
      passwordHash: data.passwordHash,
      failedLoginAttempts: 0,
      accountLocked: false,
      createdAt: new Date(),
    };
    this.nextId += 1;
    this.usersById.set(user.id, user);
    return user;
  }

  async incrementFailedAttempts(userId: string): Promise<FailedAttemptsUpdate> {
    const user = this.mustFind(userId);
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const accountLocked = failedLoginAttempts >= LOCKOUT_THRESHOLD;
    this.usersById.set(userId, { ...user, failedLoginAttempts, accountLocked });
    return { failedLoginAttempts, accountLocked };
  }

  async resetFailedAttempts(userId: string): Promise<void> {
    const user = this.mustFind(userId);
    this.usersById.set(userId, { ...user, failedLoginAttempts: 0 });
  }

  private mustFind(userId: string): UserRecord {
    const user = this.usersById.get(userId);
    if (!user) throw new Error(`User not found: ${userId}`);
    return user;
  }
}
