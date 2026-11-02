import { useCallback, useEffect, useState } from 'react'
import { LoaderCircle, Package } from 'lucide-react'
import Alert from '../ui/Alert'
import Badge from '../ui/Badge'
import Modal from '../ui/Modal'
import { getSupplier } from '../../services/supplier.service'
import type { Supplier, SupplierDetail } from '../../types/supplier'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { formatMoney, formatNumber, orDash } from '../../utils/format'

interface SupplierDetailsModalProps {
  open: boolean
  supplier: Supplier | null
  onClose: () => void
}

export default function SupplierDetailsModal({
  open,
  supplier,
  onClose,
}: SupplierDetailsModalProps) {
  const [detail, setDetail] = useState<SupplierDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!supplier) {
      return
    }

    setLoading(true)
    setError(null)
    setDetail(null)

    try {
      setDetail(await getSupplier(supplier.id))
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [supplier])

  useEffect(() => {
    if (!open || !supplier) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [open, supplier, load])

  return (
    <Modal
      open={open}
      title={supplier ? supplier.name : 'Supplier'}
      description="Contact details and the products currently linked to this supplier."
      onClose={onClose}
      size="lg"
    >
      {loading && (
        <div className="flex items-center justify-center gap-3 py-12 text-sm text-stone-500">
          <LoaderCircle size={20} className="animate-spin text-emerald-600" aria-hidden />
          Loading supplier...
        </div>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      {!loading && !error && detail && (
        <div className="space-y-5">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Contact
              </dt>
              <dd className="mt-1 text-sm text-stone-800">
                {orDash(detail.contactInformation)}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Average delivery time
              </dt>
              <dd className="mt-1 text-sm text-stone-800">
                {detail.averageDeliveryTime === null
                  ? 'Not recorded'
                  : `${detail.averageDeliveryTime} day${
                      detail.averageDeliveryTime === 1 ? '' : 's'
                    }`}
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-3 sm:col-span-2">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                Address
              </dt>
              <dd className="mt-1 text-sm text-stone-800">{orDash(detail.address)}</dd>
            </div>
          </dl>

          <section>
            <h3 className="text-sm font-semibold text-stone-900">
              Linked products ({detail.products.length})
            </h3>

            {detail.products.length === 0 ? (
              <div className="mt-3 flex flex-col items-center rounded-2xl border border-dashed border-stone-200 px-6 py-8 text-center">
                <Package size={20} className="text-stone-400" aria-hidden />
                <p className="mt-2 text-sm text-stone-600">
                  No products are linked to this supplier yet.
                </p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
                {detail.products.map((product) => (
                  <li
                    key={product.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-stone-500">{product.category}</p>
                    </div>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-stone-600">
                        {formatNumber(product.stock)} in stock
                      </span>
                      {product.isLowStock && <Badge tone="warning">Low stock</Badge>}
                      <span className="font-medium text-stone-800">
                        {formatMoney(product.sellingPrice)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </Modal>
  )
}
