import { useCallback, useEffect, useState } from 'react'
import {
  Boxes,
  Filter,
  LoaderCircle,
  PackagePlus,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import RestockModal from '../components/inventory/RestockModal'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import PageHeader from '../components/ui/PageHeader'
import Pagination from '../components/ui/Pagination'
import SearchField from '../components/ui/SearchField'
import SelectField from '../components/ui/SelectField'
import TextField from '../components/ui/TextField'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import * as inventoryService from '../services/inventory.service'
import * as productService from '../services/product.service'
import type {
  InventoryMovement,
  InventoryMovementType,
  LowStockAlert,
  StockItem,
  StockListParams,
} from '../types/inventory'
import { movementTypeLabels } from '../types/inventory'
import type { Pagination as PaginationInfo } from '../types/pagination'
import type { Product } from '../types/product'
import { getErrorMessage } from '../utils/getErrorMessage'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatNumber,
} from '../utils/format'

const PAGE_SIZE = 20

const initialPagination: PaginationInfo = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
}

const stockSortOptions = [
  { value: 'name:asc', label: 'Name A → Z' },
  { value: 'name:desc', label: 'Name Z → A' },
  { value: 'stock:asc', label: 'Stock: low to high' },
  { value: 'stock:desc', label: 'Stock: high to low' },
  { value: 'value:desc', label: 'Stock value: high to low' },
  { value: 'newest:desc', label: 'Newest products' },
]

const movementTypeOptions = (
  Object.keys(movementTypeLabels) as InventoryMovementType[]
).map((value) => ({ value, label: movementTypeLabels[value] }))

const movementTones: Record<
  InventoryMovementType,
  'neutral' | 'success' | 'info' | 'warning'
> = {
  initial: 'neutral',
  restock: 'success',
  sale: 'info',
  return: 'success',
  adjustment: 'warning',
}

export default function InventoryPage() {
  const [view, setView] = useState<'stock' | 'movements'>('stock')

  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [stockPagination, setStockPagination] =
    useState<PaginationInfo>(initialPagination)
  const [stockLoading, setStockLoading] = useState(true)
  const [stockError, setStockError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [alerts, setAlerts] = useState<LowStockAlert | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [products, setProducts] = useState<Product[]>([])

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [category, setCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [stockSortValue, setStockSortValue] = useState('name:asc')
  const [stockPage, setStockPage] = useState(1)

  const [restockTarget, setRestockTarget] = useState<StockItem | null>(null)

  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [movementPagination, setMovementPagination] =
    useState<PaginationInfo>(initialPagination)
  const [movementLoading, setMovementLoading] = useState(true)
  const [movementError, setMovementError] = useState<string | null>(null)

  const [movementProductId, setMovementProductId] = useState('')
  const [movementType, setMovementType] = useState('')
  const [movementFrom, setMovementFrom] = useState('')
  const [movementTo, setMovementTo] = useState('')
  const [movementDirection, setMovementDirection] = useState<'desc' | 'asc'>('desc')
  const [movementPage, setMovementPage] = useState(1)

  const [stockSort, stockDirection] = stockSortValue.split(':') as [
    StockListParams['sort'],
    'asc' | 'desc',
  ]

  const loadOptions = useCallback(async () => {
    try {
      const [categoryList, productList] = await Promise.all([
        productService.listProductCategories(),
        productService.listAllProducts(),
      ])

      setCategories(categoryList)
      setProducts(productList)
    } catch (error) {
      setStockError(getErrorMessage(error))
    }
  }, [])

  const loadAlerts = useCallback(async () => {
    try {
      setAlerts(await inventoryService.listLowStockAlerts())
    } catch (error) {
      setStockError(getErrorMessage(error))
    }
  }, [])

  const loadStock = useCallback(async () => {
    setStockLoading(true)
    setStockError(null)

    try {
      const result = await inventoryService.listStock({
        page: stockPage,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        lowStock: lowStockOnly || undefined,
        sort: stockSort,
        direction: stockDirection,
      })

      setStockItems(result.items)
      setStockPagination(result.pagination)
    } catch (error) {
      setStockError(getErrorMessage(error))
    } finally {
      setStockLoading(false)
    }
  }, [stockPage, debouncedSearch, category, lowStockOnly, stockSort, stockDirection])

  const loadMovements = useCallback(async () => {
    setMovementLoading(true)
    setMovementError(null)

    try {
      const result = await inventoryService.listMovements({
        page: movementPage,
        limit: PAGE_SIZE,
        productId: movementProductId ? Number(movementProductId) : undefined,
        movementType: (movementType || undefined) as
          | InventoryMovementType
          | undefined,
        from: movementFrom || undefined,
        to: movementTo || undefined,
        direction: movementDirection,
      })

      setMovements(result.items)
      setMovementPagination(result.pagination)
    } catch (error) {
      setMovementError(getErrorMessage(error))
    } finally {
      setMovementLoading(false)
    }
  }, [
    movementPage,
    movementProductId,
    movementType,
    movementFrom,
    movementTo,
    movementDirection,
  ])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadOptions()
  }, [loadOptions])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadAlerts()
  }, [loadAlerts])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadStock()
  }, [loadStock])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadMovements()
  }, [loadMovements])

  const hasStockFilters =
    search.trim() !== '' ||
    category !== '' ||
    lowStockOnly ||
    stockSortValue !== 'name:asc'

  const hasMovementFilters =
    movementProductId !== '' ||
    movementType !== '' ||
    movementFrom !== '' ||
    movementTo !== '' ||
    movementDirection !== 'desc'

  function clearStockFilters() {
    setSearch('')
    setCategory('')
    setLowStockOnly(false)
    setStockSortValue('name:asc')
    setStockPage(1)
  }

  function clearMovementFilters() {
    setMovementProductId('')
    setMovementType('')
    setMovementFrom('')
    setMovementTo('')
    setMovementDirection('desc')
    setMovementPage(1)
  }

  function showLowStock() {
    setView('stock')
    setLowStockOnly(true)
    setStockPage(1)
  }

  function handleRestocked(updated: StockItem, added: number) {
    setRestockTarget(null)
    setNotice(
      `Added ${formatNumber(added)} unit${
        added === 1 ? '' : 's'
      } to "${updated.name}". New stock: ${formatNumber(updated.stock)}.`,
    )
    void loadStock()
    void loadAlerts()
    void loadMovements()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`${formatNumber(stockPagination.total)} product${
          stockPagination.total === 1 ? '' : 's'
        } in the current stock view. Receive deliveries and review every stock change in the audit trail.`}
        badge={{ icon: Boxes, label: 'Stock control' }}
        actions={
          <Button
            variant="secondary"
            onClick={() => {
              void loadStock()
              void loadAlerts()
              void loadMovements()
            }}
            loading={stockLoading || movementLoading}
          >
            <RefreshCw size={16} aria-hidden />
            Reload
          </Button>
        }
      />

      {stockError && <Alert tone="error">{stockError}</Alert>}
      {movementError && <Alert tone="error">{movementError}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      {alerts && alerts.total > 0 && (
        <section
          aria-label="Low stock alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <TriangleAlert size={19} aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  {formatNumber(alerts.total)} product
                  {alerts.total === 1 ? '' : 's'} at or below the reorder level
                </p>
                <p className="mt-1 text-sm leading-relaxed text-amber-800">
                  {alerts.alerts
                    .slice(0, 4)
                    .map((item) => item.name)
                    .join(', ')}
                  {alerts.total > 4 ? ` and ${formatNumber(alerts.total - 4)} more` : ''}
                  . Receive stock to avoid running out.
                </p>
              </div>
            </div>

            <Button variant="secondary" onClick={showLowStock}>
              Show low stock
            </Button>
          </div>
        </section>
      )}

      <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          aria-pressed={view === 'stock'}
          onClick={() => setView('stock')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none ${
            view === 'stock'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Stock levels
        </button>
        <button
          type="button"
          aria-pressed={view === 'movements'}
          onClick={() => setView('movements')}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none ${
            view === 'movements'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          Movement history
        </button>
      </div>

      {view === 'stock' ? (
        <>
          <section
            aria-label="Stock filters"
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_200px_200px] lg:items-end">
              <SearchField
                value={search}
                onChange={(value) => {
                  setSearch(value)
                  setStockPage(1)
                }}
                placeholder="Search name, category or description"
                label="Search stock"
              />

              <SelectField
                label="Category"
                name="stockCategoryFilter"
                value={category}
                onChange={(value) => {
                  setCategory(value)
                  setStockPage(1)
                }}
                options={[
                  { value: '', label: 'All categories' },
                  ...categories.map((item) => ({ value: item, label: item })),
                ]}
              />

              <SelectField
                label="Sort by"
                name="stockSort"
                value={stockSortValue}
                onChange={(value) => {
                  setStockSortValue(value)
                  setStockPage(1)
                }}
                options={stockSortOptions}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                aria-pressed={lowStockOnly}
                onClick={() => {
                  setLowStockOnly((current) => !current)
                  setStockPage(1)
                }}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none ${
                  lowStockOnly
                    ? 'border-amber-300 bg-amber-50 text-amber-900'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Filter size={14} aria-hidden />
                Low stock only
              </button>

              {hasStockFilters && (
                <Button variant="ghost" onClick={clearStockFilters} className="text-xs">
                  Clear filters
                </Button>
              )}

              {stockLoading && stockItems.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-2 text-xs text-stone-500">
                  <LoaderCircle size={14} className="animate-spin" aria-hidden />
                  Updating...
                </span>
              )}
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {stockLoading && stockItems.length === 0 ? (
              <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-stone-500">
                <LoaderCircle
                  size={20}
                  className="animate-spin text-emerald-600"
                  aria-hidden
                />
                Loading stock...
              </div>
            ) : stockItems.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title={
                  hasStockFilters
                    ? 'No products match these filters'
                    : 'Nothing in stock yet'
                }
                description={
                  hasStockFilters
                    ? 'Try a different search term, category or clear the low-stock filter.'
                    : 'Add products to the catalogue first, or receive stock to see it here.'
                }
                action={
                  hasStockFilters ? (
                    <Button variant="secondary" onClick={clearStockFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                        <th scope="col" className="px-5 py-3">
                          Product
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Supplier
                        </th>
                        <th scope="col" className="px-5 py-3 text-right">
                          On hand
                        </th>
                        <th scope="col" className="px-5 py-3 text-right">
                          Reorder at
                        </th>
                        <th scope="col" className="px-5 py-3 text-right">
                          Stock value
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Updated
                        </th>
                        <th scope="col" className="px-5 py-3 text-right">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {stockItems.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-stone-100 last:border-0"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-stone-900">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-xs text-stone-500">
                              {item.category}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-stone-600">
                            {item.supplierName ?? '—'}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <span className="inline-flex items-center gap-2">
                              {item.isLowStock && (
                                <Badge tone="warning">Low stock</Badge>
                              )}
                              <span
                                className={`font-semibold ${
                                  item.isLowStock
                                    ? 'text-amber-800'
                                    : 'text-stone-900'
                                }`}
                              >
                                {formatNumber(item.stock)}
                              </span>
                            </span>
                          </td>

                          <td className="px-5 py-4 text-right text-stone-600">
                            {formatNumber(item.reorderLevel)}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <p className="font-medium text-stone-900">
                              {formatMoney(item.stockValue)}
                            </p>
                            <p className="text-xs text-stone-500">
                              @ {formatMoney(item.purchaseCost)} cost
                            </p>
                          </td>

                          <td className="px-5 py-4 text-stone-600">
                            {formatDate(item.updatedAt)}
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              <Button
                                variant="secondary"
                                className="px-3 py-1.5 text-xs"
                                onClick={() => setRestockTarget(item)}
                              >
                                <PackagePlus size={14} aria-hidden />
                                Restock
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={stockPagination.page}
                  totalPages={stockPagination.totalPages}
                  total={stockPagination.total}
                  limit={stockPagination.limit}
                  itemLabel="products"
                  onPageChange={setStockPage}
                />
              </>
            )}
          </div>

          <p className="text-xs leading-relaxed text-stone-500">
            Stock value uses the purchase cost, not the selling price. Receiving
            stock writes a restock movement so the audit trail stays complete.
          </p>
        </>
      ) : (
        <>
          <section
            aria-label="Movement filters"
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SelectField
                label="Product"
                name="movementProductFilter"
                value={movementProductId}
                onChange={(value) => {
                  setMovementProductId(value)
                  setMovementPage(1)
                }}
                options={[
                  { value: '', label: 'All products' },
                  ...products.map((product) => ({
                    value: String(product.id),
                    label: product.name,
                  })),
                ]}
              />

              <SelectField
                label="Movement type"
                name="movementTypeFilter"
                value={movementType}
                onChange={(value) => {
                  setMovementType(value)
                  setMovementPage(1)
                }}
                options={[
                  { value: '', label: 'All movement types' },
                  ...movementTypeOptions,
                ]}
              />

              <SelectField
                label="Order"
                name="movementOrder"
                value={movementDirection}
                onChange={(value) => {
                  setMovementDirection(value as 'asc' | 'desc')
                  setMovementPage(1)
                }}
                options={[
                  { value: 'desc', label: 'Newest first' },
                  { value: 'asc', label: 'Oldest first' },
                ]}
              />

              <TextField
                label="From date"
                name="movementFromDate"
                type="date"
                value={movementFrom}
                onChange={(event) => {
                  setMovementFrom(event.target.value)
                  setMovementPage(1)
                }}
              />

              <TextField
                label="To date"
                name="movementToDate"
                type="date"
                value={movementTo}
                onChange={(event) => {
                  setMovementTo(event.target.value)
                  setMovementPage(1)
                }}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {hasMovementFilters && (
                <Button
                  variant="ghost"
                  onClick={clearMovementFilters}
                  className="text-xs"
                >
                  Clear filters
                </Button>
              )}

              {movementLoading && movements.length > 0 && (
                <span className="ml-auto inline-flex items-center gap-2 text-xs text-stone-500">
                  <LoaderCircle size={14} className="animate-spin" aria-hidden />
                  Updating...
                </span>
              )}
            </div>
          </section>

          <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {movementLoading && movements.length === 0 ? (
              <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-stone-500">
                <LoaderCircle
                  size={20}
                  className="animate-spin text-emerald-600"
                  aria-hidden
                />
                Loading movements...
              </div>
            ) : movements.length === 0 ? (
              <EmptyState
                icon={Boxes}
                title={
                  hasMovementFilters
                    ? 'No stock movements match these filters'
                    : 'No stock movements yet'
                }
                description={
                  hasMovementFilters
                    ? 'Try a different product, movement type or date range.'
                    : 'Sales, deliveries and stock adjustments will appear here as an audit trail.'
                }
                action={
                  hasMovementFilters ? (
                    <Button variant="secondary" onClick={clearMovementFilters}>
                      Clear filters
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                        <th scope="col" className="px-5 py-3">
                          When
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Product
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Type
                        </th>
                        <th scope="col" className="px-5 py-3 text-right">
                          Change
                        </th>
                        <th scope="col" className="px-5 py-3 text-right">
                          Stock after
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Reference
                        </th>
                        <th scope="col" className="px-5 py-3">
                          By
                        </th>
                        <th scope="col" className="px-5 py-3">
                          Reason
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {movements.map((movement) => (
                        <tr
                          key={movement.id}
                          className="border-b border-stone-100 last:border-0"
                        >
                          <td className="px-5 py-4 text-stone-600">
                            {formatDateTime(movement.createdAt)}
                          </td>

                          <td className="px-5 py-4 font-medium text-stone-900">
                            {movement.productName}
                          </td>

                          <td className="px-5 py-4">
                            <Badge tone={movementTones[movement.movementType]}>
                              {movementTypeLabels[movement.movementType]}
                            </Badge>
                          </td>

                          <td
                            className={`px-5 py-4 text-right font-semibold ${
                              movement.quantityChange < 0
                                ? 'text-rose-700'
                                : movement.quantityChange > 0
                                  ? 'text-emerald-700'
                                  : 'text-stone-600'
                            }`}
                          >
                            {movement.quantityChange > 0 ? '+' : ''}
                            {formatNumber(movement.quantityChange)}
                          </td>

                          <td className="px-5 py-4 text-right text-stone-700">
                            {formatNumber(movement.stockAfter)}
                          </td>

                          <td className="px-5 py-4 text-stone-600">
                            {movement.saleId ? `Sale #${movement.saleId}` : '—'}
                          </td>

                          <td className="px-5 py-4 text-stone-600">
                            {movement.userName ?? '—'}
                          </td>

                          <td className="max-w-[220px] truncate px-5 py-4 text-stone-500">
                            {movement.reason ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Pagination
                  page={movementPagination.page}
                  totalPages={movementPagination.totalPages}
                  total={movementPagination.total}
                  limit={movementPagination.limit}
                  itemLabel="movements"
                  onPageChange={setMovementPage}
                />
              </>
            )}
          </div>

          <p className="text-xs leading-relaxed text-stone-500">
            Every stock change is recorded: opening stock, sales, deliveries,
            returns and manual adjustments. Negative changes come from sales.
          </p>
        </>
      )}

      <RestockModal
        open={restockTarget !== null}
        product={restockTarget}
        onClose={() => setRestockTarget(null)}
        onSaved={handleRestocked}
      />
    </div>
  )
}
