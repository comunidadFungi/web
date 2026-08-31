import Link from 'next/link'
import { PencilSimple, PlusCircle } from '@phosphor-icons/react/dist/ssr'

import { getPrescribers } from '@/lib/dispensario'
import ListControls, { NoResults } from '../ListControls'
import {
  Badge,
  EmptyState,
  PageHeader,
  PrimaryLink,
  TableWrap,
  Td,
  Th,
  actionLinkClass,
} from '../ui'

export const dynamic = 'force-dynamic'

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

export default async function MedicosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = '' } = await searchParams

  const prescribers = await getPrescribers()
  const rows = prescribers.filter(
    p => q === '' || matches(q, p.full_name, p.rut, p.registry_no),
  )

  return (
    <div>
      <PageHeader
        title="Médicos"
        subtitle={
          prescribers.length === 1
            ? '1 médico prescriptor registrado'
            : `${prescribers.length} médicos prescriptores registrados`
        }
        action={
          <PrimaryLink href="/admin/dispensario/medicos/nuevo">
            <PlusCircle weight="fill" size={18} />
            Nuevo médico
          </PrimaryLink>
        }
      />

      {prescribers.length === 0 ? (
        <EmptyState
          message="Aún no hay médicos prescriptores registrados."
          actionLabel="Registrar primer médico"
          actionHref="/admin/dispensario/medicos/nuevo"
        />
      ) : (
        <>
          <ListControls
            searchLabel="Buscar médico por nombre, RUT o número de registro"
            placeholder="Buscar por nombre, RUT o nº de registro…"
          />

          {rows.length === 0 ? (
            <NoResults message="Ningún médico coincide con la búsqueda." />
          ) : (
            <TableWrap>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                    <Th>Nombre</Th>
                    <Th>RUT</Th>
                    <Th>Nº registro</Th>
                    <Th>Especialidad</Th>
                    <Th>Contacto</Th>
                    <Th align="center">Estado</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(p => (
                    <tr
                      key={p.id}
                      className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                    >
                      <Td className="font-medium text-[#4A1E0A]">{p.full_name}</Td>
                      <Td className="text-[#7A3B1E]">{p.rut || '—'}</Td>
                      <Td className="text-[#7A3B1E]">{p.registry_no || '—'}</Td>
                      <Td className="text-[#7A3B1E]">{p.specialty || '—'}</Td>
                      <Td className="text-[#7A3B1E]">
                        {p.email || p.phone ? (
                          <>
                            {p.email && <span className="block">{p.email}</span>}
                            {p.phone && <span className="block text-xs">{p.phone}</span>}
                          </>
                        ) : (
                          '—'
                        )}
                      </Td>
                      <Td align="center">
                        <Badge tone={p.active ? 'good' : 'neutral'}>
                          {p.active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Td>
                      <Td align="right">
                        <Link
                          href={`/admin/dispensario/medicos/${p.id}`}
                          className={`${actionLinkClass} gap-1.5`}
                        >
                          <PencilSimple weight="bold" size={13} />
                          Editar
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </>
      )}
    </div>
  )
}
