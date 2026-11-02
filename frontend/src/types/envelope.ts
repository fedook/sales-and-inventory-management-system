/** Standard success envelope used by every endpoint except /health. */
export interface ApiResponse<T> {
  success: true
  message?: string
  data: T
}
