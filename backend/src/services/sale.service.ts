import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import {
  customers,
  inventoryMovements,
  products,
  saleItems,
  sales,
  users,
} from '../db/schema/index.js';
import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../utils/money.js';
import { buildPagination, getOffset } from '../utils/pagination.js';
import type { SaleInput, SaleQueryInput } from '../validators/sale.validator.js';

export interface SaleListItem {
  id: number;
  saleDate: Date;
  totalAmount: number;
  paymentMethod: string;
  customerId: number | null;
  customerName: string | null;
  processedByName: string | null;
  itemCount: number;
}

export interface SaleItemRecord {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleDetail extends SaleListItem {
  createdAt: Date;
  items: SaleItemRecord[];
}

export interface SaleListResult {
  sales: SaleListItem[];
  pagination: ReturnType<typeof buildPagination>;
}

const saleColumns = {
  id: sales.id,
  saleDate: sales.saleDate,
  totalAmount: sales.totalAmount,
  paymentMethod: sales.paymentMethod,
  customerId: sales.customerId,
  customerName: customers.name,
  processedByName: users.name,
  itemCount:
    sql<number>`(select count(*)::int from ${saleItems} where ${saleItems.saleId} = ${sales.id})`.as(
      'item_count',
    ),
};

function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function startOfNextDay(value: string): Date {
  const date = startOfDay(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function buildFilters(
  query: SaleQueryInput,
  db: ReturnType<typeof requireDb>,
): SQL | undefined {
  const filters: SQL[] = [];

  if (query.search?.trim()) {
    const pattern = `%${query.search.trim()}%`;
    const searchFilters: SQL[] = [
      ilike(customers.name, pattern),
      ilike(users.name, pattern),
    ];

    const numericSearch = Number(query.search.trim());

    if (Number.isInteger(numericSearch) && numericSearch > 0) {
      searchFilters.push(eq(sales.id, numericSearch));
    }

    // Also search by a product that appears on the sale.
    searchFilters.push(
      inArray(
        sales.id,
        db
          .select({ id: saleItems.saleId })
          .from(saleItems)
          .innerJoin(products, eq(saleItems.productId, products.id))
          .where(ilike(products.name, pattern)),
      ),
    );

    const combined = or(...searchFilters);

    if (combined) {
      filters.push(combined);
    }
  }

  if (query.paymentMethod) {
    filters.push(eq(sales.paymentMethod, query.paymentMethod));
  }

  if (query.customerId !== undefined) {
    filters.push(eq(sales.customerId, query.customerId));
  }

  if (query.from) {
    filters.push(sql`${sales.saleDate} >= ${startOfDay(query.from)}`);
  }

  if (query.to) {
    filters.push(sql`${sales.saleDate} < ${startOfNextDay(query.to)}`);
  }

  if (filters.length === 0) {
    return undefined;
  }

  return and(...filters);
}

/** Paginated sales history with customer, cashier, and line counts. */
export async function listSales(
  query: SaleQueryInput,
): Promise<SaleListResult> {
  const db = requireDb();
  const where = buildFilters(query, db);
  const direction = query.direction === 'asc' ? asc : desc;

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.processedBy, users.id))
    .where(where);

  const total = countRow?.total ?? 0;

  const rows = await db
    .select(saleColumns)
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.processedBy, users.id))
    .where(where)
    .orderBy(
      query.sort === 'total'
        ? direction(sales.totalAmount)
        : direction(sales.saleDate),
      desc(sales.id),
    )
    .limit(query.limit)
    .offset(getOffset(query.page, query.limit));

  return {
    sales: rows,
    pagination: buildPagination(query.page, query.limit, total),
  };
}

/** One sale with every line, or 404. */
export async function getSaleById(id: number): Promise<SaleDetail> {
  const db = requireDb();

  const [sale] = await db
    .select({
      ...saleColumns,
      createdAt: sales.createdAt,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .leftJoin(users, eq(sales.processedBy, users.id))
    .where(eq(sales.id, id))
    .limit(1);

  if (!sale) {
    throw new AppError('Sale not found.', 404);
  }

  const itemRows = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      productName: products.name,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      subtotal: saleItems.subtotal,
    })
    .from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, id))
    .orderBy(asc(saleItems.id));

  return { ...sale, items: itemRows };
}

interface LockedLine {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stockAfter: number;
}

/**
 * Record a sale atomically:
 *   1. lock each product row and check its current stock,
 *   2. read the selling price from the database (never from the browser),
 *   3. insert the sale and its items,
 *   4. reduce stock and write one "sale" movement per line.
 *
 * Any failure rolls the whole thing back, so stock and sales can never drift
 * apart.
 */
export async function createSale(
  input: SaleInput,
  userId: number,
): Promise<SaleDetail> {
  const db = requireDb();

  const saleId = await db.transaction(async (tx) => {
    if (input.customerId !== undefined && input.customerId !== null) {
      const [customer] = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .limit(1);

      if (!customer) {
        throw new AppError('The selected customer no longer exists.', 400, {
          fieldErrors: { customerId: ['Choose an existing customer.'] },
        });
      }
    }

    const lines: LockedLine[] = [];
    const orderedItems = [...input.items].sort(
      (a, b) => a.productId - b.productId,
    );

    for (const item of orderedItems) {
      const [product] = await tx
        .select({
          id: products.id,
          name: products.name,
          sellingPrice: products.sellingPrice,
          stock: products.stock,
        })
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1)
        .for('update');

      if (!product) {
        throw new AppError('One of the selected products no longer exists.', 400, {
          fieldErrors: {
            items: ['Remove the missing product and choose another one.'],
          },
        });
      }

      if (product.stock < item.quantity) {
        throw new AppError(
          `Not enough stock for "${product.name}". Only ${product.stock} left.`,
          409,
          {
            fieldErrors: {
              items: [
                `"${product.name}" only has ${product.stock} unit${
                  product.stock === 1 ? '' : 's'
                } left.`,
              ],
            },
          },
        );
      }

      lines.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellingPrice,
        subtotal: roundMoney(product.sellingPrice * item.quantity),
        stockAfter: product.stock - item.quantity,
      });
    }

    const totalAmount = roundMoney(
      lines.reduce((total, line) => total + line.subtotal, 0),
    );

    const [sale] = await tx
      .insert(sales)
      .values({
        customerId: input.customerId ?? null,
        totalAmount,
        paymentMethod: input.paymentMethod,
        processedBy: userId,
      })
      .returning({ id: sales.id });

    if (!sale) {
      throw new AppError('Could not record the sale. Please try again.', 500);
    }

    await tx.insert(saleItems).values(
      lines.map((line) => ({
        saleId: sale.id,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      })),
    );

    for (const line of lines) {
      await tx
        .update(products)
        .set({ stock: line.stockAfter })
        .where(eq(products.id, line.productId));

      await tx.insert(inventoryMovements).values({
        productId: line.productId,
        quantityChange: -line.quantity,
        stockAfter: line.stockAfter,
        movementType: 'sale',
        saleId: sale.id,
        userId,
        reason: `Sale #${sale.id}`,
      });
    }

    return sale.id;
  });

  return getSaleById(saleId);
}
