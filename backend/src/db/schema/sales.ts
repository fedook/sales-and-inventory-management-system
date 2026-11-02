import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  timestamp,
} from 'drizzle-orm/pg-core';
import { customers } from './customers.js';
import { paymentMethodEnum } from './enums.js';
import { users } from './users.js';

export const sales = pgTable(
  'sales',
  {
    id: serial('id').primaryKey(),
    /** Nullable: walk-in customers may not be recorded. */
    customerId: integer('customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    totalAmount: numeric('total_amount', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    saleDate: timestamp('sale_date', { withTimezone: true }).notNull().defaultNow(),
    /** Staff member who recorded the sale (audit trail). */
    processedBy: integer('processed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('sales_sale_date_idx').on(table.saleDate),
    index('sales_customer_id_idx').on(table.customerId),
    index('sales_processed_by_idx').on(table.processedBy),
    check('sales_total_amount_non_negative', sql`${table.totalAmount} >= 0`),
  ],
);

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
