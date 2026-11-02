import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type { Paginated } from '../types/pagination'
import type {
  Supplier,
  SupplierDetail,
  SupplierInput,
  SupplierListParams,
} from '../types/supplier'

export async function listSuppliers(
  params: SupplierListParams,
): Promise<Paginated<Supplier>> {
  const response = await api.get<
    ApiResponse<{ suppliers: Supplier[]; pagination: Paginated<Supplier>['pagination'] }>
  >('/suppliers', { params })

  return {
    items: response.data.data.suppliers,
    pagination: response.data.data.pagination,
  }
}

export async function getSupplier(id: number): Promise<SupplierDetail> {
  const response =
    await api.get<ApiResponse<{ supplier: SupplierDetail }>>(`/suppliers/${id}`)
  return response.data.data.supplier
}

export async function createSupplier(input: SupplierInput): Promise<Supplier> {
  const response = await api.post<ApiResponse<{ supplier: Supplier }>>(
    '/suppliers',
    input,
  )
  return response.data.data.supplier
}

export async function updateSupplier(
  id: number,
  input: SupplierInput,
): Promise<Supplier> {
  const response = await api.put<ApiResponse<{ supplier: Supplier }>>(
    `/suppliers/${id}`,
    input,
  )
  return response.data.data.supplier
}

export async function deleteSupplier(id: number): Promise<void> {
  await api.delete(`/suppliers/${id}`)
}
