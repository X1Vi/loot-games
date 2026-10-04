import { useApi } from './useApi'
import { STORE_ORIGIN } from '../lib/store'

export const STORE_HEALTH_URL = `${STORE_ORIGIN}/api/free-books`

const STORE_HEALTH_TTL_MS = 10 * 60_000
const STORE_HEALTH_TIMEOUT_MS = 2_500

export function useStoreHealth(): boolean {
  const { data, error } = useApi(
    () =>
      fetch(STORE_HEALTH_URL, {
        cache: 'no-store',
        signal: AbortSignal.timeout(STORE_HEALTH_TIMEOUT_MS),
      }).then((res) => res.ok),
    [],
    'store:health',
    STORE_HEALTH_TTL_MS,
  )

  return error === null && data !== false
}
