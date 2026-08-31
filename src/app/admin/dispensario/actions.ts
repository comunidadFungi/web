'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'
import {
  calcPosology,
  daysUntil,
  effectiveExpiry,
  formatGrams,
  formatUnits,
} from '@/lib/posology'
import type {
  BatchStatus,
  DurationUnit,
  MovementType,
  Prescription,
  PrescriptionStatus,
  ScheduleType,
} from '@/types/dispensario'

type Result = { ok: true } | { error: string }

// Las Server Actions son endpoints públicos: el guardia del layout de /admin no
// las protege. Como estas operan con la service role key (que omite RLS), cada
// una verifica la sesión con `requireAdmin`, que falla cerrado.

function fail(message: string): Result {
  return { error: message }
}

const BASE = '/admin/dispensario'

// ------------------------------------------------------------
// Pacientes
// ------------------------------------------------------------

export interface PatientPayload {
  id?: string
  full_name: string
  rut?: string | null
  birth_date?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  comuna?: string | null
  city?: string | null
  notes?: string | null
  active?: boolean
}

export async function savePatient(payload: PatientPayload): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')
  if (!payload.full_name?.trim()) return fail('El nombre del paciente es obligatorio')

  const supabase = createAdminClient()
  const { id, ...rest } = payload
  const body = { ...rest, full_name: rest.full_name.trim(), updated_at: new Date().toISOString() }

  const { error } = id
    ? await supabase.from('patients').update(body).eq('id', id)
    : await supabase.from('patients').insert(body)

  if (error) {
    return fail(
      error.code === '23505'
        ? 'Ya existe un paciente con ese RUT'
        : error.message,
    )
  }

  revalidatePath(`${BASE}/pacientes`)
  revalidatePath(BASE)
  return { ok: true }
}

/**
 * Borrar un paciente con historial destruiría sus recetas y dejaría salidas de
 * inventario sin dueño. Se bloquea y se ofrece desactivarlo, que conserva todo.
 */
export async function deletePatient(id: string): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const supabase = createAdminClient()

  const [{ count: prescriptions }, { count: movements }] = await Promise.all([
    supabase.from('prescriptions').select('*', { count: 'exact', head: true }).eq('patient_id', id),
    supabase.from('stock_movements').select('*', { count: 'exact', head: true }).eq('patient_id', id),
  ])

  if ((prescriptions ?? 0) > 0 || (movements ?? 0) > 0) {
    const partes = []
    if (prescriptions) partes.push(`${prescriptions} receta(s)`)
    if (movements) partes.push(`${movements} movimiento(s) de stock`)
    return fail(
      `No se puede eliminar: el paciente tiene ${partes.join(' y ')}. ` +
      'Desmarca «Paciente activo» para retirarlo sin perder el historial.',
    )
  }

  const { error } = await supabase.from('patients').delete().eq('id', id)
  if (error) return fail(error.message)

  revalidatePath(`${BASE}/pacientes`)
  revalidatePath(BASE)
  return { ok: true }
}

// ------------------------------------------------------------
// Médicos prescriptores
// ------------------------------------------------------------

export interface PrescriberPayload {
  id?: string
  full_name: string
  rut?: string | null
  registry_no?: string | null
  specialty?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  comuna?: string | null
  city?: string | null
  notes?: string | null
  active?: boolean
}

export async function savePrescriber(payload: PrescriberPayload): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')
  if (!payload.full_name?.trim()) return fail('El nombre del médico es obligatorio')

  const supabase = createAdminClient()
  const { id, ...rest } = payload
  const body = { ...rest, full_name: rest.full_name.trim(), updated_at: new Date().toISOString() }

  const { error } = id
    ? await supabase.from('prescribers').update(body).eq('id', id)
    : await supabase.from('prescribers').insert(body)

  if (error) {
    return fail(error.code === '23505' ? 'Ya existe un médico con ese RUT' : error.message)
  }

  revalidatePath(`${BASE}/medicos`)
  return { ok: true }
}

export async function deletePrescriber(id: string): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const supabase = createAdminClient()
  const { error } = await supabase.from('prescribers').delete().eq('id', id)
  if (error) return fail(error.message)

  revalidatePath(`${BASE}/medicos`)
  return { ok: true }
}

// ------------------------------------------------------------
// Recetas
// ------------------------------------------------------------

export interface PrescriptionPayload {
  id?: string
  patient_id: string
  prescriber_id?: string | null
  folio?: string | null
  issued_date: string
  valid_until?: string | null
  product_id?: string | null
  product_name: string
  presentation?: string
  schedule_type: ScheduleType
  unit_size_g: number
  units_per_intake: number
  intakes_per_day: number
  days_per_week?: number | null
  cycle_days_on?: number | null
  cycle_days_off?: number | null
  monthly_quota_g?: number | null
  duration_value: number
  duration_unit: DurationUnit
  declared_total_units?: number | null
  diagnosis?: string | null
  notes?: string | null
  document_url?: string | null
  status?: PrescriptionStatus
}

function validatePrescription(p: PrescriptionPayload): string | null {
  if (!p.patient_id) return 'Selecciona un paciente'
  if (!p.product_name?.trim()) return 'Indica el producto recetado'
  if (!p.issued_date) return 'Indica la fecha de emisión'
  if (!(p.duration_value > 0)) return 'La duración debe ser mayor a cero'

  // Los gramos por unidad hacen falta siempre: sin ellos no hay conversión a
  // cápsulas, y el tope dispensable de la receta quedaría en cero.
  if (!(p.unit_size_g > 0)) return 'Indica cuántos gramos tiene cada unidad'

  if (p.schedule_type === 'monthly_quota') {
    if (!(Number(p.monthly_quota_g) > 0)) return 'Indica la cuota mensual en gramos'
  } else {
    if (!(p.units_per_intake > 0)) return 'Indica cuántas unidades tiene cada toma'
    if (!(p.intakes_per_day > 0)) return 'Indica cuántas tomas hay al día'
  }

  if (p.schedule_type === 'days_per_week') {
    const d = Number(p.days_per_week)
    if (!(d > 0 && d <= 7)) return 'Los días por semana deben estar entre 1 y 7'
  }

  if (p.schedule_type === 'cycle') {
    const on = Number(p.cycle_days_on)
    const off = Number(p.cycle_days_off)
    if (!(on > 0)) return 'Indica cuántos días seguidos toma el paciente'
    if (!(off >= 0)) return 'Indica cuántos días de descanso hay'
    if (on + off <= 0) return 'El ciclo debe tener al menos un día'
  }

  if (p.valid_until && p.valid_until < p.issued_date) {
    return 'El vencimiento no puede ser anterior a la emisión'
  }

  return null
}

export async function savePrescription(payload: PrescriptionPayload): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const problem = validatePrescription(payload)
  if (problem) return fail(problem)

  const supabase = createAdminClient()
  const { id, ...rest } = payload

  // Solo se persisten los campos del esquema elegido; el resto queda en null
  // para que no queden valores huérfanos si se cambia el tipo de posología.
  const body = {
    ...rest,
    product_name: rest.product_name.trim(),
    presentation: rest.presentation?.trim() || 'cápsula',
    days_per_week: rest.schedule_type === 'days_per_week' ? rest.days_per_week : null,
    cycle_days_on: rest.schedule_type === 'cycle' ? rest.cycle_days_on : null,
    cycle_days_off: rest.schedule_type === 'cycle' ? rest.cycle_days_off : null,
    monthly_quota_g: rest.schedule_type === 'monthly_quota' ? rest.monthly_quota_g : null,
    updated_at: new Date().toISOString(),
  }

  const { error } = id
    ? await supabase.from('prescriptions').update(body).eq('id', id)
    : await supabase.from('prescriptions').insert(body)

  if (error) return fail(error.message)

  revalidatePath(`${BASE}/recetas`)
  revalidatePath(`${BASE}/pacientes`)
  revalidatePath(BASE)
  return { ok: true }
}

/** Una receta con dispensaciones registradas no se borra: se anula. */
export async function deletePrescription(id: string): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('stock_movements')
    .select('*', { count: 'exact', head: true })
    .eq('prescription_id', id)

  if ((count ?? 0) > 0) {
    return fail(
      `No se puede eliminar: hay ${count} movimiento(s) de stock asociados a esta receta. ` +
      'Cámbiale el estado a «Anulada» para retirarla sin perder la trazabilidad.',
    )
  }

  const { error } = await supabase.from('prescriptions').delete().eq('id', id)
  if (error) return fail(error.message)

  revalidatePath(`${BASE}/recetas`)
  revalidatePath(BASE)
  return { ok: true }
}

export async function setPrescriptionStatus(
  id: string,
  status: PrescriptionStatus,
): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('prescriptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return fail(error.message)

  revalidatePath(`${BASE}/recetas`)
  revalidatePath(BASE)
  return { ok: true }
}

// ------------------------------------------------------------
// Producción
// ------------------------------------------------------------

export interface BatchPayload {
  id?: string
  code: string
  product_name: string
  species?: string | null
  started_at?: string | null
  harvested_at?: string | null
  dried_grams?: number
  encapsulated_units?: number
  unit_size_g?: number | null
  expires_at?: string | null
  status: BatchStatus
  notes?: string | null
}

export async function saveBatch(payload: BatchPayload): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')
  if (!payload.code?.trim()) return fail('El código de lote es obligatorio')
  if (!payload.product_name?.trim()) return fail('Indica el producto del lote')

  const supabase = createAdminClient()
  const { id, ...rest } = payload
  const body = {
    ...rest,
    code: rest.code.trim(),
    product_name: rest.product_name.trim(),
    updated_at: new Date().toISOString(),
  }

  const { error } = id
    ? await supabase.from('production_batches').update(body).eq('id', id)
    : await supabase.from('production_batches').insert(body)

  if (error) {
    return fail(error.code === '23505' ? 'Ya existe un lote con ese código' : error.message)
  }

  revalidatePath(`${BASE}/produccion`)
  revalidatePath(BASE)
  return { ok: true }
}

export async function deleteBatch(id: string): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const supabase = createAdminClient()
  const { error } = await supabase.from('production_batches').delete().eq('id', id)
  if (error) return fail(error.message)

  revalidatePath(`${BASE}/produccion`)
  revalidatePath(BASE)
  return { ok: true }
}

// ------------------------------------------------------------
// Stock
// ------------------------------------------------------------

export interface MovementPayload {
  batch_id?: string | null
  prescription_id?: string | null
  patient_id?: string | null
  type: MovementType
  /** Siempre en positivo: el signo lo aplica el servidor según el tipo. */
  grams: number
  units: number
  occurred_at?: string
  notes?: string | null
}

/** Los tipos que restan del inventario se guardan con signo negativo. */
const OUTBOUND: MovementType[] = ['dispensacion', 'merma']

export async function addStockMovement(payload: MovementPayload): Promise<Result> {
  const email = await requireAdmin()
  if (!email) return fail('No autorizado')

  const grams = Math.abs(Number(payload.grams) || 0)
  const units = Math.abs(Number(payload.units) || 0)
  if (grams <= 0 && units <= 0) return fail('Indica una cantidad en gramos o unidades')

  // Sin lote el movimiento queda fuera del saldo: el producto sale del
  // dispensario y el inventario no baja. Solo el ajuste puede ir sin lote.
  if (payload.type !== 'ajuste' && !payload.batch_id) {
    return fail('Indica de qué lote sale o entra el producto')
  }

  if (payload.type === 'dispensacion') {
    if (!payload.patient_id) return fail('Una dispensación debe indicar el paciente')
    if (!payload.prescription_id) {
      return fail('Una dispensación debe ir asociada a la receta que la autoriza')
    }
  }

  const supabase = createAdminClient()

  // Copia del paciente y del folio para que el libro de inventario siga
  // siendo legible aunque la ficha se borre o se corrija más adelante.
  let patientRut: string | null = null
  let patientName: string | null = null
  let prescriptionFolio: string | null = null

  if (payload.patient_id) {
    const { data } = await supabase
      .from('patients')
      .select('rut, full_name')
      .eq('id', payload.patient_id)
      .maybeSingle()
    patientRut = (data?.rut as string) ?? null
    patientName = (data?.full_name as string) ?? null
  }

  if (payload.type === 'dispensacion' && payload.prescription_id) {
    const check = await assertWithinPrescriptionLimit(
      supabase,
      payload.prescription_id,
      payload.patient_id!,
      grams,
      units,
    )
    if (check.error) return check
    prescriptionFolio = check.folio
  }

  if (OUTBOUND.includes(payload.type) && payload.batch_id) {
    const shortage = await assertBatchHasStock(supabase, payload.batch_id, grams, units)
    if (shortage) return shortage
  }

  // El ajuste es el único tipo que admite signo libre: puede sumar o restar.
  const sign = OUTBOUND.includes(payload.type) ? -1 : 1
  const signedGrams = payload.type === 'ajuste' ? Number(payload.grams) || 0 : grams * sign
  const signedUnits = payload.type === 'ajuste' ? Number(payload.units) || 0 : units * sign

  const { error } = await supabase.from('stock_movements').insert({
    batch_id: payload.batch_id || null,
    prescription_id: payload.prescription_id || null,
    patient_id: payload.patient_id || null,
    patient_rut: patientRut,
    patient_name: patientName,
    prescription_folio: prescriptionFolio,
    type: payload.type,
    grams: signedGrams,
    units: signedUnits,
    occurred_at: payload.occurred_at || new Date().toISOString(),
    notes: payload.notes || null,
    created_by: email,
  })

  if (error) return fail(error.message)

  revalidatePath(`${BASE}/stock`)
  revalidatePath(`${BASE}/produccion`)
  revalidatePath(`${BASE}/recetas`)
  revalidatePath(BASE)
  return { ok: true }
}

type LimitCheck = { error: string; folio: null } | { error: null; folio: string | null }

/** Impide entregar más de lo que autoriza la receta. */
async function assertWithinPrescriptionLimit(
  supabase: ReturnType<typeof createAdminClient>,
  prescriptionId: string,
  patientId: string,
  grams: number,
  units: number,
): Promise<LimitCheck> {
  const { data: row } = await supabase
    .from('prescriptions')
    .select('*')
    .eq('id', prescriptionId)
    .maybeSingle()

  if (!row) return { error: 'La receta indicada no existe', folio: null }

  const prescription = row as unknown as Prescription
  if (prescription.patient_id !== patientId) {
    return { error: 'Esa receta pertenece a otro paciente', folio: null }
  }
  if (prescription.status === 'cancelled') {
    return { error: 'La receta está anulada', folio: null }
  }

  const expiry = effectiveExpiry(prescription.valid_until, prescription.issued_date, prescription)
  if (daysUntil(expiry) < 0) {
    return { error: 'La receta está vencida: no se puede dispensar contra ella', folio: null }
  }

  const { dispensableUnits, unitSize } = prescriptionLimit(prescription)
  if (dispensableUnits <= 0) return { error: null, folio: prescription.folio }

  const alreadyGiven = await dispensedUnitsFor(supabase, prescriptionId, unitSize)
  const requested = units > 0 ? units : unitSize > 0 ? grams / unitSize : 0
  const remaining = dispensableUnits - alreadyGiven

  if (requested > remaining + 0.001) {
    return {
      error:
        `La receta autoriza ${formatUnits(dispensableUnits)} unidades y ya se entregaron ` +
        `${formatUnits(alreadyGiven)}. Quedan ${formatUnits(Math.max(0, remaining))}.`,
      folio: null,
    }
  }

  return { error: null, folio: prescription.folio }
}

function prescriptionLimit(p: Prescription) {
  const result = calcPosology(p)
  return { dispensableUnits: result.dispensableUnits, unitSize: Number(p.unit_size_g) || 0 }
}

/**
 * Unidades ya entregadas contra una receta, netas de devoluciones. Los
 * movimientos anotados solo en gramos se convierten con el tamaño de unidad
 * de la receta; si no, quedaban sin contar y el tope nunca se alcanzaba.
 */
async function dispensedUnitsFor(
  supabase: ReturnType<typeof createAdminClient>,
  prescriptionId: string,
  unitSize: number,
): Promise<number> {
  const { data } = await supabase
    .from('stock_movements')
    .select('type, grams, units')
    .eq('prescription_id', prescriptionId)
    .in('type', ['dispensacion', 'devolucion'])

  let total = 0
  for (const row of data ?? []) {
    const r = row as { type: string; grams: number; units: number }
    const magnitude = Math.abs(Number(r.units) || 0) ||
      (unitSize > 0 ? Math.abs(Number(r.grams) || 0) / unitSize : 0)
    total += r.type === 'devolucion' ? -magnitude : magnitude
  }
  return Math.max(0, total)
}

/** Impide que un lote quede en negativo. */
async function assertBatchHasStock(
  supabase: ReturnType<typeof createAdminClient>,
  batchId: string,
  grams: number,
  units: number,
): Promise<Result | null> {
  const { data } = await supabase
    .from('batch_stock')
    .select('code, grams_balance, units_balance')
    .eq('batch_id', batchId)
    .maybeSingle()

  if (!data) return null

  const availableGrams = Number(data.grams_balance) || 0
  const availableUnits = Number(data.units_balance) || 0

  if (grams > 0 && grams > availableGrams + 0.001) {
    return fail(
      `El lote ${data.code} tiene ${formatGrams(availableGrams)} disponibles y se intentan ` +
      `retirar ${formatGrams(grams)}.`,
    )
  }
  if (units > 0 && units > availableUnits + 0.001) {
    return fail(
      `El lote ${data.code} tiene ${formatUnits(availableUnits)} unidades disponibles y se ` +
      `intentan retirar ${formatUnits(units)}.`,
    )
  }
  return null
}

/**
 * Anula un movimiento con otro de signo contrario en vez de borrarlo.
 *
 * Un libro de inventario que se puede editar a posteriori no sirve ante una
 * fiscalización: lo que hubo debe seguir constando, junto con su corrección.
 */
export async function reverseStockMovement(id: string, reason?: string): Promise<Result> {
  const email = await requireAdmin()
  if (!email) return fail('No autorizado')

  const supabase = createAdminClient()
  const { data } = await supabase.from('stock_movements').select('*').eq('id', id).maybeSingle()
  if (!data) return fail('El movimiento ya no existe')

  const original = data as unknown as {
    batch_id: string | null
    prescription_id: string | null
    patient_id: string | null
    patient_rut: string | null
    patient_name: string | null
    prescription_folio: string | null
    grams: number
    units: number
    notes: string | null
  }

  const { error } = await supabase.from('stock_movements').insert({
    batch_id: original.batch_id,
    prescription_id: original.prescription_id,
    patient_id: original.patient_id,
    patient_rut: original.patient_rut,
    patient_name: original.patient_name,
    prescription_folio: original.prescription_folio,
    // El ajuste admite signo libre, que es lo que necesita una anulación.
    type: 'ajuste',
    grams: -Number(original.grams || 0),
    units: -Number(original.units || 0),
    occurred_at: new Date().toISOString(),
    notes: `Anula movimiento del ${new Date().toLocaleDateString('es-CL')}` +
      (reason ? ` · ${reason}` : '') +
      (original.notes ? ` · original: ${original.notes}` : ''),
    created_by: email,
  })

  if (error) return fail(error.message)

  revalidatePath(`${BASE}/stock`)
  revalidatePath(`${BASE}/produccion`)
  revalidatePath(BASE)
  return { ok: true }
}

// ------------------------------------------------------------
// Notificaciones push
// ------------------------------------------------------------

export interface PushSubscriptionPayload {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function savePushSubscription(
  sub: PushSubscriptionPayload,
  userAgent?: string,
): Promise<Result> {
  const email = await requireAdmin()
  if (!email) return fail('No autorizado')
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return fail('Suscripción incompleta')
  }

  const supabase = createAdminClient()
  // El endpoint es único: reinstalar la app en el mismo dispositivo
  // actualiza la fila en vez de duplicarla.
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_email: email,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      user_agent: userAgent ?? null,
    },
    { onConflict: 'endpoint' },
  )

  if (error) return fail(error.message)
  return { ok: true }
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const supabase = createAdminClient()
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) return fail(error.message)
  return { ok: true }
}

/** Envía una notificación de prueba a los dispositivos suscritos. */
export async function sendTestPush(): Promise<Result & { detail?: string }> {
  if (!(await requireAdmin())) return fail('No autorizado')

  const { sendPushToAdmin } = await import('@/lib/push')
  const result = await sendPushToAdmin({
    title: 'Comunidad Fungi',
    body: 'Las notificaciones del dispensario están funcionando.',
    url: '/admin/dispensario',
    tag: 'prueba',
  })

  if (result.skipped) return fail(result.skipped)
  if (result.sent === 0) return fail('No se pudo entregar en ningún dispositivo')
  return { ok: true, detail: `Enviada a ${result.sent} dispositivo(s)` }
}
