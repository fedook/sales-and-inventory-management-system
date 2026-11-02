import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RefreshCw,
  Server,
  ShieldCheck,
  Store,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApiHealth } from '../hooks/useApiHealth'
import { useAuth } from '../hooks/useAuth'
import { API_BASE_URL } from '../services/api'

const projectScope = [
  'Products, sales, customers, suppliers and stock in one place',
  'Sales transactions with automatic stock deduction and an audit trail',
  'Descriptive, predictive and prescriptive business analytics',
  'Admin and staff roles with protected API endpoints',
]

export default function HomePage() {
  const { state, refresh } = useApiHealth()
  const { status } = useAuth()

  const isLoading = state.status === 'loading'
  const isOnline = state.status === 'online'

  const statusStyles = isOnline
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : isLoading
      ? 'border-stone-200 bg-stone-50 text-stone-700'
      : 'border-rose-200 bg-rose-50 text-rose-900'

  return (
    <div className="relative min-h-screen overflow-hidden bg-stone-50">
      {/* Decorative background shapes (not content). */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-36 -right-28 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -left-28 h-96 w-96 rounded-full bg-amber-100/60 blur-3xl"
      />

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-5 py-10 sm:px-8">
        <header className="mb-10 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
              <Store size={20} aria-hidden />
            </span>
            <span className="text-sm font-semibold text-stone-900">
              Sales &amp; Inventory
            </span>
          </Link>

          <nav aria-label="Account navigation" className="flex items-center gap-2">
            {status === 'authenticated' ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Open dashboard
                <ArrowRight size={16} aria-hidden />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-emerald-600/20 transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <section>
            <p className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white/80 px-3 py-1 text-xs font-medium text-stone-600 shadow-sm backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Phase 5 &middot; Sales &amp; inventory active
            </p>

            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                <Store size={24} aria-hidden />
              </span>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Small business suite
              </p>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              Sales &amp; Inventory
              <span className="block text-emerald-700">with business analytics</span>
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
              A single place to manage products, sales, customers and suppliers &mdash; then
              turn real transaction data into clear, practical decisions.
            </p>

            <ul className="mt-7 space-y-3">
              {projectScope.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-stone-700">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="system-status-heading"
            className="rounded-3xl border border-stone-200/80 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2
                  id="system-status-heading"
                  className="text-lg font-semibold text-stone-900"
                >
                  System status
                </h2>
                <p className="mt-1 text-sm text-stone-500">
                  Live check against the Express API.
                </p>
              </div>

              <button
                type="button"
                onClick={() => void refresh()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? 'animate-spin' : ''}
                  aria-hidden
                />
                Refresh
              </button>
            </div>

            <div
              role="status"
              aria-live="polite"
              className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 ${statusStyles}`}
            >
              {isOnline ? (
                <CheckCircle2 size={20} className="mt-0.5 shrink-0" aria-hidden />
              ) : isLoading ? (
                <LoaderCircle
                  size={20}
                  className="mt-0.5 shrink-0 animate-spin"
                  aria-hidden
                />
              ) : (
                <XCircle size={20} className="mt-0.5 shrink-0" aria-hidden />
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold">
                  {isOnline
                    ? 'API connected'
                    : isLoading
                      ? 'Checking the API...'
                      : 'API unreachable'}
                </p>
                <p className="mt-1 text-sm opacity-80">
                  {isOnline
                    ? state.data.message
                    : isLoading
                      ? 'Waiting for a response from the backend.'
                      : state.message}
                </p>
              </div>
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-stone-500">
                  <Server size={16} aria-hidden />
                  API base URL
                </dt>
                <dd className="max-w-[60%] truncate font-mono text-xs text-stone-700">
                  {API_BASE_URL}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-stone-500">
                  <Clock3 size={16} aria-hidden />
                  Server time
                </dt>
                <dd className="text-right text-stone-700">
                  {isOnline
                    ? new Date(state.data.timestamp).toLocaleString()
                    : 'Unavailable'}
                </dd>
              </div>

              <div className="flex items-start justify-between gap-4">
                <dt className="flex items-center gap-2 text-stone-500">
                  <ShieldCheck size={16} aria-hidden />
                  Frontend
                </dt>
                <dd className="text-right text-stone-700">React + Vite</dd>
              </div>
            </dl>

            {state.status === 'offline' && (
              <div className="mt-6 rounded-2xl bg-stone-50 p-4 text-sm text-stone-600">
                <p className="font-medium text-stone-800">Start the backend:</p>
                <code className="mt-2 block rounded-lg bg-white px-3 py-2 font-mono text-xs text-stone-700 ring-1 ring-stone-200">
                  cd backend &amp;&amp; npm run dev
                </code>
                <p className="mt-2 text-xs text-stone-500">
                  Then refresh this page. If you changed the port, update{' '}
                  <span className="font-mono">VITE_API_URL</span> in{' '}
                  <span className="font-mono">frontend/.env</span>.
                </p>
              </div>
            )}
          </section>
        </div>

        <footer className="mt-12 flex flex-col gap-2 border-t border-stone-200 pt-6 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>Sales and Inventory Management System &middot; College IT final project</p>
          <p>
            Public endpoint:{' '}
            <span className="font-mono text-stone-600">GET /api/health</span>
            <span className="mx-2 text-stone-300">|</span>
            Auth: <span className="font-mono text-stone-600">/api/auth</span>
          </p>
        </footer>
      </main>
    </div>
  )
}
