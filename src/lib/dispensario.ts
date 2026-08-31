import { createAdminClient } from '@/lib/supabase-admin'
import {
  calcPosology,
  daysUntil,
  effectiveExpiry,
  expiryLevel,
  type ExpiryLevel,
  type PosologyResult,
} from '@/lib/posology'
import type {
  BatchStock,
  Patient,
  Prescriber,
  PrescriptionWithRelations,
  ProductionBatch,
  StockMovement,
} from '@/types/dispensario'

const PRESCRIPTION_SELECT = `
  *,
  patient:patients ( id, full_name, rut, email, phone ),
  prescriber:prescribers ( id, full_name, registry_no )
`

/** Una receta junto con su consumo calculado y su estado de vigencia. */
export interface PrescriptionView {
  prescription: PrescriptionWithRelations
  posology: PosologyResult
  expiresOn: Date
  daysToExpiry: number
  expiry: ExpiryLevel
}

function toView(p: PrescriptionWithRelations): PrescriptionView {
  const posology = calcPosology(p)
  const expiresOn = effectiveExpiry(p.valid_until, p.issued_date, p)
  const daysToExpiry = daysUntil(expiresOn)

  return {
    prescription: p,
    posology,
    expiresOn,
    daysToExpiry,
    expiry: expiryLevel(daysToExpiry),
  }
}

export async function getPrescriptions(options?: {
  patientId?: string
  /** Solo las marcadas como vigentes, incluidas las que ya pasaron su fecha. */
  onlyActive?: boolean
  /**
   * Solo aquellas contra las que se puede dispensar hoy: vigentes y no
   * vencidas según la fecha real, sin depender de que el cron haya corrido.
   */
  onlyDispensable?: boolean
}): Promise<PrescriptionView[]> {
  const supabase = createAdminClient()
  let query = supabase
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .order('issued_date', { ascending: false })

  if (options?.patientId) query = query.eq('patient_id', options.patientId)
  if (options?.onlyActive || options?.onlyDispensable) query = query.eq('status', 'active')

  const { data } = await query
  const views = ((data ?? []) as unknown as PrescriptionWithRelations[]).map(toView)

  // El estado guardado es una caché que actualiza el cron; la fecha es la
  // fuente de verdad. Sin esto se ofrecían recetas vencidas para dispensar.
  return options?.onlyDispensable ? views.filter(v => v.daysToExpiry >= 0) : views
}

export async function getPrescription(id: string): Promise<PrescriptionView | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('prescriptions')
    .select(PRESCRIPTION_SELECT)
    .eq('id', id)
    .maybeSingle()

  return data ? toView(data as unknown as PrescriptionWithRelations) : null
}

export async function getPatients(): Promise<Patient[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('patients')
    .select('*')
    .order('full_name', { ascending: true })
  return (data ?? []) as Patient[]
}

export async function getPatient(id: string): Promise<Patient | null> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('patients').select('*').eq('id', id).maybeSingle()
  return (data as Patient) ?? null
}

export async function getPrescribers(): Promise<Prescriber[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('prescribers')
    .select('*')
    .order('full_name', { ascending: true })
  return (data ?? []) as Prescriber[]
}

export async function getBatches(): Promise<ProductionBatch[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('production_batches')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as ProductionBatch[]
}

export async function getBatchStock(): Promise<BatchStock[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('batch_stock').select('*').order('code')
  return (data ?? []) as BatchStock[]
}

export interface MovementWithRelations extends StockMovement {
  batch: { code: string } | null
  patient: { full_name: string } | null
}

export async function getMovements(limit = 100): Promise<MovementWithRelations[]> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('stock_movements')
    .select('*, batch:production_batches ( code ), patient:patients ( full_name )')
    .order('occurred_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as MovementWithRelations[]
}

// ------------------------------------------------------------
// Agregación: demanda del dispensario
// ------------------------------------------------------------

export interface ProductDemand {
  productName: string
  patients: number
  prescriptions: number
  gramsPerDay: number
  gramsPerWeek: number
  gramsPerMonth: number
  unitsPerMonth: number
  /** Existencias utilizables de este producto. */
  stockGrams: number
  /** Meses que cubre el stock de ESTE producto. */
  monthsOfCoverage: number | null
}

/**
 * Clave de agrupación tolerante a cómo se teclee el nombre.
 * Sin esto, «Hongos secos», «hongos secos» y «Hongos Secos» aparecían como
 * tres líneas distintas en el plan de producción.
 */
function productKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
}

/** Lotes que realmente pueden usarse: ni descartados, ni agotados, ni vencidos. */
function isUsableBatch(s: BatchStock): boolean {
  if (s.status === 'descartado' || s.status === 'agotado') return false
  if (s.expires_at && daysUntil(s.expires_at) < 0) return false
  return true
}

export interface DispensarioSummary {
  activePrescriptions: number
  activePatients: number
  /** Demanda mensual sumada de todas las recetas vigentes. */
  totalGramsPerMonth: number
  totalGramsPerWeek: number
  totalGramsPerDay: number
  byProduct: ProductDemand[]
  /** Saldo de inventario en gramos, sumando todos los lotes. */
  stockGrams: number
  stockUnits: number
  /** Meses de cobertura del stock frente a la demanda mensual. */
  monthsOfCoverage: number | null
  expiring: PrescriptionView[]
}

/**
 * Solo cuentan las recetas vigentes y no vencidas: una receta expirada ya no
 * genera demanda que el dispensario deba cubrir.
 */
function countsTowardDemand(v: PrescriptionView): boolean {
  return v.prescription.status === 'active' && v.daysToExpiry >= 0
}

export async function getDispensarioSummary(): Promise<DispensarioSummary> {
  const [views, stock] = await Promise.all([getPrescriptions(), getBatchStock()])

  const live = views.filter(countsTowardDemand)
  const usableStock = stock.filter(isUsableBatch)

  // Existencias por producto, con la misma normalización del nombre que la
  // demanda, para poder cruzar ambas.
  const stockByProduct = new Map<string, number>()
  for (const s of usableStock) {
    const key = productKey(s.product_name)
    stockByProduct.set(key, (stockByProduct.get(key) ?? 0) + Number(s.grams_balance || 0))
  }

  interface Accum extends Omit<ProductDemand, 'stockGrams' | 'monthsOfCoverage'> {
    patientIds: Set<string>
  }

  const byProductMap = new Map<string, Accum>()
  let totalGramsPerMonth = 0
  let totalGramsPerWeek = 0
  let totalGramsPerDay = 0

  for (const v of live) {
    const name = v.prescription.product_name
    const key = productKey(name)
    const entry = byProductMap.get(key) ?? {
      productName: name,
      patients: 0,
      prescriptions: 0,
      gramsPerDay: 0,
      gramsPerWeek: 0,
      gramsPerMonth: 0,
      unitsPerMonth: 0,
      patientIds: new Set<string>(),
    }

    entry.prescriptions += 1
    entry.patientIds.add(v.prescription.patient_id)
    entry.gramsPerDay += v.posology.gramsPerDay
    entry.gramsPerWeek += v.posology.gramsPerWeek
    entry.gramsPerMonth += v.posology.gramsPerMonth
    entry.unitsPerMonth += v.posology.unitsPerMonth

    byProductMap.set(key, entry)

    totalGramsPerDay += v.posology.gramsPerDay
    totalGramsPerWeek += v.posology.gramsPerWeek
    totalGramsPerMonth += v.posology.gramsPerMonth
  }

  const byProduct: ProductDemand[] = [...byProductMap.entries()]
    .map(([key, { patientIds, ...rest }]) => {
      const productStock = stockByProduct.get(key) ?? 0
      return {
        ...rest,
        patients: patientIds.size,
        stockGrams: productStock,
        monthsOfCoverage: rest.gramsPerMonth > 0 ? productStock / rest.gramsPerMonth : null,
      }
    })
    // Lo más urgente primero: menor cobertura arriba.
    .sort((a, b) => (a.monthsOfCoverage ?? Infinity) - (b.monthsOfCoverage ?? Infinity))

  const stockGrams = usableStock.reduce((sum, s) => sum + Number(s.grams_balance || 0), 0)
  const stockUnits = usableStock.reduce((sum, s) => sum + Number(s.units_balance || 0), 0)

  const uniquePatients = new Set(live.map(v => v.prescription.patient_id))

  // Se acota por abajo para no arrastrar indefinidamente recetas vencidas hace
  // meses que aún no ha tocado el cron.
  const expiring = views
    .filter(v =>
      v.prescription.status === 'active' &&
      v.daysToExpiry <= 30 &&
      v.daysToExpiry >= -60,
    )
    .sort((a, b) => a.daysToExpiry - b.daysToExpiry)

  return {
    activePrescriptions: live.length,
    activePatients: uniquePatients.size,
    totalGramsPerMonth,
    totalGramsPerWeek,
    totalGramsPerDay,
    byProduct,
    stockGrams,
    stockUnits,
    monthsOfCoverage: totalGramsPerMonth > 0 ? stockGrams / totalGramsPerMonth : null,
    expiring,
  }
}

// ------------------------------------------------------------
// Dispensado por receta
// ------------------------------------------------------------

/**
 * Unidades entregadas contra cada receta, netas de devoluciones.
 *
 * Los movimientos anotados solo en gramos se convierten usando el tamaño de
 * unidad de la receta: antes se sumaba únicamente el campo de unidades, así que
 * una dispensación registrada en gramos contaba como cero y el tope de la
 * receta nunca se alcanzaba.
 */
export async function getDispensedByPrescription(): Promise<Map<string, number>> {
  const supabase = createAdminClient()

  const [{ data: movements }, { data: prescriptions }] = await Promise.all([
    supabase
      .from('stock_movements')
      .select('prescription_id, type, grams, units')
      .in('type', ['dispensacion', 'devolucion'])
      .not('prescription_id', 'is', null),
    supabase.from('prescriptions').select('id, unit_size_g'),
  ])

  const unitSizes = new Map<string, number>()
  for (const row of prescriptions ?? []) {
    const r = row as { id: string; unit_size_g: number }
    unitSizes.set(r.id, Number(r.unit_size_g) || 0)
  }

  const map = new Map<string, number>()
  for (const row of movements ?? []) {
    const r = row as { prescription_id: string; type: string; grams: number; units: number }
    const unitSize = unitSizes.get(r.prescription_id) ?? 0

    const magnitude = Math.abs(Number(r.units) || 0) ||
      (unitSize > 0 ? Math.abs(Number(r.grams) || 0) / unitSize : 0)

    const delta = r.type === 'devolucion' ? -magnitude : magnitude
    map.set(r.prescription_id, (map.get(r.prescription_id) ?? 0) + delta)
  }

  // Una devolución no puede dejar el acumulado por debajo de cero.
  for (const [id, total] of map) map.set(id, Math.max(0, total))
  return map
}
