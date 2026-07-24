import { html, render } from 'lit-html';
import { attachSharedStyles } from './styles/shadow-styles';
import { classesFor } from './styles/classes-for';
import type { AuthApiService } from './auth-api-service';

const INVALID_CREDENTIALS_MESSAGE = 'Incorrect email or password';
const ACCOUNT_LOCKED_MESSAGE =
  'This account has been locked due to too many failed attempts. Contact support.';
const UNEXPECTED_ERROR_MESSAGE = 'Something went wrong. Please try again.';

function isValidEmailShape(value: string): boolean {
  const atIndex = value.indexOf('@');
  return atIndex >= 0 && atIndex < value.length - 1;
}

function isNonEmptyPassword(value: string): boolean {
  return value.length > 0;
}

/**
 * `app-login-view` — the whole login screen (route `/login`) as a single custom element
 * with a single Shadow DOM, holding all 7 elements from views/login/ui-spec.json as plain
 * native elements tagged with `data-element-id` (CLAUDE.md's "no nested Shadow DOM" rule).
 */
export class LoginView extends HTMLElement {
  /** Injected by the caller after `document.createElement('app-login-view')` (DIP) — only
   * read lazily, when the user actually submits, never required before first render. */
  public authService!: AuthApiService;

  private _email = '';
  private _password = '';
  private _submitAttempted = false;
  private _passwordRevealed = false;
  private _loading = false;
  private _errorMessage: string | null = null;

  connectedCallback(): void {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    attachSharedStyles(this.shadowRoot!);
    this._render();
  }

  private get _emailInvalid(): boolean {
    return this._submitAttempted && !isValidEmailShape(this._email);
  }

  private get _passwordInvalid(): boolean {
    return this._submitAttempted && !isNonEmptyPassword(this._password);
  }

  private _handleEmailInput(event: Event): void {
    this._email = (event.target as HTMLInputElement).value;
    this._render();
  }

  private _handlePasswordInput(event: Event): void {
    this._password = (event.target as HTMLInputElement).value;
    this._render();
  }

  private _handleTogglePasswordVisibility(): void {
    this._passwordRevealed = !this._passwordRevealed;
    this._render();
  }

  private _handleForgotPasswordClick(event: Event): void {
    // Out of scope per views/login/use-cases.md UC-04 — intentionally a no-op.
    event.preventDefault();
  }

  private async _handleLoginClick(): Promise<void> {
    this._submitAttempted = true;
    this._render();
    if (this._emailInvalid || this._passwordInvalid) {
      return;
    }

    this._loading = true;
    this._errorMessage = null;
    this._render();

    try {
      const response = await this.authService.login(this._email, this._password);
      switch (response.status) {
        case 200:
          this.dispatchEvent(
            new CustomEvent('app:login-succeeded', {
              bubbles: true,
              composed: true,
              detail: { redirectTo: response.body.redirectTo },
            }),
          );
          window.location.assign(response.body.redirectTo);
          break;
        case 401:
          this._errorMessage = INVALID_CREDENTIALS_MESSAGE;
          break;
        case 403:
          this._errorMessage = ACCOUNT_LOCKED_MESSAGE;
          break;
        default:
          // 400 (malformed request) isn't expected once client-side validation passed —
          // shown generically rather than inventing a per-field message the server didn't
          // send. Not covered by a red test; see Step 4 report.
          this._errorMessage = UNEXPECTED_ERROR_MESSAGE;
      }
    } finally {
      this._loading = false;
      this._render();
    }
  }

  private _renderEyeIcon(): ReturnType<typeof html> {
    return this._passwordRevealed
      ? html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 3l18 18" stroke-linecap="round" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" stroke-linecap="round" />
          <path
            d="M6.5 6.7C4.3 8.2 2.7 10.3 2 12c1.6 3.6 5.2 7 10 7 1.7 0 3.3-.4 4.7-1.1M9.9 4.2C10.6 4.1 11.3 4 12 4c4.8 0 8.4 3.4 10 7-.5 1.1-1.1 2.2-1.9 3.1"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>`
      : html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M2 12c1.6-3.6 5.2-7 10-7s8.4 3.4 10 7c-1.6 3.6-5.2 7-10 7s-8.4-3.4-10-7z" stroke-linejoin="round" />
          <circle cx="12" cy="12" r="3" />
        </svg>`;
  }

  private _render(): void {
    const passwordType = this._passwordRevealed ? 'text' : 'password';
    const toggleLabel = this._passwordRevealed ? 'Hide password' : 'Show password';

    render(
      html`
        <div class="mx-auto flex max-w-sm flex-col gap-4 p-6">
          <h1 data-element-id="login-heading" class="${classesFor('heading')}">Sign in</h1>

          <div class="flex flex-col gap-1">
            <label for="login-email" class="text-sm font-medium text-slate-700">Email</label>
            <input
              id="login-email"
              type="email"
              data-element-id="email-input"
              placeholder="you@example.com"
              class="${classesFor('text-input', this._emailInvalid ? 'danger' : undefined)}"
              aria-invalid="${this._emailInvalid ? 'true' : 'false'}"
              .value="${this._email}"
              @input="${(event: Event): void => this._handleEmailInput(event)}"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="login-password" class="text-sm font-medium text-slate-700">Password</label>
            <div class="relative">
              <input
                id="login-password"
                type="${passwordType}"
                data-element-id="password-input"
                class="${classesFor('password-input', this._passwordInvalid ? 'danger' : undefined)}"
                aria-invalid="${this._passwordInvalid ? 'true' : 'false'}"
                .value="${this._password}"
                @input="${(event: Event): void => this._handlePasswordInput(event)}"
              />
              <button
                type="button"
                data-element-id="password-toggle-button"
                aria-label="${toggleLabel}"
                class="${classesFor('icon-button', 'ghost', 'sm')} absolute inset-y-0 right-1 my-auto"
                @click="${(): void => this._handleTogglePasswordVisibility()}"
              >
                ${this._renderEyeIcon()}
              </button>
            </div>
          </div>

          ${this._errorMessage
            ? html`<p data-element-id="login-error-message" aria-live="assertive" class="${classesFor('paragraph', 'danger')}">${this._errorMessage}</p>`
            : ''}

          <button
            type="button"
            data-element-id="login-button"
            ?disabled="${this._loading}"
            class="${classesFor('submit-button', 'primary', 'md')}"
            @click="${(): void => {
              void this._handleLoginClick();
            }}"
          >
            ${this._loading ? 'Signing in…' : 'Sign in'}
          </button>

          <a
            href="#"
            data-element-id="forgot-password-link"
            class="${classesFor('link')}"
            @click="${(event: Event): void => this._handleForgotPasswordClick(event)}"
          >
            Forgot your password?
          </a>
        </div>
      `,
      this.shadowRoot!,
    );
  }
}

customElements.define('app-login-view', LoginView);
