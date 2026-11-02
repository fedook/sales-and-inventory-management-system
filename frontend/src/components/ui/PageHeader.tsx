import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description: string
  badge?: { icon: LucideIcon; label: string }
  actions?: ReactNode
}

/** Title block shared by the business pages. */
export default function PageHeader({
  title,
  description,
  badge,
  actions,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {badge && (
          <p className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-sm">
            <badge.icon size={13} aria-hidden />
            {badge.label}
          </p>
        )}
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          {description}
        </p>
      </div>

      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  )
}
