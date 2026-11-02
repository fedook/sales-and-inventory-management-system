import { z } from 'zod';
import { paginationSchema, searchSchema } from './common.validator.js';

export const customerTypeSchema = z.enum(['walk-in', 'regular', 'wholesale']);

export const customerInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Customer name is required.')
    .max(120, 'Customer name must be 120 characters or fewer.'),
  customerType: customerTypeSchema.default('regular'),
  location: z
    .string()
    .trim()
    .max(160, 'Location must be 160 characters or fewer.')
    .optional(),
  contactInformation: z
    .string()
    .trim()
    .max(255, 'Contact information must be 255 characters or fewer.')
    .optional(),
});

export const customerQuerySchema = paginationSchema.extend({
  search: searchSchema,
  customerType: customerTypeSchema.optional(),
  sort: z.enum(['name', 'newest']).default('name'),
  direction: z.enum(['asc', 'desc']).default('asc'),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
export type CustomerQueryInput = z.infer<typeof customerQuerySchema>;
export type CustomerType = z.infer<typeof customerTypeSchema>;
