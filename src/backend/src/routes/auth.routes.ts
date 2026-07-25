// elementId: login-button — POST /api/auth/login (views/login/api-contracts.md).
import { Router } from 'express';
import { z } from 'zod';
import type { AuthService } from '../services/auth.service';

// "Must contain '@' followed by at least one more character" (functional-spec.json,
// email-input.businessRules) — a syntactic shape check only, not full RFC validation; the
// server is the source of truth for whether the account actually exists.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+$/;

const loginBodySchema = z.object({
  email: z.string().regex(EMAIL_SHAPE, 'invalid_email_shape'),
  password: z.string().min(1),
});

export function authRouter(authService: AuthService): Router {
  const router = Router();

  router.post('/login', async (req, res) => {
    const parsed = loginBodySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    const { email, password } = parsed.data;
    const result = await authService.login(email, password);

    if (result.ok) {
      res.status(200).json({ redirectTo: '/dashboard' });
      return;
    }

    if (result.reason === 'account_locked') {
      res.status(403).json({ error: 'account_locked' });
      return;
    }

    res.status(401).json({ error: 'invalid_credentials' });
  });

  return router;
}
