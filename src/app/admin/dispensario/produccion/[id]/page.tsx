import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

import { getBatchStock, getBatches } from '@/lib/dispensario'
import { formatGrams, formatUnits } from '@/lib/posology'
import BatchEditor from '../BatchEditor'
import { PageHeader, Stat } from '../../ui'

export const dynamic = 'force-dynamic'

export default async function EditarLotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [batches, stock] = await Promise.all([getBatches(), getBatchStock()])
  const batch = batches.find(b => b.id === id)
  if (!batch) notFound()

  const balance = stock.find(s => s.batch_id === batch.id)

  return (
    <div>
      <Link
        href="/admin/dispensario/produccion"
        className="inline-flex items-center gap-1.5 text-xs text-[#7A3B1E] hover:text-[#4A1E0A] mb-4"
      >
        <ArrowLeft weight="bold" size={13} />
        Volver a producción
      </Link>

      <PageHeader title={`Lote ${batch.code}`} subtitle={batch.product_name} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-3xl">
        <Stat
          label="Saldo en stock"
          value={formatGrams(Number(balance?.grams_balance ?? 0))}
          hint={`${formatUnits(Number(balance?.units_balance ?? 0))} unidades`}
          tone={Number(balance?.grams_balance ?? 0) > 0 ? 'good' : 'neutral'}
        />
        <Stat
          label="Gramos secos del lote"
          value={formatGrams(Number(batch.dried_grams || 0))}
          hint={`${formatUnits(Number(batch.encapsulated_units || 0))} unidades encapsuladas`}
        />
      </div>

      <BatchEditor initial={batch} />
    </div>
  )
}
