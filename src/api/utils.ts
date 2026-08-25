const CORS_PROXY = 'https://api.allorigins.win/get?url='

export async function fetchWithCorsFallback(url: string, options?: RequestInit): Promise<Response> {
  // Try direct fetch first
  try {
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) return res
  } catch {
    // CORS or network failure — fall through to proxy
  }

  // Fallback: proxy
  const proxyUrl = `${CORS_PROXY}${encodeURIComponent(url)}`
  const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) })
  if (!proxyRes.ok) throw new Error(`Failed to fetch: ${url}`)

  const json = await proxyRes.json()
  // allorigins.win wraps the response in { contents: string, status: {...} }
  if (json.contents) {
    const body = typeof json.contents === 'string' ? json.contents : JSON.stringify(json.contents)
    return new Response(body, {
      status: json.status?.http_code ?? 200,
      headers: { 'content-type': json.status?.content_type ?? 'application/json' },
    })
  }
  return new Response(JSON.stringify(json), { status: 200 })
}
