import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import TextAreaField from '../ui/TextAreaField'
import TextField from '../ui/TextField'
import {
  createSupplier,
  updateSupplier,
} from '../../services/supplier.service'
import type { Supplier, SupplierInput } from '../../types/supplier'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../../utils/getFieldErrors'

interface SupplierFormModalProps {
  open: boolean
  supplier: Supplier | null
  onClose: () => void
  onSaved: (supplier: Supplier, mode: 'created' | 'updated') => void
}

export default function SupplierFormModal({
  open,
  supplier,
  onClose,
  onSaved,
}: SupplierFormModalProps) {
  const [name, setName] = useState('')
  const [contactInformation, setContactInformation] = useState('')
  const [address, setAddress] = useState('')
  const [averageDeliveryTime, setAverageDeliveryTime] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    // The modal is reused for create and edit, so reset the form when it opens.
    // oxlint-disable-next-line react/set-state-in-effect
    setName(supplier?.name ?? '')
    setContactInformation(supplier?.contactInformation ?? '')
    setAddress(supplier?.address ?? '')
    setAverageDeliveryTime(
      supplier?.averageDeliveryTime !== null && supplier?.averageDeliveryTime !== undefined
        ? String(supplier.averageDeliveryTime)
        : '',
    )
    setFieldErrors({})
    setFormError(null)
  }, [open, supplier])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const localErrors: FieldErrors = {}
    const delivery = averageDeliveryTime.trim() === '' ? null : Number(averageDeliveryTime)

    if (!name.trim()) {
      localErrors.name = 'Supplier name is required.'
    }

    if (delivery !== null && (!Number.isInteger(delivery) || delivery < 0)) {
      localErrors.averageDeliveryTime =
        'Delivery time must be a whole number of days, or left empty.'
    }

    if (Object.keys(localErrors).length > 0) {
      setFieldErrors(localErrors)
      return
    }

    const input: SupplierInput = {
      name: name.trim(),
      contactInformation: contactInformation.trim() || undefined,
      address: address.trim() || undefined,
      averageDeliveryTime: delivery,
    }

    setSaving(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const saved = supplier
        ? await updateSupplier(supplier.id, input)
        : await createSupplier(input)

      onSaved(saved, supplier ? 'updated' : 'created')
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
      title={supplier ? 'Edit supplier' : 'New supplier'}
      description="Suppliers are linked to products so you know where stock comes from."
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField
          label="Supplier name"
          name="supplierName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Northwind Wholesale"
          error={fieldErrors.name}
          required
        />

        <TextField
          label="Contact information (optional)"
          name="supplierContact"
          value={contactInformation}
          onChange={(event) => setContactInformation(event.target.value)}
          placeholder="Phone number or email"
          error={fieldErrors.contactInformation}
        />

        <TextField
          label="Average delivery time (days, optional)"
          name="averageDeliveryTime"
          type="number"
          min="0"
          step="1"
          inputMode="numeric"
          value={averageDeliveryTime}
          onChange={(event) => setAverageDeliveryTime(event.target.value)}
          placeholder="e.g. 3"
          error={fieldErrors.averageDeliveryTime}
          hint="Used later by analytics to estimate when stock will arrive."
        />

        <TextAreaField
          label="Address (optional)"
          name="supplierAddress"
          value={address}
          onChange={setAddress}
          placeholder="Street, city, and any delivery notes"
          error={fieldErrors.address}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <Save size={16} aria-hidden />
            {supplier ? 'Save changes' : 'Create supplier'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
