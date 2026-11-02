import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  fullWidth?: boolean
  children: ReactNode
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20 hover:bg-emerald-700',
  secondary:
    'border border-stone-200 bg-white text-stone-700 hover:bg-stone-50',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-700',
  ghost: 'text-stone-600 hover:bg-stone-100',
}

/** Shared button so every page has the same size, colour and focus ring. */
export default function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled ?? loading}
      className={`${baseStyles} ${variantStyles[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
