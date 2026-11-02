import { useEffect, useState } from 'react'

/**
 * Waits until the user stops typing before the value is used in a request.
 * The product, customer and supplier search boxes all use this.
 */
export function useDebouncedValue<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(timer)
  }, [value, delay])

  return debounced
}
