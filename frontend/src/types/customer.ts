export type CustomerType = 'walk-in' | 'regular' | 'wholesale'

export interface Customer {
  id: number
  name: string
  customerType: CustomerType
  location: string | null
  contactInformation: string | null
  createdAt: string
  updatedAt: string
  /** Calculated from real sales by the API. */
  totalSpent: number
  saleCount: number
  lastPurchaseAt: string | null
}

export interface CustomerInput {
  name: string
  customerType: CustomerType
  location?: string
  contactInformation?: string
}

export interface CustomerListParams {
  page?: number
  limit?: number
  search?: string
  customerType?: CustomerType
  sort?: 'name' | 'newest'
  direction?: 'asc' | 'desc'
}

export interface PurchaseItem {
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface Purchase {
  id: number
  saleDate: string
  totalAmount: number
  paymentMethod: string
  processedByName: string | null
  items: PurchaseItem[]
}

export interface PurchaseSummary {
  saleCount: number
  totalSpent: number
  averageSale: number
  lastPurchaseAt: string | null
}

export interface CustomerPurchases {
  customer: Customer
  summary: PurchaseSummary
  purchases: Purchase[]
}
