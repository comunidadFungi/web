import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  CalendarBlank,
  CaretLeft,
  Envelope,
  IdentificationCard,
  MapPin,
  Note,
  Phone,
} from '@phosphor-icons/react/dist/ssr'

import { getPatient, getPrescriptions } from '@/lib/dispensario'
import { describePosology, formatGrams } from '@/lib/posology'
import PatientEditor from '../PatientEditor'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
  TableWrap,
  Td,
  Th,
  formatDate,
  type Tone,
} from '../../ui'

export const dynamic = 'force-dynamic'

const EXPIRY_TONE = {
  expired: 'bad',
  critical: 'bad',
  warning: 'warn',
  ok: 'good',
} as const satisfies Record<string, Tone>

const EXPIRY_LABEL = {
  expired: 'Vencida',
  critical: 'Por vencer',
  warning: 'Próxima a vencer',
  ok: 'Vigente',
} as const

export default async function PacienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const patient = await getPatient(id)
  if (!patient) notFound()

  const views = await getPrescriptions({ patientId: id })

  const place = [patient.address, patient.comuna, patient.city].filter(Boolean).join(', ')

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
        title={patient.full_name}
        subtitle="Ficha del paciente, recetas asociadas y edición de datos."
        action={
          <Badge tone={patient.active ? 'good' : 'neutral'}>
            {patient.active ? 'Activo' : 'Inactivo'}
          </Badge>
        }
      />

      {/* Datos del paciente */}
      <Card className="p-6 mb-8">
        <SectionTitle>Datos del paciente</SectionTitle>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <DataItem Icon={IdentificationCard} label="RUT" value={patient.rut} />
          <DataItem
            Icon={CalendarBlank}
            label="Fecha de nacimiento"
            value={patient.birth_date ? formatDate(patient.birth_date) : null}
          />
          <DataItem Icon={Envelope} label="Email" value={patient.email} />
          <DataItem Icon={Phone} label="Teléfono" value={patient.phone} />
          <DataItem Icon={MapPin} label="Dirección" value={place || null} />
          <DataItem Icon={Note} label="Notas" value={patient.notes} />
        </dl>
      </Card>

      {/* Recetas del paciente */}
      <div className="mb-8">
        <SectionTitle
          hint={
            views.length === 1
              ? '1 receta registrada para este paciente.'
              : `${views.length} recetas registradas para este paciente.`
          }
        >
          Recetas del paciente
        </SectionTitle>

        {views.length === 0 ? (
          <EmptyState
            message="Este paciente todavía no tiene recetas cargadas."
            actionLabel="Registrar receta"
            actionHref="/admin/dispensario/recetas/nueva"
          />
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <Th>Producto</Th>
                  <Th>Folio</Th>
                  <Th>Posología</Th>
                  <Th align="right">Consumo mensual</Th>
                  <Th>Vencimiento</Th>
                  <Th align="center">Estado</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {views.map(({ prescription, posology, expiresOn, expiry }) => (
                  <tr
                    key={prescription.id}
                    className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                  >
                    <Td className="font-medium text-[#4A1E0A]">{prescription.product_name}</Td>
                    <Td className="text-[#7A3B1E] whitespace-nowrap">
                      {prescription.folio || '—'}
                    </Td>
                    <Td className="text-[#7A3B1E] min-w-[16rem]">
                      {describePosology(prescription, prescription.presentation)}
                    </Td>
                    <Td align="right" className="font-semibold text-[#4A1E0A] whitespace-nowrap">
                      {formatGrams(posology.gramsPerMonth)}
                    </Td>
                    <Td className="text-[#4A1E0A] whitespace-nowrap">{formatDate(expiresOn)}</Td>
                    <Td align="center">
                      <Badge tone={EXPIRY_TONE[expiry]}>{EXPIRY_LABEL[expiry]}</Badge>
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/dispensario/recetas/${prescription.id}`}
                        className="text-xs text-[#C8923A] hover:underline font-medium whitespace-nowrap"
                      >
                        Ver receta
                      </Link>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>

      <div className="max-w-3xl">
        <PatientEditor initial={patient} />
      </div>
    </div>
  )
}

function DataItem({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size?: number; className?: string; weight?: 'fill' }>
  label: string
  value: string | null | undefined
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={16} weight="fill" className="text-[#C8923A] shrink-0 mt-0.5" />
      <div className="min-w-0">
        <dt className="text-xs text-[#7A3B1E]">{label}</dt>
        <dd className="text-sm text-[#4A1E0A] break-words">{value || '—'}</dd>
      </div>
    </div>
  )
}
