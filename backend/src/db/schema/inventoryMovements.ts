import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { inventoryMovementTypeEnum } from './enums.js';
import { products } from './products.js';
import { sales } from './sales.js';
import { users } from './users.js';

/**
 * Every stock change is recorded here, so the owner can see *why* the
 * current stock is what it is. `stock` on products is the fast current value;
 * this table is the audit history.
 */
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    /** Signed change: +20 for a delivery, -3 for a sale. */
    quantityChange: integer('quantity_change').notNull(),
    stockAfter: integer('stock_after').notNull(),
    movementType: inventoryMovementTypeEnum('movement_type').notNull(),
    /** Optional link when the movement was caused by a sale. */
    saleId: integer('sale_id').references(() => sales.id, {
      onDelete: 'set null',
    }),
    /** Staff member who recorded the movement, when known. */
    userId: integer('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reason: varchar('reason', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('inventory_movements_product_id_idx').on(table.productId),
    index('inventory_movements_created_at_idx').on(table.createdAt),
    check('inventory_movements_quantity_change_not_zero', sql`${table.quantityChange} <> 0`),
    check('inventory_movements_stock_after_non_negative', sql`${table.stockAfter} >= 0`),
  ],
);

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type NewInventoryMovement = typeof inventoryMovements.$inferInsert;
