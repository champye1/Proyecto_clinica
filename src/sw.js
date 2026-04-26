import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim } from 'workbox-core'

cleanupOutdatedCaches()

// Cuando el SW toma control tras un deploy nuevo, recarga todos los clientes
// abiertos para que usen los nuevos chunks en vez de los cacheados viejos.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => client.navigate(client.url))
      })
    })
  )
})

self.skipWaiting()

// VitePWA inyecta el manifest aquí en el build
precacheAndRoute(self.__WB_MANIFEST)

// SPA: todas las navegaciones sirven index.html excepto las rutas de API
const handler = createHandlerBoundToURL('/index.html')
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/rest\//, /^\/auth\//, /^\/functions\//, /^\/storage\//],
})
registerRoute(navigationRoute)

// Google Fonts (cache a largo plazo)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }),
    ],
  })
)

// ── Web Push ──────────────────────────────────────────────────

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data?.json() ?? {}
  } catch {
    data = { title: 'SurgicalHUB', body: event.data?.text() ?? '' }
  }

  const title = data.title ?? 'SurgicalHUB'
  const options = {
    body:      data.body ?? '',
    icon:      '/icons/icon-192.svg',
    badge:     '/icons/icon-192.svg',
    tag:       data.tag ?? 'surgicalhub-notification',
    renotify:  true,
    vibrate:   [200, 100, 200],
    data:      { url: data.url ?? '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Si ya hay una ventana abierta con esa URL, enfocarla
      for (const client of windowClients) {
        if ('focus' in client) return client.focus()
      }
      // Si no, abrir una nueva
      return clients.openWindow(targetUrl)
    })
  )
})
