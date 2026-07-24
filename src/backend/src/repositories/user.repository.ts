export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  failedLoginAttempts: number;
  accountLocked: boolean;
  createdAt: Date;
}

export interface CreateUserInput {
  email: string;
  passwordHash: string;
}

export interface FailedAttemptsUpdate {
  failedLoginAttempts: number;
  accountLocked: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<UserRecord | null>;
  create(data: CreateUserInput): Promise<UserRecord>;
  incrementFailedAttempts(userId: string): Promise<FailedAttemptsUpdate>;
  resetFailedAttempts(userId: string): Promise<void>;
}
