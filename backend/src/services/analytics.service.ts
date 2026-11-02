import { and, asc, desc, eq, gte, lt, lte, sql } from 'drizzle-orm';
import { requireDb } from '../db/client.js';
import { customers, products, saleItems, sales, suppliers } from '../db/schema/index.js';
import type { AnalyticsQuery } from '../validators/analytics.validator.js';

function dateStart(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
function dateEndExclusive(value: string): Date {
  const date = dateStart(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}
function dateFilters(query: AnalyticsQuery) {
  const filters = [];
  if (query.from) filters.push(gte(sales.saleDate, dateStart(query.from)));
  if (query.to) filters.push(lt(sales.saleDate, dateEndExclusive(query.to)));
  return filters.length ? and(...filters) : undefined;
}

export async function getOverview(query: AnalyticsQuery) {
  const db = requireDb();
  const where = dateFilters(query);
  const [totals] = await db.select({
    revenue: sql<number>`coalesce(sum(${sales.totalAmount}), 0)::float`,
    transactionCount: sql<number>`count(*)::int`,
    averageOrderValue: sql<number>`coalesce(avg(${sales.totalAmount}), 0)::float`,
  }).from(sales).where(where);
  const [customerTotals] = await db.select({ customerCount: sql<number>`count(*)::int` }).from(customers);
  const [productTotals] = await db.select({
    productCount: sql<number>`count(*)::int`,
    lowStockCount: sql<number>`count(*) filter (where ${products.stock} <= ${products.reorderLevel})::int`,
    inventoryUnits: sql<number>`coalesce(sum(${products.stock}), 0)::int`,
    inventoryCostValue: sql<number>`coalesce(sum(${products.stock} * ${products.purchaseCost}), 0)::float`,
  }).from(products);
  return { ...totals, ...productTotals, ...customerTotals };
}

export async function getSalesTrend(query: AnalyticsQuery) {
  const db = requireDb();
  return db.select({
    period: sql<string>`to_char(date_trunc('month', ${sales.saleDate}), 'YYYY-MM')`,
    revenue: sql<number>`sum(${sales.totalAmount})::float`,
    transactions: sql<number>`count(*)::int`,
  }).from(sales).where(dateFilters(query))
    .groupBy(sql`date_trunc('month', ${sales.saleDate})`)
    .orderBy(asc(sql`date_trunc('month', ${sales.saleDate})`));
}

export async function getTopProducts(query: AnalyticsQuery) {
  const db = requireDb();
  return db.select({
    productId: products.id,
    productName: products.name,
    category: products.category,
    unitsSold: sql<number>`sum(${saleItems.quantity})::int`,
    revenue: sql<number>`sum(${saleItems.subtotal})::float`,
  }).from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(dateFilters(query))
    .groupBy(products.id, products.name, products.category)
    .orderBy(desc(sql`sum(${saleItems.quantity})`), desc(sql`sum(${saleItems.subtotal})`))
    .limit(10);
}

export async function getLowestProducts(query: AnalyticsQuery) {
  const db = requireDb();
  const saleJoinFilters = [eq(saleItems.saleId, sales.id)];
  if (query.from) saleJoinFilters.push(gte(sales.saleDate, dateStart(query.from)));
  if (query.to) saleJoinFilters.push(lt(sales.saleDate, dateEndExclusive(query.to)));
  const rows = await db.select({
    productId: products.id,
    productName: products.name,
    category: products.category,
    unitsSold: sql<number>`coalesce(sum(case when ${sales.id} is not null then ${saleItems.quantity} else 0 end), 0)::int`,
    revenue: sql<number>`coalesce(sum(case when ${sales.id} is not null then ${saleItems.subtotal} else 0 end), 0)::float`,
    stock: products.stock,
  }).from(products)
    .leftJoin(saleItems, eq(saleItems.productId, products.id))
    .leftJoin(sales, and(...saleJoinFilters))
    .groupBy(products.id)
    .orderBy(asc(sql`coalesce(sum(case when ${sales.id} is not null then ${saleItems.quantity} else 0 end), 0)`), asc(products.name))
    .limit(10);
  return rows;
}

export async function getCategoryPerformance(query: AnalyticsQuery) {
  const db = requireDb();
  return db.select({
    category: products.category,
    unitsSold: sql<number>`sum(${saleItems.quantity})::int`,
    revenue: sql<number>`sum(${saleItems.subtotal})::float`,
  }).from(saleItems)
    .innerJoin(products, eq(saleItems.productId, products.id))
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(dateFilters(query))
    .groupBy(products.category)
    .orderBy(desc(sql`sum(${saleItems.subtotal})`));
}

export async function getInventorySummary() {
  const db = requireDb();
  const [totals] = await db.select({
    totalProducts: sql<number>`count(*)::int`,
    lowStockCount: sql<number>`count(*) filter (where ${products.stock} <= ${products.reorderLevel})::int`,
    outOfStockCount: sql<number>`count(*) filter (where ${products.stock} = 0)::int`,
  }).from(products);

  const lowStock = await db.select({
    id: products.id,
    name: products.name,
    category: products.category,
    stock: products.stock,
    reorderLevel: products.reorderLevel,
    supplierName: suppliers.name,
  }).from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .where(lte(products.stock, products.reorderLevel))
    .orderBy(asc(products.stock), asc(products.name))
    .limit(10);

  return { ...totals, lowStock };
}

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}
function monthLabel(key: string): string {
  const [yearText = '1970', monthText = '1'] = key.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** Forecasts the next calendar month's revenue using the mean of the last 3 completed months. */
export async function getForecast(months: number) {
  const db = requireDb();
  const now = new Date();
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const firstMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1));
  const rows = await db.select({
    period: sql<string>`to_char(date_trunc('month', ${sales.saleDate}), 'YYYY-MM')`,
    revenue: sql<number>`sum(${sales.totalAmount})::float`,
    transactions: sql<number>`count(*)::int`,
  }).from(sales)
    .where(and(gte(sales.saleDate, firstMonth), lt(sales.saleDate, currentMonthStart)))
    .groupBy(sql`date_trunc('month', ${sales.saleDate})`)
    .orderBy(asc(sql`date_trunc('month', ${sales.saleDate})`));
  const byMonth = new Map(rows.map((row) => [row.period, row]));
  const history = Array.from({ length: months }, (_, index) => {
    const date = new Date(Date.UTC(firstMonth.getUTCFullYear(), firstMonth.getUTCMonth() + index, 1));
    const key = monthKey(date);
    const row = byMonth.get(key);
    return { period: key, label: monthLabel(key), revenue: row?.revenue ?? 0, transactions: row?.transactions ?? 0, kind: 'actual' as const };
  });
  const averageBase = history.slice(-3);
  const predictedRevenue = averageBase.reduce((sum, item) => sum + item.revenue, 0) / averageBase.length;
  const forecastDate = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() + 1, 1));
  const forecastPeriod = monthKey(forecastDate);
  return {
    method: 'Three-month simple moving average',
    forecastPeriod,
    forecastLabel: monthLabel(forecastPeriod),
    predictedRevenue: Math.round(predictedRevenue * 100) / 100,
    historical: history,
    assumptions: [
      'Uses the last three completed calendar months; months without sales count as zero.',
      'Assumes recent revenue patterns continue and does not model seasonality, price changes, or one-off events.',
      'This is a planning estimate, not a guaranteed result.',
    ],
  };
}

/** Product demand and stock cover based on the previous 30 days of recorded sales. */
export async function getDemandForecast() {
  const db = requireDb();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const soldRows = await db.select({
    productId: saleItems.productId,
    unitsSold: sql<number>`coalesce(sum(${saleItems.quantity}), 0)::int`,
  }).from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(gte(sales.saleDate, since))
    .groupBy(saleItems.productId);
  const soldByProduct = new Map(soldRows.map((row) => [row.productId, row.unitsSold]));
  const productRows = await db.select({
    id: products.id, name: products.name, stock: products.stock,
    reorderLevel: products.reorderLevel,
  }).from(products).orderBy(asc(products.name));
  return productRows.map((product) => {
    const unitsSold30Days = soldByProduct.get(product.id) ?? 0;
    const averageDailyDemand = unitsSold30Days / 30;
    const estimatedDaysUntilStockout = averageDailyDemand > 0 ? Math.floor(product.stock / averageDailyDemand) : null;
    return { ...product, unitsSold30Days, averageDailyDemand: Math.round(averageDailyDemand * 100) / 100, estimatedDaysUntilStockout };
  }).filter((product) => product.unitsSold30Days > 0 || product.stock <= product.reorderLevel)
    .sort((a, b) => (a.estimatedDaysUntilStockout ?? Number.POSITIVE_INFINITY) - (b.estimatedDaysUntilStockout ?? Number.POSITIVE_INFINITY))
    .slice(0, 15);
}

/** Recommendations are deterministic rules based on stock, sales velocity and supplier lead time. */
export async function getRecommendations() {
  const db = requireDb();
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  const recentSales = db.select({
    productId: saleItems.productId,
    unitsSold90Days: sql<number>`sum(${saleItems.quantity})::int`.as('units_sold_90_days'),
  }).from(saleItems)
    .innerJoin(sales, eq(saleItems.saleId, sales.id))
    .where(gte(sales.saleDate, since))
    .groupBy(saleItems.productId)
    .as('recent_product_sales');

  const rows = await db.select({
    id: products.id,
    name: products.name,
    category: products.category,
    stock: products.stock,
    reorderLevel: products.reorderLevel,
    supplierName: suppliers.name,
    leadTimeDays: suppliers.averageDeliveryTime,
    unitsSold90Days: sql<number>`coalesce(${recentSales.unitsSold90Days}, 0)::int`,
  }).from(products)
    .leftJoin(suppliers, eq(products.supplierId, suppliers.id))
    .leftJoin(recentSales, eq(recentSales.productId, products.id))
    .orderBy(asc(products.stock));

  const recommendations: Array<{
    productId: number; productName: string; category: string; type: 'reorder' | 'stockout-risk' | 'slow-moving';
    priority: 'high' | 'medium' | 'low'; reason: string; suggestedQuantity?: number; supplierName: string | null;
  }> = [];

  for (const product of rows) {
    const dailyDemand = product.unitsSold90Days / 90;
    const leadTime = product.leadTimeDays ?? 7;
    const daysOfStock = dailyDemand > 0 ? product.stock / dailyDemand : null;
    const targetStock = Math.max(product.reorderLevel * 2, Math.ceil(dailyDemand * (leadTime + 14)));
    const reorderQuantity = Math.max(0, targetStock - product.stock);

    if (product.stock === 0 || product.stock <= product.reorderLevel || (daysOfStock !== null && daysOfStock <= leadTime)) {
      recommendations.push({
        productId: product.id, productName: product.name, category: product.category,
        type: daysOfStock !== null && daysOfStock <= leadTime ? 'stockout-risk' : 'reorder',
        priority: product.stock === 0 || (daysOfStock !== null && daysOfStock <= leadTime) ? 'high' : 'medium',
        reason: product.stock === 0 ? 'Out of stock.' : daysOfStock !== null && daysOfStock <= leadTime
          ? `Estimated stock cover is ${Math.floor(daysOfStock)} days, at or below the ${leadTime}-day supplier lead time.`
          : `Current stock (${product.stock}) is at or below the reorder level (${product.reorderLevel}).`,
        suggestedQuantity: reorderQuantity || Math.max(1, product.reorderLevel * 2 - product.stock),
        supplierName: product.supplierName,
      });
    } else if (product.stock > product.reorderLevel && product.unitsSold90Days <= 2) {
      recommendations.push({
        productId: product.id, productName: product.name, category: product.category,
        type: 'slow-moving', priority: 'low',
        reason: `Only ${product.unitsSold90Days} unit(s) sold in the last 90 days while ${product.stock} unit(s) remain in stock. Consider a promotion or smaller future orders.`,
        supplierName: product.supplierName,
      });
    }
  }

  recommendations.sort((a, b) => {
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority];
  });
  return recommendations.slice(0, 30);
}
