import { z } from 'zod';
import {
  booleanQuerySchema,
  moneySchema,
  paginationSchema,
  quantitySchema,
  searchSchema,
} from './common.validator.js';

const supplierIdSchema = z
  .union([z.coerce.number().int().positive(), z.null()])
  .optional();

/**
 * Body for POST /api/products and PUT /api/products/:id.
 * The prices and stock values are coerced because HTML number inputs send
 * strings, and some API clients send numbers. Both are accepted.
 */
export const productInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Product name is required.')
    .max(150, 'Product name must be 150 characters or fewer.'),
  description: z
    .string()
    .trim()
    .max(2_000, 'Description must be 2000 characters or fewer.')
    .optional(),
  category: z
    .string()
    .trim()
    .min(1, 'Category is required.')
    .max(80, 'Category must be 80 characters or fewer.'),
  sellingPrice: moneySchema,
  purchaseCost: moneySchema,
  stock: quantitySchema.default(0),
  reorderLevel: quantitySchema.default(10),
  supplierId: supplierIdSchema,
});

export const productQuerySchema = paginationSchema.extend({
  search: searchSchema,
  category: z.string().trim().max(80).optional(),
  supplierId: z.coerce.number().int().positive().optional(),
  lowStock: booleanQuerySchema,
  sort: z
    .enum(['name', 'newest', 'stock', 'price'])
    .default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
