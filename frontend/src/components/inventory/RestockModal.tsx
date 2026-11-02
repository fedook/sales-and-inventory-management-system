import { useEffect, useState, type FormEvent } from 'react'
import { PackagePlus, Save } from 'lucide-react'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import TextField from '../ui/TextField'
import { restockProduct } from '../../services/inventory.service'
import type { StockItem } from '../../types/inventory'
import { formatNumber } from '../../utils/format'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../../utils/getFieldErrors'

interface RestockModalProps {
  open: boolean
  product: StockItem | null
  onClose: () => void
  onSaved: (product: StockItem, added: number) => void
}

export default function RestockModal({
  open,
  product,
  onClose,
  onSaved,
}: RestockModalProps) {
  const [quantity, setQuantity] = useState('10')
  const [reason, setReason] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect
    setQuantity('10')
    setReason('')
    setFieldErrors({})
    setFormError(null)
  }, [open, product])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!product) {
      return
    }

    const amount = Number(quantity)

    if (!Number.isInteger(amount) || amount < 1) {
      setFormError('Enter a whole quantity of at least 1.')
      return
    }

    setSaving(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const updated = await restockProduct({
        productId: product.id,
        quantity: amount,
        reason: reason.trim() || undefined,
      })

      onSaved(updated, amount)
    } catch (error) {
      setFormError(getErrorMessage(error))
      setFieldErrors(getFieldErrors(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Receive stock"
      description={
        product
          ? `Add units to "${product.name}". A restock movement is written to the audit trail.`
          : undefined
      }
      onClose={onClose}
    >
      {product && (
        <form
          onSubmit={(event) => void handleSubmit(event)}
          noValidate
          className="space-y-4"
        >
          {formError && <Alert tone="error">{formError}</Alert>}

          <div className="grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-stone-500">Current stock</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {formatNumber(product.stock)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">Reorder level</p>
              <p className="mt-1 text-lg font-semibold text-stone-900">
                {formatNumber(product.reorderLevel)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-500">New stock</p>
              <p className="mt-1 text-lg font-semibold text-emerald-700">
                {formatNumber(
                  product.stock + Math.max(0, Number(quantity) || 0),
                )}
              </p>
            </div>
          </div>

          <TextField
            label="Quantity received"
            name="restockQuantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            error={fieldErrors.quantity}
            required
          />

          <TextField
            label="Reason (optional)"
            name="restockReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Delivery from supplier"
            error={fieldErrors.reason}
            hint="Saved with the movement so the stock change is explainable."
          />

          <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Save size={16} aria-hidden />
              Add stock
            </Button>
          </div>

          <p className="flex items-start gap-2 text-xs text-stone-500">
            <PackagePlus size={14} className="mt-0.5 shrink-0" aria-hidden />
            Use this for deliveries. For corrections, edit the product stock so
            an adjustment is recorded instead.
          </p>
        </form>
      )}
    </Modal>
  )
}
