import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';
import { suppliers } from './suppliers.js';

export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    description: text('description'),
    category: varchar('category', { length: 80 }).notNull(),
    /** Money is stored as NUMERIC(12, 2); mode: 'number' returns a JS number. */
    sellingPrice: numeric('selling_price', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),
    purchaseCost: numeric('purchase_cost', {
      precision: 12,
      scale: 2,
      mode: 'number',
    }).notNull(),
    stock: integer('stock').notNull().default(0),
    /** Show a low-stock alert when stock falls to this value or below. */
    reorderLevel: integer('reorder_level').notNull().default(10),
    supplierId: integer('supplier_id').references(() => suppliers.id, {
      // Keep the product if its supplier is removed.
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex('products_name_unique').on(table.name),
    index('products_category_idx').on(table.category),
    index('products_supplier_id_idx').on(table.supplierId),
    // Database-level guards: stock and prices can never become negative.
    check('products_selling_price_non_negative', sql`${table.sellingPrice} >= 0`),
    check('products_purchase_cost_non_negative', sql`${table.purchaseCost} >= 0`),
    check('products_stock_non_negative', sql`${table.stock} >= 0`),
    check('products_reorder_level_non_negative', sql`${table.reorderLevel} >= 0`),
  ],
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
