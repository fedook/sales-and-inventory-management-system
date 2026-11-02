import { asc, sql } from 'drizzle-orm';
import { closeDatabase, requireDb } from './client.js';
import {
  customers,
  inventoryMovements,
  products,
  saleItems,
  sales,
  suppliers,
  users,
} from './schema/index.js';
import { roundMoney } from '../utils/money.js';

/**
 * Manual demo-data seeder.
 *
 * Run it with `npm run db:seed`. It refuses to touch a database that already
 * has business records, so it can never overwrite real products or sales.
 * It creates:
 *   - 50 suppliers
 *   - 50 customers
 *   - 50 products
 *   - 200 sales with 1-4 items each
 *   - opening, sale, and (where needed) stock movements
 *
 * The data is generated from a fixed random seed, so the demo is repeatable.
 */

const SUPPLIER_COUNT = 50;
const CUSTOMER_COUNT = 50;
const PRODUCT_COUNT = 50;
const SALE_COUNT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;

const productGroups: Array<{
  category: string;
  basePrice: number;
  names: string[];
}> = [
  {
    category: 'Beverages',
    basePrice: 18,
    names: [
      'Bottled Water 500ml',
      'Instant Coffee 3-in-1',
      'Iced Tea Powder',
      'Orange Juice 1L',
      'Soft Drink 1.5L',
    ],
  },
  {
    category: 'Snacks',
    basePrice: 12,
    names: [
      'Salted Crackers',
      'Corn Chips',
      'Chocolate Bar',
      'Peanut Brittle',
      'Cream Sandwich Cookies',
    ],
  },
  {
    category: 'Stationery',
    basePrice: 8,
    names: [
      'Ballpoint Pen',
      'Spiral Notebook',
      'Pencil Set',
      'Glue Stick',
      'A4 Bond Paper',
    ],
  },
  {
    category: 'Household',
    basePrice: 35,
    names: [
      'Dishwashing Liquid',
      'Laundry Powder',
      'Toilet Tissue 4-pack',
      'Trash Bag Medium',
      'Floor Cleaner',
    ],
  },
  {
    category: 'Personal Care',
    basePrice: 22,
    names: [
      'Bath Soap',
      'Shampoo Sachet',
      'Toothpaste 100g',
      'Hand Sanitizer',
      'Cotton Buds',
    ],
  },
  {
    category: 'Canned Goods',
    basePrice: 28,
    names: [
      'Sardines in Tomato Sauce',
      'Corned Beef 150g',
      'Tuna Flakes',
      'Liver Spread',
      'Pork and Beans',
    ],
  },
  {
    category: 'Dairy',
    basePrice: 32,
    names: [
      'Evaporated Milk',
      'Condensed Milk',
      'Powdered Milk 300g',
      'Cheese Spread',
      'Yogurt Drink',
    ],
  },
  {
    category: 'Bakery',
    basePrice: 15,
    names: [
      'Pandesal 6-pack',
      'White Bread Loaf',
      'Ensaymada',
      'Butter Cookies',
      'Muffin',
    ],
  },
  {
    category: 'Frozen',
    basePrice: 45,
    names: [
      'Frozen Siomai 10pcs',
      'Chicken Nuggets',
      'Fish Balls',
      'Ice Cream 1L',
      'Frozen Fries',
    ],
  },
  {
    category: 'Cleaning',
    basePrice: 40,
    names: [
      'Bleach 1L',
      'Glass Cleaner',
      'Mop Refill',
      'Scouring Pad',
      'Air Freshener',
    ],
  },
];

const supplierPrefixes = [
  'Northwind',
  'Sunrise',
  'Metro',
  'Evergreen',
  'Blue Harbor',
  'Golden Grain',
  'Pacific',
  'Summit',
  'Greenfield',
  'Starline',
];

const supplierSuffixes = [
  'Trading',
  'Distributors',
  'Wholesale',
  'Supply Co.',
  'Enterprises',
];

const customerFirstNames = [
  'Maria',
  'Jose',
  'Ana',
  'Carlos',
  'Liza',
  'Miguel',
  'Sofia',
  'Ramon',
  'Elena',
  'Paolo',
  'Grace',
  'Andres',
  'Rosa',
  'Daniel',
  'Clara',
  'Victor',
  'Isabel',
  'Mario',
  'Teresa',
  'Gabriel',
];

const customerLastNames = [
  'Santos',
  'Reyes',
  'Cruz',
  'Garcia',
  'Mendoza',
  'Torres',
  'Flores',
  'Ramos',
  'Bautista',
  'Villanueva',
];

const locations = [
  'Cebu City',
  'Mandaue City',
  'Lapu-Lapu City',
  'Talisay City',
  'Danao City',
  'Consolacion',
  'Minglanilla',
  'Naga City',
];

const customerTypes = ['regular', 'walk-in', 'wholesale'] as const;
const paymentMethods = [
  'cash',
  'card',
  'mobile_money',
  'bank_transfer',
] as const;

/** Small deterministic PRNG so every seed run produces the same demo. */
function mulberry32(seed: number): () => number {
  let state = seed;

  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

const random = mulberry32(0x5eed2026);

function randomInt(min: number, max: number): number {
  return min + Math.floor(random() * (max - min + 1));
}

function pick<T>(values: readonly T[]): T {
  const value = values[Math.floor(random() * values.length)];

  if (value === undefined) {
    throw new Error('Cannot pick from an empty list.');
  }

  return value;
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0');
}

interface ProductPlan {
  name: string;
  category: string;
  sellingPrice: number;
  purchaseCost: number;
  openingStock: number;
  stock: number;
  reorderLevel: number;
  supplierName: string;
}

function buildSuppliers() {
  return Array.from({ length: SUPPLIER_COUNT }, (_, index) => ({
    name: `Seed Supplier ${pad(index + 1)} - ${supplierPrefixes[index % supplierPrefixes.length]} ${
      supplierSuffixes[Math.floor(index / supplierPrefixes.length) % supplierSuffixes.length]
    }`,
    contactInformation: `seed.supplier${pad(index + 1)}@example.test`,
    address: `${randomInt(1, 220)} ${pick(['Mabini', 'Rizal', 'Bonifacio', 'Colon', 'Osmena'])} Street, ${pick(locations)}`,
    averageDeliveryTime: randomInt(1, 14),
  }));
}

function buildCustomers() {
  return Array.from({ length: CUSTOMER_COUNT }, (_, index) => ({
    name: `Seed Customer ${pad(index + 1)} - ${pick(customerFirstNames)} ${pick(customerLastNames)}`,
    customerType: index % 11 === 0 ? 'wholesale' : pick(customerTypes),
    location: pick(locations),
    contactInformation: `0917 ${pad(randomInt(100, 999), 3)} ${pad(randomInt(1000, 9999), 4)}`,
  }));
}

function buildProducts(supplierNames: string[]): ProductPlan[] {
  const productNames = productGroups.flatMap((group) =>
    group.names.map((name) => ({ name, category: group.category, basePrice: group.basePrice })),
  );

  if (productNames.length !== PRODUCT_COUNT) {
    throw new Error(`Expected ${PRODUCT_COUNT} product templates.`);
  }

  return productNames.map((template, index) => {
    const sellingPrice = roundMoney(
      template.basePrice + randomInt(0, 60) + (index % 4) * 2.5,
    );
    const purchaseCost = roundMoney(sellingPrice * (0.55 + random() * 0.2));
    const isLowStockDemo = index % 10 === 0;
    const openingStock = isLowStockDemo ? randomInt(3, 8) : randomInt(90, 260);

    return {
      name: template.name,
      category: template.category,
      sellingPrice,
      purchaseCost,
      openingStock,
      stock: openingStock,
      reorderLevel: isLowStockDemo ? randomInt(15, 25) : randomInt(8, 24),
      supplierName: supplierNames[index % supplierNames.length] ?? supplierNames[0]!,
    };
  });
}

interface SaleLinePlan {
  productId: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stockAfter: number;
}

interface SalePlan {
  customerId: number;
  paymentMethod: (typeof paymentMethods)[number];
  saleDate: Date;
  totalAmount: number;
  lines: SaleLinePlan[];
}

function buildSales(productIds: number[], productPlans: ProductPlan[], customerIds: number[]) {
  const plans: SalePlan[] = [];
  const now = Date.now();

  for (let index = 0; index < SALE_COUNT; index += 1) {
    const lineCount = randomInt(1, 4);
    const chosen = new Set<number>();
    const lines: SaleLinePlan[] = [];

    while (chosen.size < lineCount) {
      // Only pick products that still have stock, so every attempted sale
      // gets at least one line and the seed always creates SALE_COUNT sales.
      const availableIndexes: number[] = [];

      for (let candidate = 0; candidate < productPlans.length; candidate += 1) {
        const plan = productPlans[candidate];

        if (plan && plan.stock > 0 && !chosen.has(candidate)) {
          availableIndexes.push(candidate);
        }
      }

      if (availableIndexes.length === 0) {
        break;
      }

      const productIndex = pick(availableIndexes);
      const product = productPlans[productIndex];
      const productId = productIds[productIndex];

      if (!product || productId === undefined) {
        throw new Error('Seed product list is out of sync.');
      }

      const quantity = Math.min(randomInt(1, 5), product.stock);
      const unitPrice = product.sellingPrice;
      const subtotal = roundMoney(unitPrice * quantity);

      product.stock -= quantity;
      chosen.add(productIndex);

      lines.push({
        productId,
        quantity,
        unitPrice,
        subtotal,
        stockAfter: product.stock,
      });
    }

    if (lines.length === 0) {
      throw new Error('Could not choose a product with stock for a seeded sale.');
    }

    plans.push({
      customerId: customerIds[index % customerIds.length] ?? customerIds[0]!,
      paymentMethod: pick(paymentMethods),
      saleDate: new Date(
        now - randomInt(0, 89) * DAY_MS - randomInt(0, 23) * 60 * 60 * 1000,
      ),
      totalAmount: roundMoney(lines.reduce((sum, line) => sum + line.subtotal, 0)),
      lines,
    });
  }

  return plans;
}

async function seed(): Promise<void> {
  const db = requireDb();

  const [supplierCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(suppliers);
  const [customerCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers);
  const [productCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products);
  const [saleCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(sales);

  const existing = {
    suppliers: supplierCount?.total ?? 0,
    customers: customerCount?.total ?? 0,
    products: productCount?.total ?? 0,
    sales: saleCount?.total ?? 0,
  };

  if (Object.values(existing).some((count) => count > 0)) {
    throw new Error(
      `Seed data was not inserted because the business tables are not empty ` +
        `(suppliers: ${existing.suppliers}, customers: ${existing.customers}, ` +
        `products: ${existing.products}, sales: ${existing.sales}). ` +
        'Use a fresh database or clear those rows first.',
    );
  }

  // Sales can be recorded without a cashier (processed_by is nullable).
  const [firstUser] = await db
    .select({ id: users.id })
    .from(users)
    .orderBy(asc(users.id))
    .limit(1);
  const userId = firstUser?.id ?? null;

  const supplierRows = buildSuppliers();
  const customerRows = buildCustomers();
  const productPlans = buildProducts(supplierRows.map((supplier) => supplier.name));

  const summary = await db.transaction(async (tx) => {
    const insertedSuppliers = await tx
      .insert(suppliers)
      .values(supplierRows)
      .returning({ id: suppliers.id, name: suppliers.name });

    const supplierIdByName = new Map(
      insertedSuppliers.map((supplier) => [supplier.name, supplier.id]),
    );

    const insertedCustomers = await tx
      .insert(customers)
      .values(customerRows)
      .returning({ id: customers.id });

    const customerIds = insertedCustomers.map((customer) => customer.id);

    const insertedProducts = await tx
      .insert(products)
      .values(
        productPlans.map((product) => ({
          name: product.name,
          description: `Demo catalogue item seeded for the ${product.category} category.`,
          category: product.category,
          sellingPrice: product.sellingPrice,
          purchaseCost: product.purchaseCost,
          stock: product.stock,
          reorderLevel: product.reorderLevel,
          supplierId: supplierIdByName.get(product.supplierName) ?? null,
        })),
      )
      .returning({ id: products.id, name: products.name });

    const productIdByName = new Map(
      insertedProducts.map((product) => [product.name, product.id]),
    );
    const productIds = productPlans.map(
      (product) => productIdByName.get(product.name)!,
    );

    const salePlans = buildSales(productIds, productPlans, customerIds);
    const saleIds: number[] = [];
    let itemCount = 0;

    for (const plan of salePlans) {
      const [sale] = await tx
        .insert(sales)
        .values({
          customerId: plan.customerId,
          totalAmount: plan.totalAmount,
          paymentMethod: plan.paymentMethod,
          saleDate: plan.saleDate,
          processedBy: userId,
        })
        .returning({ id: sales.id });

      if (!sale) {
        throw new Error('Could not create a seeded sale.');
      }

      saleIds.push(sale.id);
      itemCount += plan.lines.length;
    }

    const saleItemValues = salePlans.flatMap((plan, index) => {
      const saleId = saleIds[index]!;

      return plan.lines.map((line) => ({
        saleId,
        productId: line.productId,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        subtotal: line.subtotal,
      }));
    });

    if (saleItemValues.length > 0) {
      await tx.insert(saleItems).values(saleItemValues);
    }

    const openingDate = new Date(Date.now() - 100 * DAY_MS);

    await tx.insert(inventoryMovements).values([
      ...productPlans.map((product, index) => ({
        productId: productIds[index]!,
        quantityChange: product.openingStock,
        stockAfter: product.openingStock,
        movementType: 'initial' as const,
        userId,
        reason: 'Seed opening stock',
        createdAt: openingDate,
      })),
      ...salePlans.flatMap((plan, index) =>
        plan.lines.map((line) => ({
          productId: line.productId,
          quantityChange: -line.quantity,
          stockAfter: line.stockAfter,
          movementType: 'sale' as const,
          saleId: saleIds[index]!,
          userId,
          reason: `Seed sale #${saleIds[index]}`,
          createdAt: plan.saleDate,
        })),
      ),
    ]);

    for (const [index, product] of productPlans.entries()) {
      await tx
        .update(products)
        .set({ stock: product.stock })
        .where(sql`${products.id} = ${productIds[index]!}`);
    }

    const lowStock = productPlans.filter(
      (product) => product.stock <= product.reorderLevel,
    ).length;

    return {
      suppliers: insertedSuppliers.length,
      customers: insertedCustomers.length,
      products: insertedProducts.length,
      sales: salePlans.length,
      items: itemCount,
      movements: productPlans.length + itemCount,
      lowStock,
    };
  });

  console.log('[seed] Demo data created successfully.');
  console.log(
    `[seed] Suppliers: ${summary.suppliers}, customers: ${summary.customers}, products: ${summary.products}`,
  );
  console.log(
    `[seed] Sales: ${summary.sales}, sale items: ${summary.items}, inventory movements: ${summary.movements}`,
  );
  console.log(`[seed] Low-stock products: ${summary.lowStock}`);
  console.log(`[seed] Cashier: ${userId ? `user #${userId}` : 'none (processed_by is null)'}`);
}

void seed()
  .catch((error: unknown) => {
    console.error(
      '[seed] Failed:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
