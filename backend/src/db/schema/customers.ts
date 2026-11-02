import { index, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { customerTypeEnum } from './enums.js';

export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    customerType: customerTypeEnum('customer_type').notNull().default('regular'),
    location: varchar('location', { length: 160 }),
    contactInformation: varchar('contact_information', { length: 255 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('customers_name_idx').on(table.name)],
);

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
