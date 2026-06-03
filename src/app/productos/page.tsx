import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'
import ProductsClient from './ProductsClient'
import type { Product } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProductosPage() {
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
    .eq('active', true)
    .order('category', { ascending: true })

  const allProducts: Product[] = (data ?? []).map(row => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    longDescription: row.long_description,
    price: row.price,
    image: row.image || '',
    images: row.image ? [row.image] : [],
    category: row.category,
    access: row.access,
    stock: row.stock,
    requiresPrescription: row.requires_prescription,
    features: row.features || [],
    variants: row.variants || [],
  }))

  return <ProductsClient allProducts={allProducts} isLoggedIn={isLoggedIn} />
}
