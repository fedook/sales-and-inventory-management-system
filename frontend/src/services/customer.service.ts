import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type { Paginated } from '../types/pagination'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
  CustomerPurchases,
} from '../types/customer'

export async function listCustomers(
  params: CustomerListParams,
): Promise<Paginated<Customer>> {
  const response = await api.get<
    ApiResponse<{ customers: Customer[]; pagination: Paginated<Customer>['pagination'] }>
  >('/customers', { params })

  return {
    items: response.data.data.customers,
    pagination: response.data.data.pagination,
  }
}

/**
 * Loads every customer for sale entry and filter menus. The API caps each
 * page at 100 rows, so this follows the pagination until the list ends.
 */
export async function listAllCustomers(): Promise<Customer[]> {
  const items: Customer[] = []
  let page = 1
  let totalPages = 1

  do {
    const result = await listCustomers({
      page,
      limit: 100,
      sort: 'name',
      direction: 'asc',
    })

    items.push(...result.items)
    totalPages = result.pagination.totalPages
    page += 1
  } while (page <= totalPages && page <= 20)

  return items
}

export async function getCustomer(id: number): Promise<Customer> {
  const response =
    await api.get<ApiResponse<{ customer: Customer }>>(`/customers/${id}`)
  return response.data.data.customer
}

export async function getCustomerPurchases(
  id: number,
): Promise<CustomerPurchases> {
  const response =
    await api.get<ApiResponse<CustomerPurchases>>(`/customers/${id}/purchases`)
  return response.data.data
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const response = await api.post<ApiResponse<{ customer: Customer }>>(
    '/customers',
    input,
  )
  return response.data.data.customer
}

export async function updateCustomer(
  id: number,
  input: CustomerInput,
): Promise<Customer> {
  const response = await api.put<ApiResponse<{ customer: Customer }>>(
    `/customers/${id}`,
    input,
  )
  return response.data.data.customer
}

export async function deleteCustomer(id: number): Promise<void> {
  await api.delete(`/customers/${id}`)
}
