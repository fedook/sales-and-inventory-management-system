import { and, asc, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import {
  inventoryMovements,
  products,
  saleItems,
  suppliers,
} from '../db/schema/index.js';
import { AppError } from '../utils/AppError.js';
import { isForeignKeyViolation, isUniqueViolation } from '../utils/dbErrors.js';
import { roundMoney } from '../utils/money.js';
import { buildPagination, getOffset } from '../utils/pagination.js';
import type {
  ProductInput,
  ProductQueryInput,
} from '../validators/product.validator.js';

/**
 * Product columns returned to the client, plus the supplier name so the UI
 * does not need a second request. `isLowStock` is added after the query.
 */
const productColumns = {
  id: products.id,
  name: products.name,
  description: products.description,
  category: products.category,
  sellingPrice: products.sellingPrice,
  purchaseCost: products.purchaseCost,
  stock: products.stock,
  reorderLevel: products.reorderLevel,
  supplierId: products.supplierId,
  supplierName: suppliers.name,
  createdAt: products.createdAt,
  updatedAt: products.updatedAt,
};

export interface ProductRecord {
  id: number;
  name: string;
  description: string | null;
  category: string;
  sellingPrice: number;
  purchaseCost: number;
  stock: number;
  reorderLevel: number;
  supplierId: number | null;
  supplierName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductListItem = ProductRecord & { isLowStock: boolean };

export interface ProductListResult {
  products: ProductListItem[];
  pagination: ReturnType<typeof buildPagination>;
}

function withLowStockFlag(product: ProductRecord): ProductListItem {
  return { ...product, isLowStock: product.stock <= product.reorderLevel };
}

/** Empty text from a form means "no value", not an empty string. */
function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildFilters(query: ProductQueryInput): SQL | undefined {
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

function buildOrderBy(query: ProductQueryInput): SQL[] {
  const direction = query.direction === 'desc' ? desc : asc;

  switch (query.sort) {
    case 'newest':
      return [direction(products.createdAt), asc(products.id)];
    case 'stock':
      return [direction(products.stock), asc(products.name)];
    case 'price':
      return [direction(products.sellingPrice), asc(products.name)];
    default:
      return [direction(products.name), asc(products.id)];
  }
}

/** List products with search, filters, sorting and pagination. */
export async function listProducts(query: ProductQueryInput): Promise<ProductListResult> {
  const db = requireDb();
  const where = buildFilters(query);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(where);

  const total = countRow?.total ?? 0;

  const rows = await db
    .select(productColumns)
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(where)
    .orderBy(...buildOrderBy(query))
    .limit(query.limit)
    .offset(getOffset(query.page, query.limit));

  return {
    products: rows.map(withLowStockFlag),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

/** Distinct category names for the filter dropdown. */
export async function listCategories(): Promise<string[]> {
  const db = requireDb();

  const rows = await db
    .selectDistinct({ category: products.category })
    .from(products)
    .orderBy(asc(products.category));

  return rows.map((row) => row.category);
}

/** Load one product (including its supplier name) or throw 404. */
export async function getProductById(id: number): Promise<ProductListItem> {
  const db = requireDb();

  const [product] = await db
    .select(productColumns)
    .from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(eq(products.id, id))
    .limit(1);

  if (!product) {
    throw new AppError('Product not found.', 404);
  }

  return withLowStockFlag(product);
}

/** Validate an optional supplier reference. */
async function assertSupplierExists(
  supplierId: number | null | undefined,
): Promise<void> {
  if (supplierId === null || supplierId === undefined) {
    return;
  }

  const db = requireDb();

  const [supplier] = await db
    .select({ id: suppliers.id })
    .from(suppliers)
    .where(eq(suppliers.id, supplierId))
    .limit(1);

  if (!supplier) {
    throw new AppError('The selected supplier no longer exists.', 400, {
      fieldErrors: { supplierId: ['Choose an existing supplier.'] },
    });
  }
}

export async function createProduct(
  input: ProductInput,
  userId: number,
): Promise<ProductListItem> {
  const db = requireDb();

  try {
    const productId = await db.transaction(async (tx) => {
      await assertSupplierExists(input.supplierId);

      const [created] = await tx
        .insert(products)
        .values({
          name: input.name,
          description: emptyToNull(input.description),
          category: input.category,
          sellingPrice: roundMoney(input.sellingPrice),
          purchaseCost: roundMoney(input.purchaseCost),
          stock: input.stock,
          reorderLevel: input.reorderLevel,
          supplierId: input.supplierId ?? null,
        })
        .returning({ id: products.id });

      if (!created) {
        throw new AppError('Could not create the product. Please try again.', 500);
      }

      // Opening stock is part of the audit trail too.
      if (input.stock > 0) {
        await tx.insert(inventoryMovements).values({
          productId: created.id,
          quantityChange: input.stock,
          stockAfter: input.stock,
          movementType: 'initial',
          userId,
          reason: 'Initial stock recorded with the product',
        });
      }

      return created.id;
    });

    return await getProductById(productId);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError('A product with this name already exists.', 409, {
        fieldErrors: { name: ['A product with this name already exists.'] },
      });
    }

    if (isForeignKeyViolation(error)) {
      throw new AppError('The selected supplier no longer exists.', 400);
    }

    throw error;
  }
}

/**
 * Update a product. When the stock number changes, an "adjustment" movement
 * is written so the difference is never lost. Sales in Phase 5 add their own
 * movements with a link to the sale.
 */
export async function updateProduct(
  id: number,
  input: ProductInput,
  userId: number,
): Promise<ProductListItem> {
  const db = requireDb();

  try {
    await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ id: products.id, stock: products.stock })
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

      if (!current) {
        throw new AppError('Product not found.', 404);
      }

      await assertSupplierExists(input.supplierId);

      await tx
        .update(products)
        .set({
          name: input.name,
          description: emptyToNull(input.description),
          category: input.category,
          sellingPrice: roundMoney(input.sellingPrice),
          purchaseCost: roundMoney(input.purchaseCost),
          stock: input.stock,
          reorderLevel: input.reorderLevel,
          supplierId: input.supplierId ?? null,
        })
        .where(eq(products.id, id));

      const difference = input.stock - current.stock;

      if (difference !== 0) {
        await tx.insert(inventoryMovements).values({
          productId: id,
          quantityChange: difference,
          stockAfter: input.stock,
          movementType: 'adjustment',
          userId,
          reason: 'Manual stock adjustment from the product editor',
        });
      }
    });

    return await getProductById(id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError('A product with this name already exists.', 409, {
        fieldErrors: { name: ['A product with this name already exists.'] },
      });
    }

    if (isForeignKeyViolation(error)) {
      throw new AppError('The selected supplier no longer exists.', 400);
    }

    throw error;
  }
}

/**
 * Delete a product.
 *
 * Products that appear in a sale can never be deleted: the sales history and
 * the analytics built on it must stay accurate. A product that was never sold
 * may be deleted together with its stock movements (there is no financial
 * history to preserve), inside one transaction.
 */
export async function deleteProduct(id: number): Promise<void> {
  const db = requireDb();

  await db.transaction(async (tx) => {
    const [product] = await tx
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (!product) {
      throw new AppError('Product not found.', 404);
    }

    const [sold] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(saleItems)
      .where(eq(saleItems.productId, id));

    if ((sold?.count ?? 0) > 0) {
      throw new AppError(
        'This product appears in past sales and cannot be deleted. Sales history must stay accurate.',
        409,
      );
    }

    await tx
      .delete(inventoryMovements)
      .where(eq(inventoryMovements.productId, id));
    await tx.delete(products).where(eq(products.id, id));
  });
}
