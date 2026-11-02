import { useId } from 'react'

interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  name?: string
  placeholder?: string
  rows?: number
  error?: string
  hint?: string
  className?: string
}

/** Multi-line input for descriptions and addresses. */
export default function TextAreaField({
  label,
  value,
  onChange,
  name,
  placeholder,
  rows = 3,
  error,
  hint,
  className = '',
}: TextAreaFieldProps) {
  const generatedId = useId()
  const id = name ? `${name}-${generatedId}` : generatedId

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-stone-700">
        {label}
      </label>

      <textarea
        id={id}
        name={name}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`w-full resize-y rounded-xl border bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm transition placeholder:text-stone-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200'
            : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-200'
        }`}
      />

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
