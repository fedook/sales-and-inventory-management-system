import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext, type AuthStatus } from './authContext'
import * as authService from '../services/auth.service'
import { UNAUTHORIZED_EVENT } from '../services/api'
import type { AuthUser, LoginInput, RegisterInput } from '../types/auth'
import { clearToken, getToken, setToken } from '../utils/tokenStorage'

/**
 * Owns the authentication state for the whole app.
 *
 * On a page refresh it re-validates the stored token with GET /api/auth/me,
 * so a deleted account or expired session cannot stay "logged in".
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>(() =>
    getToken() ? 'loading' : 'anonymous',
  )

  // Validate a token that was restored from localStorage.
  useEffect(() => {
    if (!getToken()) {
      return
    }

    let cancelled = false

    void authService
      .getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearToken()
          setUser(null)
          setStatus('anonymous')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  // The Axios interceptor fires this when the API rejects the stored token.
  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken()
      setUser(null)
      setStatus('anonymous')
    }

    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)

    return () => {
      window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    }
  }, [])

  const login = useCallback(async (input: LoginInput) => {
    const result = await authService.login(input)
    setToken(result.token)
    setUser(result.user)
    setStatus('authenticated')
    return result
  }, [])

  const register = useCallback(async (input: RegisterInput) => {
    const result = await authService.register(input)
    setToken(result.token)
    setUser(result.user)
    setStatus('authenticated')
    return result
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch {
      // The server call is a formality; signing out locally must always work.
    } finally {
      clearToken()
      setUser(null)
      setStatus('anonymous')
    }
  }, [])

  const value = useMemo(
    () => ({ status, user, login, register, logout }),
    [status, user, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
