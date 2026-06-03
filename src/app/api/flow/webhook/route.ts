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

    const payment = await getPaymentStatus(token)
    const status = STATUS_MAP[payment.status] ?? 'pending'

    const supabase = createAdminClient()
    await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('external_reference', payment.commerceOrder)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Flow webhook error:', err)
    return NextResponse.json({ ok: true }) // siempre 200 para que Flow no reintente
  }
}
