import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { AuthService } from '../services/auth.service';

// Server-side shape check only — the client (email-input) already validates syntactically
// valid email shape before ever sending a request; this is the source of truth (functional-spec.json).
const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export function authRouter(service: AuthService): Router {
  const router = Router();

  router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const parsed = loginRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'invalid_request' });
      return;
    }

    const { email, password } = parsed.data;
    const result = await service.login(email, password);

    if (result.ok) {
      res.status(200).json({ redirectTo: '/dashboard' });
      return;
    }

    const status = result.reason === 'account_locked' ? 403 : 401;
    res.status(status).json({ error: result.reason });
  });

  return router;
}
