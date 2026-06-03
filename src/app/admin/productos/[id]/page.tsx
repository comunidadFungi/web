import { createClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import ProductoEditor from '../ProductoEditor'

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('*').eq('id', id).single()

  if (!data) notFound()

  const initial = {
    ...data,
    features: Array.isArray(data.features) ? data.features.join('\n') : '',
    variants: data.variants ?? [],
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[#4A1E0A] mb-8">Editar producto</h1>
      <ProductoEditor initial={initial} />
    </div>
  )
}
