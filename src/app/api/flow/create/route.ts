import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/flow'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { items, total, email, userId } = await req.json()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const commerceOrder = `CF-${Date.now()}`

  try {
    const supabase = createAdminClient()
    const [, payment] = await Promise.all([
      supabase.from('orders').insert({
        external_reference: commerceOrder,
        user_id: userId ?? null,
        user_email: email,
        items,
        total: Math.round(total),
        status: 'pending',
      }),
      createPayment({
        commerceOrder,
        subject: 'Comunidad Fungi — Pedido',
        amount: total,
        email,
        urlConfirmation: `${siteUrl}/api/flow/webhook`,
        urlReturn: `${siteUrl}/checkout/success?order=${commerceOrder}`,
      }),
    ])

    return NextResponse.json({ url: `${payment.url}?token=${payment.token}` })
  } catch (err) {
    console.error('Flow create error:', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago' }, { status: 500 })
  }
}
