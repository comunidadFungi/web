/* eslint-disable no-undef */
/**
 * Service worker de Comunidad Fungi.
 *
 * Deliberadamente NO cachea las páginas del dispensario: mostrar stock o
 * dosis desactualizados sería peor que mostrar un aviso de "sin conexión".
 * Solo se precachean la página de respaldo y los iconos, y se manejan las
 * notificaciones push de vencimiento de recetas.
 */

const CACHE = 'fungi-shell-v1'
const OFFLINE_URL = '/offline'
const PRECACHE = [OFFLINE_URL, '/icon-192.png', '/icon-512.png']

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', event => {
  const { request } = event

  // Solo se interviene la navegación; el resto pasa directo a la red.
  if (request.mode !== 'navigate') return

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE)
      const fallback = await cache.match(OFFLINE_URL)
      return (
        fallback ??
        new Response('Sin conexión', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      )
    }),
  )
})

self.addEventListener('push', event => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Comunidad Fungi', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Comunidad Fungi', {
      body: payload.body ?? '',
      icon: payload.icon ?? '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      tag: payload.tag,
      data: { url: payload.url ?? '/admin/dispensario' },
    }),
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const target = event.notification.data?.url ?? '/admin/dispensario'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windows => {
      // Reutiliza una ventana abierta de la app en lugar de abrir otra.
      for (const client of windows) {
        if (client.url.includes(target) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
