import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimit } from '../middleware/rateLimit.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { loginSchema, registerSchema } from '../validators/auth.validator.js';

export const authRouter = Router();

/**
 * Limit repeated sign-in / sign-up attempts from the same client.
 * 20 attempts per 10 minutes is generous for a human but stops simple
 * password-guessing scripts.
 */
const authRateLimit = rateLimit({
  windowMs: 10 * 60 * 1_000,
  max: 20,
  message: 'Too many authentication attempts.',
});

authRouter.post('/register', authRateLimit, validateBody(registerSchema), register);
authRouter.post('/login', authRateLimit, validateBody(loginSchema), login);
authRouter.post('/logout', authenticate, logout);
authRouter.get('/me', authenticate, me);
