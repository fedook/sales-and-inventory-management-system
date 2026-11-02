import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../types/auth.js';
import { AppError } from './AppError.js';

const TOKEN_ISSUER = 'sales-inventory-api';

export interface AccessTokenPayload {
  userId: number;
  role: UserRole;
  email: string;
}

/**
 * Create a signed JWT for a user.
 *
 * The signature proves the token was issued by this API; the payload only
 * contains non-sensitive identifiers (never the password hash).
 */
export function signAccessToken(input: AccessTokenPayload): string {
  if (!env.JWT_SECRET) {
    throw new AppError(
      'Authentication is not configured. Set JWT_SECRET in backend/.env.',
      503,
    );
  }

  return jwt.sign({ role: input.role, email: input.email }, env.JWT_SECRET, {
    subject: String(input.userId),
    issuer: TOKEN_ISSUER,
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60,
  });
}

/**
 * Verify a token from the Authorization header.
 * Any problem (expired, tampered, wrong signature) becomes a 401.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  if (!env.JWT_SECRET) {
    throw new AppError(
      'Authentication is not configured. Set JWT_SECRET in backend/.env.',
      503,
    );
  }

  let decoded: string | JwtPayload;

  try {
    decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: TOKEN_ISSUER,
      algorithms: ['HS256'],
    });
  } catch {
    throw new AppError('Your session is invalid or has expired. Please sign in again.', 401);
  }

  if (typeof decoded === 'string' || !decoded.sub) {
    throw new AppError('Your session is invalid. Please sign in again.', 401);
  }

  const userId = Number(decoded.sub);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new AppError('Your session is invalid. Please sign in again.', 401);
  }

  if (decoded.role !== 'admin' && decoded.role !== 'staff') {
    throw new AppError('Your session is invalid. Please sign in again.', 401);
  }

  return {
    userId,
    role: decoded.role,
    email: typeof decoded.email === 'string' ? decoded.email : '',
  };
}
