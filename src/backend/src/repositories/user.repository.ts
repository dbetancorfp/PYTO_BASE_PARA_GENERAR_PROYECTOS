// elementId: login-button — the data shape and access contract UC-01 authenticates
// against (views/login/use-cases.md, views/login/schema-changes.sql).

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
  createdAt: Date;
}

export interface NewUser {
  email: string;
  passwordHash: string;
}

export interface FailedAttemptsUpdate {
  failedLoginAttempts: number;
  accountLocked: boolean;
}

// Consecutive failed attempts that lock an account — see globalRules in
// views/login/functional-spec.json.
export const ACCOUNT_LOCK_THRESHOLD = 5;

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: NewUser): Promise<UserRecord>;
  incrementFailedAttempts(userId: string): Promise<FailedAttemptsUpdate>;
  resetFailedAttempts(userId: string): Promise<void>;
}
