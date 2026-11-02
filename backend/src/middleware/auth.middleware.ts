import type { Request, RequestHandler } from 'express';
import { eq } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import { users } from '../db/schema/index.js';
import type { PublicUser, UserRole } from '../types/auth.js';
import { AppError } from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/jwt.js';

/** Read "Bearer <token>" from the Authorization header. */
function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;

  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim() || null;
}

/**
 * Use on any route that requires a signed-in user:
 *
 *   router.get('/me', authenticate, controller.me);
 *
 * The token is verified first. Then the user is loaded from the database so
 * a deleted account or a role change takes effect immediately — the token
 * alone is not trusted for long-lived permissions.
 */
export const authenticate: RequestHandler = async (req, _res, next) => {
  const token = extractBearerToken(req);

  if (!token) {
    throw new AppError('Please sign in to continue.', 401);
  }

  const payload = verifyAccessToken(token);
  const db = requireDb();

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, payload.userId))
    .limit(1);

  if (!user) {
    throw new AppError('Your account no longer exists. Please sign in again.', 401);
  }

  req.user = user;
  next();
};

/**
 * Restrict a route to specific roles. Always place it AFTER `authenticate`.
 *
 *   router.get('/', authenticate, requireRole('admin'), controller.list);
 */
export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) {
      throw new AppError('Please sign in to continue.', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError('You do not have permission to perform this action.', 403);
    }

    next();
  };
}

/**
 * Controllers can call this to get a user that is guaranteed to exist.
 * It keeps TypeScript happy without using non-null assertions everywhere.
 */
export function getAuthenticatedUser(req: Request): PublicUser {
  if (!req.user) {
    throw new AppError('Please sign in to continue.', 401);
  }

  return req.user;
}
