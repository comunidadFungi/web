import Link from 'next/link'
import { Prescription as RxIcon, Warning } from '@phosphor-icons/react/dist/ssr'

import { getDispensedByPrescription, getPrescriptions } from '@/lib/dispensario'
import { describePosology, formatGrams, formatUnits } from '@/lib/posology'
import { STATUS_LABELS, type PrescriptionStatus } from '@/types/dispensario'
import ListControls, { NoResults, Pagination } from '../ListControls'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PrimaryLink,
  Stat,
  TableWrap,
  Td,
  Th,
  actionLinkClass,
  formatDate,
  type Tone,
} from '../ui'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

const EXPIRY_TONE = {
  expired: 'bad',
  critical: 'bad',
  warning: 'warn',
  ok: 'good',
} as const satisfies Record<string, Tone>

const STATUS_TONE: Record<PrescriptionStatus, Tone> = {
  active: 'good',
  completed: 'neutral',
  expired: 'bad',
  cancelled: 'neutral',
}

/**
 * El listado mezclaba vigentes, vencidas, completadas y anuladas sin poder
 * separarlas. Por omisión se muestran solo las vigentes, que es lo que se
 * consulta a diario; el resto sigue a un clic.
 */
const DEFAULT_STATUS: PrescriptionStatus = 'active'
const ALL = 'todas'

const ESTADO_OPTIONS = [
  { value: ALL, label: 'Todas las recetas' },
  ...(Object.keys(STATUS_LABELS) as PrescriptionStatus[]).map(status => ({
    value: status,
    label: `Solo ${STATUS_LABELS[status].toLowerCase()}s`,
  })),
]

/**
 * Comparación tolerante: minúsculas, sin tildes y con el RUT también sin
 * puntos ni guion, para que «muñoz» encuentre a «Muñoz» y «12345678»
 * encuentre a «12.345.678-9». Cada palabra tecleada debe aparecer.
 */
function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const normalize = (value: string) =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const text = normalize(fields.filter(Boolean).join(' '))
  const bare = text.replace(/[.\-]/g, '')

  return normalize(query)
    .split(/\s+/)
    .filter(Boolean)
    .every(term => text.includes(term) || bare.includes(term.replace(/[.\-]/g, '')))
}

function expiryText(days: number): string {
  if (days < 0) return `Vencida hace ${Math.abs(days)} d`
  if (days === 0) return 'Vence hoy'
  return `${days} d`
}

export default async function RecetasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; pagina?: string }>
}) {
  const { q = '', estado: rawEstado, pagina } = await searchParams

  const estado: PrescriptionStatus | typeof ALL =
    rawEstado === ALL || (rawEstado != null && rawEstado in STATUS_LABELS)
      ? (rawEstado as PrescriptionStatus | typeof ALL)
      : DEFAULT_STATUS

  const [views, dispensed] = await Promise.all([
    getPrescriptions(),
    getDispensedByPrescription(),
  ])

  // Las tarjetas siguen contando sobre el total, no sobre lo filtrado: son el
  // panorama del dispensario, no un resumen de la búsqueda en curso.
  const active = views.filter(v => v.prescription.status === 'active' && v.daysToExpiry >= 0)
  const totalMonthly = active.reduce((sum, v) => sum + v.posology.gramsPerMonth, 0)
  const mismatches = views.filter(v => v.posology.declaredMismatch).length

  const filtered = views.filter(v => {
    const p = v.prescription
    if (estado !== ALL && p.status !== estado) return false
    return q === '' || matches(q, p.patient?.full_name, p.patient?.rut, p.folio)
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pagina) || 1), totalPages)
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const scopeNote =
    estado === ALL
      ? `${active.length} vigentes`
      : `mostrando solo las ${STATUS_LABELS[estado].toLowerCase()}s`

  return (
    <div>
      <PageHeader
        title="Recetas"
        subtitle={`${views.length} registradas · ${scopeNote}`}
        action={
          <PrimaryLink href="/admin/dispensario/recetas/nueva">
            <RxIcon weight="fill" size={18} />
            Nueva receta
          </PrimaryLink>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Recetas vigentes" value={String(active.length)} />
        <Stat label="Demanda mensual" value={formatGrams(totalMonthly)} tone="info" />
        <Stat
          label="Vencen en 30 días"
          value={String(active.filter(v => v.daysToExpiry <= 30).length)}
          tone={active.some(v => v.daysToExpiry <= 30) ? 'warn' : 'neutral'}
        />
        <Stat
          label="Con discrepancia"
          value={String(mismatches)}
          hint="Total declarado ≠ calculado"
          tone={mismatches > 0 ? 'warn' : 'neutral'}
        />
      </div>

      {views.length === 0 ? (
        <EmptyState
          message="Todavía no hay recetas registradas."
          actionLabel="Registrar primera receta"
          actionHref="/admin/dispensario/recetas/nueva"
        />
      ) : (
        <>
          <ListControls
            searchLabel="Buscar receta por paciente, RUT o folio"
            placeholder="Buscar por paciente, RUT o folio…"
            filter={{
              name: 'estado',
              label: 'Filtrar recetas por estado',
              options: ESTADO_OPTIONS,
              defaultValue: DEFAULT_STATUS,
            }}
          />

          {filtered.length === 0 ? (
            <NoResults message="Ninguna receta coincide con la búsqueda y el estado elegidos." />
          ) : (
            <>
              {/* En el teléfono la tabla obliga a arrastrar el dedo y se pierde
                  de vista de quién es cada fila; aquí va lo esencial apilado. */}
              <ul className="sm:hidden space-y-3">
                {rows.map(v => {
                  const p = v.prescription

                  return (
                    <li key={p.id}>
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-[#4A1E0A]">
                              {p.patient?.full_name ?? '—'}
                            </p>
                            <p className="text-xs text-[#7A3B1E] mt-0.5">
                              {p.patient?.rut ?? ''}
                              {p.folio ? ` · Folio ${p.folio}` : ''}
                            </p>
                          </div>
                          <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                        </div>

                        <p className="text-sm text-[#4A1E0A] mt-2">{p.product_name}</p>
                        <p className="text-xs text-[#7A3B1E] mt-0.5 leading-snug">
                          {describePosology(p, p.presentation)}
                        </p>

                        <div className="flex items-center justify-between gap-3 mt-3">
                          <span className="text-xs text-[#7A3B1E]">
                            Vence {formatDate(v.expiresOn)}
                            {p.status === 'active' && ` · ${expiryText(v.daysToExpiry)}`}
                          </span>
                          <Link
                            href={`/admin/dispensario/recetas/${p.id}`}
                            className={actionLinkClass}
                          >
                            Ver / editar
                          </Link>
                        </div>
                      </Card>
                    </li>
                  )
                })}
              </ul>

              <div className="hidden sm:block">
                <TableWrap>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                        <Th>Paciente</Th>
                        <Th>Producto y posología</Th>
                        <Th align="right">Mensual</Th>
                        <Th align="right">Dispensado</Th>
                        <Th>Vence</Th>
                        <Th align="center">Estado</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(v => {
                        const p = v.prescription
                        const given = dispensed.get(p.id) ?? 0
                        const limit = v.posology.dispensableUnits

                        return (
                          <tr
                            key={p.id}
                            className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors align-top"
                          >
                            <Td className="font-medium text-[#4A1E0A] whitespace-nowrap">
                              {p.patient?.full_name ?? '—'}
                              <span className="block text-xs text-[#7A3B1E] font-normal">
                                {p.patient?.rut ?? ''}
                                {p.folio ? ` · Folio ${p.folio}` : ''}
                              </span>
                            </Td>

                            <Td className="text-[#4A1E0A] max-w-sm">
                              {p.product_name}
                              <span className="block text-xs text-[#7A3B1E] mt-0.5 leading-snug">
                                {describePosology(p, p.presentation)}
                              </span>
                              {v.posology.declaredMismatch && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-[#C8923A] mt-1">
                                  <Warning weight="fill" size={12} />
                                  Declaradas {formatUnits(v.posology.declaredTotalUnits ?? 0)} vs{' '}
                                  {formatUnits(v.posology.unitsTotal)} calculadas
                                </span>
                              )}
                            </Td>

                            <Td
                              align="right"
                              className="text-[#4A1E0A] font-medium whitespace-nowrap"
                            >
                              {formatGrams(v.posology.gramsPerMonth)}
                            </Td>

                            <Td align="right" className="text-[#7A3B1E] whitespace-nowrap">
                              {formatUnits(given)} / {formatUnits(limit)}
                              <span className="block text-[11px] text-[#7A3B1E]/70">unidades</span>
                            </Td>

                            <Td className="whitespace-nowrap">
                              <span className="block text-[#4A1E0A]">
                                {formatDate(v.expiresOn)}
                              </span>
                              {p.status === 'active' && (
                                <Badge tone={EXPIRY_TONE[v.expiry]}>
                                  {expiryText(v.daysToExpiry)}
                                </Badge>
                              )}
                            </Td>

                            <Td align="center">
                              <Badge tone={STATUS_TONE[p.status]}>{STATUS_LABELS[p.status]}</Badge>
                            </Td>

                            <Td align="right">
                              <Link
                                href={`/admin/dispensario/recetas/${p.id}`}
                                className={`${actionLinkClass} whitespace-nowrap`}
                              >
                                Ver / editar
                              </Link>
                            </Td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              </div>

              <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} />
            </>
          )}
        </>
      )}
    </div>
  )
}
