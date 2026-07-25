// elementId: login-error-message
import { describe, it, expect } from 'bun:test';
import '../src/login-view';
import type { LoginView } from '../src/login-view';

describe('elementId: login-error-message', () => {
  it('is not present/visible on first load', () => {
    const el = document.createElement('app-login-view') as LoginView;
    el.authService = {
      login: async () => {
        throw new Error('not used');
      },
    };
    document.body.appendChild(el);
    const error = el.shadowRoot!.querySelector('[data-element-id="login-error-message"]');
    expect(error).toBeNull();
  });
});
