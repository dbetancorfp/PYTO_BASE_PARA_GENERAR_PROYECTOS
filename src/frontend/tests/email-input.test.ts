// elementId: email-input
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

function submit(el: LoginView): void {
  (el.shadowRoot!.querySelector('[data-element-id="login-button"]') as HTMLButtonElement).click();
}

describe('elementId: email-input', () => {
  it('shows an inline validation message and blocks submit when empty', () => {
    const el = mount();
    setValue(field(el, 'password-input'), 'something');
    submit(el);
    expect(field(el, 'email-input').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows an inline validation message when the value has no "@"', () => {
    const el = mount();
    setValue(field(el, 'email-input'), 'not-an-email');
    setValue(field(el, 'password-input'), 'something');
    submit(el);
    expect(field(el, 'email-input').getAttribute('aria-invalid')).toBe('true');
  });

  it('shows an inline validation message when "@" has nothing after it', () => {
    const el = mount();
    setValue(field(el, 'email-input'), 'ana@');
    setValue(field(el, 'password-input'), 'something');
    submit(el);
    expect(field(el, 'email-input').getAttribute('aria-invalid')).toBe('true');
  });

  it('clears its invalid state as soon as the value becomes a valid email, without a new submit', () => {
    const el = mount();
    setValue(field(el, 'password-input'), 'something');
    submit(el);
    expect(field(el, 'email-input').getAttribute('aria-invalid')).toBe('true');

    setValue(field(el, 'email-input'), 'ana@example.com');
    expect(field(el, 'email-input').getAttribute('aria-invalid')).not.toBe('true');
  });
});
