import { z } from 'zod';
import {
  booleanQuerySchema,
  dateStringSchema,
  paginationSchema,
  searchSchema,
} from './common.validator.js';

export const inventoryMovementTypeSchema = z.enum([
  'initial',
  'restock',
  'sale',
  'return',
  'adjustment',
]);

export const stockQuerySchema = paginationSchema.extend({
  search: searchSchema,
  category: z.string().trim().max(80).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  lowStock: booleanQuerySchema,
  sort: z.enum(['name', 'stock', 'value', 'newest']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export const movementQuerySchema = paginationSchema
  .extend({
    productId: z.coerce.number().int().positive().optional(),
    movementType: inventoryMovementTypeSchema.optional(),
    from: dateStringSchema,
    to: dateStringSchema,
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (query) => !query.from || !query.to || query.from <= query.to,
    {
      message: 'The start date cannot be after the end date.',
      path: ['from'],
    },
  );

export const restockInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce
    .number()
    .int('Use a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(1_000_000, 'Quantity is too large.'),
  reason: z
    .string()
    .trim()
    .max(255, 'Reason must be 255 characters or fewer.')
    .optional(),
});

export type StockQueryInput = z.infer<typeof stockQuerySchema>;
export type MovementQueryInput = z.infer<typeof movementQuerySchema>;
export type RestockInput = z.infer<typeof restockInputSchema>;
export type InventoryMovementType = z.infer<typeof inventoryMovementTypeSchema>;
