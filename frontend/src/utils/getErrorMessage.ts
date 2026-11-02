import axios from 'axios'
import type { ApiErrorResponse } from '../types/api'

/**
 * Turns any thrown value into a message that is safe to show in the UI.
 * Axios errors contain a response body written by our own API.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const apiMessage = error.response?.data?.message
    if (apiMessage) {
      return apiMessage
    }

    if (error.code === 'ECONNABORTED') {
      return 'The API took too long to respond. Please try again.'
    }

    return 'Cannot reach the API. Make sure the backend is running on port 7000.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred.'
}
