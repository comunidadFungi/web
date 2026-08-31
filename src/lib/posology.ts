/**
 * Cálculo de consumo a partir de la posología de una receta.
 *
 * Los cuatro esquemas cubren los formatos de receta que se reciben en el
 * dispensario: dosis diaria, N días por semana, ciclos de N días on / M off
 * ("un día sí, un día no", "tomar 4 días y suspender 3") y cuota mensual.
 */

/** Promedio real: 365.2425 / 12. Evita la deriva de usar 30 días. */
export const DAYS_PER_MONTH = 30.436875
export const DAYS_PER_YEAR = 365.2425

export type ScheduleType = 'daily' | 'days_per_week' | 'cycle' | 'monthly_quota'
export type DurationUnit = 'days' | 'weeks' | 'months' | 'years'

export interface Posology {
  schedule_type: ScheduleType
  /** Gramos por cápsula / unidad. */
  unit_size_g: number
  units_per_intake: number
  intakes_per_day: number
  days_per_week?: number | null
  cycle_days_on?: number | null
  cycle_days_off?: number | null
  monthly_quota_g?: number | null
  duration_value: number
  duration_unit: DurationUnit
  /** Total declarado en la receta impresa, si lo indica. */
  declared_total_units?: number | null
}

export interface PosologyResult {
  /** Unidades en un día de toma (excluye los días de descanso). */
  unitsPerActiveDay: number
  gramsPerActiveDay: number
  /** Días de toma por semana. Puede ser fraccionario en ciclos. */
  activeDaysPerWeek: number

  /** Promedios, ya prorrateados sobre los días de descanso. */
  gramsPerDay: number
  gramsPerWeek: number
  gramsPerMonth: number
  unitsPerDay: number
  unitsPerWeek: number
  unitsPerMonth: number

  durationDays: number
  gramsTotal: number
  unitsTotal: number

  declaredTotalUnits: number | null
  /** El total declarado en la receta se aleja más de 10% del calculado. */
  declaredMismatch: boolean
  /** Tope dispensable: manda lo declarado en la receta si existe. */
  dispensableUnits: number
}

const DURATION_DAYS: Record<DurationUnit, number> = {
  days: 1,
  weeks: 7,
  months: DAYS_PER_MONTH,
  years: DAYS_PER_YEAR,
}

/**
 * Acepta también cadenas numéricas —con coma o con punto— para que una
 * importación o una API que devuelva texto no produzca ceros en silencio.
 */
function num(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === '') return fallback
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : fallback
}

/** Días de toma por semana según el esquema. */
export function activeDaysPerWeek(p: Posology): number {
  switch (p.schedule_type) {
    case 'daily':
      return 7
    case 'days_per_week':
      return Math.min(7, Math.max(0, num(p.days_per_week)))
    case 'cycle': {
      const on = Math.max(0, num(p.cycle_days_on))
      const off = Math.max(0, num(p.cycle_days_off))
      return on + off > 0 ? (7 * on) / (on + off) : 0
    }
    case 'monthly_quota':
      // La cuota se reparte sobre todo el mes; no hay días de descanso.
      return 7
  }
}

export function durationInDays(p: Posology): number {
  return Math.max(0, num(p.duration_value)) * DURATION_DAYS[p.duration_unit]
}

export function calcPosology(p: Posology): PosologyResult {
  const unitSize = Math.max(0, num(p.unit_size_g))
  const activeDays = activeDaysPerWeek(p)
  const durationDays = durationInDays(p)

  let unitsPerActiveDay: number
  let gramsPerActiveDay: number
  let gramsPerWeek: number

  if (p.schedule_type === 'monthly_quota') {
    const quota = Math.max(0, num(p.monthly_quota_g))
    const gramsPerDay = quota / DAYS_PER_MONTH
    gramsPerWeek = gramsPerDay * 7
    gramsPerActiveDay = gramsPerDay
    unitsPerActiveDay = unitSize > 0 ? gramsPerDay / unitSize : 0
  } else {
    unitsPerActiveDay = Math.max(0, num(p.units_per_intake, 1)) * Math.max(0, num(p.intakes_per_day, 1))
    gramsPerActiveDay = unitsPerActiveDay * unitSize
    gramsPerWeek = gramsPerActiveDay * activeDays
  }

  const gramsPerDay = gramsPerWeek / 7
  const gramsPerMonth = gramsPerDay * DAYS_PER_MONTH
  const gramsTotal = gramsPerDay * durationDays

  const toUnits = (grams: number) => (unitSize > 0 ? grams / unitSize : 0)

  const unitsTotal = toUnits(gramsTotal)
  const declared = p.declared_total_units != null && Number.isFinite(p.declared_total_units)
    ? p.declared_total_units
    : null

  const declaredMismatch =
    declared !== null &&
    (unitsTotal > 0
      ? Math.abs(declared - unitsTotal) / unitsTotal > 0.1
      // Un total declarado frente a un cálculo de cero es justo el caso en que
      // la posología está mal registrada: es cuando más hay que avisar.
      : declared > 0)

  return {
    unitsPerActiveDay,
    gramsPerActiveDay,
    activeDaysPerWeek: activeDays,
    gramsPerDay,
    gramsPerWeek,
    gramsPerMonth,
    unitsPerDay: toUnits(gramsPerDay),
    unitsPerWeek: toUnits(gramsPerWeek),
    unitsPerMonth: toUnits(gramsPerMonth),
    durationDays,
    gramsTotal,
    unitsTotal,
    declaredTotalUnits: declared,
    declaredMismatch,
    // Se redondea hacia abajo: no se autoriza media cápsula, y ante la duda
    // el tope debe quedarse corto, nunca pasarse.
    dispensableUnits: Math.floor(declared ?? unitsTotal),
  }
}

// ------------------------------------------------------------
// Formato
// ------------------------------------------------------------

export function formatGrams(g: number): string {
  if (!Number.isFinite(g)) return '—'
  const decimals = g > 0 && g < 1 ? 3 : g < 100 ? 2 : 1
  return `${g.toLocaleString('es-CL', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })} g`
}

export function formatUnits(u: number): string {
  if (!Number.isFinite(u)) return '—'
  return u.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 1 })
}

const DURATION_LABEL: Record<DurationUnit, [string, string]> = {
  days: ['día', 'días'],
  weeks: ['semana', 'semanas'],
  months: ['mes', 'meses'],
  years: ['año', 'años'],
}

export function formatDuration(p: Posology): string {
  const v = num(p.duration_value)
  const [one, many] = DURATION_LABEL[p.duration_unit]
  return `${v.toLocaleString('es-CL', { maximumFractionDigits: 1 })} ${v === 1 ? one : many}`
}

/** Descripción legible de la posología, para fichas y alertas. */
export function describePosology(p: Posology, presentation = 'cápsula'): string {
  const unit = num(p.unit_size_g)
  const sizeSuffix = unit > 0 ? ` de ${formatGrams(unit)}` : ''
  const unitWord = (n: number) => (n === 1 ? presentation : `${presentation}s`)

  if (p.schedule_type === 'monthly_quota') {
    return `Cuota mensual de ${formatGrams(num(p.monthly_quota_g))} durante ${formatDuration(p)}`
  }

  const perIntake = Math.max(0, num(p.units_per_intake, 1))
  const intakes = Math.max(0, num(p.intakes_per_day, 1))
  const perDay = perIntake * intakes
  const base =
    intakes > 1
      ? `${formatUnits(perIntake)} ${unitWord(perIntake)}${sizeSuffix}, ${formatUnits(intakes)} veces al día`
      : `${formatUnits(perDay)} ${unitWord(perDay)}${sizeSuffix} al día`

  let rhythm: string
  switch (p.schedule_type) {
    case 'daily':
      rhythm = 'todos los días'
      break
    case 'days_per_week':
      rhythm = `${formatUnits(num(p.days_per_week))} días por semana`
      break
    case 'cycle': {
      const on = num(p.cycle_days_on)
      const off = num(p.cycle_days_off)
      rhythm =
        on === 1 && off === 1
          ? 'un día sí, un día no'
          : `${formatUnits(on)} días de toma y ${formatUnits(off)} de descanso`
      break
    }
  }

  return `${base}, ${rhythm}, durante ${formatDuration(p)}`
}

// ------------------------------------------------------------
// Vigencia
// ------------------------------------------------------------

/**
 * Interpreta las fechas de la base (`YYYY-MM-DD`) en la zona horaria local.
 *
 * `new Date('2026-09-09')` se parsea como medianoche UTC; leerla luego con
 * `getDate()` devuelve el día anterior en Chile (UTC-4/-3), lo que restaba un
 * día a todos los vencimientos.
 */
export function parseDate(value: string | Date): Date {
  // Siempre una copia: quien la reciba puede mutarla sin afectar al llamador.
  if (value instanceof Date) return new Date(value.getTime())
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
  }
  return new Date(value)
}

/** Fecha de término del tratamiento según la duración prescrita. */
export function treatmentEndDate(issuedDate: string | Date, p: Posology): Date {
  const end = parseDate(issuedDate)
  end.setDate(end.getDate() + Math.round(durationInDays(p)))
  return end
}

/**
 * Vencimiento efectivo: la fecha explícita de la receta si existe,
 * si no el término del tratamiento.
 */
export function effectiveExpiry(
  validUntil: string | null | undefined,
  issuedDate: string | Date,
  p: Posology,
): Date {
  return validUntil ? parseDate(validUntil) : treatmentEndDate(issuedDate, p)
}

/** El dispensario opera en Chile; el servidor, en UTC. */
export const DISPENSARY_TIMEZONE = 'America/Santiago'

/** Día de calendario como `AAAA-MM-DD`, sin hora ni desplazamiento. */
export function toDateKey(value: string | Date): string {
  if (typeof value === 'string') {
    const dateOnly = /^(\d{4}-\d{2}-\d{2})/.exec(value)
    if (dateOnly) return dateOnly[1]
    return toDateKey(new Date(value))
  }
  const y = value.getFullYear()
  const m = String(value.getMonth() + 1).padStart(2, '0')
  const d = String(value.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Hoy según el reloj de Chile, no el del servidor.
 *
 * Vercel ejecuta en UTC: entre las 20:00 y la medianoche chilena el servidor ya
 * está en el día siguiente, y sin esto toda receta que vence hoy se leía como
 * vencida ayer — y el cron llegaba a escribirlo en la base.
 */
export function todayKey(timeZone: string = DISPENSARY_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function keyToUTC(key: string): number {
  const [y, m, d] = key.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

/** Días completos entre hoy en Chile y la fecha dada. */
export function daysUntil(date: string | Date, from?: Date | string): number {
  const targetKey = toDateKey(date)
  const fromKey = from === undefined ? todayKey() : toDateKey(from)
  return Math.round((keyToUTC(targetKey) - keyToUTC(fromKey)) / 86_400_000)
}

export type ExpiryLevel = 'expired' | 'critical' | 'warning' | 'ok'

/** Umbrales usados tanto en el panel como en las alertas push. */
export function expiryLevel(days: number): ExpiryLevel {
  if (days < 0) return 'expired'
  if (days <= 7) return 'critical'
  if (days <= 30) return 'warning'
  return 'ok'
}
