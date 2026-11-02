import { asc, desc, eq, ilike, inArray, or, sql, type SQL } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import { products, suppliers } from '../db/schema/index.js';
import { AppError } from '../utils/AppError.js';
import { isUniqueViolation } from '../utils/dbErrors.js';
import { buildPagination, getOffset } from '../utils/pagination.js';
import type {
  SupplierInput,
  SupplierQueryInput,
} from '../validators/supplier.validator.js';

const supplierColumns = {
  id: suppliers.id,
  name: suppliers.name,
  contactInformation: suppliers.contactInformation,
  address: suppliers.address,
  averageDeliveryTime: suppliers.averageDeliveryTime,
  createdAt: suppliers.createdAt,
  updatedAt: suppliers.updatedAt,
};

export interface SupplierRecord {
  id: number;
  name: string;
  contactInformation: string | null;
  address: string | null;
  averageDeliveryTime: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierListItem extends SupplierRecord {
  productCount: number;
}

export interface SupplierProduct {
  id: number;
  name: string;
  category: string;
  stock: number;
  reorderLevel: number;
  sellingPrice: number;
  isLowStock: boolean;
}

export interface SupplierDetail extends SupplierListItem {
  products: SupplierProduct[];
}

export interface SupplierListResult {
  suppliers: SupplierListItem[];
  pagination: ReturnType<typeof buildPagination>;
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildFilters(query: SupplierQueryInput): SQL | undefined {
  if (!query.search?.trim()) {
    return undefined;
  }

  const pattern = `%${query.search.trim()}%`;
  return or(
    ilike(suppliers.name, pattern),
    ilike(suppliers.contactInformation, pattern),
    ilike(suppliers.address, pattern),
  );
}

function buildOrderBy(query: SupplierQueryInput): SQL[] {
  if (query.sort === 'delivery') {
    // Suppliers with an unknown delivery time go last in both directions.
    return [
      query.direction === 'desc'
        ? sql`${suppliers.averageDeliveryTime} desc nulls last`
        : sql`${suppliers.averageDeliveryTime} asc nulls last`,
      asc(suppliers.name),
    ];
  }

  const direction = query.direction === 'desc' ? desc : asc;

  return query.sort === 'newest'
    ? [direction(suppliers.createdAt), asc(suppliers.id)]
    : [direction(suppliers.name), asc(suppliers.id)];
}

export async function listSuppliers(
  query: SupplierQueryInput,
): Promise<SupplierListResult> {
  const db = requireDb();
  const where = buildFilters(query);

  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(suppliers)
    .where(where);

  const total = countRow?.total ?? 0;

  const rows = await db
    .select(supplierColumns)
    .from(suppliers)
    .where(where)
    .orderBy(...buildOrderBy(query))
    .limit(query.limit)
    .offset(getOffset(query.page, query.limit));

  const ids = rows.map((row) => row.id);

  const counts = ids.length
    ? await db
        .select({
          supplierId: products.supplierId,
          productCount: sql<number>`count(*)::int`,
        })
        .from(products)
        .where(inArray(products.supplierId, ids))
        .groupBy(products.supplierId)
    : [];

  const countBySupplier = new Map(
    counts
      .filter((row) => row.supplierId !== null)
      .map((row) => [row.supplierId as number, row.productCount]),
  );

  return {
    suppliers: rows.map((supplier) => ({
      ...supplier,
      productCount: countBySupplier.get(supplier.id) ?? 0,
    })),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

/** Supplier details plus the products currently linked to it. */
export async function getSupplierById(id: number): Promise<SupplierDetail> {
  const db = requireDb();

  const [supplier] = await db
    .select(supplierColumns)
    .from(suppliers)
    .where(eq(suppliers.id, id))
    .limit(1);

  if (!supplier) {
    throw new AppError('Supplier not found.', 404);
  }

  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      stock: products.stock,
      reorderLevel: products.reorderLevel,
      sellingPrice: products.sellingPrice,
    })
    .from(products)
    .where(eq(products.supplierId, id))
    .orderBy(asc(products.name))
    .limit(100);

  return {
    ...supplier,
    productCount: productRows.length,
    products: productRows.map((product) => ({
      ...product,
      isLowStock: product.stock <= product.reorderLevel,
    })),
  };
}

export async function createSupplier(
  input: SupplierInput,
): Promise<SupplierRecord> {
  const db = requireDb();

  try {
    const [created] = await db
      .insert(suppliers)
      .values({
        name: input.name,
        contactInformation: emptyToNull(input.contactInformation),
        address: emptyToNull(input.address),
        averageDeliveryTime: input.averageDeliveryTime ?? null,
      })
      .returning(supplierColumns);

    if (!created) {
      throw new AppError('Could not create the supplier. Please try again.', 500);
    }

    return created;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError('A supplier with this name already exists.', 409, {
        fieldErrors: { name: ['A supplier with this name already exists.'] },
      });
    }

    throw error;
  }
}

export async function updateSupplier(
  id: number,
  input: SupplierInput,
): Promise<SupplierRecord> {
  const db = requireDb();

  try {
    const [updated] = await db
      .update(suppliers)
      .set({
        name: input.name,
        contactInformation: emptyToNull(input.contactInformation),
        address: emptyToNull(input.address),
        averageDeliveryTime: input.averageDeliveryTime ?? null,
      })
      .where(eq(suppliers.id, id))
      .returning(supplierColumns);

    if (!updated) {
      throw new AppError('Supplier not found.', 404);
    }

    return updated;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError('A supplier with this name already exists.', 409, {
        fieldErrors: { name: ['A supplier with this name already exists.'] },
      });
    }

    throw error;
  }
}

/**
 * Delete a supplier. Products linked to it stay in the catalogue; only their
 * supplier reference becomes NULL (ON DELETE SET NULL).
 */
export async function deleteSupplier(id: number): Promise<void> {
  const db = requireDb();

  const deleted = await db
    .delete(suppliers)
    .where(eq(suppliers.id, id))
    .returning({ id: suppliers.id });

  if (deleted.length === 0) {
    throw new AppError('Supplier not found.', 404);
  }
}
