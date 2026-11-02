import { z } from 'zod';
import {
  dateStringSchema,
  paginationSchema,
  searchSchema,
} from './common.validator.js';

export const paymentMethodSchema = z.enum([
  'cash',
  'card',
  'mobile_money',
  'bank_transfer',
]);

/**
 * A sale line. The client sends only the product and quantity: the API reads
 * the current selling price from the database so a browser cannot change it.
 */
export const saleItemInputSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce
    .number()
    .int('Use a whole number.')
    .min(1, 'Quantity must be at least 1.')
    .max(1_000_000, 'Quantity is too large.'),
});

export const saleInputSchema = z
  .object({
    customerId: z
      .union([z.coerce.number().int().positive(), z.null()])
      .optional(),
    paymentMethod: paymentMethodSchema,
    items: z
      .array(saleItemInputSchema)
      .min(1, 'Add at least one product to the sale.')
      .max(50, 'A sale can contain at most 50 lines.'),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<number>();

    value.items.forEach((item, index) => {
      if (seen.has(item.productId)) {
        ctx.addIssue({
          code: 'custom',
          message: 'This product is already on the sale. Change its quantity instead.',
          path: ['items', index, 'productId'],
        });
      }

      seen.add(item.productId);
    });
  });

export const saleQuerySchema = paginationSchema
  .extend({
    search: searchSchema,
    paymentMethod: paymentMethodSchema.optional(),
    customerId: z.coerce.number().int().positive().optional(),
    from: dateStringSchema,
    to: dateStringSchema,
    sort: z.enum(['date', 'total']).default('date'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine(
    (query) => !query.from || !query.to || query.from <= query.to,
    {
      message: 'The start date cannot be after the end date.',
      path: ['from'],
    },
  );

export type SaleInput = z.infer<typeof saleInputSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
