import Link from 'next/link'
import { PencilSimple, PlusCircle } from '@phosphor-icons/react/dist/ssr'

import { getBatchStock, getBatches } from '@/lib/dispensario'
import { daysUntil, formatGrams, formatUnits } from '@/lib/posology'
import { BATCH_STATUS_LABELS, type BatchStatus } from '@/types/dispensario'
import ListControls, { NoResults } from '../ListControls'
import {
  Badge,
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

const STATUS_TONE = {
  cultivo: 'info',
  secado: 'warn',
  encapsulado: 'warn',
  disponible: 'good',
  agotado: 'neutral',
  descartado: 'bad',
} as const satisfies Record<BatchStatus, Tone>

const ALL = 'todos'

const ESTADO_OPTIONS = [
  { value: ALL, label: 'Todos los estados' },
  ...(Object.keys(BATCH_STATUS_LABELS) as BatchStatus[]).map(status => ({
    value: status,
    label: BATCH_STATUS_LABELS[status],
  })),
]

/**
 * Comparación tolerante: minúsculas y sin tildes, para que «cordyceps»
 * encuentre a «Cordyceps». Cada palabra tecleada debe aparecer.
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

/** Vencido en rojo; a 30 días o menos, aviso. */
function expiryBadge(expiresAt: string | null) {
  if (!expiresAt) return <span className="text-[#7A3B1E]">—</span>

  const days = daysUntil(expiresAt)
  const label = formatDate(expiresAt)

  if (days < 0) {
    return <Badge tone="bad">{label} · vencido</Badge>
  }
  if (days <= 30) {
    return (
      <Badge tone="warn">
        {label} · {days === 0 ? 'vence hoy' : days === 1 ? 'vence mañana' : `${days} días`}
      </Badge>
    )
  }
  return <span className="text-[#4A1E0A] whitespace-nowrap">{label}</span>
}

export default async function ProduccionPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; estado?: string }>
}) {
  const { q = '', estado = ALL } = await searchParams

  const [batches, stock] = await Promise.all([getBatches(), getBatchStock()])

  const stockByBatch = new Map(stock.map(s => [s.batch_id, s]))

  const totalDriedGrams = batches.reduce((sum, b) => sum + Number(b.dried_grams || 0), 0)
  const totalStockGrams = stock.reduce((sum, s) => sum + Number(s.grams_balance || 0), 0)

  const rows = batches.filter(b => {
    if (estado !== ALL && b.status !== estado) return false
    return q === '' || matches(q, b.code, b.product_name, b.species)
  })

  return (
    <div>
      <PageHeader
        title="Producción"
        subtitle="Lotes de cultivo, secado y encapsulado."
        action={
          <PrimaryLink href="/admin/dispensario/produccion/nuevo">
            <PlusCircle weight="fill" size={18} />
            Nuevo lote
          </PrimaryLink>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Lotes registrados" value={String(batches.length)} />
        <Stat
          label="Gramos secos producidos"
          value={formatGrams(totalDriedGrams)}
          hint="Suma de todos los lotes"
        />
        <Stat
          label="Saldo en stock"
          value={formatGrams(totalStockGrams)}
          hint="Según los movimientos registrados"
          tone={totalStockGrams > 0 ? 'good' : 'neutral'}
        />
      </div>

      {batches.length === 0 ? (
        <EmptyState
          message="Aún no hay lotes de producción registrados."
          actionLabel="Registrar primer lote"
          actionHref="/admin/dispensario/produccion/nuevo"
        />
      ) : (
        <>
          <ListControls
            searchLabel="Buscar lote por código o producto"
            placeholder="Buscar por código de lote o producto…"
            filter={{
              name: 'estado',
              label: 'Filtrar lotes por estado',
              options: ESTADO_OPTIONS,
              defaultValue: ALL,
            }}
          />

          {rows.length === 0 ? (
            <NoResults message="Ningún lote coincide con la búsqueda y el estado elegidos." />
          ) : (
            <TableWrap>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                    <Th>Código de lote</Th>
                    <Th>Producto</Th>
                    <Th>Especie</Th>
                    <Th>Cosecha</Th>
                    <Th align="right">Gramos secos</Th>
                    <Th align="right">Unidades encapsuladas</Th>
                    <Th align="right">Saldo en stock</Th>
                    <Th>Vencimiento</Th>
                    <Th align="center">Estado</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(b => {
                    const s = stockByBatch.get(b.id)
                    return (
                      <tr
                        key={b.id}
                        className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                      >
                        <Td className="font-medium text-[#4A1E0A] whitespace-nowrap">{b.code}</Td>
                        <Td className="text-[#4A1E0A]">{b.product_name}</Td>
                        <Td className="text-[#7A3B1E] italic">{b.species || '—'}</Td>
                        <Td className="text-[#7A3B1E] whitespace-nowrap">
                          {formatDate(b.harvested_at)}
                        </Td>
                        <Td align="right" className="text-[#7A3B1E]">
                          {formatGrams(Number(b.dried_grams || 0))}
                        </Td>
                        <Td align="right" className="text-[#7A3B1E]">
                          {formatUnits(Number(b.encapsulated_units || 0))}
                        </Td>
                        <Td align="right" className="text-[#4A1E0A] font-semibold whitespace-nowrap">
                          {s ? (
                            <>
                              {formatGrams(Number(s.grams_balance || 0))}
                              <span className="block text-xs font-normal text-[#7A3B1E]">
                                {formatUnits(Number(s.units_balance || 0))} unidades
                              </span>
                            </>
                          ) : (
                            <span className="font-normal text-[#7A3B1E]">Sin movimientos</span>
                          )}
                        </Td>
                        <Td>{expiryBadge(b.expires_at)}</Td>
                        <Td align="center">
                          <Badge tone={STATUS_TONE[b.status]}>{BATCH_STATUS_LABELS[b.status]}</Badge>
                        </Td>
                        <Td align="right">
                          <Link
                            href={`/admin/dispensario/produccion/${b.id}`}
                            className={`${actionLinkClass} gap-1.5`}
                          >
                            <PencilSimple weight="bold" size={13} />
                            Editar
                          </Link>
                        </Td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </TableWrap>
          )}
        </>
      )}
    </div>
  )
}
