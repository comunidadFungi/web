import webpush from 'web-push'

import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Envío de notificaciones push a los dispositivos donde se instaló la PWA.
 * Las suscripciones viven en `push_subscriptions`; las que el navegador da
 * por muertas (404/410) se borran solas para que la tabla no se llene de
 * dispositivos que ya desinstalaron la app.
 */

export interface PushMessage {
  title: string
  body: string
  /** Ruta que se abre al tocar la notificación. */
  url?: string
  /** Agrupa notificaciones: una nueva con el mismo tag reemplaza la anterior. */
  tag?: string
}

export interface PushResult {
  sent: number
  removed: number
  failed: number
  skipped?: string
}

let configured = false

/** Devuelve false si faltan las claves VAPID, en vez de reventar. */
function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) return false

  if (!configured) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? 'mailto:contacto@comunidadfungi.com',
      publicKey,
      privateKey,
    )
    configured = true
  }
  return true
}

export function isPushConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

interface StoredSubscription {
  id: string
  endpoint: string
  p256dh: string
  auth: string
}

/**
 * Envía solo a los dispositivos del administrador.
 *
 * Antes se enviaba a toda la tabla, así que un aviso podía llegar al teléfono
 * de cualquiera que alguna vez hubiera activado las notificaciones — incluido
 * un equipo prestado o el de un colaborador que ya no está.
 */
export async function sendPushToAdmin(message: PushMessage): Promise<PushResult> {
  if (!configure()) {
    return { sent: 0, removed: 0, failed: 0, skipped: 'Faltan las claves VAPID' }
  }

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    return { sent: 0, removed: 0, failed: 0, skipped: 'ADMIN_EMAIL no está definida' }
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_email', adminEmail)

  const subs = (data ?? []) as StoredSubscription[]
  if (subs.length === 0) {
    return { sent: 0, removed: 0, failed: 0, skipped: 'No hay dispositivos suscritos' }
  }

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url ?? '/admin/dispensario',
    tag: message.tag,
    icon: '/icon-192.png',
  })

  const dead: string[] = []
  let sent = 0
  let failed = 0

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      ),
    ),
  )

  results.forEach((result, i) => {
    if (result.status === 'fulfilled') {
      sent += 1
      return
    }
    // 404/410 significan que el navegador desechó la suscripción.
    const status = (result.reason as { statusCode?: number })?.statusCode
    if (status === 404 || status === 410) dead.push(subs[i].id)
    else failed += 1
  })

  if (dead.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', dead)
  }

  return { sent, removed: dead.length, failed }
}
