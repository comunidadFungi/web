import { products } from '@/lib/products'
import ProductsClient from './ProductsClient'
import { createClient } from '@/lib/supabase-server'

export default async function ProductosPage() {
  let isLoggedIn = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isLoggedIn = !!user
  } catch {}

  return <ProductsClient allProducts={products} isLoggedIn={isLoggedIn} />
}
