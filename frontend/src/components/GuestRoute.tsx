import { Navigate, Outlet } from 'react-router-dom'
import FullPageLoader from './ui/FullPageLoader'
import { useAuth } from '../hooks/useAuth'

/** Keeps a signed-in user away from the login and register pages. */
export default function GuestRoute() {
  const { status } = useAuth()

  if (status === 'loading') {
    return <FullPageLoader label="Checking your session..." />
  }

  if (status === 'authenticated') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
