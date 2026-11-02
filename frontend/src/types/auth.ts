export type UserRole = 'admin' | 'staff'

/** A user exactly as the API returns it (never includes a password). */
export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
  /** ISO date string produced by JSON serialisation. */
  createdAt: string
}

/** Response body of POST /api/auth/login and /api/auth/register. */
export interface AuthResult {
  token: string
  user: AuthUser
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  name: string
  email: string
  password: string
}
