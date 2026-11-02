import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, ReceiptText } from 'lucide-react'
import Alert from '../ui/Alert'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import { getCustomerPurchases } from '../../services/customer.service'
import type { Customer, CustomerPurchases } from '../../types/customer'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { formatDate, formatDateTime, formatMoney } from '../../utils/format'

interface PurchaseHistoryModalProps {
  open: boolean
  customer: Customer | null
  onClose: () => void
}

function paymentLabel(method: string): string {
  return method.replaceAll('_', ' ')
}

export default function PurchaseHistoryModal({
  open,
  customer,
  onClose,
}: PurchaseHistoryModalProps) {
  const [data, setData] = useState<CustomerPurchases | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!customer) {
      return
    }

    setLoading(true)
    setError(null)
    setData(null)

    try {
      setData(await getCustomerPurchases(customer.id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [customer])

  useEffect(() => {
    if (!open || !customer) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [open, customer, load])

  return (
    <Modal
      open={open}
      title={customer ? `${customer.name} — purchase history` : 'Purchase history'}
      description="Calculated from real recorded sales, newest first."
      onClose={onClose}
      size="lg"
    >
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-stone-500">
          <LoaderCircle size={20} className="animate-spin text-emerald-600" aria-hidden />
          Loading purchases...
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && data && (
        <div className="space-y-5">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Total spent
              </dt>
              <dd className="mt-1 text-sm font-semibold text-stone-900">
                {formatMoney(data.summary.totalSpent)}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Purchases
              </dt>
              <dd className="mt-1 text-sm font-semibold text-stone-900">
                {data.summary.saleCount}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Average sale
              </dt>
              <dd className="mt-1 text-sm font-semibold text-stone-900">
                {formatMoney(data.summary.averageSale)}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Last purchase
              </dt>
              <dd className="mt-1 text-sm font-semibold text-stone-900">
                {data.summary.lastPurchaseAt
                  ? formatDate(data.summary.lastPurchaseAt)
                  : 'None yet'}
              </dd>
            </div>
          </dl>

          {data.purchases.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-200 px-6 py-10 text-center">
              <ReceiptText size={22} className="text-stone-400" aria-hidden />
              <p className="mt-2 text-sm font-medium text-stone-800">
                No purchases recorded yet
              </p>
              <p className="mt-1 text-xs text-stone-500">
                Sales recorded in Phase 5 will appear here automatically.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {data.purchases.map((purchase) => (
                <li
                  key={purchase.id}
                  className="overflow-hidden rounded-2xl border border-stone-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">
                        Sale #{purchase.id}
                      </p>
                      <p className="text-xs text-stone-500">
                        {formatDateTime(purchase.saleDate)}
                        {purchase.processedByName
                          ? ` · recorded by ${purchase.processedByName}`
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone="neutral">{paymentLabel(purchase.paymentMethod)}</Badge>
                      <span className="text-sm font-semibold text-stone-900">
                        {formatMoney(purchase.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <ul className="divide-y divide-stone-100">
                    {purchase.items.map((item) => (
                      <li
                        key={`${purchase.id}-${item.productId}`}
                        className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
                      >
                        <span className="min-w-0 truncate text-stone-700">
                          {item.productName}
                          <span className="ml-2 text-xs text-stone-500">
                            {item.quantity} × {formatMoney(item.unitPrice)}
                          </span>
                        </span>
                        <span className="shrink-0 font-medium text-stone-800">
                          {formatMoney(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  )
}
