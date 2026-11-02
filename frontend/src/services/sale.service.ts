import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type { Paginated } from '../types/pagination'
import type { SaleDetail, SaleInput, SaleListItem, SaleListParams } from '../types/sale'

export async function listSales(
  params: SaleListParams,
): Promise<Paginated<SaleListItem>> {
  const response = await api.get<
    ApiResponse<{
      sales: SaleListItem[]
      pagination: Paginated<SaleListItem>['pagination']
    }>
  >('/sales', { params })

  return {
    items: response.data.data.sales,
    pagination: response.data.data.pagination,
  }
}

export async function getSale(id: number): Promise<SaleDetail> {
  const response =
    await api.get<ApiResponse<{ sale: SaleDetail }>>(`/sales/${id}`)
  return response.data.data.sale
}

export async function createSale(input: SaleInput): Promise<SaleDetail> {
  const response = await api.post<ApiResponse<{ sale: SaleDetail }>>(
    '/sales',
    input,
  )
  return response.data.data.sale
}
