export type PaymentMethod = 'cash' | 'card' | 'mobile_money' | 'bank_transfer'

export interface SaleListItem {
  id: number
  saleDate: string
  totalAmount: number
  paymentMethod: PaymentMethod
  customerId: number | null
  customerName: string | null
  processedByName: string | null
  itemCount: number
}

export interface SaleItem {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface SaleDetail extends SaleListItem {
  createdAt: string
  items: SaleItem[]
}

export interface SaleInput {
  customerId: number | null
  paymentMethod: PaymentMethod
  items: Array<{
    productId: number
    quantity: number
  }>
}

export interface SaleListParams {
  page?: number
  limit?: number
  search?: string
  paymentMethod?: PaymentMethod
  customerId?: number
  from?: string
  to?: string
  sort?: 'date' | 'total'
  direction?: 'asc' | 'desc'
}

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  card: 'Card',
  mobile_money: 'Mobile money',
  bank_transfer: 'Bank transfer',
}
