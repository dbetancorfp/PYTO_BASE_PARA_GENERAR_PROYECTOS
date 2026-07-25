// elementId: password-toggle-button
import { describe, it, expect } from 'bun:test';
import '../src/login-view';
import type { LoginView } from '../src/login-view';
import type { AuthApiService } from '../src/auth-api-service';

const neverCalledService: AuthApiService = {
  login: async () => {
    throw new Error('should not be called in these tests');
  },
};

function mount(): LoginView {
  const el = document.createElement('app-login-view') as LoginView;
  el.authService = neverCalledService;
  document.body.appendChild(el);
  return el;
}

function toggleButton(el: LoginView): HTMLButtonElement {
  return el.shadowRoot!.querySelector('[data-element-id="password-toggle-button"]') as HTMLButtonElement;
}

describe('elementId: password-toggle-button', () => {
  it('has an accessible label announcing "Show password" by default', () => {
    const el = mount();
    expect(toggleButton(el).getAttribute('aria-label')).toBe('Show password');
  });

  it('updates its accessible label to "Hide password" after being clicked once', () => {
    const el = mount();
    toggleButton(el).click();
    expect(toggleButton(el).getAttribute('aria-label')).toBe('Hide password');
  });

  it('reverts its accessible label back to "Show password" after a second click', () => {
    const el = mount();
    toggleButton(el).click();
    toggleButton(el).click();
    expect(toggleButton(el).getAttribute('aria-label')).toBe('Show password');
  });
});
