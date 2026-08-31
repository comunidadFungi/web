import { NextRequest, NextResponse } from 'next/server'
import { getPaymentStatus } from '@/lib/flow'
import { createAdminClient } from '@/lib/supabase-admin'

const STATUS_MAP: Record<number, string> = {
  1: 'completed',
  0: 'pending',
  [-1]: 'cancelled',
  2: 'cancelled',
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const token = form.get('token') as string
    if (!token) return NextResponse.json({ ok: true })

    // El estado se consulta a Flow con la clave firmada: nunca se toma del
    // cuerpo de la petición, así que un POST falso no puede marcar un pedido
    // como pagado.
    const payment = await getPaymentStatus(token)
    let status = STATUS_MAP[payment.status] ?? 'pending'

    const supabase = createAdminClient()
    const { data: order } = await supabase
      .from('orders')
      .select('id, total')
      .eq('external_reference', payment.commerceOrder)
      .maybeSingle()

    if (!order) return NextResponse.json({ ok: true })

    // Defensa en profundidad: un pago por menos de lo pedido no completa la
    // orden, queda para revisión manual.
    if (status === 'completed' && Number(payment.amount) < Number(order.total)) {
      console.error(
        `Flow webhook: pago insuficiente en ${payment.commerceOrder} — ` +
        `recibido ${payment.amount}, esperado ${order.total}`,
      )
      status = 'pending'
    }

    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Flow webhook error:', err)
    return NextResponse.json({ ok: true }) // siempre 200 para que Flow no reintente
  }
}
