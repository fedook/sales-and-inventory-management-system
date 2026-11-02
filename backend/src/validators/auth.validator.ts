import { z } from 'zod';
import { userRoleSchema } from '../types/auth.js';

/**
 * Shared email rule: trimmed, valid, lowercased in the service layer so that
 * "Owner@Shop.com" and "owner@shop.com" cannot create two accounts.
 */
const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .max(255, 'Email must be 255 characters or fewer.')
  .pipe(z.email('Enter a valid email address.'));

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  // bcrypt ignores anything after 72 bytes, so reject longer input instead
  // of silently accepting a password that is not fully checked.
  .max(72, 'Password must be 72 characters or fewer.');

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(120, 'Name must be 120 characters or fewer.'),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.').max(72),
});

export const updateRoleSchema = z.object({
  role: userRoleSchema,
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive number.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
