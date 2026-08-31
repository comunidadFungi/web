import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

import PrescriberEditor from '../PrescriberEditor'
import { PageHeader } from '../../ui'

export const dynamic = 'force-dynamic'

export default function NuevoMedicoPage() {
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
        title="Nuevo médico"
        subtitle="Datos del profesional que emite las recetas."
      />

      <PrescriberEditor />
    </div>
  )
}
