import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function signParams(params: Record<string, string>, secret: string): string {
  const keys = Object.keys(params).sort()
  const toSign = keys.map(k => `${k}${params[k]}`).join('')
  return crypto.createHmac('sha256', secret).update(toSign).digest('hex')
}

export async function POST(req: NextRequest) {
  const { items, total, email } = await req.json()

  const apiKey = process.env.FLOW_API_KEY!
  const secret = process.env.FLOW_SECRET_KEY!
  const apiUrl = process.env.FLOW_API_URL!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const commerceOrder = `CF-${Date.now()}`
  const subject = `Pedido Comunidad Fungi #${commerceOrder}`

  const params: Record<string, string> = {
    apiKey,
    commerceOrder,
    subject,
    currency: 'CLP',
    amount: String(Math.round(total)),
    email,
    urlConfirmation: `${siteUrl}/api/flow/confirm`,
    urlReturn: `${siteUrl}/checkout/success?order=${commerceOrder}`,
    paymentMethod: '9', // Todos los medios
  }

  params.s = signParams(params, secret)

  const form = new URLSearchParams(params)

  const res = await fetch(`${apiUrl}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  const data = await res.json()

  if (data.url && data.token) {
    return NextResponse.json({ url: `${data.url}?token=${data.token}` })
  }

  return NextResponse.json({ error: data }, { status: 400 })
}
