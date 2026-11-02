export type ProductSort = 'name' | 'newest' | 'stock' | 'price'

/** A product exactly as the API returns it. */
export interface Product {
  id: number
  name: string
  description: string | null
  category: string
  sellingPrice: number
  purchaseCost: number
  stock: number
  reorderLevel: number
  supplierId: number | null
  supplierName: string | null
  isLowStock: boolean
  createdAt: string
  updatedAt: string
}

/** Body sent to POST /api/products and PUT /api/products/:id. */
export interface ProductInput {
  name: string
  description?: string
  category: string
  sellingPrice: number
  purchaseCost: number
  stock: number
  reorderLevel: number
  supplierId: number | null
}

export interface ProductListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  supplierId?: number
  lowStock?: boolean
  sort?: ProductSort
  direction?: 'asc' | 'desc'
}
