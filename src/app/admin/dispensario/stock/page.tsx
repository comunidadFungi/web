import { Warning } from '@phosphor-icons/react/dist/ssr'

import {
  getBatchStock,
  getDispensedByPrescription,
  getMovements,
  getPatients,
  getPrescriptions,
} from '@/lib/dispensario'
import { daysUntil, formatGrams, formatUnits } from '@/lib/posology'
import {
  BATCH_STATUS_LABELS,
  MOVEMENT_LABELS,
  type BatchStatus,
  type MovementType,
} from '@/types/dispensario'

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
} from '../ui'
import MovementForm from './MovementForm'
import ReverseButton from './ReverseButton'

export const dynamic = 'force-dynamic'

const MOVEMENT_TONE = {
  entrada: 'good',
  devolucion: 'good',
  dispensacion: 'info',
  merma: 'bad',
  ajuste: 'warn',
} as const satisfies Record<MovementType, Tone>

const BATCH_TONE = {
  cultivo: 'neutral',
  secado: 'neutral',
  encapsulado: 'info',
  disponible: 'good',
  agotado: 'warn',
  descartado: 'bad',
} as const satisfies Record<BatchStatus, Tone>

function num(value: number | null | undefined): number {
  return Number(value) || 0
}

/** Los saldos negativos son salidas: se muestran con su signo explícito. */
function signedGrams(value: number): string {
  const n = num(value)
  if (n === 0) return formatGrams(0)
  return `${n > 0 ? '+' : '−'}${formatGrams(Math.abs(n))}`
}

function signedUnits(value: number): string {
  const n = num(value)
  if (n === 0) return formatUnits(0)
  return `${n > 0 ? '+' : '−'}${formatUnits(Math.abs(n))}`
}

function amountClass(value: number): string {
  const n = num(value)
  if (n > 0) return 'text-[#6B8F71] font-medium'
  if (n < 0) return 'text-[#C4513A] font-medium'
  return 'text-[#7A3B1E]'
}

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ paciente?: string; receta?: string }>
}) {
  // Permite llegar desde la ficha de una receta con todo precargado.
  const { paciente, receta } = await searchParams
  const [stock, movements, patients, prescriptions, dispensed] = await Promise.all([
    getBatchStock(),
    getMovements(100),
    getPatients(),
    // Vigentes y no vencidas según la fecha real, no según el estado guardado.
    getPrescriptions({ onlyDispensable: true }),
    getDispensedByPrescription(),
  ])

  const totalGrams = stock.reduce((sum, s) => sum + num(s.grams_balance), 0)
  const withBalance = stock.filter(s => num(s.grams_balance) > 0 || num(s.units_balance) > 0)
  const negatives = stock.filter(s => num(s.grams_balance) < 0 || num(s.units_balance) < 0)
  const unusable = stock.filter(
    s => s.status === 'descartado' || s.status === 'agotado' ||
      (s.expires_at ? daysUntil(s.expires_at) < 0 : false),
  )

  // Solo lo indispensable viaja al cliente: cadenas planas, nunca objetos Date.
  const batchOptions = stock.map(s => ({
    id: s.batch_id,
    label: `${s.code} · ${s.product_name} (${formatGrams(num(s.grams_balance))})`,
  }))

  const patientOptions = patients.map(p => ({
    id: p.id,
    label: p.rut ? `${p.full_name} (${p.rut})` : p.full_name,
  }))

  const prescriptionOptions = prescriptions.map(v => {
    const given = dispensed.get(v.prescription.id) ?? 0
    const remaining = Math.max(0, v.posology.dispensableUnits - given)
    return {
      id: v.prescription.id,
      patientId: v.prescription.patient_id,
      unitSizeG: Number(v.prescription.unit_size_g) || 0,
      remainingUnits: remaining,
      label:
        `${v.prescription.product_name}` +
        (v.prescription.folio ? ` · folio ${v.prescription.folio}` : '') +
        ` · quedan ${formatUnits(remaining)}`,
    }
  })

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle="Saldo por lote y trazabilidad de cada entrada y salida del inventario."
      />

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Stat
          label="Saldo total en gramos"
          value={formatGrams(totalGrams)}
          tone={totalGrams < 0 ? 'bad' : 'neutral'}
        />
        {/*
          No se muestra un total de unidades: sumaría cápsulas de 0,1 g con
          otras de 0,5 g y daría un número que no significa nada. El total en
          gramos sí es comparable; las unidades se ven lote a lote.
        */}
        <Stat
          label="Lotes vencidos o descartados"
          value={String(unusable.length)}
          hint="No cuentan como stock disponible"
          tone={unusable.length > 0 ? 'warn' : 'neutral'}
        />
        <Stat
          label="Lotes con saldo"
          value={String(withBalance.length)}
          hint={`De ${stock.length} lote${stock.length === 1 ? '' : 's'} registrado${stock.length === 1 ? '' : 's'}`}
          tone={withBalance.length === 0 ? 'warn' : 'good'}
        />
      </div>

      {/* Saldo por lote */}
      <div className="mb-8">
        <SectionTitle hint="Suma de todos los movimientos asociados a cada lote de producción.">
          Saldo por lote
        </SectionTitle>

        {negatives.length > 0 && (
          <Card className="mb-4 p-5 border-[#C4513A]/40 bg-[#C4513A]/5 flex items-start gap-3">
            <Warning weight="fill" size={22} className="text-[#C4513A] shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-[#C4513A] text-sm">
                {negatives.length === 1
                  ? 'Hay un lote con saldo negativo'
                  : `Hay ${negatives.length} lotes con saldo negativo`}
              </p>
              <p className="text-xs text-[#7A3B1E] mt-1">
                Un saldo bajo cero indica un error de registro: se descontó más de lo que entró.
                Revisa los movimientos del lote y corrige con un ajuste de inventario.
              </p>
            </div>
          </Card>
        )}

        {stock.length === 0 ? (
          <EmptyState
            message="Todavía no hay lotes de producción cargados."
            actionLabel="Ir a producción"
            actionHref="/admin/dispensario/produccion"
          />
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <Th>Código</Th>
                  <Th>Producto</Th>
                  <Th>Estado</Th>
                  <Th>Vencimiento</Th>
                  <Th align="right">Saldo en gramos</Th>
                  <Th align="right">Saldo en unidades</Th>
                </tr>
              </thead>
              <tbody>
                {stock.map(s => {
                  const isNegative = num(s.grams_balance) < 0 || num(s.units_balance) < 0
                  return (
                    <tr
                      key={s.batch_id}
                      className={`border-b border-[#E8D5B5] last:border-0 transition-colors ${
                        isNegative ? 'bg-[#C4513A]/5 hover:bg-[#C4513A]/10' : 'hover:bg-[#FAF3E5]'
                      }`}
                    >
                      <Td className="font-medium text-[#4A1E0A] whitespace-nowrap">{s.code}</Td>
                      <Td className="text-[#7A3B1E]">{s.product_name}</Td>
                      <Td>
                        <Badge tone={isNegative ? 'bad' : BATCH_TONE[s.status]}>
                          {BATCH_STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </Td>
                      <Td className="text-[#7A3B1E] whitespace-nowrap">
                        {formatDate(s.expires_at)}
                      </Td>
                      <Td
                        align="right"
                        className={
                          isNegative ? 'text-[#C4513A] font-semibold' : 'text-[#4A1E0A] font-semibold'
                        }
                      >
                        {formatGrams(num(s.grams_balance))}
                      </Td>
                      <Td
                        align="right"
                        className={isNegative ? 'text-[#C4513A] font-medium' : 'text-[#7A3B1E]'}
                      >
                        {formatUnits(num(s.units_balance))}
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#F5ECD7] font-semibold text-[#4A1E0A]">
                  <Td>Total</Td>
                  <Td />
                  <Td />
                  <Td />
                  <Td align="right">{formatGrams(totalGrams)}</Td>
                  {/* Sin total de unidades: sumaría cápsulas de distinto tamaño. */}
                  <Td align="right" className="text-[#7A3B1E]">—</Td>
                </tr>
              </tfoot>
            </table>
          </TableWrap>
        )}
      </div>

      {/* Nuevo movimiento */}
      <div className="mb-8">
        <SectionTitle hint="Las cantidades se ingresan en positivo: el signo lo aplica el tipo de movimiento.">
          Registrar movimiento
        </SectionTitle>
        <MovementForm
          batches={batchOptions}
          patients={patientOptions}
          prescriptions={prescriptionOptions}
          initialPatientId={paciente}
          initialPrescriptionId={receta}
        />
      </div>

      {/* Historial */}
      <div>
        <SectionTitle hint="Los últimos 100 movimientos, del más reciente al más antiguo.">
          Últimos movimientos
        </SectionTitle>

        {movements.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-[#7A3B1E]">
              Aún no se ha registrado ningún movimiento de stock.
            </p>
          </Card>
        ) : (
          <TableWrap>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F5ECD7] border-b border-[#E8D5B5]">
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th>Lote</Th>
                  <Th>Paciente</Th>
                  <Th align="right">Gramos</Th>
                  <Th align="right">Unidades</Th>
                  <Th>Nota</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {movements.map(m => (
                  <tr
                    key={m.id}
                    className="border-b border-[#E8D5B5] last:border-0 hover:bg-[#FAF3E5] transition-colors"
                  >
                    <Td className="text-[#4A1E0A] whitespace-nowrap">
                      {formatDate(m.occurred_at)}
                    </Td>
                    <Td>
                      <Badge tone={MOVEMENT_TONE[m.type]}>
                        {MOVEMENT_LABELS[m.type] ?? m.type}
                      </Badge>
                    </Td>
                    <Td className="text-[#7A3B1E] whitespace-nowrap">{m.batch?.code ?? '—'}</Td>
                    <Td className="text-[#7A3B1E]">{m.patient?.full_name ?? '—'}</Td>
                    <Td align="right" className={amountClass(m.grams)}>
                      {signedGrams(m.grams)}
                    </Td>
                    <Td align="right" className={amountClass(m.units)}>
                      {signedUnits(m.units)}
                    </Td>
                    <Td className="text-[#7A3B1E] max-w-xs">{m.notes || '—'}</Td>
                    <Td align="right">
                      <ReverseButton
                        id={m.id}
                        summary={`${MOVEMENT_LABELS[m.type]} · ${signedGrams(m.grams)} · ${
                          m.batch?.code ?? 'sin lote'
                        }${m.patient?.full_name ? ` · ${m.patient.full_name}` : ''}`}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </div>
    </div>
  )
}
