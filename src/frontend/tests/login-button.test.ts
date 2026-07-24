// elementId: login-button
import { describe, it, expect } from 'bun:test';
import '../src/login-view';
import type { LoginView } from '../src/login-view';
import type { AuthApiService } from '../src/auth-api-service';

function mountLoginView(authService: AuthApiService): LoginView {
  const el = document.createElement('app-login-view') as LoginView;
  el.authService = authService;
  document.body.appendChild(el);
  return el;
}

function fillField(el: LoginView, elementId: string, value: string): void {
  const input = el.shadowRoot!.querySelector(`[data-element-id="${elementId}"]`) as HTMLInputElement;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function clickLogin(el: LoginView): void {
  const button = el.shadowRoot!.querySelector('[data-element-id="login-button"]') as HTMLButtonElement;
  button.click();
}

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe('elementId: login-button', () => {
  it('does not call the auth service when email-input or password-input is invalid', () => {
    let called = false;
    const fakeService: AuthApiService = {
      login: async () => {
        called = true;
        return { status: 200, body: { redirectTo: '/dashboard' } };
      },
    };
    const el = mountLoginView(fakeService);
    fillField(el, 'email-input', '');
    fillField(el, 'password-input', '');
    clickLogin(el);
    expect(called).toBe(false);
  });

  it('enters a disabled/loading state immediately after being clicked with two valid fields', () => {
    const fakeService: AuthApiService = {
      login: () => new Promise(() => {}),
    };
    const el = mountLoginView(fakeService);
    fillField(el, 'email-input', 'ana@example.com');
    fillField(el, 'password-input', 'whatever');
    clickLogin(el);
    const button = el.shadowRoot!.querySelector('[data-element-id="login-button"]') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('dispatches app:login-succeeded with redirectTo after a 200 response — shape copied from api-contracts.md, not invented', async () => {
    const fakeService: AuthApiService = {
      login: async () => ({ status: 200, body: { redirectTo: '/dashboard' } }),
    };
    const el = mountLoginView(fakeService);
    let detail: { redirectTo: string } | undefined;
    el.addEventListener('app:login-succeeded', (e) => {
      detail = (e as CustomEvent<{ redirectTo: string }>).detail;
    });
    fillField(el, 'email-input', 'ana@example.com');
    fillField(el, 'password-input', 'correct-password');
    clickLogin(el);
    await wait();
    expect(detail).toEqual({ redirectTo: '/dashboard' });
  });

  it('shows "Incorrect email or password" after a 401 invalid_credentials response — shape from api-contracts.md', async () => {
    const fakeService: AuthApiService = {
      login: async () => ({ status: 401, body: { error: 'invalid_credentials' } }),
    };
    const el = mountLoginView(fakeService);
    fillField(el, 'email-input', 'ana@example.com');
    fillField(el, 'password-input', 'wrong-password');
    clickLogin(el);
    await wait();
    const error = el.shadowRoot!.querySelector('[data-element-id="login-error-message"]');
    expect(error?.textContent).toBe('Incorrect email or password');
  });

  it('shows the account-locked message after a 403 account_locked response — shape from api-contracts.md', async () => {
    const fakeService: AuthApiService = {
      login: async () => ({ status: 403, body: { error: 'account_locked' } }),
    };
    const el = mountLoginView(fakeService);
    fillField(el, 'email-input', 'ana@example.com');
    fillField(el, 'password-input', 'whatever');
    clickLogin(el);
    await wait();
    const error = el.shadowRoot!.querySelector('[data-element-id="login-error-message"]');
    expect(error?.textContent).toBe(
      'This account has been locked due to too many failed attempts. Contact support.',
    );
  });

  it('returns to its default (non-loading) state after any response', async () => {
    const fakeService: AuthApiService = {
      login: async () => ({ status: 401, body: { error: 'invalid_credentials' } }),
    };
    const el = mountLoginView(fakeService);
    fillField(el, 'email-input', 'ana@example.com');
    fillField(el, 'password-input', 'wrong-password');
    clickLogin(el);
    await wait();
    const button = el.shadowRoot!.querySelector('[data-element-id="login-button"]') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });
});
