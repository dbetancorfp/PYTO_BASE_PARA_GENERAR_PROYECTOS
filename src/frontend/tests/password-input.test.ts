// elementId: password-input
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

function field(el: LoginView, id: string): HTMLInputElement {
  return el.shadowRoot!.querySelector(`[data-element-id="${id}"]`) as HTMLInputElement;
}

function setValue(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

describe('elementId: password-input', () => {
  it('renders masked (type=password) by default', () => {
    const el = mount();
    expect(field(el, 'password-input').type).toBe('password');
  });

  it('shows an inline validation message and blocks submit when empty', () => {
    const el = mount();
    setValue(field(el, 'email-input'), 'ana@example.com');
    (el.shadowRoot!.querySelector('[data-element-id="login-button"]') as HTMLButtonElement).click();
    expect(field(el, 'password-input').getAttribute('aria-invalid')).toBe('true');
  });

  it('clears its invalid state as soon as the value becomes non-empty, without a new submit', () => {
    const el = mount();
    setValue(field(el, 'email-input'), 'ana@example.com');
    (el.shadowRoot!.querySelector('[data-element-id="login-button"]') as HTMLButtonElement).click();
    expect(field(el, 'password-input').getAttribute('aria-invalid')).toBe('true');

    setValue(field(el, 'password-input'), 'something');
    expect(field(el, 'password-input').getAttribute('aria-invalid')).not.toBe('true');
  });

  it('switches to plain text after password-toggle-button is clicked, and back after a second click', () => {
    const el = mount();
    const toggle = el.shadowRoot!.querySelector('[data-element-id="password-toggle-button"]') as HTMLButtonElement;
    const password = field(el, 'password-input');
    toggle.click();
    expect(password.type).toBe('text');
    toggle.click();
    expect(password.type).toBe('password');
  });
});
