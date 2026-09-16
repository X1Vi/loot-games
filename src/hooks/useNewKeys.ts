import { useEffect, useState } from 'react'

const sessions = new Map<string, Set<string>>()

export function useNewKeys(storageKey: string, keys: string[], ready = true): Set<string> {
  const [newKeys, setNewKeys] = useState<Set<string>>(
    () => sessions.get(storageKey) ?? new Set(),
  )

  useEffect(() => {
    if (!ready || keys.length === 0) return

    if (sessions.has(storageKey)) {
      setNewKeys(sessions.get(storageKey) as Set<string>)
      return
    }

    let prev: string[] | null = null
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw !== null) prev = JSON.parse(raw) as string[]
    } catch {
      prev = null
    }

    const prevSet = new Set(prev ?? [])
    const result = prev === null ? new Set<string>() : new Set(keys.filter((k) => !prevSet.has(k)))

    sessions.set(storageKey, result)
    setNewKeys(result)

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(keys))
    } catch {
      // ignore
    }
  }, [keys, storageKey, ready])

  return newKeys
}
