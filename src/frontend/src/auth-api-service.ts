// Response shape copied verbatim from views/login/api-contracts.md — POST /api/auth/login.
// This file declares the contract `login-view.ts` depends on; it does not implement the
// HTTP call itself (that's a concrete service injected by whatever wires the app together).

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

export interface AuthApiService {
  login(email: string, password: string): Promise<LoginResponse>;
}
