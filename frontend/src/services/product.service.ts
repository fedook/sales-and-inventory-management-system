import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type { Paginated } from '../types/pagination'
import type {
  Product,
  ProductInput,
  ProductListParams,
} from '../types/product'

export async function listProducts(
  params: ProductListParams,
): Promise<Paginated<Product>> {
  const response = await api.get<
    ApiResponse<{ products: Product[]; pagination: Paginated<Product>['pagination'] }>
  >('/products', { params })

  return {
    items: response.data.data.products,
    pagination: response.data.data.pagination,
  }
}

/**
 * Loads every product for the sale form and filter menus. The API caps each
 * page at 100 rows, so this follows the pagination until the catalogue ends.
 */
export async function listAllProducts(): Promise<Product[]> {
  const items: Product[] = []
  let page = 1
  let totalPages = 1

  do {
    const result = await listProducts({
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

export async function listProductCategories(): Promise<string[]> {
  const response =
    await api.get<ApiResponse<{ categories: string[] }>>('/products/categories')
  return response.data.data.categories
}

export async function getProduct(id: number): Promise<Product> {
  const response =
    await api.get<ApiResponse<{ product: Product }>>(`/products/${id}`)
  return response.data.data.product
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const response = await api.post<ApiResponse<{ product: Product }>>(
    '/products',
    input,
  )
  return response.data.data.product
}

export async function updateProduct(
  id: number,
  input: ProductInput,
): Promise<Product> {
  const response = await api.put<ApiResponse<{ product: Product }>>(
    `/products/${id}`,
    input,
  )
  return response.data.data.product
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`)
}
