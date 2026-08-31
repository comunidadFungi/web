import Link from 'next/link'
import { UserPlus } from '@phosphor-icons/react/dist/ssr'

import { getPatients, getPrescriptions } from '@/lib/dispensario'
import ListControls, { NoResults, Pagination } from '../ListControls'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  PrimaryLink,
  TableWrap,
  Td,
  Th,
  actionLinkClass,
} from '../ui'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

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

const ESTADO_OPTIONS = [
  { value: 'todos', label: 'Todos los estados' },
  { value: 'activos', label: 'Solo activos' },
  { value: 'inactivos', label: 'Solo inactivos' },
]

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string; pagina?: string }>
}) {
  const { q = '', estado = 'todos', pagina } = await searchParams

  // Una sola consulta de recetas para todos los pacientes: el conteo se agrupa
  // en memoria en vez de disparar una consulta por fila de la tabla.
  const [patients, views] = await Promise.all([getPatients(), getPrescriptions()])

  const activeByPatient = new Map<string, number>()
  for (const v of views) {
    if (v.prescription.status !== 'active' || v.daysToExpiry < 0) continue
    const id = v.prescription.patient_id
    activeByPatient.set(id, (activeByPatient.get(id) ?? 0) + 1)
  }

  const filtered = patients.filter(p => {
    if (estado === 'activos' && !p.active) return false
    if (estado === 'inactivos' && p.active) return false
    return q === '' || matches(q, p.full_name, p.rut)
  })

  // La página se acota a lo que existe: al estrechar la búsqueda desde la
  // página 4 no debe quedar una tabla en blanco.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(Math.max(1, Number(pagina) || 1), totalPages)
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div>
      <PageHeader
        title="Pacientes"
        subtitle={
          patients.length === 1
            ? '1 paciente registrado'
            : `${patients.length} pacientes registrados`
        }
        action={
          <PrimaryLink href="/admin/dispensario/pacientes/nuevo">
            <UserPlus weight="fill" size={18} />
            Nuevo paciente
          </PrimaryLink>
        }
      />

      {patients.length === 0 ? (
        <EmptyState
          message="Aún no hay pacientes registrados."
          actionLabel="Registrar primer paciente"
          actionHref="/admin/dispensario/pacientes/nuevo"
        />
      ) : (
        <>
          <ListControls
            searchLabel="Buscar paciente por nombre o RUT"
            placeholder="Buscar por nombre o RUT…"
            filter={{
              name: 'estado',
              label: 'Filtrar pacientes por estado',
              options: ESTADO_OPTIONS,
              defaultValue: 'todos',
            }}
          />

          {filtered.length === 0 ? (
            <NoResults message="Ningún paciente coincide con la búsqueda." />
          ) : (
            <>
              {/* En el teléfono la tabla obliga a arrastrar el dedo y se pierde
                  de vista de quién es cada fila; aquí va lo esencial apilado. */}
              <ul className="sm:hidden space-y-3">
                {rows.map(p => {
                  const active = activeByPatient.get(p.id) ?? 0

                  return (
                    <li key={p.id}>
                      <Card className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-[#4A1E0A]">{p.full_name}</p>
                            <p className="text-xs text-[#7A3B1E] mt-0.5">
                              {p.rut || 'Sin RUT'}
                            </p>
                          </div>
                          <Badge tone={p.active ? 'good' : 'neutral'}>
                            {p.active ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between gap-3 mt-2">
                          <span className="text-xs text-[#7A3B1E]">
                            {active === 1 ? '1 receta vigente' : `${active} recetas vigentes`}
                          </span>
                          <Link
                            href={`/admin/dispensario/pacientes/${p.id}`}
                            className={actionLinkClass}
                          >
                            Ver ficha
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
                        <Th>Nombre</Th>
                        <Th>RUT</Th>
                        <Th>Contacto</Th>
                        <Th>Ciudad / Comuna</Th>
                        <Th align="center">Recetas vigentes</Th>
                        <Th align="center">Estado</Th>
                        <Th />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(p => {
                        const active = activeByPatient.get(p.id) ?? 0
                        const place = [p.city, p.comuna].filter(Boolean).join(' / ')

                        return (
                          <tr
                            key={p.id}
                            className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                          >
                            <Td className="font-medium text-[#4A1E0A]">{p.full_name}</Td>
                            <Td className="text-[#7A3B1E] whitespace-nowrap">{p.rut || '—'}</Td>
                            <Td className="text-[#7A3B1E]">
                              {p.email || p.phone ? (
                                <>
                                  {p.email && <span className="block">{p.email}</span>}
                                  {p.phone && (
                                    <span className="block text-xs whitespace-nowrap">
                                      {p.phone}
                                    </span>
                                  )}
                                </>
                              ) : (
                                '—'
                              )}
                            </Td>
                            <Td className="text-[#7A3B1E]">{place || '—'}</Td>
                            <Td align="center">
                              <Badge tone={active > 0 ? 'info' : 'neutral'}>{active}</Badge>
                            </Td>
                            <Td align="center">
                              <Badge tone={p.active ? 'good' : 'neutral'}>
                                {p.active ? 'Activo' : 'Inactivo'}
                              </Badge>
                            </Td>
                            <Td align="right">
                              <Link
                                href={`/admin/dispensario/pacientes/${p.id}`}
                                className={`${actionLinkClass} whitespace-nowrap`}
                              >
                                Ver ficha
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
