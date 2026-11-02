import { useId } from 'react'
import { Search, X } from 'lucide-react'

interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

/** Search input with a magnifier icon and a clear button. */
export default function SearchField({
  value,
  onChange,
  placeholder = 'Search...',
  label = 'Search',
}: SearchFieldProps) {
  const id = useId()

  return (
    <div className="relative w-full sm:max-w-xs">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={16}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-stone-400"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pr-9 pl-9 text-sm text-stone-900 shadow-sm transition placeholder:text-stone-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-stone-400 transition hover:text-stone-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          <X size={15} aria-hidden />
        </button>
      )}
    </div>
  )
}
