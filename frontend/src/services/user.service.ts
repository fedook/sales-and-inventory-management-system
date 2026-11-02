import { api } from './api'
import type { ApiResponse } from '../types/envelope'
import type { AuthUser, UserRole } from '../types/auth'

export async function listUsers(): Promise<AuthUser[]> {
  const response = await api.get<ApiResponse<{ users: AuthUser[] }>>('/users')
  return response.data.data.users
}

export async function updateUserRole(
  id: number,
  role: UserRole,
): Promise<AuthUser> {
  const response = await api.patch<ApiResponse<{ user: AuthUser }>>(
    `/users/${id}/role`,
    { role },
  )
  return response.data.data.user
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/users/${id}`)
}
