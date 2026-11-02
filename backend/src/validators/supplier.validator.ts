import { z } from 'zod';
import { paginationSchema, quantitySchema, searchSchema } from './common.validator.js';

export const supplierInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Supplier name is required.')
    .max(120, 'Supplier name must be 120 characters or fewer.'),
  contactInformation: z
    .string()
    .trim()
    .max(255, 'Contact information must be 255 characters or fewer.')
    .optional(),
  address: z
    .string()
    .trim()
    .max(2_000, 'Address must be 2000 characters or fewer.')
    .optional(),
  averageDeliveryTime: z
    .union([quantitySchema, z.null()])
    .optional(),
});

export const supplierQuerySchema = paginationSchema.extend({
  search: searchSchema,
  sort: z.enum(['name', 'newest', 'delivery']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type SupplierQueryInput = z.infer<typeof supplierQuerySchema>;
