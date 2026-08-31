import Link from 'next/link'
import { CaretLeft } from '@phosphor-icons/react/dist/ssr'

import { getPatients, getPrescribers } from '@/lib/dispensario'
import { EmptyState, PageHeader } from '../../ui'
import PrescriptionEditor from '../PrescriptionEditor'

export const dynamic = 'force-dynamic'

export default async function NuevaRecetaPage() {
  const [patients, prescribers] = await Promise.all([getPatients(), getPrescribers()])

  return (
    <div>
      <Link
        href="/admin/dispensario/recetas"
        className="inline-flex items-center gap-1 text-sm text-[#7A3B1E] hover:text-[#4A1E0A] mb-4"
      >
        <CaretLeft weight="bold" size={14} />
        Volver a recetas
      </Link>

      <PageHeader
        title="Nueva receta"
        subtitle="Registra la posología tal como aparece en la receta; el consumo se calcula solo."
      />

      {patients.length === 0 ? (
        <EmptyState
          message="Primero necesitas registrar al menos un paciente."
          actionLabel="Crear paciente"
          actionHref="/admin/dispensario/pacientes/nuevo"
        />
      ) : (
        <PrescriptionEditor
          patients={patients.map(p => ({ id: p.id, full_name: p.full_name, rut: p.rut }))}
          prescribers={prescribers.map(p => ({
            id: p.id,
            full_name: p.full_name,
            registry_no: p.registry_no,
          }))}
        />
      )}
    </div>
  )
}
