import { relations } from 'drizzle-orm';
import { customers } from './customers.js';
import { inventoryMovements } from './inventoryMovements.js';
import { products } from './products.js';
import { saleItems } from './saleItems.js';
import { sales } from './sales.js';
import { suppliers } from './suppliers.js';
import { users } from './users.js';

/**
 * Relations let Drizzle's query API load related rows, for example:
 *   db.query.sales.findMany({ with: { items: { with: { product: true } } } })
 */
export const usersRelations = relations(users, ({ many }) => ({
  processedSales: many(sales),
  inventoryMovements: many(inventoryMovements),
}));

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  products: many(products),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  sales: many(sales),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  supplier: one(suppliers, {
    fields: [products.supplierId],
    references: [suppliers.id],
  }),
  saleItems: many(saleItems),
  inventoryMovements: many(inventoryMovements),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  customer: one(customers, {
    fields: [sales.customerId],
    references: [customers.id],
  }),
  processedByUser: one(users, {
    fields: [sales.processedBy],
    references: [users.id],
  }),
  items: many(saleItems),
  inventoryMovements: many(inventoryMovements),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  user: one(users, {
    fields: [inventoryMovements.userId],
    references: [users.id],
  }),
  sale: one(sales, {
    fields: [inventoryMovements.saleId],
    references: [sales.id],
  }),
}));
