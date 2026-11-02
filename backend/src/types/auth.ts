import { z } from 'zod';

/**
 * The four roles/values are also PostgreSQL enums (see db/schema/enums.ts).
 * Keeping a Zod version here lets the API reject anything the database
 * would refuse, with a friendly message instead of a SQL error.
 */
export const userRoleSchema = z.enum(['admin', 'staff']);

export type UserRole = z.infer<typeof userRoleSchema>;

/**
 * A user as returned by the API. The password hash is NEVER part of this
 * shape, so it cannot leak through a response by accident.
 */
export interface PublicUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

/** What the login and register endpoints return. */
export interface AuthResult {
  token: string;
  user: PublicUser;
}
