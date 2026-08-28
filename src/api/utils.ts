// CORS proxy list — tried in order. corsproxy.io works from browser
// even if curl gets 403 (they check User-Agent).
const CORS_PROXIES = [
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
]

export async function fetchWithCorsFallback(url: string, options?: RequestInit): Promise<Response> {
  // Try direct fetch first
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(6000),
    })
    if (res.ok) return res
    // 4xx/5xx — might still work via proxy
  } catch {
    // CORS or network failure — fall through to proxy
  }

  // Try each proxy in order
  for (const proxyFn of CORS_PROXIES) {
    try {
      const proxyUrl = proxyFn(url)
      const res = await fetch(proxyUrl, {
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue

      // allorigins wraps response in { contents: ..., status: {...} }
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('json')) {
        const json = await res.json()
        if (json.contents) {
          const body = typeof json.contents === 'string'
            ? json.contents
            : JSON.stringify(json.contents)
          return new Response(body, {
            status: json.status?.http_code ?? 200,
            headers: {
              'content-type': json.status?.content_type ?? 'application/json',
            },
          })
        }
      }
      return res
    } catch {
      continue // try next proxy
    }
  }

  throw new Error(`Failed to fetch: ${url}`)
}
