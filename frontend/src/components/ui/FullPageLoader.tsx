import { LoaderCircle } from 'lucide-react'

/** Full-screen loading state used while the stored token is validated. */
export default function FullPageLoader({
  label = 'Loading...',
}: {
  label?: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-5">
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3 text-stone-600"
      >
        <LoaderCircle size={28} className="animate-spin text-emerald-600" aria-hidden />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  )
}
