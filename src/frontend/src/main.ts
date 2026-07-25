// Bootstrap entry point — registers every view's custom element and wires its injected
// service properties to real concrete clients. One static index.html serves every view;
// the backend routes each view's `ui-spec.json` route to this same entry point.
import './login-view';
import { HttpAuthApiService } from './http-auth-api-service';

const loginView = document.querySelector('app-login-view');
if (loginView) {
  (loginView as HTMLElement & { authService: HttpAuthApiService }).authService =
    new HttpAuthApiService();
}
