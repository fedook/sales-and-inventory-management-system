import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type {
  AuthResult,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '../types/auth'

export async function login(input: LoginInput): Promise<AuthResult> {
  const response = await api.post<ApiResponse<AuthResult>>('/auth/login', input)
  return response.data.data
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const response = await api.post<ApiResponse<AuthResult>>(
    '/auth/register',
    input,
  )
  return response.data.data
}

/** Confirms that a stored token is still valid and returns its user. */
export async function getCurrentUser(): Promise<AuthUser> {
  const response =
    await api.get<ApiResponse<{ user: AuthUser }>>('/auth/me')
  return response.data.data.user
}

/** Best-effort sign-out call; the client removes the token either way. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}
