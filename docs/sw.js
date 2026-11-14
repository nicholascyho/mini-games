const prefix = 'blockfall:' + self.registration.scope + ':'
const cacheName = prefix + '57763777ab45db9f'
const files = ["./","./assets/index-Bd-j5Tqn.css","./assets/index-CMrdjUd4.js","./icon-192.png","./icon-512.png","./index.html","./manifest.webmanifest"]
const urls = new Set(files.map(file => new URL(file, self.registration.scope).href))

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(
    files.map(file => new Request(new URL(file, self.registration.scope), { cache: 'reload' }))
  )))
})

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName)
      .map(key => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', event => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  const root = new URL(self.registration.scope)
  const appPage = request.mode === 'navigate' && url.origin === root.origin &&
    [root.pathname, root.pathname + 'index.html'].includes(url.pathname)
  if (appPage || urls.has(request.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(cacheName)
      return await cache.match(appPage ? root.href : request) ?? fetch(request)
    })())
  }
})
