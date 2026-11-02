import { LoaderCircle, Receipt } from 'lucide-react'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import type { SaleDetail } from '../../types/sale'
import { paymentMethodLabels } from '../../types/sale'
import { formatDateTime, formatMoney, formatNumber } from '../../utils/format'

interface SaleDetailsModalProps {
  open: boolean
  sale: SaleDetail | null
  loading: boolean
  onClose: () => void
}

export default function SaleDetailsModal({
  open,
  sale,
  loading,
  onClose,
}: SaleDetailsModalProps) {
  return (
    <Modal
      open={open}
      size="lg"
      title={sale ? `Sale #${sale.id}` : 'Sale details'}
      description={
        sale
          ? `${formatDateTime(sale.saleDate)} · ${paymentMethodLabels[sale.paymentMethod]}`
          : undefined
      }
      onClose={onClose}
    >
      {loading || !sale ? (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-stone-500">
          <LoaderCircle
            size={20}
            className="animate-spin text-emerald-600"
            aria-hidden
          />
          Loading sale...
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Customer</p>
              <p className="mt-1 font-medium text-stone-900">
                {sale.customerName ?? 'Walk-in customer'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Recorded by</p>
              <p className="mt-1 font-medium text-stone-900">
                {sale.processedByName ?? 'Unknown cashier'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Payment</p>
              <p className="mt-1 font-medium text-stone-900">
                {paymentMethodLabels[sale.paymentMethod]}
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-200">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                  <th scope="col" className="px-4 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Qty
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Unit price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-stone-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {item.productName}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-700">
                      {formatNumber(item.quantity)}
                    </td>
                    <td className="px-4 py-3 text-right text-stone-700">
                      {formatMoney(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-stone-900">
                      {formatMoney(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-stone-100 pt-4">
            <span className="inline-flex items-center gap-2 text-xs text-stone-500">
              <Receipt size={14} aria-hidden />
              {sale.itemCount} line{sale.itemCount === 1 ? '' : 's'}
            </span>
            <div className="text-right">
              <p className="text-xs font-medium text-stone-500">Total</p>
              <p className="text-2xl font-semibold text-stone-900">
                {formatMoney(sale.totalAmount)}
              </p>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-stone-500">
            Sales are permanent records. Stock movements for this sale are listed
            on the Inventory page with reference <strong>Sale #{sale.id}</strong>.
          </p>

          <div className="flex justify-end">
            <Badge tone="success">Recorded</Badge>
          </div>
        </div>
      )}
    </Modal>
  )
}
