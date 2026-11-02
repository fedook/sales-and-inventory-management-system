import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import SelectField from '../ui/SelectField'
import TextAreaField from '../ui/TextAreaField'
import TextField from '../ui/TextField'
import {
  createProduct,
  updateProduct,
} from '../../services/product.service'
import type { Product, ProductInput } from '../../types/product'
import type { Supplier } from '../../types/supplier'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../../utils/getFieldErrors'

interface ProductFormModalProps {
  open: boolean
  product: Product | null
  suppliers: Supplier[]
  onClose: () => void
  onSaved: (product: Product, mode: 'created' | 'updated') => void
}

export default function ProductFormModal({
  open,
  product,
  suppliers,
  onClose,
  onSaved,
}: ProductFormModalProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [sellingPrice, setSellingPrice] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [stock, setStock] = useState('0')
  const [reorderLevel, setReorderLevel] = useState('10')
  const [supplierId, setSupplierId] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    // The modal is reused for create and edit, so reset the form when it opens.
    // oxlint-disable-next-line react/set-state-in-effect
    setName(product?.name ?? '')
    setCategory(product?.category ?? '')
    setDescription(product?.description ?? '')
    setSellingPrice(product ? String(product.sellingPrice) : '')
    setPurchaseCost(product ? String(product.purchaseCost) : '')
    setStock(product ? String(product.stock) : '0')
    setReorderLevel(product ? String(product.reorderLevel) : '10')
    setSupplierId(product?.supplierId ? String(product.supplierId) : '')
    setFieldErrors({})
    setFormError(null)
  }, [open, product])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const localErrors: FieldErrors = {}
    const selling = Number(sellingPrice)
    const cost = Number(purchaseCost)
    const stockNumber = Number(stock)
    const reorderNumber = Number(reorderLevel)

    if (!name.trim()) localErrors.name = 'Product name is required.'
    if (!category.trim()) localErrors.category = 'Category is required.'
    if (sellingPrice.trim() === '' || !Number.isFinite(selling) || selling < 0) {
      localErrors.sellingPrice = 'Enter a valid selling price.'
    }
    if (purchaseCost.trim() === '' || !Number.isFinite(cost) || cost < 0) {
      localErrors.purchaseCost = 'Enter a valid purchase cost.'
    }
    if (!Number.isInteger(stockNumber) || stockNumber < 0) {
      localErrors.stock = 'Stock must be a whole number of 0 or more.'
    }
    if (!Number.isInteger(reorderNumber) || reorderNumber < 0) {
      localErrors.reorderLevel = 'Reorder level must be a whole number of 0 or more.'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    const input: ProductInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      sellingPrice: selling,
      purchaseCost: cost,
      stock: stockNumber,
      reorderLevel: reorderNumber,
      supplierId: supplierId === '' ? null : Number(supplierId),
    }

    setSaving(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const saved = product
        ? await updateProduct(product.id, input)
        : await createProduct(input)

      onSaved(saved, product ? 'updated' : 'created')
    } catch (error) {
      setFormError(getErrorMessage(error))
      setFieldErrors(getFieldErrors(error))
    } finally {
      setSaving(false)
    }
  }

  const supplierOptions = [
    { value: '', label: 'No supplier' },
    ...suppliers.map((supplier) => ({
      value: String(supplier.id),
      label: supplier.name,
    })),
  ]

  return (
    <Modal
      open={open}
      title={product ? 'Edit product' : 'New product'}
      description={
        product
          ? 'Changing the stock number writes an adjustment to the stock history.'
          : 'Add an item to the catalogue. Opening stock is recorded in the stock history.'
      }
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Product name"
            name="productName"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Instant coffee 100g"
            error={fieldErrors.name}
            required
          />

          <TextField
            label="Category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="e.g. Beverages"
            error={fieldErrors.category}
            hint="Group similar products together."
            required
          />

          <TextField
            label="Selling price"
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={sellingPrice}
            onChange={(event) => setSellingPrice(event.target.value)}
            placeholder="0.00"
            error={fieldErrors.sellingPrice}
            required
          />

          <TextField
            label="Purchase cost"
            name="purchaseCost"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={purchaseCost}
            onChange={(event) => setPurchaseCost(event.target.value)}
            placeholder="0.00"
            error={fieldErrors.purchaseCost}
            required
          />

          <TextField
            label="Stock on hand"
            name="stock"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
            error={fieldErrors.stock}
            hint="Opening stock when creating a product."
            required
          />

          <TextField
            label="Reorder level"
            name="reorderLevel"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={reorderLevel}
            onChange={(event) => setReorderLevel(event.target.value)}
            error={fieldErrors.reorderLevel}
            hint="The product is marked low stock at or below this number."
            required
          />

          <SelectField
            label="Supplier"
            name="supplierId"
            value={supplierId}
            onChange={setSupplierId}
            options={supplierOptions}
            error={fieldErrors.supplierId}
            className="sm:col-span-2"
          />

          <TextAreaField
            label="Description (optional)"
            name="description"
            value={description}
            onChange={setDescription}
            placeholder="Size, brand, or any note that helps staff identify the item."
            error={fieldErrors.description}
            className="sm:col-span-2"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <Save size={16} aria-hidden />
            {product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
