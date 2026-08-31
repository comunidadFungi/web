import Link from 'next/link'
import { Warning, Package, Users, Prescription as RxIcon } from '@phosphor-icons/react/dist/ssr'

import { getDispensarioSummary } from '@/lib/dispensario'
import { formatGrams, formatUnits } from '@/lib/posology'
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
  Stat,
  TableWrap,
  Td,
  Th,
  formatDate,
  type Tone,
} from './ui'
import InstallPrompt from './InstallPrompt'
import PushToggle from './PushToggle'

export const dynamic = 'force-dynamic'

const EXPIRY_TONE = {
  expired: 'bad',
  critical: 'bad',
  warning: 'warn',
  ok: 'good',
} as const satisfies Record<string, Tone>

function expiryText(days: number): string {
  if (days < 0) return `Vencida hace ${Math.abs(days)} d`
  if (days === 0) return 'Vence hoy'
  if (days === 1) return 'Vence mañana'
  return `Vence en ${days} días`
}

/** «Alcanza para» en lenguaje llano, no como una fórmula. */
function coverageText(months: number | null): string {
  if (months === null) return 'Sin demanda'
  if (months <= 0) return 'Sin stock'
  if (months < 1) return `${Math.round(months * 30)} días`
  if (months < 2) return '1 mes'
  return `${months.toLocaleString('es-CL', { maximumFractionDigits: 1 })} meses`
}

function coverageTone(months: number | null): Tone {
  if (months === null) return 'neutral'
  if (months < 1) return 'bad'
  if (months < 3) return 'warn'
  return 'good'
}

export default async function DispensarioDashboard() {
  const s = await getDispensarioSummary()
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

  // El indicador general se toma del producto peor cubierto, no del promedio:
  // un excedente de un producto no compensa la falta de otro.
  const worst = s.byProduct.reduce<number | null>((min, p) => {
    if (p.monthsOfCoverage === null) return min
    return min === null ? p.monthsOfCoverage : Math.min(min, p.monthsOfCoverage)
  }, null)

  const shortest = s.byProduct.find(p => p.monthsOfCoverage === worst)

  return (
    <div>
      <InstallPrompt />

      <PageHeader
        title="Dispensario"
        subtitle="Requerimiento de producción, stock y vigencia de recetas."
      />

      {vapidPublicKey && <PushToggle vapidPublicKey={vapidPublicKey} />}

      {/* Resumen */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Stat label="Pacientes con receta vigente" value={String(s.activePatients)} />
        <Stat label="Recetas vigentes" value={String(s.activePrescriptions)} />
        <Stat
          label="Demanda mensual"
          value={formatGrams(s.totalGramsPerMonth)}
          hint={`${formatGrams(s.totalGramsPerDay)} al día · ${formatGrams(s.totalGramsPerWeek)} por semana`}
          tone="info"
        />
        <Stat
          label="Stock utilizable"
          value={formatGrams(s.stockGrams)}
          hint="Excluye lotes vencidos y descartados"
        />
        <Stat
          label="El stock más justo"
          value={coverageText(worst)}
          hint={shortest ? shortest.productName : 'Sin recetas vigentes'}
          tone={coverageTone(worst)}
        />
      </div>

      {/* Alertas de vencimiento */}
      <div className="mb-8">
        <SectionTitle hint="Recetas vigentes que vencen dentro de 30 días o ya vencieron.">
          Alertas de vencimiento
        </SectionTitle>

        {s.expiring.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#7A3B1E]">
              Ninguna receta vence en los próximos 30 días.
            </p>
          </Card>
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <Th>Paciente</Th>
                  <Th>Producto</Th>
                  <Th>Folio</Th>
                  <Th>Vence</Th>
                  <Th>Estado</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {s.expiring.map(v => (
                  <tr
                    key={v.prescription.id}
                    className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                  >
                    <Td className="font-medium text-[#4A1E0A]">
                      {v.prescription.patient?.full_name ?? '—'}
                      <span className="block text-xs text-[#7A3B1E] font-normal">
                        {v.prescription.patient?.rut ?? ''}
                      </span>
                    </Td>
                    <Td className="text-[#7A3B1E]">{v.prescription.product_name}</Td>
                    <Td className="text-[#7A3B1E]">{v.prescription.folio || '—'}</Td>
                    <Td className="text-[#4A1E0A] whitespace-nowrap">
                      {formatDate(v.expiresOn)}
                    </Td>
                    <Td>
                      <Badge tone={EXPIRY_TONE[v.expiry]}>{expiryText(v.daysToExpiry)}</Badge>
                    </Td>
                    <Td align="right">
                      <Link
                        href={`/admin/dispensario/recetas/${v.prescription.id}`}
                        className="text-xs text-[#C8923A] hover:underline font-medium"
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

      {/* Requerimiento por producto */}
      <div className="mb-8">
        <SectionTitle hint="Cuánto debe producir el dispensario para cubrir las recetas vigentes.">
          Requerimiento de producción por producto
        </SectionTitle>

        {s.byProduct.length === 0 ? (
          <EmptyState
            message="Aún no hay recetas vigentes cargadas."
            actionLabel="Registrar primera receta"
            actionHref="/admin/dispensario/recetas/nueva"
          />
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <Th>Producto</Th>
                  <Th align="center">Pacientes</Th>
                  <Th align="right">Diario</Th>
                  <Th align="right">Semanal</Th>
                  <Th align="right">Mensual</Th>
                  <Th align="right">Stock</Th>
                  <Th align="center">Alcanza para</Th>
                </tr>
              </thead>
              <tbody>
                {s.byProduct.map(p => (
                  <tr
                    key={p.productName}
                    className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                  >
                    <Td className="font-medium text-[#4A1E0A]">
                      {p.productName}
                      <span className="block text-xs text-[#7A3B1E] font-normal">
                        {p.prescriptions} receta{p.prescriptions === 1 ? '' : 's'} ·{' '}
                        {formatUnits(p.unitsPerMonth)} unidades/mes
                      </span>
                    </Td>
                    <Td align="center" className="text-[#7A3B1E]">{p.patients}</Td>
                    <Td align="right" className="text-[#7A3B1E]">{formatGrams(p.gramsPerDay)}</Td>
                    <Td align="right" className="text-[#7A3B1E]">{formatGrams(p.gramsPerWeek)}</Td>
                    <Td align="right" className="font-semibold text-[#4A1E0A]">
                      {formatGrams(p.gramsPerMonth)}
                    </Td>
                    <Td align="right" className="text-[#7A3B1E]">{formatGrams(p.stockGrams)}</Td>
                    <Td align="center">
                      <Badge tone={coverageTone(p.monthsOfCoverage)}>
                        {coverageText(p.monthsOfCoverage)}
                      </Badge>
                    </Td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#F5ECD7] font-semibold text-[#4A1E0A]">
                  <Td>Total</Td>
                  <Td align="center">{s.activePatients}</Td>
                  <Td align="right">{formatGrams(s.totalGramsPerDay)}</Td>
                  <Td align="right">{formatGrams(s.totalGramsPerWeek)}</Td>
                  <Td align="right">{formatGrams(s.totalGramsPerMonth)}</Td>
                  <Td align="right">{formatGrams(s.stockGrams)}</Td>
                  <Td />
                </tr>
              </tfoot>
            </table>
          </TableWrap>
        )}
      </div>

      {/* Accesos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <QuickLink
          href="/admin/dispensario/recetas/nueva"
          Icon={RxIcon}
          title="Nueva receta"
          hint="Cargar posología y calcular consumo"
        />
        <QuickLink
          href="/admin/dispensario/pacientes/nuevo"
          Icon={Users}
          title="Nuevo paciente"
          hint="Registrar ficha del paciente"
        />
        <QuickLink
          href="/admin/dispensario/produccion"
          Icon={Package}
          title="Producción"
          hint="Lotes, secado y encapsulado"
        />
      </div>

      {shortest && worst !== null && worst < 1 && (
        <Card className="mt-6 p-5 border-[#C4513A]/40 bg-[#C4513A]/5 flex items-start gap-3">
          <Warning weight="fill" size={22} className="text-[#C4513A] shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[#A33625] text-sm">
              Falta producir {shortest.productName}
            </p>
            <p className="text-xs text-[#7A3B1E] mt-1">
              Quedan {formatGrams(shortest.stockGrams)} y se consumen{' '}
              {formatGrams(shortest.gramsPerMonth)} al mes entre {shortest.patients} paciente
              {shortest.patients === 1 ? '' : 's'}: alcanza para {coverageText(worst)}. Para cubrir
              los próximos tres meses harían falta{' '}
              {formatGrams(Math.max(0, shortest.gramsPerMonth * 3 - shortest.stockGrams))} más.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

function QuickLink({
  href,
  Icon,
  title,
  hint,
}: {
  href: string
  Icon: React.ComponentType<{ weight?: 'fill'; size?: number; className?: string }>
  title: string
  hint: string
}) {
  return (
    <Link
      href={href}
      className="bg-[#4A1E0A] text-[#F5ECD7] rounded-2xl p-5 flex items-center gap-3 hover:bg-[#7A3B1E] transition-colors"
    >
      <Icon weight="fill" size={22} className="text-[#C8923A]" />
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-white/60">{hint}</p>
      </div>
    </Link>
  )
}
