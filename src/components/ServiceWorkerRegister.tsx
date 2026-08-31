'use client'

import { useEffect } from 'react'

/**
 * Registra el service worker que habilita la instalación como PWA, la página
 * de respaldo sin conexión y las notificaciones de vencimiento de recetas.
 * No renderiza nada.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // En desarrollo el service worker interfiere con la recarga en caliente.
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch(() => {
        // Un fallo aquí solo significa que no habrá modo sin conexión.
      })
  }, [])

  return null
}
