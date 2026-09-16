interface CacheEntry {
  t: number
  v: unknown
}

const store = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<unknown>>()

export function cacheKeyFor(key: string, deps: unknown[]): string {
  return `${key}::${JSON.stringify(deps)}`
}

export function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number,
  force = false,
): Promise<T> {
  if (!force) {
    const hit = store.get(key)
    if (hit && Date.now() - hit.t < ttlMs) {
      return Promise.resolve(hit.v as T)
    }
  }

  const pending = inflight.get(key)
  if (pending) return pending as Promise<T>

  const p = fetcher()
    .then((v) => {
      store.set(key, { t: Date.now(), v })
      return v
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, p)
  return p
}

export function cacheAgeMs(key: string): number | null {
  const hit = store.get(key)
  return hit ? Date.now() - hit.t : null
}
