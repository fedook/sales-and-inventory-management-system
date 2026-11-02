import type { RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';

/**
 * Controllers are thin: they read the (already validated) request,
 * call a service, and send a consistent JSON response.
 */
export const register: RequestHandler = async (req, res) => {
  const result = await authService.register(req.body as RegisterInput);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: result,
  });
};

export const login: RequestHandler = async (req, res) => {
  const result = await authService.login(req.body as LoginInput);

  res.status(200).json({
    success: true,
    message: 'Signed in successfully.',
    data: result,
  });
};

/** Returns the user belonging to the Bearer token. */
export const me: RequestHandler = (req, res) => {
  const user = getAuthenticatedUser(req);

  res.status(200).json({
    success: true,
    data: { user },
  });
};

/**
 * JWTs are stateless: there is no server-side session to destroy.
 * The client deletes its stored token; this endpoint exists so the frontend
 * has one clear "sign out" call and so the request can be audited later.
 */
export const logout: RequestHandler = (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Signed out successfully.',
  });
};
