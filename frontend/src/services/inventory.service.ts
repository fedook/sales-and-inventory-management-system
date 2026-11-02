import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type { Paginated } from '../types/pagination'
import type {
  InventoryMovement,
  LowStockAlert,
  MovementListParams,
  RestockInput,
  StockItem,
  StockListParams,
} from '../types/inventory'

export async function listStock(
  params: StockListParams,
): Promise<Paginated<StockItem>> {
  const response = await api.get<
    ApiResponse<{
      products: StockItem[]
      pagination: Paginated<StockItem>['pagination']
    }>
  >('/inventory/stock', { params })

  return {
    items: response.data.data.products,
    pagination: response.data.data.pagination,
  }
}

export async function listMovements(
  params: MovementListParams,
): Promise<Paginated<InventoryMovement>> {
  const response = await api.get<
    ApiResponse<{
      movements: InventoryMovement[]
      pagination: Paginated<InventoryMovement>['pagination']
    }>
  >('/inventory/movements', { params })

  return {
    items: response.data.data.movements,
    pagination: response.data.data.pagination,
  }
}

export async function listLowStockAlerts(): Promise<LowStockAlert> {
  const response =
    await api.get<ApiResponse<LowStockAlert>>('/inventory/alerts')
  return response.data.data
}

export async function restockProduct(
  input: RestockInput,
): Promise<StockItem> {
  const response = await api.post<ApiResponse<{ product: StockItem }>>(
    '/inventory/restock',
    input,
  )
  return response.data.data.product
}
