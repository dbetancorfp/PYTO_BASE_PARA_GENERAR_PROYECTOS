// Production implementation of `AuthApiService` (see auth-api-service.ts) — calls the real
// backend over HTTP. Injected into `LoginView` by main.ts; tests inject a fake instead.
import type { AuthApiService, LoginResponse } from './auth-api-service';

export class HttpAuthApiService implements AuthApiService {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await response.json();
    return { status: response.status, body } as LoginResponse;
  }
}
