const CACHE_PREFIX = 'loot-terminal-'
const CACHE = `${CACHE_PREFIX}v2`
const SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  if (!request.url.startsWith(self.location.origin)) return
  if (request.url.includes('/adstera-')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match('/index.html')
        return cached ?? new Response('Offline', { status: 503 })
      }),
    )
    return
  }

  // Vite assets have content-hashed filenames. Let the browser fetch them
  // directly so an old worker cannot serve or interfere with a new build.
  if (new URL(request.url).pathname.startsWith('/assets/')) return

  event.respondWith(
    caches.match(request).then(async (cached) => {
      if (cached) return cached
      return fetch(request)
    }),
  )
})
