// Bootstrap entry point — registers app-login-view (side-effect import) and wires its
// injected authService to the real AuthApiClient. This file, not login-view.ts itself,
// owns the DIP injection decision for the real app (unit tests inject their own fakes
// instead, see src/frontend/tests/).
import './login-view';
import { AuthApiClient } from './auth-api-service';
import type { LoginView } from './login-view';

const view = document.querySelector('app-login-view') as LoginView | null;
if (view) {
  view.authService = new AuthApiClient();
}
