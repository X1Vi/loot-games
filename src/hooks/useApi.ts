import { useState, useEffect, useCallback, useRef } from 'react'
import { cached, cacheAgeMs, cacheKeyFor } from '../lib/cache'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  updatedAt: number | null
  refetch: () => void
}

export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  key?: string,
  ttlMs = 5 * 60_000,
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<number | null>(null)
  const mounted = useRef(true)

  const cacheKey = key ? cacheKeyFor(key, deps) : null

  const fetchData = useCallback(
    async (force = false) => {
      setLoading(true)
      setError(null)
      try {
        const result = cacheKey
          ? await cached(cacheKey, fetcher, ttlMs, force)
          : await fetcher()
        if (mounted.current) {
          const age = cacheKey ? cacheAgeMs(cacheKey) : null
          setUpdatedAt(Date.now() - (age ?? 0))
          setData(result)
          setLoading(false)
        }
      } catch (err) {
        if (mounted.current) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
        }
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [...deps, cacheKey, ttlMs],
  )

  useEffect(() => {
    mounted.current = true
    fetchData()
    return () => {
      mounted.current = false
    }
  }, [fetchData])

  return { data, loading, error, updatedAt, refetch: () => fetchData(true) }
}
