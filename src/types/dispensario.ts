import type { DurationUnit, ScheduleType } from '@/lib/posology'

export type { DurationUnit, ScheduleType }

export interface Prescriber {
  id: string
  full_name: string
  rut: string | null
  registry_no: string | null
  specialty: string | null
  email: string | null
  phone: string | null
  address: string | null
  comuna: string | null
  city: string | null
  active: boolean
  notes: string | null
  created_at?: string
  updated_at?: string
}

export interface Patient {
  id: string
  user_id: string | null
  full_name: string
  rut: string | null
  birth_date: string | null
  email: string | null
  phone: string | null
  address: string | null
  comuna: string | null
  city: string | null
  notes: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}

export type PrescriptionStatus = 'active' | 'completed' | 'expired' | 'cancelled'

export interface Prescription {
  id: string
  patient_id: string
  prescriber_id: string | null

  folio: string | null
  issued_date: string
  valid_until: string | null
  product_id: string | null
  product_name: string
  presentation: string

  schedule_type: ScheduleType
  unit_size_g: number
  units_per_intake: number
  intakes_per_day: number
  days_per_week: number | null
  cycle_days_on: number | null
  cycle_days_off: number | null
  monthly_quota_g: number | null

  duration_value: number
  duration_unit: DurationUnit
  declared_total_units: number | null

  diagnosis: string | null
  notes: string | null
  document_url: string | null
  status: PrescriptionStatus

  created_at?: string
  updated_at?: string
}

/** Receta con paciente y prescriptor resueltos, tal como la devuelven los listados. */
export interface PrescriptionWithRelations extends Prescription {
  patient: Pick<Patient, 'id' | 'full_name' | 'rut' | 'email' | 'phone'> | null
  prescriber: Pick<Prescriber, 'id' | 'full_name' | 'registry_no'> | null
}

export type BatchStatus =
  | 'cultivo'
  | 'secado'
  | 'encapsulado'
  | 'disponible'
  | 'agotado'
  | 'descartado'

export interface ProductionBatch {
  id: string
  code: string
  product_name: string
  species: string | null
  started_at: string | null
  harvested_at: string | null
  dried_grams: number
  encapsulated_units: number
  unit_size_g: number | null
  expires_at: string | null
  status: BatchStatus
  notes: string | null
  created_at?: string
  updated_at?: string
}

export type MovementType = 'entrada' | 'dispensacion' | 'merma' | 'ajuste' | 'devolucion'

export interface StockMovement {
  id: string
  batch_id: string | null
  prescription_id: string | null
  patient_id: string | null
  type: MovementType
  grams: number
  units: number
  occurred_at: string
  notes: string | null
  created_by: string | null
  created_at?: string
}

export interface BatchStock {
  batch_id: string
  code: string
  product_name: string
  status: BatchStatus
  expires_at: string | null
  grams_balance: number
  units_balance: number
}

// ------------------------------------------------------------
// Etiquetas para la interfaz
// ------------------------------------------------------------

export const SCHEDULE_LABELS: Record<ScheduleType, string> = {
  daily: 'Todos los días',
  days_per_week: 'N días por semana',
  cycle: 'Ciclo (días de toma / descanso)',
  monthly_quota: 'Cuota mensual total',
}

export const SCHEDULE_HINTS: Record<ScheduleType, string> = {
  daily: 'Ej: 1 cápsula cada 24 horas, sin descansos.',
  days_per_week: 'Ej: «5 cápsulas al día, 6 veces a la semana».',
  cycle: 'Ej: «un día sí, un día no» (1 y 1) o «tomar 4 días y suspender 3» (4 y 3).',
  monthly_quota: 'Ej: «dosis mensual: 10.000 mg». Se reparte sobre todo el mes.',
}

export const DURATION_LABELS: Record<DurationUnit, string> = {
  days: 'días',
  weeks: 'semanas',
  months: 'meses',
  years: 'años',
}

export const STATUS_LABELS: Record<PrescriptionStatus, string> = {
  active: 'Vigente',
  completed: 'Completada',
  expired: 'Vencida',
  cancelled: 'Anulada',
}

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  cultivo: 'En cultivo',
  secado: 'En secado',
  encapsulado: 'Encapsulado',
  disponible: 'Disponible',
  agotado: 'Agotado',
  descartado: 'Descartado',
}

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  entrada: 'Entrada de producción',
  dispensacion: 'Dispensación a paciente',
  merma: 'Merma',
  ajuste: 'Ajuste de inventario',
  devolucion: 'Devolución',
}
