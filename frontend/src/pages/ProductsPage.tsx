import { useCallback, useEffect, useState } from 'react'
import {
  Filter,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import ProductFormModal from '../components/products/ProductFormModal'
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
import * as productService from '../services/product.service'
import * as supplierService from '../services/supplier.service'
import type { Pagination as PaginationInfo } from '../types/pagination'
import type { Product, ProductSort } from '../types/product'
import type { Supplier } from '../types/supplier'
import { getErrorMessage } from '../utils/getErrorMessage'
import { formatMoney, formatNumber, orDash } from '../utils/format'

const PAGE_SIZE = 20

const initialPagination: PaginationInfo = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
}

const sortOptions = [
  { value: 'name:asc', label: 'Name A → Z' },
  { value: 'name:desc', label: 'Name Z → A' },
  { value: 'newest:desc', label: 'Newest first' },
  { value: 'price:asc', label: 'Price: low to high' },
  { value: 'price:desc', label: 'Price: high to low' },
  { value: 'stock:asc', label: 'Stock: low to high' },
  { value: 'stock:desc', label: 'Stock: high to low' },
]

export default function ProductsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const [products, setProducts] = useState<Product[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>(initialPagination)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [category, setCategory] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [sortValue, setSortValue] = useState('name:asc')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [sort, direction] = sortValue.split(':') as [
    ProductSort,
    'asc' | 'desc',
  ]

  const loadOptions = useCallback(async () => {
    try {
      const [supplierPage, categoryList] = await Promise.all([
        supplierService.listSuppliers({ limit: 100, sort: 'name' }),
        productService.listProductCategories(),
      ])

      setSuppliers(supplierPage.items)
      setCategories(categoryList)
    } catch (error) {
      setPageError(getErrorMessage(error))
    }
  }, [])

  const loadProducts = useCallback(async () => {
    setLoading(true)
    setPageError(null)

    try {
      const result = await productService.listProducts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
        lowStock: lowStockOnly || undefined,
        sort,
        direction,
      })

      setProducts(result.items)
      setPagination(result.pagination)
    } catch (error) {
      setPageError(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, category, supplierId, lowStockOnly, sort, direction])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadOptions()
  }, [loadOptions])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    void loadProducts()
  }, [loadProducts])

  const hasFilters =
    search.trim() !== '' ||
    category !== '' ||
    supplierId !== '' ||
    lowStockOnly ||
    sortValue !== 'name:asc'

  function clearFilters() {
    setSearch('')
    setCategory('')
    setSupplierId('')
    setLowStockOnly(false)
    setSortValue('name:asc')
    setPage(1)
  }

  function openCreate() {
    setEditingProduct(null)
    setFormOpen(true)
  }

  function openEdit(product: Product) {
    setEditingProduct(product)
    setFormOpen(true)
  }

  function handleSaved(saved: Product, mode: 'created' | 'updated') {
    setFormOpen(false)
    setEditingProduct(null)
    setConfirmingId(null)
    setNotice(
      mode === 'created'
        ? `"${saved.name}" was added to the catalogue.`
        : `"${saved.name}" was updated.`,
    )

    void loadOptions()

    if (mode === 'created' && page !== 1) {
      setPage(1)
      return
    }

    void loadProducts()
  }

  async function handleDelete(id: number) {
    setDeletingId(id)
    setPageError(null)
    setNotice(null)

    try {
      await productService.deleteProduct(id)
      setConfirmingId(null)
      setNotice('Product deleted.')
      void loadOptions()

      if (products.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadProducts()
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
        title="Products"
        description={`${formatNumber(pagination.total)} product${
          pagination.total === 1 ? '' : 's'
        } in the catalogue. Prices and stock changes are saved straight to the database.`}
        badge={{ icon: Package, label: 'Catalogue' }}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => void loadProducts()}
              loading={loading}
            >
              <RefreshCw size={16} aria-hidden />
              Reload
            </Button>
            <Button onClick={openCreate}>
              <Plus size={16} aria-hidden />
              Add product
            </Button>
          </>
        }
      />

      {pageError && <Alert tone="error">{pageError}</Alert>}
      {notice && <Alert tone="success">{notice}</Alert>}

      <section
        aria-label="Product filters"
        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_200px_190px] lg:items-end">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            placeholder="Search name, category or description"
            label="Search products"
          />

          <SelectField
            label="Category"
            name="categoryFilter"
            value={category}
            onChange={(value) => {
              setCategory(value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All categories' },
              ...categories.map((item) => ({ value: item, label: item })),
            ]}
          />

          <SelectField
            label="Supplier"
            name="supplierFilter"
            value={supplierId}
            onChange={(value) => {
              setSupplierId(value)
              setPage(1)
            }}
            options={[
              { value: '', label: 'All suppliers' },
              ...suppliers.map((supplier) => ({
                value: String(supplier.id),
                label: supplier.name,
              })),
            ]}
          />

          <SelectField
            label="Sort by"
            name="productSort"
            value={sortValue}
            onChange={(value) => {
              setSortValue(value)
              setPage(1)
            }}
            options={sortOptions}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={lowStockOnly}
            onClick={() => {
              setLowStockOnly((current) => !current)
              setPage(1)
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

          {hasFilters && (
            <Button variant="ghost" onClick={clearFilters} className="text-xs">
              Clear filters
            </Button>
          )}

          {loading && products.length > 0 && (
            <span className="ml-auto inline-flex items-center gap-2 text-xs text-stone-500">
              <LoaderCircle size={14} className="animate-spin" aria-hidden />
              Updating...
            </span>
          )}
        </div>
      </section>

      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-stone-500">
            <LoaderCircle
              size={20}
              className="animate-spin text-emerald-600"
              aria-hidden
            />
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title={hasFilters ? 'No products match these filters' : 'No products yet'}
            description={
              hasFilters
                ? 'Try a different search term, category or supplier.'
                : 'Add your first product to start tracking prices and stock.'
            }
            action={
              hasFilters ? (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={openCreate}>
                  <Plus size={16} aria-hidden />
                  Add product
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50/80 text-xs font-semibold tracking-wide text-stone-500 uppercase">
                    <th scope="col" className="px-5 py-3">
                      Product
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Category
                    </th>
                    <th scope="col" className="px-5 py-3">
                      Supplier
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Selling price
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Stock
                    </th>
                    <th scope="col" className="px-5 py-3 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const isConfirming = confirmingId === product.id
                    const isDeleting = deletingId === product.id

                    return (
                      <tr
                        key={product.id}
                        className="border-b border-stone-100 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-stone-900">
                            {product.name}
                          </p>
                          <p className="mt-0.5 max-w-xs truncate text-xs text-stone-500">
                            {orDash(product.description)}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <Badge tone="neutral">{product.category}</Badge>
                        </td>

                        <td className="px-5 py-4 text-stone-600">
                          {orDash(product.supplierName)}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <p className="font-medium text-stone-900">
                            {formatMoney(product.sellingPrice)}
                          </p>
                          <p className="text-xs text-stone-500">
                            cost {formatMoney(product.purchaseCost)}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <span className="inline-flex items-center gap-2">
                            {product.isLowStock && (
                              <Badge tone="warning">Low stock</Badge>
                            )}
                            <span
                              className={`font-medium ${
                                product.isLowStock
                                  ? 'text-amber-800'
                                  : 'text-stone-900'
                              }`}
                            >
                              {formatNumber(product.stock)}
                            </span>
                          </span>
                          <p className="mt-0.5 text-xs text-stone-500">
                            reorder at {formatNumber(product.reorderLevel)}
                          </p>
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
                                  onClick={() => void handleDelete(product.id)}
                                >
                                  Confirm delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <IconButton
                                  label={`Edit ${product.name}`}
                                  onClick={() => openEdit(product)}
                                >
                                  <Pencil size={16} aria-hidden />
                                </IconButton>

                                {isAdmin && (
                                  <IconButton
                                    label={`Delete ${product.name}`}
                                    tone="danger"
                                    onClick={() => setConfirmingId(product.id)}
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
              itemLabel="products"
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <p className="text-xs leading-relaxed text-stone-500">
        Only administrators can delete products. A product that appears in a past
        sale is kept forever so the sales history stays accurate.
      </p>

      <ProductFormModal
        open={formOpen}
        product={editingProduct}
        suppliers={suppliers}
        onClose={() => {
          setFormOpen(false)
          setEditingProduct(null)
        }}
        onSaved={handleSaved}
      />
    </div>
  )
}
