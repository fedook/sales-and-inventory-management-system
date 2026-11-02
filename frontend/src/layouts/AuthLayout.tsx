import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ShieldCheck, Store } from 'lucide-react'

const benefits = [
  'Admin and staff accounts with protected API routes',
  'Passwords hashed with bcrypt — never stored as plain text',
  'One place for sales, stock, customers and suppliers',
]

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

/**
 * Shared split-screen shell for the login and register pages.
 * The left brand panel is hidden on small screens to keep the form focused.
 */
export default function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-50">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-5 py-10">
        <div className="grid w-full overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl shadow-stone-900/5 lg:grid-cols-[0.95fr_1.05fr]">
          <aside className="relative hidden flex-col justify-between bg-emerald-800 p-10 text-emerald-50 lg:flex">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-800 focus-visible:outline-none"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <Store size={20} aria-hidden />
                </span>
                <span className="text-sm font-semibold tracking-wide">
                  Sales &amp; Inventory
                </span>
              </Link>

              <h2 className="mt-12 text-3xl font-semibold leading-tight">
                Run the shop.
                <span className="block text-emerald-200">
                  Understand the numbers.
                </span>
              </h2>

              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-emerald-50/90">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-300"
                      aria-hidden
                    />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-12 flex items-center gap-2 text-xs text-emerald-200/80">
              <ShieldCheck size={16} aria-hidden />
              JWT authentication &middot; role-based access
            </div>
          </aside>

          <main className="p-6 sm:p-10">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs font-medium text-stone-500 transition hover:text-stone-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeft size={14} aria-hidden />
              Back to home
            </Link>

            <h1 className="mt-8 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{subtitle}</p>

            <div className="mt-8">{children}</div>

            <div className="mt-8 border-t border-stone-100 pt-6 text-sm text-stone-600">
              {footer}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
