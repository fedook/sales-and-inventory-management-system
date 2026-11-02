import bcrypt from 'bcrypt';

/**
 * bcrypt cost factor. 10 is a good balance for a small business app:
 * strong enough, but fast enough that login does not feel slow.
 * Increase it later if you move to dedicated hardware.
 */
const SALT_ROUNDS = 10;

/** Hash a plain-text password before storing it. */
export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Compare a login attempt with the stored hash.
 * bcrypt.compare is time-safe and never "decrypts" the hash.
 */
export function verifyPassword(
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}
