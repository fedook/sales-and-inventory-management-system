export interface SupplierProduct {
  id: number
  name: string
  category: string
  stock: number
  reorderLevel: number
  sellingPrice: number
  isLowStock: boolean
}

export interface Supplier {
  id: number
  name: string
  contactInformation: string | null
  address: string | null
  averageDeliveryTime: number | null
  productCount: number
  createdAt: string
  updatedAt: string
}

export interface SupplierDetail extends Supplier {
  products: SupplierProduct[]
}

export interface SupplierInput {
  name: string
  contactInformation?: string
  address?: string
  averageDeliveryTime: number | null
}

export interface SupplierListParams {
  page?: number
  limit?: number
  search?: string
  sort?: 'name' | 'newest' | 'delivery'
  direction?: 'asc' | 'desc'
}
