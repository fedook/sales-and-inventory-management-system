import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type {
  AnalyticsOverview, CategoryPerformance, ForecastResponse, InventorySummary, LowestProduct,
  Recommendation, SalesTrendPoint, TopProduct,
} from '../types/analytics'

export interface AnalyticsFilters { from?: string; to?: string }

async function getData<T>(path: string, params?: object): Promise<T> {
  const response = await api.get<ApiResponse<T>>(path, { params })
  return response.data.data
}

export const getOverview = (filters: AnalyticsFilters) => getData<AnalyticsOverview>('/analytics/overview', filters)
export const getSalesTrend = (filters: AnalyticsFilters) => getData<SalesTrendPoint[]>('/analytics/sales-trend', filters)
export const getTopProducts = (filters: AnalyticsFilters) => getData<TopProduct[]>('/analytics/top-products', filters)
export const getLowestProducts = (filters: AnalyticsFilters) => getData<LowestProduct[]>('/analytics/lowest-products', filters)
export const getCategoryPerformance = (filters: AnalyticsFilters) => getData<CategoryPerformance[]>('/analytics/category-performance', filters)
export const getInventorySummary = () => getData<InventorySummary>('/analytics/inventory-summary')
export const getForecast = (months = 6) => getData<ForecastResponse>('/analytics/forecast', { months })
export const getRecommendations = () => getData<Recommendation[]>('/analytics/recommendations')
