import { html, nothing, render } from 'lit-html';
import { attachSharedStyles } from './styles/shadow-styles';
import { classesFor } from './styles/classes-for';
import type {
  AuthApiService,
  LoginAccountLockedResponse,
  LoginBadRequestResponse,
  LoginInvalidCredentialsResponse,
} from './auth-api-service';

export type { AuthApiService } from './auth-api-service';

function isValidEmailShape(value: string): boolean {
  // Business rule from functional-spec.json: "@" followed by at least one more character.
  return value.length > 0 && /@.+/.test(value);
}

/**
 * The `login-screen` view (views/login/ui-spec.json) — a single custom element holding
 * all 7 elements as plain native elements in one Shadow DOM, per CLAUDE.md's "no nested
 * Shadow DOM" rule. `authService` is injected after `document.createElement` and is only
 * read lazily, from the click handler, so it isn't required before first render.
 */
export class LoginView extends HTMLElement {
  authService!: AuthApiService;

  private _emailValue = '';
  private _passwordValue = '';
  private _emailInvalid = false;
  private _passwordInvalid = false;
  private _passwordRevealed = false;
  private _loading = false;
  private _errorMessage: string | null = null;

  connectedCallback(): void {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    attachSharedStyles(this.shadowRoot!);
    this._render();
  }

  private _handleEmailInput(event: Event): void {
    this._emailValue = (event.target as HTMLInputElement).value;
    if (this._emailInvalid && isValidEmailShape(this._emailValue)) {
      this._emailInvalid = false;
    }
    this._render();
  }

  private _handlePasswordInput(event: Event): void {
    this._passwordValue = (event.target as HTMLInputElement).value;
    if (this._passwordInvalid && this._passwordValue.length > 0) {
      this._passwordInvalid = false;
    }
    this._render();
  }

  private _togglePasswordVisibility(): void {
    this._passwordRevealed = !this._passwordRevealed;
    this._render();
  }

  private _focusFirstInvalidField(): void {
    const selector = this._emailInvalid
      ? '[data-element-id="email-input"]'
      : '[data-element-id="password-input"]';
    (this.shadowRoot?.querySelector(selector) as HTMLElement | null)?.focus();
  }

  private _errorMessageFor(
    response: LoginBadRequestResponse | LoginInvalidCredentialsResponse | LoginAccountLockedResponse,
  ): string {
    if (response.status === 403) {
      return 'This account has been locked due to too many failed attempts. Contact support.';
    }
    // 401, and 400 (server-side rejection our own client-side checks didn't catch) both
    // fall back to the same generic message — api-contracts.md defines no user-facing copy
    // for 400, and the view must never hint at which case occurred (see globalRules).
    return 'Incorrect email or password';
  }

  private async _handleSubmit(): Promise<void> {
    const emailValid = isValidEmailShape(this._emailValue);
    const passwordValid = this._passwordValue.length > 0;
    this._emailInvalid = !emailValid;
    this._passwordInvalid = !passwordValid;

    if (!emailValid || !passwordValid) {
      this._render();
      this._focusFirstInvalidField();
      return;
    }

    this._loading = true;
    this._errorMessage = null;
    this._render();

    const response = await this.authService.login(this._emailValue, this._passwordValue);

    this._loading = false;

    if (response.status === 200) {
      this._render();
      this.dispatchEvent(
        new CustomEvent('app:login-succeeded', {
          bubbles: true,
          composed: true,
          detail: { redirectTo: response.body.redirectTo },
        }),
      );
      window.location.href = response.body.redirectTo;
      return;
    }

    this._errorMessage = this._errorMessageFor(response);
    this._render();
  }

  private _render(): void {
    render(
      html`
        <div class="max-w-sm mx-auto p-6 space-y-4">
          <h1 data-element-id="login-heading" class="${classesFor('heading', 'default', 'md')}">
            Sign in
          </h1>

          <div>
            <label for="email-input" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              id="email-input"
              data-element-id="email-input"
              type="email"
              placeholder="you@example.com"
              class="${classesFor('text-input', this._emailInvalid ? 'danger' : 'default', 'md')}"
              aria-invalid=${this._emailInvalid ? 'true' : nothing}
              .value=${this._emailValue}
              @input=${(e: Event): void => this._handleEmailInput(e)}
            />
            ${this._emailInvalid
              ? html`<p class="${classesFor('paragraph', 'danger', 'sm')}">
                  ${this._emailValue.length === 0 ? 'Email is required' : 'Enter a valid email address'}
                </p>`
              : ''}
          </div>

          <div>
            <label for="password-input" class="block text-sm font-medium text-gray-700">Password</label>
            <div class="flex items-center gap-2">
              <input
                id="password-input"
                data-element-id="password-input"
                type="${this._passwordRevealed ? 'text' : 'password'}"
                class="${classesFor('password-input', this._passwordInvalid ? 'danger' : 'default', 'md')}"
                aria-invalid=${this._passwordInvalid ? 'true' : nothing}
                .value=${this._passwordValue}
                @input=${(e: Event): void => this._handlePasswordInput(e)}
              />
              <button
                type="button"
                data-element-id="password-toggle-button"
                class="${classesFor('icon-button', 'ghost', 'sm')}"
                aria-label=${this._passwordRevealed ? 'Hide password' : 'Show password'}
                @click=${(): void => this._togglePasswordVisibility()}
              >
                ${this._passwordRevealed ? '\u{1F648}' : '\u{1F441}'}
              </button>
            </div>
            ${this._passwordInvalid
              ? html`<p class="${classesFor('paragraph', 'danger', 'sm')}">Password is required</p>`
              : ''}
          </div>

          <button
            type="button"
            data-element-id="login-button"
            class="${classesFor('submit-button', 'primary', 'md')}"
            ?disabled=${this._loading}
            @click=${(): void => {
              void this._handleSubmit();
            }}
          >
            ${this._loading ? 'Signing in…' : 'Sign in'}
          </button>

          <a
            href="#"
            data-element-id="forgot-password-link"
            class="${classesFor('link', 'link', 'md')}"
            @click=${(e: Event): void => e.preventDefault()}
          >
            Forgot your password?
          </a>

          ${this._errorMessage
            ? html`<p data-element-id="login-error-message" aria-live="assertive" class="${classesFor('paragraph', 'danger', 'md')}">${this._errorMessage}</p>`
            : ''}
        </div>
      `,
      this.shadowRoot!,
    );
  }
}

customElements.define('app-login-view', LoginView);
