import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
} from 'drizzle-orm/pg-core';
import { products } from './products.js';
import { sales } from './sales.js';

export const saleItems = pgTable(
  'sale_items',
  {
    id: serial('id').primaryKey(),
    saleId: integer('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    // Products with sales history cannot be deleted, so reports stay accurate.
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    unitPrice: numeric('unit_price', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),
    subtotal: numeric('subtotal', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),
  },
  (table) => [
    index('sale_items_sale_id_idx').on(table.saleId),
    index('sale_items_product_id_idx').on(table.productId),
    check('sale_items_quantity_positive', sql`${table.quantity} > 0`),
    check('sale_items_unit_price_non_negative', sql`${table.unitPrice} >= 0`),
    check('sale_items_subtotal_non_negative', sql`${table.subtotal} >= 0`),
  ],
);

export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
