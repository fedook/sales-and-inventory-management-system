import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load variables from backend/.env into process.env.
dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

/**
 * Treat empty strings in .env (for example "JWT_SECRET=") as "not provided".
 * This keeps the API usable in Phase 1, before Neon and JWT are configured.
 */
const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

const optionalDatabaseUrl = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .trim()
    .min(1, 'DATABASE_URL cannot be empty')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must start with postgresql:// (copy the full Neon connection string)',
    )
    .optional(),
);

const optionalJwtSecret = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters long')
    .optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(7000),
  FRONTEND_URL: z.url().default('http://localhost:5173'),
  DATABASE_URL: optionalDatabaseUrl,
  JWT_SECRET: optionalJwtSecret,
  /** How long a login stays valid before the user must sign in again. */
  JWT_EXPIRES_IN_DAYS: z.coerce.number().int().min(1).max(365).default(7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables in backend/.env:');
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;

/**
 * These flags let later phases fail with a clear message instead of a
 * confusing crash when a service has not been configured yet.
 */
export const isDatabaseConfigured = env.DATABASE_URL !== undefined;
export const isAuthConfigured = env.JWT_SECRET !== undefined;
