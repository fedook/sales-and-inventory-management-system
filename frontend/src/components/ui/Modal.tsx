import { useEffect, useId, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}

/**
 * Accessible dialog used by every create/edit form and the purchase history.
 * Escape and the backdrop close it; the page behind cannot scroll while open.
 */
export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div className="relative flex min-h-full items-end justify-center p-0 sm:items-center sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className={`relative w-full ${
            size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg'
          } max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-semibold text-stone-900">
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-sm leading-relaxed text-stone-600">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
            >
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="mt-5">{children}</div>

          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
