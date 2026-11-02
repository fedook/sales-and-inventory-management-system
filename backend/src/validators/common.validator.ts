import { z } from 'zod';

/** Route parameter used by every "/:id" endpoint. */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive number.'),
});

/**
 * Base query schema for list endpoints.
 * Values arrive as strings, so `z.coerce` converts them to numbers.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/** A search box value: trimmed, optional, and ignored when empty. */
export const searchSchema = z.string().trim().max(100).optional();

/** Accepts true/false only; a plain coerce would treat "false" as true. */
export const booleanQuerySchema = z.enum(['true', 'false']).optional();

/** A calendar date used by report filters, for example 2026-11-02. */
export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.')
  .optional();

/**
 * Optional free-text database column (description, address...).
 * The UI sends "" for an empty field; the services convert that to null.
 */
export const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).optional();

/**
 * A money value. The API rejects negative amounts and rounds to two
 * decimals before saving, matching NUMERIC(12, 2).
 */
export const moneySchema = z.coerce
  .number()
  .finite('Enter a valid amount.')
  .min(0, 'Amount cannot be negative.')
  .max(9_999_999_999.99, 'Amount is too large.');

/** A whole number of units (stock, reorder level, delivery days). */
export const quantitySchema = z.coerce
  .number()
  .int('Use a whole number.')
  .min(0, 'Quantity cannot be negative.')
  .max(1_000_000, 'Quantity is too large.');

export type IdParamInput = z.infer<typeof idParamSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
