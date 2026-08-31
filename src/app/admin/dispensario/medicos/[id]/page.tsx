import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

import { getPrescribers } from '@/lib/dispensario'
import PrescriberEditor from '../PrescriberEditor'
import { PageHeader } from '../../ui'

export const dynamic = 'force-dynamic'

export default async function EditarMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const prescribers = await getPrescribers()
  const prescriber = prescribers.find(p => p.id === id)
  if (!prescriber) notFound()

  return (
    <div>
      <Link
        href="/admin/dispensario/medicos"
        className="inline-flex items-center gap-1.5 text-xs text-[#7A3B1E] hover:text-[#4A1E0A] mb-4"
      >
        <ArrowLeft weight="bold" size={13} />
        Volver a médicos
      </Link>

      <PageHeader
        title={prescriber.full_name}
        subtitle={
          prescriber.registry_no
            ? `Nº Registro Superintendencia de Salud: ${prescriber.registry_no}`
            : 'Ficha del médico prescriptor.'
        }
      />

      <PrescriberEditor initial={prescriber} />
    </div>
  )
}
