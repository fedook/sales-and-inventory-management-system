import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import { customers, products, saleItems, sales, users } from '../db/schema/index.js';
import { AppError } from '../utils/AppError.js';
import { buildPagination, getOffset } from '../utils/pagination.js';
import type {
  CustomerInput,
  CustomerQueryInput,
} from '../validators/customer.validator.js';

const customerColumns = {
  id: customers.id,
  name: customers.name,
  customerType: customers.customerType,
  location: customers.location,
  contactInformation: customers.contactInformation,
  createdAt: customers.createdAt,
  updatedAt: customers.updatedAt,
};

export interface CustomerRecord {
  id: number;
  name: string;
  customerType: 'walk-in' | 'regular' | 'wholesale';
  location: string | null;
  contactInformation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** List row adds a small purchase summary calculated from real sales. */
export interface CustomerListItem extends CustomerRecord {
  totalSpent: number;
  saleCount: number;
  lastPurchaseAt: Date | null;
}

export interface CustomerListResult {
  customers: CustomerListItem[];
  pagination: ReturnType<typeof buildPagination>;
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildFilters(query: CustomerQueryInput): SQL | undefined {
  const filters: SQL[] = [];

  if (query.search?.trim()) {
    const pattern = `%${query.search.trim()}%`;

    const combined = or(
      ilike(customers.name, pattern),
      ilike(customers.location, pattern),
      ilike(customers.contactInformation, pattern),
    );

    if (combined) {
      filters.push(combined);
    }
  }

  if (query.customerType) {
    filters.push(eq(customers.customerType, query.customerType));
  }

  if (filters.length === 0) {
    return undefined;
  }

  return and(...filters);
}

export async function listCustomers(
  query: CustomerQueryInput,
): Promise<CustomerListResult> {
  const db = requireDb();
  const where = buildFilters(query);
  const direction = query.direction === 'desc' ? desc : asc;

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers)
    .where(where);

  const total = countRow?.total ?? 0;

  const rows = await db
    .select(customerColumns)
    .from(customers)
    .where(where)
    .orderBy(
      query.sort === 'newest'
        ? direction(customers.createdAt)
        : direction(customers.name),
      asc(customers.id),
    )
    .limit(query.limit)
    .offset(getOffset(query.page, query.limit));

  const ids = rows.map((row) => row.id);

  // One extra grouped query avoids a subquery per customer.
  const summaries = ids.length
    ? await db
        .select({
          customerId: sales.customerId,
          totalSpent: sql<number>`coalesce(sum(${sales.totalAmount}), 0)::float`,
          saleCount: sql<number>`count(*)::int`,
          lastPurchaseAt: sql<Date | null>`max(${sales.saleDate})`,
        })
        .from(sales)
        .where(inArray(sales.customerId, ids))
        .groupBy(sales.customerId)
    : [];

  const summaryByCustomer = new Map(
    summaries
      .filter((summary) => summary.customerId !== null)
      .map((summary) => [summary.customerId as number, summary]),
  );

  return {
    customers: rows.map((customer) => {
      const summary = summaryByCustomer.get(customer.id);

      return {
        ...customer,
        totalSpent: summary?.totalSpent ?? 0,
        saleCount: summary?.saleCount ?? 0,
        lastPurchaseAt: summary?.lastPurchaseAt ?? null,
      };
    }),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

export async function getCustomerById(id: number): Promise<CustomerRecord> {
  const db = requireDb();

  const [customer] = await db
    .select(customerColumns)
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);

  if (!customer) {
    throw new AppError('Customer not found.', 404);
  }

  return customer;
}

export async function createCustomer(input: CustomerInput): Promise<CustomerRecord> {
  const db = requireDb();

  const [created] = await db
    .insert(customers)
    .values({
      name: input.name,
      customerType: input.customerType,
      location: emptyToNull(input.location),
      contactInformation: emptyToNull(input.contactInformation),
    })
    .returning(customerColumns);

  if (!created) {
    throw new AppError('Could not create the customer. Please try again.', 500);
  }

  return created;
}

export async function updateCustomer(
  id: number,
  input: CustomerInput,
): Promise<CustomerRecord> {
  const db = requireDb();

  const [updated] = await db
    .update(customers)
    .set({
      name: input.name,
      customerType: input.customerType,
      location: emptyToNull(input.location),
      contactInformation: emptyToNull(input.contactInformation),
    })
    .where(eq(customers.id, id))
    .returning(customerColumns);

  if (!updated) {
    throw new AppError('Customer not found.', 404);
  }

  return updated;
}

/**
 * Delete a customer. Sales keep their totals; only the link to the customer
 * becomes NULL (ON DELETE SET NULL), so revenue reports stay correct.
 */
export async function deleteCustomer(id: number): Promise<void> {
  const db = requireDb();

  const deleted = await db
    .delete(customers)
    .where(eq(customers.id, id))
    .returning({ id: customers.id });

  if (deleted.length === 0) {
    throw new AppError('Customer not found.', 404);
  }
}

export interface PurchaseSummary {
  saleCount: number;
  totalSpent: number;
  averageSale: number;
  lastPurchaseAt: Date | null;
}

export interface PurchaseItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: number;
  saleDate: Date;
  totalAmount: number;
  paymentMethod: string;
  processedByName: string | null;
  items: PurchaseItem[];
}

/** Purchase history for one customer, newest sale first. */
export async function getCustomerPurchases(
  id: number,
  limit = 20,
): Promise<{ customer: CustomerRecord; summary: PurchaseSummary; purchases: Purchase[] }> {
  const db = requireDb();
  const customer = await getCustomerById(id);

  const [summaryRow] = await db
    .select({
      saleCount: sql<number>`count(*)::int`,
      totalSpent: sql<number>`coalesce(sum(${sales.totalAmount}), 0)::float`,
      averageSale: sql<number>`coalesce(avg(${sales.totalAmount}), 0)::float`,
      lastPurchaseAt: sql<Date | null>`max(${sales.saleDate})`,
    })
    .from(sales)
    .where(eq(sales.customerId, id));

  const saleRows = await db
    .select({
      id: sales.id,
      saleDate: sales.saleDate,
      totalAmount: sales.totalAmount,
      paymentMethod: sales.paymentMethod,
      processedByName: users.name,
    })
    .from(sales)
    .leftJoin(users, eq(sales.processedBy, users.id))
    .where(eq(sales.customerId, id))
    .orderBy(desc(sales.saleDate), desc(sales.id))
    .limit(limit);

  const saleIds = saleRows.map((sale) => sale.id);

  const itemRows = saleIds.length
    ? await db
        .select({
          saleId: saleItems.saleId,
          productId: saleItems.productId,
          productName: products.name,
          quantity: saleItems.quantity,
          unitPrice: saleItems.unitPrice,
          subtotal: saleItems.subtotal,
        })
        .from(saleItems)
        .innerJoin(products, eq(saleItems.productId, products.id))
        .where(inArray(saleItems.saleId, saleIds))
        .orderBy(asc(saleItems.id))
    : [];

  const itemsBySale = new Map<number, PurchaseItem[]>();

  for (const item of itemRows) {
    const list = itemsBySale.get(item.saleId) ?? [];
    list.push({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
    });
    itemsBySale.set(item.saleId, list);
  }

  return {
    customer,
    summary: {
      saleCount: summaryRow?.saleCount ?? 0,
      totalSpent: summaryRow?.totalSpent ?? 0,
      averageSale: summaryRow?.averageSale ?? 0,
      lastPurchaseAt: summaryRow?.lastPurchaseAt ?? null,
    },
    purchases: saleRows.map((sale) => ({
      ...sale,
      items: itemsBySale.get(sale.id) ?? [],
    })),
  };
}
