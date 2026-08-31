'use client'

import { useEffect, useState } from 'react'
import { BellRinging, BellSlash } from '@phosphor-icons/react'

import { removePushSubscription, savePushSubscription, sendTestPush } from './actions'
import { Card } from './ui'

/**
 * La clave VAPID viaja en base64url y el navegador la pide como bytes.
 * El buffer se crea explícito para que el tipo sea `ArrayBuffer` y no
 * `ArrayBufferLike`, que `applicationServerKey` no acepta.
 */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(normalized)
  const output = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

type Status = 'cargando' | 'no-soportado' | 'sin-service-worker' | 'activas' | 'inactivas'

export default function PushToggle({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>('cargando')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!cancelled) setStatus('no-soportado')
        return
      }

      // El service worker no se registra en desarrollo, así que aquí
      // no habrá registro con el que suscribirse.
      const registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        if (!cancelled) setStatus('sin-service-worker')
        return
      }

      const existing = await registration.pushManager.getSubscription()
      if (!cancelled) setStatus(existing ? 'activas' : 'inactivas')
    }

    check()
    return () => { cancelled = true }
  }, [])

  async function enable() {
    setBusy(true)
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.ready
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setMessage('El navegador bloqueó las notificaciones.')
        return
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const raw = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } }
      if (!raw.endpoint || !raw.keys) {
        setMessage('El navegador devolvió una suscripción incompleta.')
        return
      }

      const res = await savePushSubscription(
        { endpoint: raw.endpoint, keys: raw.keys },
        navigator.userAgent,
      )
      if ('error' in res) {
        setMessage(res.error)
        return
      }

      setStatus('activas')
      setMessage('Este dispositivo recibirá los avisos de vencimiento.')
    } catch {
      setMessage('No se pudo activar las notificaciones en este dispositivo.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    setMessage('')
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setStatus('inactivas')
      setMessage('Este dispositivo ya no recibirá avisos.')
    } catch {
      setMessage('No se pudo desactivar.')
    } finally {
      setBusy(false)
    }
  }

  async function test() {
    setBusy(true)
    setMessage('')
    const res = await sendTestPush()
    setMessage('error' in res ? res.error : (res.detail ?? 'Enviada.'))
    setBusy(false)
  }

  if (status === 'cargando' || status === 'no-soportado') return null

  // En desarrollo no hay service worker; avisarlo evita pensar que está roto.
  if (status === 'sin-service-worker') {
    return (
      <Card className="p-4 mb-6 bg-[#F5ECD7] border-[#E8D5B5]">
        <p className="text-xs text-[#7A3B1E]">
          Las notificaciones se activan en el sitio publicado. En desarrollo el service worker
          está desactivado a propósito, porque interfiere con la recarga en caliente.
        </p>
      </Card>
    )
  }

  const active = status === 'activas'

  return (
    <Card className="p-4 mb-6 flex flex-wrap items-center gap-3">
      {active ? (
        <BellRinging weight="fill" size={20} className="text-[#6B8F71] shrink-0" />
      ) : (
        <BellSlash weight="fill" size={20} className="text-[#7A3B1E]/50 shrink-0" />
      )}

      <div className="flex-1 min-w-[12rem]">
        <p className="text-sm font-medium text-[#4A1E0A]">
          {active ? 'Avisos activados en este dispositivo' : 'Avisos de vencimiento desactivados'}
        </p>
        <p className="text-xs text-[#7A3B1E] mt-0.5">
          {message || 'Recibirás una notificación cuando una receta esté por vencer.'}
        </p>
      </div>

      {active ? (
        <div className="flex gap-2">
          <button
            onClick={test}
            disabled={busy}
            className="text-xs border border-[#E8D5B5] text-[#4A1E0A] px-4 py-2 rounded-full font-medium hover:bg-[#F5ECD7] transition-colors disabled:opacity-50"
          >
            Probar
          </button>
          <button
            onClick={disable}
            disabled={busy}
            className="text-xs text-[#7A3B1E] hover:text-[#C4513A] px-2 transition-colors disabled:opacity-50"
          >
            Desactivar
          </button>
        </div>
      ) : (
        <button
          onClick={enable}
          disabled={busy}
          className="text-xs bg-[#4A1E0A] text-[#F5ECD7] px-5 py-2 rounded-full font-medium hover:bg-[#7A3B1E] transition-colors disabled:opacity-50"
        >
          {busy ? 'Activando…' : 'Activar avisos'}
        </button>
      )}
    </Card>
  )
}
