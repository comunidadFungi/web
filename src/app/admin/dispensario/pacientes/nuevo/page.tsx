import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react/dist/ssr'

import PatientEditor from '../PatientEditor'
import { PageHeader } from '../../ui'

export const dynamic = 'force-dynamic'

export default function NuevoPacientePage() {
  return (
    <div>
      <Link
        href="/admin/dispensario/pacientes"
        className="inline-flex items-center gap-1.5 text-sm text-[#7A3B1E] hover:text-[#4A1E0A] transition-colors mb-4"
      >
        <CaretLeft weight="bold" size={14} />
        Volver a pacientes
      </Link>

      <PageHeader
        title="Nuevo paciente"
        subtitle="Registra la ficha para poder asociarle recetas y dispensaciones."
      />

      <div className="max-w-3xl">
        <PatientEditor />
      </div>
    </div>
  )
}
