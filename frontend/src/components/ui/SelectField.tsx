import { useId } from 'react'

export interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  name?: string
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
}

/** Labelled select used by filter bars and forms. */
export default function SelectField({
  label,
  value,
  onChange,
  options,
  name,
  error,
  hint,
  disabled = false,
  className = '',
}: SelectFieldProps) {
  const generatedId = useId()
  const id = name ? `${name}-${generatedId}` : generatedId

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm transition focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
            : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-200'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-stone-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
