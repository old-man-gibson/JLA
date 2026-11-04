// Offline support for the deployed app. The page is fetched network-first, so
// a new deploy shows up the next time the app opens online; built assets have
// content hashes in their names, so they're cached once and reused.
const PAGES = 'jla-pages'
const ASSETS = 'jla-assets'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (request.mode === 'navigate') event.respondWith(networkFirst(request))
  else if (url.pathname.includes('/assets/')) event.respondWith(cacheFirst(request))
  else event.respondWith(staleWhileRevalidate(request))
})

async function networkFirst(request) {
  const cache = await caches.open(PAGES)
  try {
    const response = await fetch(request, { cache: 'no-cache' })
    if (response.ok) {
      await cache.put('index', response.clone())
      pruneAssets(response.clone())
    }
    return response
  } catch {
    return (await cache.match('index')) ?? Response.error()
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(ASSETS)
  const hit = await cache.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok) cache.put(request, response.clone())
  return response
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(PAGES)
  const hit = await cache.match(request)
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone())
      return response
    })
    .catch(() => hit ?? Response.error())
  return hit ?? network
}

/** Drops cached assets that the newest page no longer uses. */
async function pruneAssets(response) {
  const html = await response.text()
  const used = new Set([...html.matchAll(/assets\/[\w.-]+/g)].map((m) => m[0]))
  if (used.size === 0) return
  const cache = await caches.open(ASSETS)
  for (const request of await cache.keys()) {
    const name = new URL(request.url).pathname.split('/').slice(-2).join('/')
    if (!used.has(name)) await cache.delete(request)
  }
}
