import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Store,
  Truck,
  UserRound,
  Users,
  X,
} from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

function navLinkClasses({ isActive }: { isActive: boolean }) {
  return `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
    isActive
      ? 'bg-emerald-50 text-emerald-800'
      : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
  }`
}

/**
 * Signed-in shell: sidebar navigation, the current user, and a sign-out
 * button. Pages render into <Outlet />.
 */
export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  if (!user) {
    return null
  }

  const isAdmin = user.role === 'admin'
  const initial = user.name.charAt(0).toUpperCase()

  async function handleSignOut() {
    setSigningOut(true)

    try {
      await logout()
      navigate('/login', { replace: true })
    } finally {
      setSigningOut(false)
    }
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
          <Store size={20} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900">
            Sales &amp; Inventory
          </p>
          <p className="text-xs text-stone-500">Business suite</p>
        </div>
      </div>

      <nav aria-label="Main navigation" className="mt-8 space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
          Workspace
        </p>

        <NavLink
          to="/dashboard"
          className={navLinkClasses}
          onClick={() => setMobileOpen(false)}
        >
          <LayoutDashboard size={18} aria-hidden />
          Dashboard
        </NavLink>

        <NavLink
          to="/products"
          className={navLinkClasses}
          onClick={() => setMobileOpen(false)}
        >
          <Package size={18} aria-hidden />
          Products
        </NavLink>

        <NavLink
          to="/sales"
          className={navLinkClasses}
          onClick={() => setMobileOpen(false)}
        >
          <Receipt size={18} aria-hidden />
          Sales
        </NavLink>

        <NavLink
          to="/inventory"
          className={navLinkClasses}
          onClick={() => setMobileOpen(false)}
        >
          <Boxes size={18} aria-hidden />
          Inventory
        </NavLink>

        <NavLink
          to="/customers"
          className={navLinkClasses}
          onClick={() => setMobileOpen(false)}
        >
          <UserRound size={18} aria-hidden />
          Customers
        </NavLink>

        <NavLink
          to="/suppliers"
          className={navLinkClasses}
          onClick={() => setMobileOpen(false)}
        >
          <Truck size={18} aria-hidden />
          Suppliers
        </NavLink>

        {isAdmin && (
          <NavLink
            to="/users"
            className={navLinkClasses}
            onClick={() => setMobileOpen(false)}
          >
            <Users size={18} aria-hidden />
            Users
          </NavLink>
        )}

        {isAdmin && (
          <>
            <p className="px-3 pt-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              Insights
            </p>
            <NavLink
              to="/analytics"
              className={navLinkClasses}
              onClick={() => setMobileOpen(false)}
            >
              <BarChart3 size={18} aria-hidden />
              Business analytics
            </NavLink>
          </>
        )}
      </nav>

      <div className="mt-auto rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-semibold text-white"
          >
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-800">
              {user.name}
            </p>
            <p className="truncate text-xs capitalize text-stone-500">
              {user.role}
            </p>
          </div>
        </div>

        <Button
          variant="secondary"
          fullWidth
          className="mt-3"
          loading={signingOut}
          onClick={() => void handleSignOut()}
        >
          <LogOut size={16} aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 lg:grid lg:grid-cols-[270px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-stone-200 bg-white p-4 lg:flex lg:flex-col">
        {sidebar}
      </aside>

      {/* Mobile header + drawer */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
            <Store size={18} aria-hidden />
          </span>
          <span className="text-sm font-semibold text-stone-900">
            Sales &amp; Inventory
          </span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl border border-stone-200 p-2 text-stone-600 transition hover:bg-stone-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label="Open navigation menu"
        >
          <Menu size={20} aria-hidden />
        </button>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-stone-900/40"
          />
          <div className="relative h-full w-[290px] bg-white p-4 shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              aria-label="Close navigation menu"
            >
              <X size={18} aria-hidden />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      <main className="px-5 py-8 sm:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
