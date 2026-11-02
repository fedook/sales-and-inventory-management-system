import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import {
  inventoryMovements,
  products,
  suppliers,
  users,
} from '../db/schema/index.js';
import { AppError } from '../utils/AppError.js';
import { roundMoney } from '../utils/money.js';
import { buildPagination, getOffset } from '../utils/pagination.js';
import type {
  MovementQueryInput,
  RestockInput,
  StockQueryInput,
} from '../validators/inventory.validator.js';

export interface StockListItem {
  id: number;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  sellingPrice: number;
  purchaseCost: number;
  supplierId: number | null;
  supplierName: string | null;
  stockValue: number;
  isLowStock: boolean;
  updatedAt: Date;
}

export interface StockListResult {
  products: StockListItem[];
  pagination: ReturnType<typeof buildPagination>;
}

export interface MovementListItem {
  id: number;
  productId: number;
  productName: string;
  quantityChange: number;
  stockAfter: number;
  movementType: string;
  saleId: number | null;
  userName: string | null;
  reason: string | null;
  createdAt: Date;
}

export interface MovementListResult {
  movements: MovementListItem[];
  pagination: ReturnType<typeof buildPagination>;
}

const stockColumns = {
  id: products.id,
  name: products.name,
  category: products.category,
  stock: products.stock,
  reorderLevel: products.reorderLevel,
  sellingPrice: products.sellingPrice,
  purchaseCost: products.purchaseCost,
  supplierId: products.supplierId,
  supplierName: suppliers.name,
  stockValue:
    sql<number>`round((${products.stock} * ${products.purchaseCost})::numeric, 2)::float`.as(
      'stock_value',
    ),
  updatedAt: products.updatedAt,
};

function withLowStockFlag(product: Omit<StockListItem, 'isLowStock'>): StockListItem {
  return {
    ...product,
    stockValue: roundMoney(product.stockValue),
    isLowStock: product.stock <= product.reorderLevel,
  };
}

function buildStockFilters(query: StockQueryInput): SQL | undefined {
  const filters: SQL[] = [];

  if (query.search?.trim()) {
    const pattern = `%${query.search.trim()}%`;
    const combined = or(
      ilike(products.name, pattern),
      ilike(products.category, pattern),
      ilike(products.description, pattern),
    );

    if (combined) {
      filters.push(combined);
    }
  }

  if (query.category?.trim()) {
    filters.push(eq(products.category, query.category.trim()));
  }

  if (query.supplierId !== undefined) {
    filters.push(eq(products.supplierId, query.supplierId));
  }

  if (query.lowStock === 'true') {
    filters.push(sql`${products.stock} <= ${products.reorderLevel}`);
  }

  if (filters.length === 0) {
    return undefined;
  }

  return and(...filters);
}

function buildStockOrderBy(query: StockQueryInput): SQL[] {
  const direction = query.direction === 'desc' ? desc : asc;

  switch (query.sort) {
    case 'stock':
      return [direction(products.stock), asc(products.name)];
    case 'value':
      return [
        direction(sql`${products.stock} * ${products.purchaseCost}`),
        asc(products.name),
      ];
    case 'newest':
      return [direction(products.createdAt), asc(products.id)];
    default:
      return [direction(products.name), asc(products.id)];
  }
}

/** Current stock levels with cost value and a low-stock flag. */
export async function listStock(
  query: StockQueryInput,
): Promise<StockListResult> {
  const db = requireDb();
  const where = buildStockFilters(query);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const total = countRow?.total ?? 0;

  const rows = await db
    .select(stockColumns)
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(where)
    .orderBy(...buildStockOrderBy(query))
    .limit(query.limit)
    .offset(getOffset(query.page, query.limit));

  return {
    products: rows.map(withLowStockFlag),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

async function getStockById(id: number): Promise<StockListItem> {
  const db = requireDb();

  const [product] = await db
    .select(stockColumns)
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return withLowStockFlag(product);
}

/** Every low-stock product, most urgent first. */
export async function getLowStockAlerts(): Promise<{
  total: number;
  alerts: StockListItem[];
}> {
  const db = requireDb();

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(sql`${products.stock} <= ${products.reorderLevel}`);

  const rows = await db
    .select(stockColumns)
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(sql`${products.stock} <= ${products.reorderLevel}`)
    .orderBy(asc(products.stock), asc(products.name))
    .limit(100);

  return {
    total: countRow?.total ?? 0,
    alerts: rows.map(withLowStockFlag),
  };
}

function startOfDay(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function startOfNextDay(value: string): Date {
  const date = startOfDay(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

function buildMovementFilters(query: MovementQueryInput): SQL | undefined {
  const filters: SQL[] = [];

  if (query.productId !== undefined) {
    filters.push(eq(inventoryMovements.productId, query.productId));
  }

  if (query.movementType) {
    filters.push(eq(inventoryMovements.movementType, query.movementType));
  }

  if (query.from) {
    filters.push(
      sql`${inventoryMovements.createdAt} >= ${startOfDay(query.from)}`,
    );
  }

  if (query.to) {
    filters.push(
      sql`${inventoryMovements.createdAt} < ${startOfNextDay(query.to)}`,
    );
  }

  if (filters.length === 0) {
    return undefined;
  }

  return and(...filters);
}

/** Audit trail of every stock change, newest first by default. */
export async function listMovements(
  query: MovementQueryInput,
): Promise<MovementListResult> {
  const db = requireDb();
  const where = buildMovementFilters(query);
  const direction = query.direction === 'asc' ? asc : desc;

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(inventoryMovements)
    .where(where);

  const total = countRow?.total ?? 0;

  const rows = await db
    .select({
      id: inventoryMovements.id,
      productId: inventoryMovements.productId,
      productName: products.name,
      quantityChange: inventoryMovements.quantityChange,
      stockAfter: inventoryMovements.stockAfter,
      movementType: inventoryMovements.movementType,
      saleId: inventoryMovements.saleId,
      userName: users.name,
      reason: inventoryMovements.reason,
      createdAt: inventoryMovements.createdAt,
    })
    .from(inventoryMovements)
    .innerJoin(products, eq(inventoryMovements.productId, products.id))
    .leftJoin(users, eq(inventoryMovements.userId, users.id))
    .where(where)
    .orderBy(direction(inventoryMovements.createdAt), desc(inventoryMovements.id))
    .limit(query.limit)
    .offset(getOffset(query.page, query.limit));

  return {
    movements: rows,
    pagination: buildPagination(query.page, query.limit, total),
  };
}

/**
 * Add stock and record a "restock" movement in one transaction.
 * Editing a product's stock is still possible from the catalogue, but this
 * endpoint is the normal path for receiving a delivery.
 */
export async function restockProduct(
  input: RestockInput,
  userId: number,
): Promise<StockListItem> {
  const db = requireDb();

  await db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(eq(products.id, input.productId))
      .limit(1)
      .for('update');

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const stockAfter = product.stock + input.quantity;

    await tx
      .update(products)
      .set({ stock: stockAfter })
      .where(eq(products.id, product.id));

    await tx.insert(inventoryMovements).values({
      productId: product.id,
      quantityChange: input.quantity,
      stockAfter,
      movementType: 'restock',
      userId,
      reason: input.reason?.trim() || 'Stock received',
    });
  });

  return getStockById(input.productId);
}
