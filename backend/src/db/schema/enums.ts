import { pgEnum } from 'drizzle-orm/pg-core';

/**
 * PostgreSQL enums keep allowed values in one place.
 * The same values are validated again with Zod in the API layer.
 */
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff']);

export const customerTypeEnum = pgEnum('customer_type', [
  'walk-in',
  'regular',
  'wholesale',
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'mobile_money',
  'bank_transfer',
]);

export const inventoryMovementTypeEnum = pgEnum('inventory_movement_type', [
  'initial',
  'restock',
  'sale',
  'return',
  'adjustment',
]);
