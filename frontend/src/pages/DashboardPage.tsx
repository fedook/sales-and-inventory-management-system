import {
  ArrowRight,
  CircleDollarSign,
  BarChart3,
  Boxes,
  CalendarDays,
  CheckCircle2,
  KeyRound,
  Package,
  Receipt,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEffect, useState } from 'react'
import * as analyticsService from '../services/analytics.service'
import * as saleService from '../services/sale.service'
import type { AnalyticsOverview } from '../types/analytics'
import type { SaleListItem } from '../types/sale'
import { formatMoney, formatDateTime, formatNumber } from '../utils/format'
import Alert from '../components/ui/Alert'
import Badge from '../components/ui/Badge'

const quickLinks = [
  {
    to: '/products',
    title: 'Products',
    description: 'Catalogue, prices, suppliers and low-stock alerts.',
    icon: Package,
  },
  {
    to: '/sales',
    title: 'Sales',
    description: 'Record transactions and review the full sales history.',
    icon: Receipt,
  },
  {
    to: '/inventory',
    title: 'Inventory',
    description: 'Stock levels, deliveries and the movement audit trail.',
    icon: Boxes,
  },
  {
    to: '/customers',
    title: 'Customers',
    description: 'Contact details, spend totals and purchase history.',
    icon: UserRound,
  },
  {
    to: '/suppliers',
    title: 'Suppliers',
    description: 'Contacts, delivery times and linked products.',
    icon: Truck,
  },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [recentSales, setRecentSales] = useState<SaleListItem[]>([])
  const [dataError, setDataError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function loadDashboard() {
      try {
        const [salesResult, summary] = await Promise.all([
          saleService.listSales({ page: 1, limit: 5, sort: 'date', direction: 'desc' }),
          user?.role === 'admin' ? analyticsService.getOverview({}) : Promise.resolve(null),
        ])
        if (active) {
          setRecentSales(salesResult.items)
          setOverview(summary)
          setDataError(null)
        }
      } catch (error: unknown) {
        if (active) setDataError(error instanceof Error ? error.message : 'Unable to load dashboard data.')
      }
    }
    void loadDashboard()
    return () => { active = false }
  }, [user?.role])

  if (!user) {
    return null
  }

  const firstName = user.name.split(' ')[0] ?? user.name
  const isAdmin = user.role === 'admin'
  const joined = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const permissions = isAdmin
    ? [
        'Create, edit and delete products, customers and suppliers',
        'Record sales, receive stock and review inventory movements',
        'Manage every account and change roles',
        'Full access to sales, stock and analytics reports',
      ]
    : [
        'Create and edit products, customers and suppliers',
        'Record sales and receive stock deliveries',
        'View purchase history and inventory movements',
        'No delete permissions or user administration',
      ]

  return (
    <div className="space-y-8">
      <header>
        <p className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600 shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Business workspace &middot; Live records
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-stone-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
          Record sales, manage the product catalogue and keep stock accurate.
          Every sale deducts stock and writes an inventory movement in the same
          database transaction.
        </p>
      </header>

      {dataError && <Alert tone="error">{dataError}</Alert>}
      {overview && <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business summary">
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-stone-500">Total revenue</p><CircleDollarSign size={19} className="text-emerald-700" aria-hidden /></div><p className="mt-2 text-2xl font-semibold text-stone-900">{formatMoney(overview.revenue)}</p><p className="mt-1 text-xs text-stone-500">All recorded sales</p></article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-stone-500">Transactions</p><Receipt size={19} className="text-sky-700" aria-hidden /></div><p className="mt-2 text-2xl font-semibold text-stone-900">{formatNumber(overview.transactionCount)}</p><p className="mt-1 text-xs text-stone-500">Recorded sales</p></article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-stone-500">Customers</p><UserRound size={19} className="text-violet-700" aria-hidden /></div><p className="mt-2 text-2xl font-semibold text-stone-900">{formatNumber(overview.customerCount)}</p><p className="mt-1 text-xs text-stone-500">Registered customers</p></article>
        <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-stone-500">Low stock</p><Boxes size={19} className="text-amber-700" aria-hidden /></div><p className="mt-2 text-2xl font-semibold text-stone-900">{formatNumber(overview.lowStockCount)}</p><p className="mt-1 text-xs text-stone-500">Products to review</p></article>
      </section>}
      {recentSales.length > 0 && <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-stone-900">Recent transactions</h2><p className="mt-1 text-xs text-stone-500">Latest recorded sales</p></div><Link to="/sales" className="text-sm font-semibold text-emerald-700 hover:text-emerald-800">View all</Link></div><div className="mt-4 divide-y divide-stone-100">{recentSales.map((sale) => <div key={sale.id} className="flex items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium text-stone-800">Sale #{sale.id} · {sale.customerName ?? 'Walk-in customer'}</p><p className="mt-0.5 text-xs text-stone-500">{formatDateTime(sale.saleDate)} · {sale.itemCount} item(s)</p></div><div className="text-right"><p className="text-sm font-semibold text-stone-900">{formatMoney(sale.totalAmount)}</p><Badge tone="success">Recorded</Badge></div></div>)}</div></section>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
              <UserRound size={19} aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-stone-900">Your account</h2>
          </div>

          <dl className="mt-5 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Name
              </dt>
              <dd className="mt-0.5 font-medium text-stone-800">{user.name}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Email
              </dt>
              <dd className="mt-0.5 break-all text-stone-700">{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-stone-400">
                Role
              </dt>
              <dd className="mt-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold capitalize text-emerald-800 ring-1 ring-emerald-200">
                  <ShieldCheck size={13} aria-hidden />
                  {user.role}
                </span>
              </dd>
            </div>
            <div className="flex items-center gap-2 pt-1 text-xs text-stone-500">
              <CalendarDays size={14} aria-hidden />
              Joined {joined}
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <KeyRound size={19} aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-stone-900">
              What you can do
            </h2>
          </div>

          <ul className="mt-5 space-y-3">
            {permissions.map((permission) => (
              <li
                key={permission}
                className="flex items-start gap-3 text-sm text-stone-600"
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-emerald-600"
                  aria-hidden
                />
                <span>{permission}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm md:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
              <ShieldCheck size={19} aria-hidden />
            </span>
            <h2 className="text-sm font-semibold text-stone-900">
              Session security
            </h2>
          </div>

          <ul className="mt-5 space-y-3 text-sm text-stone-600">
            <li className="rounded-xl bg-stone-50 px-3 py-2.5">
              Passwords are hashed with <strong>bcrypt</strong>; the API never
              returns them.
            </li>
            <li className="rounded-xl bg-stone-50 px-3 py-2.5">
              Requests use an <strong>Authorization: Bearer</strong> token with a
              configurable expiry.
            </li>
            <li className="rounded-xl bg-stone-50 px-3 py-2.5">
              Your role is checked against the database on every protected
              request.
            </li>
          </ul>
        </section>
      </div>

      <section aria-labelledby="quick-links-heading">
        <h2
          id="quick-links-heading"
          className="text-lg font-semibold text-stone-900"
        >
          Business data
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Jump straight into the records that power your sales and reports.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-600 group-hover:text-white">
                <item.icon size={19} aria-hidden />
              </span>
              <p className="mt-4 flex items-center justify-between gap-2 text-sm font-semibold text-stone-900">
                {item.title}
                <ArrowRight
                  size={15}
                  aria-hidden
                  className="text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-700"
                />
              </p>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {isAdmin && <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700"><BarChart3 size={19} aria-hidden /></span>
          <div><h2 className="font-semibold text-stone-900">Business analytics is ready</h2><p className="mt-1 text-sm text-stone-600">Review sales trends, forecasts, stock risks and recommended actions.</p></div>
        </div>
        <Link to="/analytics" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:text-emerald-900 sm:mt-0">Open analytics <ArrowRight size={16} aria-hidden /></Link>
      </section>}
    </div>
  )
}
