const TOKEN_KEY = 'sales-inventory.access-token'

/**
 * The JWT is kept in localStorage so a page refresh does not sign the user
 * out. localStorage is readable by JavaScript, so it is only acceptable for
 * this type of first-party app; a high-security system would use an HttpOnly
 * cookie instead.
 */
export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    // Private browsing or blocked storage: behave like a signed-out visitor.
    return null
  }
}

export function setToken(token: string): void {
  try {
    window.localStorage.setItem(TOKEN_KEY, token)
  } catch {
    // Storage is unavailable; the in-memory session still works for this page.
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Nothing to do.
  }
}
