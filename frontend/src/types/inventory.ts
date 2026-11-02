export type InventoryMovementType =
  | 'initial'
  | 'restock'
  | 'sale'
  | 'return'
  | 'adjustment'

export interface StockItem {
  id: number
  name: string
  category: string
  stock: number
  reorderLevel: number
  sellingPrice: number
  purchaseCost: number
  supplierId: number | null
  supplierName: string | null
  stockValue: number
  isLowStock: boolean
  updatedAt: string
}

export interface StockListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  supplierId?: number
  lowStock?: boolean
  sort?: 'name' | 'stock' | 'value' | 'newest'
  direction?: 'asc' | 'desc'
}

export interface InventoryMovement {
  id: number
  productId: number
  productName: string
  quantityChange: number
  stockAfter: number
  movementType: InventoryMovementType
  saleId: number | null
  userName: string | null
  reason: string | null
  createdAt: string
}

export interface MovementListParams {
  page?: number
  limit?: number
  productId?: number
  movementType?: InventoryMovementType
  from?: string
  to?: string
  direction?: 'asc' | 'desc'
}

export interface LowStockAlert {
  total: number
  alerts: StockItem[]
}

export interface RestockInput {
  productId: number
  quantity: number
  reason?: string
}

export const movementTypeLabels: Record<InventoryMovementType, string> = {
  initial: 'Opening stock',
  restock: 'Restock',
  sale: 'Sale',
  return: 'Return',
  adjustment: 'Adjustment',
}
