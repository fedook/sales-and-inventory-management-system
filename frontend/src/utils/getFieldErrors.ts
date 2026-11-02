import axios from 'axios'
import type { ApiErrorResponse } from '../types/api'

export type FieldErrors = Record<string, string>

/**
 * Reads the `errors.fieldErrors` map produced by the backend's Zod
 * validation middleware:
 *
 *   { errors: { fieldErrors: { email: ["Enter a valid email address."] } } }
 *
 * Returns the first message per field, which is what the forms display.
 */
export function getFieldErrors(error: unknown): FieldErrors {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {}
  }

  const details = error.response?.data?.errors

  if (!details || typeof details !== 'object') {
    return {}
  }

  const fieldErrors = (details as { fieldErrors?: unknown }).fieldErrors

  if (!fieldErrors || typeof fieldErrors !== 'object') {
    return {}
  }

  const result: FieldErrors = {}

  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') {
      result[field] = messages[0]
    }
  }

  return result
}
