import { asc, eq, sql } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import { users } from '../db/schema/index.js';
import type { PublicUser, UserRole } from '../types/auth.js';
import { AppError } from '../utils/AppError.js';

const publicUserColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  createdAt: users.createdAt,
};

/** List every account, for the admin-only Users page. */
export async function listUsers(): Promise<PublicUser[]> {
  const db = requireDb();

  return db.select(publicUserColumns).from(users).orderBy(asc(users.id));
}

/** Change a user's role. An admin cannot demote the last remaining admin. */
export async function updateUserRole(id: number, role: UserRole): Promise<PublicUser> {
  const db = requireDb();

  return db.transaction(async (tx) => {
    // Prevent two admins from demoting each other at the same moment and
    // leaving the system with no admin.
    await tx.execute(sql`select pg_advisory_xact_lock(742012)`);

    const [target] = await tx
      .select(publicUserColumns)
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!target) {
      throw new AppError('User not found.', 404);
    }

    if (target.role === 'admin' && role !== 'admin') {
      const [admins] = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'admin'));

      if ((admins?.value ?? 0) <= 1) {
        throw new AppError(
          'This is the last admin account. Promote another user first.',
          400,
        );
      }
    }

    if (target.role === role) {
      return target;
    }

    const [updated] = await tx
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning(publicUserColumns);

    if (!updated) {
      throw new AppError('Could not update the user.', 500);
    }

    return updated;
  });
}

/** Delete an account. Admins cannot delete themselves or the last admin. */
export async function deleteUser(id: number, currentUserId: number): Promise<void> {
  if (id === currentUserId) {
    throw new AppError('You cannot delete your own account.', 400);
  }

  const db = requireDb();

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(742012)`);

    const [target] = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!target) {
      throw new AppError('User not found.', 404);
    }

    if (target.role === 'admin') {
      const [admins] = await tx
        .select({ value: sql<number>`count(*)::int` })
        .from(users)
        .where(eq(users.role, 'admin'));

      if ((admins?.value ?? 0) <= 1) {
        throw new AppError(
          'This is the last admin account and cannot be deleted.',
          400,
        );
      }
    }

    await tx.delete(users).where(eq(users.id, id));
  });
}
