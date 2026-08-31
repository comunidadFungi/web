import { NextRequest, NextResponse } from 'next/server'
import { createPayment } from '@/lib/flow'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

/**
 * Inicio de pago.
 *
 * El importe se calcula SIEMPRE en el servidor a partir de los precios de la
 * base. Antes se tomaba el `total` que enviaba el navegador, lo que permitía
 * generar un cobro legítimo de Flow por cualquier cantidad. Del cliente solo se
 * aceptan referencias de producto y cantidades; la identidad sale de la sesión.
 */

interface RequestedItem {
  id: string
  quantity: number
}

const MAX_QUANTITY_PER_ITEM = 50

function parseItems(raw: unknown): RequestedItem[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 50) return null

  const items: RequestedItem[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) return null
    const { id, quantity } = entry as { id?: unknown; quantity?: unknown }

    if (typeof id !== 'string' || id.length === 0) return null
    const qty = Number(quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QUANTITY_PER_ITEM) return null

    items.push({ id, quantity: qty })
  }
  return items
}

export async function POST(req: NextRequest) {
  // La identidad nunca viene del cuerpo de la petición.
  const supabaseSession = await createClient()
  const { data: { user } } = await supabaseSession.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Debes iniciar sesión para pagar' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Petición inválida' }, { status: 400 })
  }

  const requested = parseItems((body as { items?: unknown })?.items)
  if (!requested) {
    return NextResponse.json({ error: 'Carrito inválido' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, active, access, stock')
    .in('id', requested.map(i => i.id))

  if (productsError) {
    return NextResponse.json({ error: 'No se pudo validar el carrito' }, { status: 500 })
  }

  const byId = new Map((products ?? []).map(p => [p.id as string, p]))

  // Se reconstruye el pedido con los precios reales; lo que enviara el
  // navegador se descarta por completo.
  const lineItems = []
  let total = 0

  for (const item of requested) {
    const product = byId.get(item.id)
    if (!product) {
      return NextResponse.json({ error: 'Uno de los productos ya no existe' }, { status: 400 })
    }
    if (!product.active) {
      return NextResponse.json(
        { error: `«${product.name}» ya no está disponible` },
        { status: 400 },
      )
    }

    const price = Number(product.price)
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: `«${product.name}» no tiene un precio válido` },
        { status: 400 },
      )
    }

    total += price * item.quantity
    lineItems.push({
      id: product.id,
      name: product.name,
      price,
      quantity: item.quantity,
    })
  }

  total = Math.round(total)
  if (total <= 0) {
    return NextResponse.json({ error: 'El total del pedido es inválido' }, { status: 400 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!
  const commerceOrder = `CF-${Date.now()}`

  try {
    const [, payment] = await Promise.all([
      supabase.from('orders').insert({
        external_reference: commerceOrder,
        user_id: user.id,
        user_email: user.email,
        items: lineItems,
        total,
        status: 'pending',
      }),
      createPayment({
        commerceOrder,
        subject: 'Comunidad Fungi — Pedido',
        amount: total,
        email: user.email,
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
