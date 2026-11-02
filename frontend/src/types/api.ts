export interface HealthResponse {
  success: true
  message: string
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  message: string
  /** Optional validation details returned by the API. */
  errors?: unknown
}
