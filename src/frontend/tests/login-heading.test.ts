// elementId: login-heading
import { describe, it, expect } from 'bun:test';
import '../src/login-view';
import type { LoginView } from '../src/login-view';

describe('elementId: login-heading', () => {
  it('is present and visible on first load', () => {
    const el = document.createElement('app-login-view') as LoginView;
    el.authService = {
      login: async () => {
        throw new Error('not used');
      },
    };
    document.body.appendChild(el);
    const heading = el.shadowRoot!.querySelector('[data-element-id="login-heading"]');
    expect(heading).not.toBeNull();
    expect(heading?.textContent?.trim().length).toBeGreaterThan(0);
  });
});
