import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CaretLeft, HandCoins } from '@phosphor-icons/react/dist/ssr'

import {
  getDispensedByPrescription,
  getPatients,
  getPrescribers,
  getPrescription,
} from '@/lib/dispensario'
import { formatUnits } from '@/lib/posology'
import { Card, PageHeader, Stat, formatDate, type Tone } from '../../ui'
import PrescriptionEditor, { type PrescriptionFormState } from '../PrescriptionEditor'

export const dynamic = 'force-dynamic'

/** Los campos numéricos del formulario se manejan como texto. */
function s(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

/**
 * Nombra las unidades con la presentación real de la receta («cápsulas»,
 * «gomitas»), en vez de la abreviatura «u.», que no dice nada.
 */
function makeUnitWord(presentation: string) {
  return (n: number) => (n === 1 ? presentation : `${presentation}s`)
}

export default async function EditarRecetaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [view, patients, prescribers, dispensed] = await Promise.all([
    getPrescription(id),
    getPatients(),
    getPrescribers(),
    getDispensedByPrescription(),
  ])

  if (!view) notFound()

  const p = view.prescription
  const given = dispensed.get(p.id) ?? 0
  const limit = view.posology.dispensableUnits
  const remaining = limit - given

  const initial: PrescriptionFormState = {
    id: p.id,
    patient_id: p.patient_id,
    prescriber_id: s(p.prescriber_id),
    folio: s(p.folio),
    issued_date: s(p.issued_date).slice(0, 10),
    valid_until: s(p.valid_until).slice(0, 10),
    product_name: p.product_name,
    presentation: p.presentation || 'cápsula',
    schedule_type: p.schedule_type,
    unit_size_g: s(p.unit_size_g),
    units_per_intake: s(p.units_per_intake),
    intakes_per_day: s(p.intakes_per_day),
    days_per_week: s(p.days_per_week) || '7',
    cycle_days_on: s(p.cycle_days_on) || '1',
    cycle_days_off: s(p.cycle_days_off) || '1',
    monthly_quota_g: s(p.monthly_quota_g),
    duration_value: s(p.duration_value),
    duration_unit: p.duration_unit,
    declared_total_units: s(p.declared_total_units),
    diagnosis: s(p.diagnosis),
    notes: s(p.notes),
    document_url: s(p.document_url),
    status: p.status,
  }

  const remainingTone: Tone = remaining <= 0 ? 'bad' : remaining < limit * 0.2 ? 'warn' : 'good'

  // Solo tiene sentido ofrecer «Dispensar» si la receta lo permite hoy.
  const canDispense = p.status === 'active' && view.daysToExpiry >= 0 && remaining > 0
  const unitWord = makeUnitWord(p.presentation || 'cápsula')

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
        title={p.patient?.full_name ?? 'Receta'}
        subtitle={`${p.product_name}${p.folio ? ` · Folio ${p.folio}` : ''} · Emitida el ${formatDate(p.issued_date)}`}
        action={
          canDispense ? (
            <Link
              href={`/admin/dispensario/stock?paciente=${p.patient_id}&receta=${p.id}`}
              className="inline-flex items-center gap-2 bg-[#4A1E0A] text-[#F5ECD7] px-5 py-2.5 min-h-[2.75rem] rounded-full font-medium text-sm hover:bg-[#7A3B1E] transition-colors"
            >
              <HandCoins weight="fill" size={18} />
              Dispensar
            </Link>
          ) : undefined
        }
      />

      {/* Avance de dispensación */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat
          label="Autorizado"
          value={`${formatUnits(limit)} ${unitWord(limit)}`}
          hint="Tope de la receta"
        />
        <Stat label="Dispensado" value={`${formatUnits(given)} ${unitWord(given)}`} />
        <Stat
          label="Por dispensar"
          value={`${formatUnits(Math.max(0, remaining))} ${unitWord(remaining)}`}
          tone={remainingTone}
        />
        <Stat
          label="Médico"
          value={p.prescriber?.full_name ?? 'Sin registrar'}
          hint={p.prescriber?.registry_no ? `Reg. ${p.prescriber.registry_no}` : undefined}
        />
      </div>

      {remaining < 0 && (
        <Card className="p-4 mb-6 border-[#C4513A]/40 bg-[#C4513A]/5">
          <p className="text-sm text-[#C4513A] font-medium">
            Se dispensaron {formatUnits(Math.abs(remaining))} unidades por sobre lo autorizado en
            esta receta.
          </p>
        </Card>
      )}

      <PrescriptionEditor
        initial={initial}
        patients={patients.map(x => ({ id: x.id, full_name: x.full_name, rut: x.rut }))}
        prescribers={prescribers.map(x => ({
          id: x.id,
          full_name: x.full_name,
          registry_no: x.registry_no,
        }))}
      />
    </div>
  )
}
