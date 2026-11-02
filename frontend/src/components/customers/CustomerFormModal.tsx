import { useEffect, useState, type FormEvent } from 'react'
import { Save } from 'lucide-react'
import Alert from '../ui/Alert'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import SelectField from '../ui/SelectField'
import TextField from '../ui/TextField'
import {
  createCustomer,
  updateCustomer,
} from '../../services/customer.service'
import type { Customer, CustomerInput, CustomerType } from '../../types/customer'
import { getErrorMessage } from '../../utils/getErrorMessage'
import { getFieldErrors, type FieldErrors } from '../../utils/getFieldErrors'

interface CustomerFormModalProps {
  open: boolean
  customer: Customer | null
  onClose: () => void
  onSaved: (customer: Customer, mode: 'created' | 'updated') => void
}

const typeOptions = [
  { value: 'regular', label: 'Regular' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'wholesale', label: 'Wholesale' },
]

export default function CustomerFormModal({
  open,
  customer,
  onClose,
  onSaved,
}: CustomerFormModalProps) {
  const [name, setName] = useState('')
  const [customerType, setCustomerType] = useState<CustomerType>('regular')
  const [location, setLocation] = useState('')
  const [contactInformation, setContactInformation] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    // The modal is reused for create and edit, so reset the form when it opens.
    // oxlint-disable-next-line react/set-state-in-effect
    setName(customer?.name ?? '')
    setCustomerType(customer?.customerType ?? 'regular')
    setLocation(customer?.location ?? '')
    setContactInformation(customer?.contactInformation ?? '')
    setFieldErrors({})
    setFormError(null)
  }, [open, customer])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setFieldErrors({ name: 'Customer name is required.' })
      return
    }

    const input: CustomerInput = {
      name: name.trim(),
      customerType,
      location: location.trim() || undefined,
      contactInformation: contactInformation.trim() || undefined,
    }

    setSaving(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const saved = customer
        ? await updateCustomer(customer.id, input)
        : await createCustomer(input)

      onSaved(saved, customer ? 'updated' : 'created')
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
      title={customer ? 'Edit customer' : 'New customer'}
      description="Customers are linked to sales so you can see who buys what."
      onClose={onClose}
    >
      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        {formError && <Alert tone="error">{formError}</Alert>}

        <TextField
          label="Customer name"
          name="customerName"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Maria Santos"
          error={fieldErrors.name}
          required
        />

        <SelectField
          label="Customer type"
          name="customerType"
          value={customerType}
          onChange={(value) => setCustomerType(value as CustomerType)}
          options={typeOptions}
          error={fieldErrors.customerType}
          hint="Walk-in customers are usually one-time buyers."
        />

        <TextField
          label="Location (optional)"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="e.g. Cebu City"
          error={fieldErrors.location}
        />

        <TextField
          label="Contact information (optional)"
          name="contactInformation"
          value={contactInformation}
          onChange={(event) => setContactInformation(event.target.value)}
          placeholder="Phone number or email"
          error={fieldErrors.contactInformation}
        />

        <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            <Save size={16} aria-hidden />
            {customer ? 'Save changes' : 'Create customer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
