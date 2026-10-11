const VERSION = '__SILKA_BUILD_ID__'
const ASSETS = /* SILKA_ASSETS */ []
const PREFIX = 'silka-shell-'
const CACHE = PREFIX + VERSION
const routes = /^\/(?:$|login\/?$|profile\/?$|progress\/?$|plans(?:\/[^/?#]+)*\/?$|workouts\/[a-f\d-]+\/?$)/

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE)
      await cache.addAll(ASSETS.map(path => new Request(path, { cache: 'reload', credentials: 'same-origin' })))
    }
    catch (error) {
      await caches.delete(CACHE)
      throw error
    }
  })())
})
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  const navigation = request.mode === 'navigate' && routes.test(url.pathname)
  const asset = ASSETS.includes(url.pathname) || /^\/_nuxt\/[\w./-]+\.(?:js|css|json|woff2?)$/.test(url.pathname)
  if (!navigation && !asset) return
  event.respondWith((async () => {
    const key = navigation ? '/index.html' : url.pathname
    const current = await (await caches.open(CACHE)).match(key)
    if (current) return current
    // Open tabs can still import chunks belonging to the previous build.
    if (!navigation) {
      for (const name of await caches.keys()) {
        if (!name.startsWith(PREFIX)) continue
        const previous = await (await caches.open(name)).match(key)
        if (previous) return previous
      }
    }
    return fetch(request)
  })())
})
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data) return
  if (data.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting())
  if (data.type === 'APP_READY' && data.version === VERSION) {
    event.waitUntil((async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      if (clients.length !== 1 || clients[0].id !== event.source?.id) return
      for (const name of await caches.keys()) {
        if (name.startsWith(PREFIX) && name !== CACHE) await caches.delete(name)
      }
    })())
  }
})
