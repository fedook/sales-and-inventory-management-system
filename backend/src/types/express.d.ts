import type { PublicUser } from './auth.js';

/**
 * Makes `req.user` available on every Express request after the
 * `authenticate` middleware has run.
 *
 * This file is a "declaration file": TypeScript reads it for types only.
 */
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
      /**
       * Parsed query string. Set by the validateQuery middleware; the
       * controller casts it to the schema's inferred type.
       */
      validatedQuery?: unknown;
    }
  }
}

export {};
