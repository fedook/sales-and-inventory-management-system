import { useCallback, useEffect, useState } from 'react'
import {
  History,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react'
import CustomerFormModal from '../components/customers/CustomerFormModal'
import PurchaseHistoryModal from '../components/customers/PurchaseHistoryModal'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import IconButton from '../components/ui/IconButton'
import PageHeader from '../components/ui/PageHeader'
import Pagination from '../components/ui/Pagination'
import SearchField from '../components/ui/SearchField'
import SelectField from '../components/ui/SelectField'
import { useAuth } from '../hooks/useAuth'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import * as customerService from '../services/customer.service'
import type { Customer, CustomerType } from '../types/customer'
import type { Pagination as PaginationInfo } from '../types/pagination'
import { getErrorMessage } from '../utils/getErrorMessage'
import { formatDate, formatMoney, formatNumber, orDash } from '../utils/format'

const PAGE_SIZE = 20

const initialPagination: PaginationInfo = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
}

const typeBadgeTone: Record<CustomerType, 'neutral' | 'success' | 'info'> = {
  'walk-in': 'neutral',
  regular: 'success',
  wholesale: 'info',
}

const typeLabel: Record<CustomerType, string> = {
  'walk-in': 'Walk-in',
  regular: 'Regular',
  wholesale: 'Wholesale',
}

const sortOptions = [
  { value: 'name:asc', label: 'Name A → Z' },
  { value: 'name:desc', label: 'Name Z → A' },
  { value: 'newest:desc', label: 'Newest first' },
]

export default function CustomersPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [customers, setCustomers] = useState<Customer[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination)
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [customerType, setCustomerType] = useState('')
  const [sortValue, setSortValue] = useState('name:asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [sort, direction] = sortValue.split(':') as [
    'name' | 'newest',
    'asc' | 'desc',
  ]

  const loadCustomers = useCallback(async () => {
    setLoading(true)
    setPageError(null)

    try {
      const result = await customerService.listCustomers({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        customerType:
          customerType === '' ? undefined : (customerType as CustomerType),
        sort,
        direction,
      })

      setCustomers(result.items)
      setPagination(result.pagination)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, customerType, sort, direction])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadCustomers()
  }, [loadCustomers])

  const hasFilters =
    search.trim() !== '' || customerType !== '' || sortValue !== 'name:asc'

  function clearFilters() {
    setSearch('')
    setCustomerType('')
    setSortValue('name:asc')
    setPage(1)
  }

  function openCreate() {
    setEditingCustomer(null)
    setFormOpen(true)
  }

  function openEdit(customer: Customer) {
    setEditingCustomer(customer)
    setFormOpen(true)
  }

  function handleSaved(saved: Customer, mode: 'created' | 'updated') {
    setFormOpen(false)
    setEditingCustomer(null)
    setConfirmingId(null)
    setNotice(
      mode === 'created'
        ? `"${saved.name}" was added to the customer list.`
        : `"${saved.name}" was updated.`,
    )

    if (mode === 'created' && page !== 1) {
      setPage(1)
      return
    }

    void loadCustomers()
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    setPageError(null)
    setNotice(null)

    try {
      await customerService.deleteCustomer(id)
      setConfirmingId(null)
      setNotice('Customer deleted. Their past sales are kept for reporting.')

      if (customers.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadCustomers()
      }
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description={`${formatNumber(pagination.total)} customer${
          pagination.total === 1 ? '' : 's'
        }. Spend totals and purchase counts come from real recorded sales, not estimates.`}
        badge={{ icon: Users, label: 'Customer book' }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void loadCustomers()}
              loading={loading}
            >
              <RefreshCw size={16} aria-hidden />
              Reload
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Add customer
            </Button>
          </>
        }
      />

      {pageError && <Alert tone="error">{pageError}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <section
        aria-label="Customer filters"
        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_190px] lg:items-end">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search name, location or contact"
            label="Search customers"
          />

          <SelectField
            label="Customer type"
            name="customerTypeFilter"
            value={customerType}
            onChange={(value) => {
              setCustomerType(value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All types' },
              { value: 'walk-in', label: 'Walk-in' },
              { value: 'regular', label: 'Regular' },
              { value: 'wholesale', label: 'Wholesale' },
            ]}
          />

          <SelectField
            label="Sort by"
            name="customerSort"
            value={sortValue}
            onChange={(value) => {
              setSortValue(value)
              setPage(1)
            }}
            options={sortOptions}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-xs">
              Clear filters
            </Button>
          )}

          {loading && customers.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-stone-500">
              <LoaderCircle size={14} className="animate-spin" aria-hidden />
              Updating...
            </span>
          )}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading && customers.length === 0 ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-stone-500">
            <LoaderCircle
              size={20}
              className="animate-spin text-emerald-600"
              aria-hidden
            />
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={
              hasFilters ? 'No customers match these filters' : 'No customers yet'
            }
            description={
              hasFilters
                ? 'Try a different search term or customer type.'
                : 'Add your first customer to link them to future sales.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus size={16} aria-hidden />
                  Add customer
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                    <th scope="col" className="px-5 py-3">
                      Customer
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Type
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Location
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Purchases
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Total spent
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Last purchase
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {customers.map((customer) => {
                    const isConfirming = confirmingId === customer.id
                    const isDeleting = deletingId === customer.id

                    return (
                      <tr
                        key={customer.id}
                        className="border-b border-stone-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-stone-900">
                            {customer.name}
                          </p>
                          <p className="mt-0.5 text-xs text-stone-500">
                            {orDash(customer.contactInformation)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <Badge tone={typeBadgeTone[customer.customerType]}>
                            {typeLabel[customer.customerType]}
                          </Badge>
                        </td>

                        <td className="px-5 py-4 text-stone-600">
                          {orDash(customer.location)}
                        </td>

                        <td className="px-5 py-4 text-right text-stone-700">
                          {formatNumber(customer.saleCount)}
                        </td>

                        <td className="px-5 py-4 text-right font-medium text-stone-900">
                          {formatMoney(customer.totalSpent)}
                        </td>

                        <td className="px-5 py-4 text-stone-600">
                          {customer.lastPurchaseAt
                            ? formatDate(customer.lastPurchaseAt)
                            : '—'}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {isConfirming ? (
                              <>
                                <Button
                                  variant="ghost"
                                  onClick={() => setConfirmingId(null)}
                                  disabled={isDeleting}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="danger"
                                  loading={isDeleting}
                                  onClick={() => void handleDelete(customer.id)}
                                >
                                  Confirm delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <IconButton
                                  label={`Purchase history for ${customer.name}`}
                                  onClick={() => setHistoryCustomer(customer)}
                                >
                                  <History size={16} aria-hidden />
                                </IconButton>

                                <IconButton
                                  label={`Edit ${customer.name}`}
                                  onClick={() => openEdit(customer)}
                                >
                                  <Pencil size={16} aria-hidden />
                                </IconButton>

                                {isAdmin && (
                                  <IconButton
                                    label={`Delete ${customer.name}`}
                                    tone="danger"
                                    onClick={() => setConfirmingId(customer.id)}
                                  >
                                    <Trash2 size={16} aria-hidden />
                                  </IconButton>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              itemLabel="customers"
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-stone-500">
        Deleting a customer never deletes their sales. The sale totals stay in the
        reports and only the customer link is cleared. Only administrators can
        delete customers.
      </p>

      <CustomerFormModal
        open={formOpen}
        customer={editingCustomer}
        onClose={() => {
          setFormOpen(false)
          setEditingCustomer(null)
        }}
        onSaved={handleSaved}
      />

      <PurchaseHistoryModal
        open={historyCustomer !== null}
        customer={historyCustomer}
        onClose={() => setHistoryCustomer(null)}
      />
    </div>
  )
}
