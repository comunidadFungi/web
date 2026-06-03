import crypto from 'node:crypto'

const BASE_URL = process.env.FLOW_ENV === 'production'
  ? 'https://www.flow.cl/api'
  : 'https://sandbox.flow.cl/api'

function sign(params: Record<string, string | number>): string {
  const str = Object.keys(params)
    .sort()
    .map(k => `${k}${params[k]}`)
    .join('')
  return crypto
    .createHmac('sha256', process.env.FLOW_SECRET_KEY!)
    .update(str)
    .digest('hex')
}

function buildForm(params: Record<string, string | number>): URLSearchParams {
  const form = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => form.append(k, String(v)))
  return form
}

export async function createPayment(params: {
  commerceOrder: string
  subject: string
  amount: number
  email: string
  urlConfirmation: string
  urlReturn: string
}) {
  const body: Record<string, string | number> = {
    apiKey: process.env.FLOW_API_KEY!,
    commerceOrder: params.commerceOrder,
    subject: params.subject,
    currency: 'CLP',
    amount: Math.round(params.amount),
    email: params.email,
    urlConfirmation: params.urlConfirmation,
    urlReturn: params.urlReturn,
  }
  body.s = sign(body)

  const res = await fetch(`${BASE_URL}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: buildForm(body).toString(),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`Flow create error: ${JSON.stringify(data)}`)
  return data as { url: string; token: string; flowOrder: number }
}

export async function getPaymentStatus(token: string) {
  const params: Record<string, string | number> = {
    apiKey: process.env.FLOW_API_KEY!,
    token,
  }
  const qs = buildForm({ ...params, s: sign(params) })

  const res = await fetch(`${BASE_URL}/payment/getStatus?${qs}`)
  const data = await res.json()
  if (!res.ok) throw new Error(`Flow getStatus error: ${JSON.stringify(data)}`)

  return data as {
    flowOrder: number
    commerceOrder: string
    status: number // 1=paid, 0=pending, -1=rejected, 2=cancelled
    amount: number
    payer: string
  }
}
