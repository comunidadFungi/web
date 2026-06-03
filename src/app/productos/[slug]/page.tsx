import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import ProductDetail from './ProductDetail'
import type { Product } from '@/types'

export const dynamic = 'force-dynamic'

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    description: row.description as string,
    longDescription: row.long_description as string | undefined,
    price: row.price as number,
    image: (row.image as string) || '',
    images: row.image ? [row.image as string] : [],
    category: row.category as string,
    access: row.access as 'public' | 'members',
    stock: row.stock as number,
    requiresPrescription: row.requires_prescription as boolean,
    features: (row.features as string[]) || [],
    variants: (row.variants as Product['variants']) || [],
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase.from('products').select('name, description').eq('slug', slug).single()
  if (!data) return {}
  return {
    title: `${data.name} | Comunidad Fungi`,
    description: data.description,
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  // Obtener sesión del usuario
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {}

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single()

  if (!data) notFound()

  // Bloquear productos de miembros a usuarios no autenticados
  if (data.access === 'members' && !isLoggedIn) notFound()

  return <ProductDetail product={mapProduct(data)} />
}
