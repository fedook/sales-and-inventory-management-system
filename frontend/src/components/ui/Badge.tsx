import type { ReactNode } from 'react'

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-stone-100 text-stone-700 ring-stone-200',
  success: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  danger: 'bg-rose-50 text-rose-800 ring-rose-200',
  info: 'bg-sky-50 text-sky-800 ring-sky-200',
}

/** Small status pill used for categories, customer types and stock state. */
export default function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: BadgeTone
  children: ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${toneStyles[tone]}`}
    >
      {children}
    </span>
  )
}
