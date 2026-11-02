import { useContext } from 'react'
import { AuthContext } from '../context/authContext'

/** Read the current user and the auth actions from anywhere in the app. */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.')
  }

  return context
}
