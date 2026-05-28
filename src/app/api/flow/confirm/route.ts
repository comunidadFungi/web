import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function signParams(params: Record<string, string>, secret: string): string {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', secret).update(toSign).digest('hex')
}

export async function POST(req: NextRequest) {
  const body = await req.formData()
  const token = body.get('token') as string
  const secret = process.env.FLOW_SECRET_KEY!
  const apiKey = process.env.FLOW_API_KEY!
  const apiUrl = process.env.FLOW_API_URL!

  const params: Record<string, string> = { apiKey, token }
  params.s = signParams(params, secret)

  const res = await fetch(`${apiUrl}/payment/getStatus?${new URLSearchParams(params)}`)
  const payment = await res.json()

  // payment.status: 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
  if (payment.status === 2) {
    // Aquí podrías guardar la orden en Supabase
    console.log('Pago confirmado:', payment.commerceOrder)
  }

  return NextResponse.json({ ok: true })
}
