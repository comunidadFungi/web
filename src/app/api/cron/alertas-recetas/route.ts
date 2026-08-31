import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'

import { createAdminClient } from '@/lib/supabase-admin'
import { getPrescriptions } from '@/lib/dispensario'
import { sendPushToAdmin } from '@/lib/push'
import { todayKey } from '@/lib/posology'

/**
 * Revisión diaria de vencimientos de recetas.
 *
 * Pensado para Vercel Cron, que envía por su cuenta la cabecera
 * `Authorization: Bearer $CRON_SECRET` cuando esa variable existe en el
 * proyecto. También sirve cualquier cron externo que la incluya.
 *
 * Hace tres cosas:
 *  1. Marca como vencidas las recetas vigentes cuya fecha ya pasó.
 *  2. Registra en `prescription_alerts` los avisos que corresponden hoy,
 *     sin repetir los ya emitidos.
 *  3. Notifica al administrador con un resumen del día.
 */

export const dynamic = 'force-dynamic'

/**
 * Umbrales en orden ascendente: se emite el aviso MÁS CERCANO al vencimiento
 * que ya se alcanzó. Con la lista al revés, `find` devolvía siempre el de 30
 * días y, como los avisos no se repiten, ninguno de los siguientes llegaba
 * jamás — ni el de vencimiento.
 */
const THRESHOLDS: { days: number; kind: string }[] = [
  { days: 0, kind: 'expired' },
  { days: 7, kind: 'expiry_7' },
  { days: 15, kind: 'expiry_15' },
  { days: 30, kind: 'expiry_30' },
]

interface AlertCandidate {
  prescription_id: string
  kind: string
  recipient: string | null
  daysToExpiry: number
}

/**
 * Resumen sin datos identificables: la notificación queda en el centro de
 * notificaciones del sistema, fuera de la aplicación.
 */
function buildMessage(nuevos: AlertCandidate[]) {
  const vencidas = nuevos.filter(c => c.daysToExpiry < 0).length
  const porVencer = nuevos.length - vencidas

  const partes: string[] = []
  if (porVencer > 0) {
    partes.push(porVencer === 1 ? '1 receta por vencer' : `${porVencer} recetas por vencer`)
  }
  if (vencidas > 0) {
    partes.push(vencidas === 1 ? '1 receta vencida' : `${vencidas} recetas vencidas`)
  }

  return {
    title: 'Recetas por vencer',
    body: `${partes.join(' · ')}. Abre el dispensario para verlas.`,
    url: '/admin/dispensario',
    tag: 'alertas-recetas',
  }
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  // Sin secreto configurado el endpoint queda cerrado, no abierto.
  if (!secret) return false

  const header = req.headers.get('authorization') ?? ''
  const expected = Buffer.from(`Bearer ${secret}`)
  const received = Buffer.from(header)

  if (expected.length !== received.length) return false
  return timingSafeEqual(expected, received)
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const views = await getPrescriptions({ onlyActive: true })

  // 1. Recetas cuya vigencia ya terminó
  const expiredIds = views.filter(v => v.daysToExpiry < 0).map(v => v.prescription.id)
  if (expiredIds.length > 0) {
    await supabase
      .from('prescriptions')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .in('id', expiredIds)
  }

  // 2. Avisos que corresponden hoy
  const candidates: AlertCandidate[] = views.flatMap(v => {
    const threshold = THRESHOLDS.find(t => v.daysToExpiry <= t.days)
    if (!threshold) return []

    return [{
      prescription_id: v.prescription.id,
      kind: threshold.kind,
      recipient: v.prescription.patient?.email ?? v.prescription.patient?.phone ?? null,
      daysToExpiry: v.daysToExpiry,
    }]
  })

  if (candidates.length === 0) {
    return NextResponse.json({
      revisadas: views.length,
      marcadasVencidas: expiredIds.length,
      avisosNuevos: 0,
      hoy: todayKey(),
    })
  }

  // `ignoreDuplicates` deja pasar los avisos ya emitidos sin fallar, así que
  // solo vuelven los realmente nuevos. Es seguro ante dos ejecuciones a la vez.
  const { data: inserted, error } = await supabase
    .from('prescription_alerts')
    .upsert(
      candidates.map(c => ({
        prescription_id: c.prescription_id,
        kind: c.kind,
        recipient: c.recipient,
        channel: 'push',
      })),
      { onConflict: 'prescription_id,kind', ignoreDuplicates: true },
    )
    .select('prescription_id, kind')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const isNew = new Set((inserted ?? []).map(r => `${r.prescription_id}:${r.kind}`))
  const nuevos = candidates.filter(c => isNew.has(`${c.prescription_id}:${c.kind}`))

  // 3. Un solo aviso con el resumen del día
  const push = nuevos.length > 0 ? await sendPushToAdmin(buildMessage(nuevos)) : null

  /*
   * Si el envío falló de verdad —hubo dispositivos y ninguno recibió— se
   * retira el registro para reintentarlo mañana.
   *
   * No se retira cuando simplemente no hay dispositivos suscritos: eso no es
   * un fallo, y borrarlo haría que el mismo aviso se repitiera cada día. El
   * aviso sigue visible en el panel, que es el canal principal.
   */
  const deliveryFailed = push !== null && !push.skipped && push.sent === 0 && push.failed > 0

  if (deliveryFailed) {
    for (const c of nuevos) {
      await supabase
        .from('prescription_alerts')
        .delete()
        .eq('prescription_id', c.prescription_id)
        .eq('kind', c.kind)
    }
  }

  // La respuesta queda en los registros de Vercel, visibles para todo el equipo
  // del proyecto: por eso solo lleva contadores, nunca datos de pacientes.
  return NextResponse.json({
    revisadas: views.length,
    marcadasVencidas: expiredIds.length,
    avisosNuevos: nuevos.length,
    entregados: push?.sent ?? 0,
    notificacion: push?.skipped ?? null,
    reintentaMañana: deliveryFailed,
    hoy: todayKey(),
  })
}
