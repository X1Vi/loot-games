import { useEffect, useRef, useState } from 'react'

export function useNewKeys(storageKey: string, keys: string[], ready = true): Set<string> {
  const [newKeys, setNewKeys] = useState<Set<string>>(() => new Set())
  const committed = useRef(false)

  useEffect(() => {
    if (!ready || keys.length === 0 || committed.current) return
    committed.current = true

    let raw: string | null = null
    try {
      raw = window.localStorage.getItem(storageKey)
    } catch {
      return
    }

    if (raw === null) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(keys))
      } catch {
        // ignore
      }
      return
    }

    let prev: string[] = []
    try {
      prev = JSON.parse(raw) as string[]
    } catch {
      prev = []
    }

    const prevSet = new Set(prev)
    setNewKeys(new Set(keys.filter((k) => !prevSet.has(k))))

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(keys))
    } catch {
      // ignore
    }
  }, [keys, storageKey, ready])

  return newKeys
}
