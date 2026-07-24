// elementId: forgot-password-link
import { describe, it, expect } from 'bun:test';
import '../src/login-view';
import type { LoginView } from '../src/login-view';
import type { AuthApiService } from '../src/auth-api-service';

describe('elementId: forgot-password-link', () => {
  it('is present and visible below the login button on first load', () => {
    const el = document.createElement('app-login-view') as LoginView;
    el.authService = {
      login: async () => {
        throw new Error('not used');
      },
    };
    document.body.appendChild(el);
    const link = el.shadowRoot!.querySelector('[data-element-id="forgot-password-link"]');
    expect(link).not.toBeNull();
  });

  it('does not navigate or call the auth service when clicked', () => {
    let called = false;
    const fakeService: AuthApiService = {
      login: async () => {
        called = true;
        return { status: 200, body: { redirectTo: '/dashboard' } };
      },
    };
    const el = document.createElement('app-login-view') as LoginView;
    el.authService = fakeService;
    document.body.appendChild(el);
    const link = el.shadowRoot!.querySelector('[data-element-id="forgot-password-link"]') as HTMLAnchorElement;
    link.click();
    expect(called).toBe(false);
  });
});
