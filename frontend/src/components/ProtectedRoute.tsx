import { Navigate, Outlet, useLocation } from 'react-router-dom'
import FullPageLoader from './ui/FullPageLoader'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types/auth'

/**
 * Layout route that blocks unauthenticated visitors.
 * The attempted URL is remembered so login can send the user back to it.
 */
export default function ProtectedRoute({ roles }: { roles?: UserRole[] }) {
  const { status, user } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <FullPageLoader label="Checking your session..." />
  }

  if (status !== 'authenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
