// Contract copied from views/login/api-contracts.md ("POST /api/auth/login") — this file
// only declares the client-side shape and a concrete `fetch`-based implementation of it. It
// does not implement the endpoint itself; that is backend-implementer's responsibility.

export interface LoginSuccessResponse {
  status: 200;
  body: { redirectTo: string };
}

export interface LoginBadRequestResponse {
  status: 400;
  body: unknown;
}

export interface LoginInvalidCredentialsResponse {
  status: 401;
  body: { error: 'invalid_credentials' };
}

export interface LoginAccountLockedResponse {
  status: 403;
  body: { error: 'account_locked' };
}

export type LoginResponse =
  | LoginSuccessResponse
  | LoginBadRequestResponse
  | LoginInvalidCredentialsResponse
  | LoginAccountLockedResponse;

/**
 * Minimal interface `login-view.ts` depends on (ISP: it only needs `login`, nothing else
 * from a broader "auth" or "http" abstraction). Injected as `authService` after
 * `document.createElement('app-login-view')`, never instantiated inside the component
 * (DIP) — that's what makes it swappable for a fake in unit tests.
 */
export interface AuthApiService {
  login(email: string, password: string): Promise<LoginResponse>;
}

/**
 * Concrete implementation used in production, calling the real endpoint documented in
 * views/login/api-contracts.md. Not exercised by the red unit tests (they inject fakes),
 * but required so the view is actually wired to a working service once mounted — CLAUDE.md
 * forbids leaving a documented mechanism unimplemented.
 */
export class AuthApiClient implements AuthApiService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body: unknown = await response.json();
    return { status: response.status, body } as LoginResponse;
  }
}
