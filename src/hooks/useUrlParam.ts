import { useCallback, useState } from 'react'

export function useUrlParam(key: string, initial = ''): [string, (value: string) => void] {
  const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return initial
    return new URLSearchParams(window.location.search).get(key) ?? initial
  })

  const set = useCallback(
    (next: string) => {
      setValue(next)
      const params = new URLSearchParams(window.location.search)
      if (next && next !== initial) params.set(key, next)
      else params.delete(key)
      const qs = params.toString()
      window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
    },
    [key, initial],
  )

  return [value, set]
}
