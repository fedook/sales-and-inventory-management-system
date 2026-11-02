import { useEffect, useState, type FormEvent } from 'react'
import { Plus, Receipt, Save, Trash2 } from 'lucide-react'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import IconButton from '../ui/IconButton'
import Modal from '../ui/Modal'
import SelectField from '../ui/SelectField'
import TextField from '../ui/TextField'
import { createSale } from '../../services/sale.service'
import type { Customer } from '../../types/customer'
import type { Product } from '../../types/product'
import type { PaymentMethod, SaleDetail } from '../../types/sale'
import { paymentMethodLabels } from '../../types/sale'
import { formatMoney, formatNumber } from '../../utils/format'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../../utils/getFieldErrors'

interface SaleFormModalProps {
  open: boolean
  products: Product[]
  customers: Customer[]
  onClose: () => void
  onSaved: (sale: SaleDetail) => void
}

interface LineState {
  key: string
  productId: string
  quantity: string
}

const MAX_LINES = 8
let lineKeySeed = 0

function newLine(): LineState {
  lineKeySeed += 1
  return { key: `sale-line-${lineKeySeed}`, productId: '', quantity: '1' }
}

const paymentOptions = (
  Object.keys(paymentMethodLabels) as PaymentMethod[]
).map((value) => ({ value, label: paymentMethodLabels[value] }))

export default function SaleFormModal({
  open,
  products,
  customers,
  onClose,
  onSaved,
}: SaleFormModalProps) {
  const [customerId, setCustomerId] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')
  const [lines, setLines] = useState<LineState[]>([newLine()])
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    // oxlint-disable-next-line react/set-state-in-effect
    setCustomerId('')
    setPaymentMethod('cash')
    setLines([newLine()])
    setFieldErrors({})
    setFormError(null)
  }, [open])

  const sellableProducts = products.filter((product) => product.stock > 0)

  function productFor(line: LineState): Product | undefined {
    return products.find((product) => String(product.id) === line.productId)
  }

  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    )
  }

  function removeLine(key: string) {
    setLines((current) => current.filter((line) => line.key !== key))
  }

  const total = lines.reduce((sum, line) => {
    const product = productFor(line)
    const quantity = Number(line.quantity)

    if (!product || !Number.isInteger(quantity) || quantity <= 0) {
      return sum
    }

    return sum + product.sellingPrice * quantity
  }, 0)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})

    if (lines.length === 0) {
      setFormError('Add at least one product to the sale.')
      return
    }

    const problems: string[] = []
    const items: Array<{ productId: number; quantity: number }> = []

    for (const line of lines) {
      const product = productFor(line)
      const quantity = Number(line.quantity)

      if (!product) {
        problems.push('Choose a product for every line.')
        continue
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        problems.push(`Enter a whole quantity for "${product.name}".`)
        continue
      }

      if (quantity > product.stock) {
        problems.push(
          `"${product.name}" only has ${formatNumber(product.stock)} in stock.`,
        )
        continue
      }

      items.push({ productId: product.id, quantity })
    }

    if (problems.length > 0) {
      setFormError(problems.join(' '))
      return
    }

    setSaving(true)

    try {
      const sale = await createSale({
        customerId: customerId ? Number(customerId) : null,
        paymentMethod,
        items,
      })

      onSaved(sale)
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
      size="lg"
      title="New sale"
      description="Stock is checked and deducted automatically when you save. Prices come from the product catalogue."
      onClose={onClose}
    >
      <form
        onSubmit={(event) => void handleSubmit(event)}
        noValidate
        className="space-y-5"
      >
        {formError && <Alert tone="error">{formError}</Alert>}
        {fieldErrors.items && !formError && (
          <Alert tone="error">{fieldErrors.items}</Alert>
        )}

        {sellableProducts.length === 0 ? (
          <Alert tone="info">
            No product currently has stock. Add products or receive a delivery
            from the Inventory page before recording a sale.
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label="Customer"
            name="customerId"
            value={customerId}
            onChange={setCustomerId}
            options={[
              { value: '', label: 'Walk-in customer (no record)' },
              ...customers.map((customer) => ({
                value: String(customer.id),
                label: `${customer.name} — ${customer.customerType}`,
              })),
            ]}
            error={fieldErrors.customerId}
            hint="Optional. Link the sale to a customer for purchase history."
          />

          <SelectField
            label="Payment method"
            name="paymentMethod"
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as PaymentMethod)}
            options={paymentOptions}
            error={fieldErrors.paymentMethod}
          />
        </div>

        <section aria-label="Sale items" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-stone-900">Products</h3>
            <span className="text-xs text-stone-500">
              {lines.length} of {MAX_LINES} lines
            </span>
          </div>

          {lines.map((line, index) => {
            const product = productFor(line)
            const quantity = Number(line.quantity)
            const lineTotal =
              product && Number.isInteger(quantity) && quantity > 0
                ? product.sellingPrice * quantity
                : 0
            const chosenElsewhere = new Set(
              lines
                .filter((other) => other.key !== line.key && other.productId)
                .map((other) => other.productId),
            )
            const options = sellableProducts
              .filter((item) => !chosenElsewhere.has(String(item.id)))
              .map((item) => ({
                value: String(item.id),
                label: `${item.name} — ${formatMoney(item.sellingPrice)} (${formatNumber(
                  item.stock,
                )} in stock)`,
              }))

            return (
              <div
                key={line.key}
                className="rounded-2xl border border-stone-200 bg-stone-50/60 p-3"
              >
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_100px_120px_auto] sm:items-end">
                  <SelectField
                    label={`Product ${index + 1}`}
                    name={`saleProduct${index}`}
                    value={line.productId}
                    onChange={(value) =>
                      updateLine(line.key, { productId: value, quantity: '1' })
                    }
                    options={[
                      { value: '', label: 'Choose a product' },
                      ...options,
                    ]}
                  />

                  <TextField
                    label="Quantity"
                    name={`saleQuantity${index}`}
                    type="number"
                    min={1}
                    max={product?.stock ?? undefined}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, { quantity: event.target.value })
                    }
                    disabled={!product}
                  />

                  <div className="pb-2 sm:pb-3">
                    <p className="text-xs text-stone-500">Line total</p>
                    <p className="text-sm font-semibold text-stone-900">
                      {formatMoney(lineTotal)}
                    </p>
                    {product && (
                      <p className="mt-0.5 text-[11px] text-stone-500">
                        {formatMoney(product.sellingPrice)} each ·{' '}
                        {formatNumber(product.stock)} in stock
                      </p>
                    )}
                  </div>

                  <IconButton
                    label={`Remove product line ${index + 1}`}
                    tone="danger"
                    onClick={() => removeLine(line.key)}
                    disabled={lines.length === 1 || saving}
                    className="mb-1"
                  >
                    <Trash2 size={16} aria-hidden />
                  </IconButton>
                </div>
              </div>
            )
          })}

          <Button
            variant="secondary"
            onClick={() => setLines((current) => [...current, newLine()])}
            disabled={
              saving ||
              lines.length >= MAX_LINES ||
              lines.length >= sellableProducts.length
            }
          >
            <Plus size={16} aria-hidden />
            Add another product
          </Button>
        </section>

        <div className="flex flex-col gap-3 border-t border-stone-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
              Sale total
            </p>
            <p className="text-2xl font-semibold text-stone-900">
              {formatMoney(total)}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="submit"
              loading={saving}
              disabled={sellableProducts.length === 0}
            >
              <Save size={16} aria-hidden />
              Record sale
            </Button>
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-stone-500">
          <Receipt size={14} className="mt-0.5 shrink-0" aria-hidden />
          The server recalculates every price and subtotal. If stock changed in
          another tab, the sale is rejected instead of going negative.
        </p>
      </form>
    </Modal>
  )
}
