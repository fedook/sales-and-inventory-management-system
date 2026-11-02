import { useCallback, useEffect, useState } from 'react'
import { getApiHealth } from '../services/health.service'
import type { HealthResponse } from '../types/api'
import { getErrorMessage } from '../utils/getErrorMessage'

type HealthState =
  | { status: 'loading' }
  | { status: 'online'; data: HealthResponse }
  | { status: 'offline'; message: string }

/**
 * Small data-fetching hook: loading, success and failure are all explicit.
 * Later phases can follow the same pattern for products, sales, etc.
 *
 * The first check runs when the page mounts. `refresh` shows the loading
 * state again and is meant to be called from a button click.
 */
export function useApiHealth() {
  const [state, setState] = useState<HealthState>({ status: 'loading' })

  const fetchHealth = useCallback(async () => {
    try {
      const data = await getApiHealth()
      setState({ status: 'online', data })
    } catch (error) {
      setState({ status: 'offline', message: getErrorMessage(error) })
    }
  }, [])

  useEffect(() => {
    // This is the intended "synchronise with an external system" effect:
    // state is only updated after the async request finishes.
    // oxlint-disable-next-line react/set-state-in-effect
    void fetchHealth()
  }, [fetchHealth])

  const refresh = useCallback(async () => {
    setState({ status: 'loading' })
    await fetchHealth()
  }, [fetchHealth])

  return { state, refresh }
}
