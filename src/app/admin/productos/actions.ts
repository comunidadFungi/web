'use server'

import { createAdminClient } from '@/lib/supabase-admin'

interface Variant { id: string; label: string; price: number }

interface ProductPayload {
  id?: string
  name: string; slug: string; description: string; long_description: string
  price: number; image: string; category: string; access: string
  stock: number; requires_prescription: boolean; active: boolean
  features: string[]; variants: Variant[]
}

export async function saveProduct(payload: ProductPayload) {
  const supabase = createAdminClient()
  const { id, ...data } = payload
  const body = { ...data, updated_at: new Date().toISOString() }

  const { error } = id
    ? await supabase.from('products').update(body).eq('id', id)
    : await supabase.from('products').insert(body)

  if (error) return { error: error.message }
  return { ok: true }
}

export async function deleteProduct(id: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { error: error.message }
  return { ok: true }
}
