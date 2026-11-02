import { eq, sql } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import { users } from '../db/schema/index.js';
import type { AuthResult, PublicUser, UserRole } from '../types/auth.js';
import type { LoginInput, RegisterInput } from '../validators/auth.validator.js';
import { AppError } from '../utils/AppError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';
import { signAccessToken } from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

/**
 * Columns that are safe to send to the client.
 * `password` is deliberately absent.
 */
const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
};

/** Emails are stored and compared in lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function createAuthResult(user: PublicUser): AuthResult {
  return {
    token: signAccessToken({ userId: user.id, role: user.role, email: user.email }),
    user,
  };
}

/**
 * Register a new staff account.
 *
 * The very first account becomes the admin, because a brand-new installation
 * needs an owner who can manage the system. Every later sign-up is a staff
 * account; an admin can promote people from the Users page.
 */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const db = requireDb();
  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  try {
    const user = await db.transaction(async (tx) => {
      // Serialize account creation so two simultaneous first sign-ups cannot
      // both become admin. The lock is released automatically at COMMIT.
      await tx.execute(sql`select pg_advisory_xact_lock(742011)`);

      const [existing] = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existing) {
        throw new AppError('An account with this email already exists.', 409);
      }

      const [counts] = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(users);

      const isFirstAccount = (counts?.value ?? 0) === 0;
      const role: UserRole = isFirstAccount ? 'admin' : 'staff';

      const [created] = await tx
        .insert(users)
        .values({
          name: input.name,
          email,
          password: passwordHash,
          role,
        })
        .returning(publicUserColumns);

      if (!created) {
        throw new AppError('Could not create the account. Please try again.', 500);
      }

      return created;
    });

    return createAuthResult(user);
  } catch (error) {
    // Also covers the tiny race between the duplicate check and the insert.
    if (isUniqueViolation(error)) {
      throw new AppError('An account with this email already exists.', 409);
    }

    throw error;
  }
}

/**
 * Check an email/password pair.
 *
 * The same message is used for "unknown email" and "wrong password" so an
 * attacker cannot discover which emails are registered.
 */
export async function login(input: LoginInput): Promise<AuthResult> {
  const db = requireDb();
  const email = normalizeEmail(input.email);

  const [user] = await db
    .select({ ...publicUserColumns, password: users.password })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  const passwordMatches = user
    ? await verifyPassword(input.password, user.password)
    : false;

  if (!user || !passwordMatches) {
    throw new AppError('Email or password is incorrect.', 401);
  }

  const { password: _passwordHash, ...publicUser } = user;

  return createAuthResult(publicUser);
}

/** Load the current user (used by GET /api/auth/me). */
export async function getUserById(id: number): Promise<PublicUser> {
  const db = requireDb();

  const [user] = await db
    .select(publicUserColumns)
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  if (!user) {
    throw new AppError('User not found.', 404);
  }

  return user;
}
