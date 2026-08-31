import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

import BatchEditor from '../BatchEditor'
import { PageHeader } from '../../ui'

export const dynamic = 'force-dynamic'

export default function NuevoLotePage() {
  return (
    <div>
      <Link
        href="/admin/dispensario/produccion"
        className="inline-flex items-center gap-1.5 text-xs text-[#7A3B1E] hover:text-[#4A1E0A] mb-4"
      >
        <ArrowLeft weight="bold" size={13} />
        Volver a producción
      </Link>

      <PageHeader
        title="Nuevo lote"
        subtitle="Trazabilidad del cultivo, secado y encapsulado."
      />

      <BatchEditor />
    </div>
  )
}
