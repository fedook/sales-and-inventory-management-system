import { api } from './api'
import type { HealthResponse } from '../types/api'

/** Calls GET /api/health on the Express backend. */
export async function getApiHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>('/health')
  return response.data
}
