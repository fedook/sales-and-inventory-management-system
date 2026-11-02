export interface AnalyticsOverview {
  revenue: number
  transactionCount: number
  averageOrderValue: number
  productCount: number
  customerCount: number
  lowStockCount: number
  inventoryUnits: number
  inventoryCostValue: number
}
export interface SalesTrendPoint { period: string; revenue: number; transactions: number }
export interface TopProduct { productId: number; productName: string; category: string; unitsSold: number; revenue: number }
export interface LowestProduct { productId: number; productName: string; category: string; unitsSold: number; revenue: number; stock: number }
export interface CategoryPerformance { category: string; unitsSold: number; revenue: number }
export interface InventoryProduct { id: number; name: string; category: string; stock: number; reorderLevel: number; supplierName: string | null }
export interface InventorySummary { totalProducts: number; lowStockCount: number; outOfStockCount: number; lowStock: InventoryProduct[] }
export interface ForecastPoint { period: string; label: string; revenue: number; transactions: number; kind: 'actual' }
export interface RevenueForecast {
  method: string; forecastPeriod: string; forecastLabel: string; predictedRevenue: number;
  historical: ForecastPoint[]; assumptions: string[]
}
export interface DemandForecastProduct {
  id: number; name: string; stock: number; reorderLevel: number; unitsSold30Days: number;
  averageDailyDemand: number; estimatedDaysUntilStockout: number | null
}
export interface ForecastResponse { revenue: RevenueForecast; productDemand: DemandForecastProduct[] }
export interface Recommendation {
  productId: number; productName: string; category: string;
  type: 'reorder' | 'stockout-risk' | 'slow-moving'; priority: 'high' | 'medium' | 'low';
  reason: string; suggestedQuantity?: number; supplierName: string | null
}
