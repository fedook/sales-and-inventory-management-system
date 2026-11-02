import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

/**
 * One Axios instance for the whole app.
 * Components and services import this instead of building URLs by hand.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:7000/api'

/**
 * Fired when the API rejects a stored token so the auth provider can reset
 * its state. A plain window event keeps this file free of React imports.
 */
export const UNAUTHORIZED_EVENT = 'auth:unauthorized'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach the Bearer token to every request when the user is signed in.
api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

// A 401 means the token is missing, expired, or the account was deleted.
// Login and register also return 401/409, but those are handled by the form.
api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const url = error.config?.url ?? ''
      const isCredentialCheck =
        url.includes('/auth/login') || url.includes('/auth/register')

      if (!isCredentialCheck) {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
      }
    }

    return Promise.reject(error)
  },
)
