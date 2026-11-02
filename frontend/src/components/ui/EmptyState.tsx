import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: ReactNode
}

/** Friendly placeholder shown when a list has no rows. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-100 text-stone-500">
        <Icon size={22} aria-hidden />
      </span>
      <h2 className="mt-4 text-sm font-semibold text-stone-900">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-stone-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
