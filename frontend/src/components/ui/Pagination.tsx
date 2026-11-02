import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  itemLabel: string
  onPageChange: (page: number) => void
}

/** Prev/next paging with a plain "showing x-y of z" summary. */
export default function Pagination({
  page,
  totalPages,
  total,
  limit,
  itemLabel,
  onPageChange,
}: PaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 border-t border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-xs text-stone-500">
        Showing <span className="font-medium text-stone-700">{start}</span>–
        <span className="font-medium text-stone-700">{end}</span> of{' '}
        <span className="font-medium text-stone-700">{total}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          <ChevronLeft size={14} aria-hidden />
          Previous
        </button>

        <span className="text-xs text-stone-500">
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          Next
          <ChevronRight size={14} aria-hidden />
        </button>
      </div>
    </nav>
  )
}
