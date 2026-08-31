'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Warning, WarningCircle, FileArrowUp, CheckCircle } from '@phosphor-icons/react'

import {
  calcPosology,
  describePosology,
  effectiveExpiry,
  formatGrams,
  formatUnits,
  toDateKey,
  type Posology,
} from '@/lib/posology'
import {
  DURATION_LABELS,
  SCHEDULE_HINTS,
  SCHEDULE_LABELS,
  STATUS_LABELS,
  type DurationUnit,
  type Patient,
  type Prescriber,
  type PrescriptionStatus,
  type ScheduleType,
} from '@/types/dispensario'
import { deletePrescription, savePrescription } from '../actions'
import { Card, SectionTitle, actionLinkClass, inputClass, labelClass } from '../ui'
import { DecimalInput, Field, toEditable, toNumber } from '../form'

/** Los campos numéricos se guardan como texto para poder dejarlos vacíos. */
interface FormState {
  id?: string
  patient_id: string
  prescriber_id: string
  folio: string
  issued_date: string
  valid_until: string
  product_name: string
  presentation: string
  schedule_type: ScheduleType
  unit_size_g: string
  units_per_intake: string
  intakes_per_day: string
  days_per_week: string
  cycle_days_on: string
  cycle_days_off: string
  monthly_quota_g: string
  duration_value: string
  duration_unit: DurationUnit
  declared_total_units: string
  diagnosis: string
  notes: string
  document_url: string
  status: PrescriptionStatus
}

export const EMPTY_FORM: FormState = {
  patient_id: '',
  prescriber_id: '',
  folio: '',
  // Fecha local, no UTC: `toISOString()` devuelve el día siguiente a partir de
  // las 20:00 en Chile, y la receta se guardaba fechada mañana.
  issued_date: toDateKey(new Date()),
  valid_until: '',
  product_name: '',
  presentation: 'cápsula',
  schedule_type: 'days_per_week',
  unit_size_g: '',
  units_per_intake: '1',
  intakes_per_day: '1',
  days_per_week: '7',
  cycle_days_on: '1',
  cycle_days_off: '1',
  monthly_quota_g: '',
  duration_value: '3',
  duration_unit: 'months',
  declared_total_units: '',
  diagnosis: '',
  notes: '',
  document_url: '',
  status: 'active',
}

/** Campos numéricos: se editan como texto y admiten coma decimal. */
const NUMERIC_FIELDS = [
  'unit_size_g',
  'units_per_intake',
  'intakes_per_day',
  'days_per_week',
  'cycle_days_on',
  'cycle_days_off',
  'monthly_quota_g',
  'duration_value',
  'declared_total_units',
] as const

/**
 * La receta llega de la base con punto decimal («0.2»). En pantalla se muestra
 * con coma, que es como se escribe y como la teclea el teléfono en es-CL.
 */
function toEditableForm(state: FormState): FormState {
  const next = { ...state }
  for (const field of NUMERIC_FIELDS) next[field] = toEditable(state[field])
  return next
}

function orNull(value: string): string | null {
  return value.trim() === '' ? null : value
}

const SCHEDULES: ScheduleType[] = ['daily', 'days_per_week', 'cycle', 'monthly_quota']

/** Mínimos que el servidor también exige; el resto es opcional. */
type RequiredField = 'patient_id' | 'product_name' | 'unit_size_g' | 'duration_value'

/** Orden en que se reportan: el primero que falte es el del banner. */
const REQUIRED_ORDER: RequiredField[] = [
  'patient_id',
  'product_name',
  'unit_size_g',
  'duration_value',
]

const REQUIRED_SUMMARY: Record<RequiredField, string> = {
  patient_id: 'Falta seleccionar el paciente de la receta.',
  product_name: 'Falta escribir el producto recetado.',
  unit_size_g: 'Faltan los gramos por unidad: debe ser un número mayor que 0.',
  duration_value: 'Falta la duración del tratamiento: debe ser un número mayor que 0.',
}

const REQUIRED_INLINE: Record<RequiredField, string> = {
  patient_id: 'Selecciona un paciente.',
  product_name: 'Escribe el producto.',
  unit_size_g: 'Debe ser mayor que 0.',
  duration_value: 'Debe ser mayor que 0.',
}

/** Alto táctil mínimo recomendado para dedos: 44 px. */
const touchTarget = 'min-h-[2.75rem]'

export default function PrescriptionEditor({
  patients,
  prescribers,
  initial,
}: {
  patients: Pick<Patient, 'id' | 'full_name' | 'rut'>[]
  prescribers: Pick<Prescriber, 'id' | 'full_name' | 'registry_no'>[]
  initial?: FormState
}) {
  const router = useRouter()
  const isNew = !initial?.id

  // Referencia inmutable del estado con el que se abrió el formulario: sirve
  // para saber si hay cambios sin guardar y si el documento es recién subido.
  const [baseline] = useState<FormState>(() => toEditableForm(initial ?? EMPTY_FORM))
  const [form, setForm] = useState<FormState>(baseline)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, string>>>({})
  const [success, setSuccess] = useState('')
  const [saved, setSaved] = useState(false)
  // Se incrementa en cada fallo para llevar la vista al banner también cuando
  // el mensaje se repite (el mismo texto no dispararía un efecto por sí solo).
  const [errorPulse, setErrorPulse] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    setFieldErrors(prev => {
      if (!(field in prev)) return prev
      const next = { ...prev }
      delete next[field as RequiredField]
      return next
    })
  }

  // ----------------------------------------------------------
  // Cambios sin guardar
  // ----------------------------------------------------------
  const dirty = useMemo(
    () => !saved && JSON.stringify(form) !== JSON.stringify(baseline),
    [form, baseline, saved],
  )

  // Aviso del navegador al cerrar o recargar la pestaña con cambios pendientes.
  useEffect(() => {
    if (!dirty) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // En el teléfono el banner de error queda a varias pantallas del botón:
  // sin esto parece que pulsar «Guardar» no hace nada.
  useEffect(() => {
    if (errorPulse === 0) return
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [errorPulse])

  // ----------------------------------------------------------
  // Cálculo en vivo
  // ----------------------------------------------------------
  const posology = useMemo<Posology>(
    () => ({
      schedule_type: form.schedule_type,
      unit_size_g: toNumber(form.unit_size_g),
      units_per_intake: toNumber(form.units_per_intake),
      intakes_per_day: toNumber(form.intakes_per_day),
      days_per_week: toNumber(form.days_per_week),
      cycle_days_on: toNumber(form.cycle_days_on),
      cycle_days_off: toNumber(form.cycle_days_off),
      monthly_quota_g: toNumber(form.monthly_quota_g),
      duration_value: toNumber(form.duration_value),
      duration_unit: form.duration_unit,
      declared_total_units: form.declared_total_units.trim() === ''
        ? null
        : toNumber(form.declared_total_units),
    }),
    [form],
  )

  const result = useMemo(() => calcPosology(posology), [posology])

  const endDate = useMemo(() => {
    if (!form.issued_date) return null
    return effectiveExpiry(orNull(form.valid_until), form.issued_date, posology)
  }, [form.issued_date, form.valid_until, posology])

  const hasPosology = result.gramsPerMonth > 0

  // ----------------------------------------------------------
  // Documento adjunto
  // ----------------------------------------------------------
  // El endpoint solo firma rutas ya asociadas a una receta guardada, así que un
  // documento recién subido todavía no se puede abrir.
  const documentPending = form.document_url !== '' && form.document_url !== baseline.document_url

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    const data = new FormData()
    data.append('file', file)

    try {
      const res = await fetch('/api/admin/recetas/documento', { method: 'POST', body: data })
      const json = await res.json()
      if (json.path) set('document_url', json.path)
      else fail(json.error ?? 'No se pudo subir el documento')
    } catch {
      fail('No se pudo subir el documento')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ----------------------------------------------------------
  // Guardar / eliminar
  // ----------------------------------------------------------
  function fail(message: string, fields: Partial<Record<RequiredField, string>> = {}) {
    setError(message)
    setFieldErrors(fields)
    setErrorPulse(p => p + 1)
  }

  /** Mínimos obligatorios. El botón nunca se bloquea: aquí se explica qué falta. */
  function validate(): Partial<Record<RequiredField, string>> {
    const errors: Partial<Record<RequiredField, string>> = {}
    if (!form.patient_id) errors.patient_id = REQUIRED_INLINE.patient_id
    if (form.product_name.trim() === '') errors.product_name = REQUIRED_INLINE.product_name
    if (toNumber(form.unit_size_g) <= 0) errors.unit_size_g = REQUIRED_INLINE.unit_size_g
    if (toNumber(form.duration_value) <= 0) errors.duration_value = REQUIRED_INLINE.duration_value
    return errors
  }

  async function save() {
    setSuccess('')

    const invalid = validate()
    const firstMissing = REQUIRED_ORDER.find(field => invalid[field])
    if (firstMissing) {
      fail(REQUIRED_SUMMARY[firstMissing], invalid)
      return
    }

    setSaving(true)
    setError('')
    setFieldErrors({})

    const res = await savePrescription({
      id: form.id,
      patient_id: form.patient_id,
      prescriber_id: orNull(form.prescriber_id),
      folio: orNull(form.folio),
      issued_date: form.issued_date,
      valid_until: orNull(form.valid_until),
      product_name: form.product_name,
      presentation: form.presentation,
      schedule_type: form.schedule_type,
      unit_size_g: toNumber(form.unit_size_g),
      units_per_intake: toNumber(form.units_per_intake),
      intakes_per_day: toNumber(form.intakes_per_day),
      days_per_week:
        form.schedule_type === 'days_per_week' ? toNumber(form.days_per_week) : null,
      cycle_days_on: form.schedule_type === 'cycle' ? toNumber(form.cycle_days_on) : null,
      cycle_days_off: form.schedule_type === 'cycle' ? toNumber(form.cycle_days_off) : null,
      monthly_quota_g:
        form.schedule_type === 'monthly_quota' ? toNumber(form.monthly_quota_g) : null,
      duration_value: toNumber(form.duration_value),
      duration_unit: form.duration_unit,
      declared_total_units:
        form.declared_total_units.trim() === '' ? null : toNumber(form.declared_total_units),
      diagnosis: orNull(form.diagnosis),
      notes: orNull(form.notes),
      document_url: orNull(form.document_url),
      status: form.status,
    })

    setSaving(false)
    if ('error' in res) {
      fail(res.error)
      return
    }

    setSaved(true)
    setSuccess('Receta guardada.')
    setTimeout(() => router.push('/admin/dispensario/recetas'), 700)
  }

  function cancel() {
    if (dirty && !confirm('Tienes cambios sin guardar en esta receta. ¿Salir y descartarlos?')) {
      return
    }
    setSaved(true)
    router.push('/admin/dispensario/recetas')
  }

  async function remove() {
    if (!confirm('¿Eliminar esta receta? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    const res = await deletePrescription(form.id!)
    if ('error' in res) {
      fail(res.error)
      setDeleting(false)
      return
    }
    setSaved(true)
    router.push('/admin/dispensario/recetas')
  }

  return (
    // El margen inferior deja sitio a la barra fija de cálculo en el teléfono.
    <div className={hasPosology ? 'pb-28 lg:pb-0' : undefined}>
      <div className="grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        {/* ---------------- Formulario ---------------- */}
        <div className="space-y-6 min-w-0">
          {error && (
            <div
              ref={errorRef}
              role="alert"
              className="bg-[#C4513A]/10 border border-[#C4513A]/40 text-[#A33625] px-4 py-3 rounded-xl text-sm flex items-start gap-2"
            >
              <WarningCircle weight="fill" size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-[#6B8F71]/15 border border-[#6B8F71]/40 text-[#3F5C46] px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          {/* Paciente y médico */}
          <Card className="p-6">
            <SectionTitle>Paciente y médico</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Paciente *" error={fieldErrors.patient_id}>
                <select
                  value={form.patient_id}
                  onChange={e => set('patient_id', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecciona un paciente…</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}{p.rut ? ` — ${p.rut}` : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Médico prescriptor">
                <select
                  value={form.prescriber_id}
                  onChange={e => set('prescriber_id', e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sin registrar</option>
                  {prescribers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name}{p.registry_no ? ` — Reg. ${p.registry_no}` : ''}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </Card>

          {/* Datos de la receta */}
          <Card className="p-6">
            <SectionTitle>Datos de la receta</SectionTitle>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Folio" hint="Número impreso en la receta.">
                <input
                  value={form.folio}
                  onChange={e => set('folio', e.target.value)}
                  placeholder="Ej: 8361544"
                  className={inputClass}
                />
              </Field>

              <Field label="Estado">
                <select
                  value={form.status}
                  onChange={e => set('status', e.target.value as PrescriptionStatus)}
                  className={inputClass}
                >
                  {(Object.keys(STATUS_LABELS) as PrescriptionStatus[]).map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </Field>

              <Field label="Fecha de emisión *">
                <input
                  type="date"
                  value={form.issued_date}
                  onChange={e => set('issued_date', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Vence el"
                hint="Si lo dejas vacío se usa el término del tratamiento."
              >
                <input
                  type="date"
                  value={form.valid_until}
                  onChange={e => set('valid_until', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field
                label="Producto recetado *"
                className="sm:col-span-2"
                error={fieldErrors.product_name}
              >
                <input
                  value={form.product_name}
                  onChange={e => set('product_name', e.target.value)}
                  placeholder="Ej: Hongos psilocibios secos encapsulados"
                  className={inputClass}
                />
              </Field>

              <Field label="Presentación" hint="Cómo se entrega: cápsula, gomita, aceite…">
                <input
                  value={form.presentation}
                  onChange={e => set('presentation', e.target.value)}
                  className={inputClass}
                />
              </Field>

              <Field label="Diagnóstico">
                <input
                  value={form.diagnosis}
                  onChange={e => set('diagnosis', e.target.value)}
                  placeholder="Ej: Trastorno ansioso-depresivo"
                  className={inputClass}
                />
              </Field>
            </div>
          </Card>

          {/* Posología */}
          <Card className="p-6">
            <SectionTitle hint="De aquí sale el cálculo de consumo y el requerimiento de producción.">
              Posología
            </SectionTitle>

            <Field label="Esquema de toma" hint={SCHEDULE_HINTS[form.schedule_type]}>
              <div className="grid sm:grid-cols-2 gap-2">
                {SCHEDULES.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => set('schedule_type', s)}
                    className={`text-left text-sm px-3.5 py-2.5 ${touchTarget} rounded-xl border transition-colors ${
                      form.schedule_type === s
                        ? 'border-[#C8923A] bg-[#C8923A]/10 text-[#4A1E0A] font-medium'
                        : 'border-[#E8D5B5] bg-white text-[#7A3B1E] hover:border-[#C8923A]/50'
                    }`}
                  >
                    {SCHEDULE_LABELS[s]}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid sm:grid-cols-3 gap-4 mt-5">
              {form.schedule_type === 'monthly_quota' ? (
                <>
                  <Field label="Cuota mensual (g) *" hint="10.000 mg = 10 g">
                    <DecimalInput
                      value={form.monthly_quota_g}
                      onChange={v => set('monthly_quota_g', v)}
                      placeholder="Ej: 10"
                    />
                  </Field>
                  <Field
                    label="Gramos por unidad *"
                    hint="Obligatorio: convierte la cuota a unidades. Ej: 0,2"
                    error={fieldErrors.unit_size_g}
                  >
                    <DecimalInput
                      value={form.unit_size_g}
                      onChange={v => set('unit_size_g', v)}
                      placeholder="0,2"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field
                    label="Gramos por unidad *"
                    hint="Obligatorio. Ej: cápsula de 0,2 g → 0,2"
                    error={fieldErrors.unit_size_g}
                  >
                    <DecimalInput
                      value={form.unit_size_g}
                      onChange={v => set('unit_size_g', v)}
                      placeholder="0,2"
                    />
                  </Field>
                  <Field label="Unidades por toma *">
                    <DecimalInput
                      value={form.units_per_intake}
                      onChange={v => set('units_per_intake', v)}
                    />
                  </Field>
                  <Field label="Tomas al día *">
                    <DecimalInput
                      value={form.intakes_per_day}
                      onChange={v => set('intakes_per_day', v)}
                    />
                  </Field>
                </>
              )}

              {form.schedule_type === 'days_per_week' && (
                <Field label="Días por semana *" hint="«6 veces a la semana» → 6">
                  <DecimalInput
                    value={form.days_per_week}
                    onChange={v => set('days_per_week', v)}
                  />
                </Field>
              )}

              {form.schedule_type === 'cycle' && (
                <>
                  <Field label="Días de toma *" hint="«tomar 4 días» → 4">
                    <DecimalInput
                      value={form.cycle_days_on}
                      onChange={v => set('cycle_days_on', v)}
                    />
                  </Field>
                  <Field label="Días de descanso *" hint="«suspender 3» → 3">
                    <DecimalInput
                      value={form.cycle_days_off}
                      onChange={v => set('cycle_days_off', v)}
                    />
                  </Field>
                </>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#E8D5B5]">
              <Field label="Duración *" error={fieldErrors.duration_value}>
                <DecimalInput
                  value={form.duration_value}
                  onChange={v => set('duration_value', v)}
                />
              </Field>
              <Field label="Unidad">
                <select
                  value={form.duration_unit}
                  onChange={e => set('duration_unit', e.target.value as DurationUnit)}
                  className={inputClass}
                >
                  {(Object.keys(DURATION_LABELS) as DurationUnit[]).map(u => (
                    <option key={u} value={u}>{DURATION_LABELS[u]}</option>
                  ))}
                </select>
              </Field>
              <Field
                label="Total declarado"
                hint="El total que dice la receta, si lo indica."
              >
                <DecimalInput
                  value={form.declared_total_units}
                  onChange={v => set('declared_total_units', v)}
                  placeholder="Ej: 180"
                />
              </Field>
            </div>
          </Card>

          {/* Documento y notas */}
          <Card className="p-6">
            <SectionTitle>Documento y notas</SectionTitle>

            <Field
              label="Receta escaneada"
              hint="PDF o foto, hasta 10 MB. Se guarda en almacenamiento privado y solo se abre con enlace firmado temporal."
            >
              {form.document_url ? (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-[#6B8F71]">
                    <CheckCircle weight="fill" size={16} />
                    Documento adjunto
                  </span>
                  {documentPending ? (
                    <span className="text-xs text-[#7A3B1E]">
                      Se podrá abrir cuando guardes la receta
                    </span>
                  ) : (
                    <a
                      href={`/api/admin/recetas/documento?path=${encodeURIComponent(form.document_url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className={actionLinkClass}
                    >
                      Ver documento
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => set('document_url', '')}
                    className={`inline-flex items-center ${touchTarget} text-xs text-[#C4513A] hover:text-[#A33625] font-medium`}
                  >
                    Quitar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-[#E8D5B5] rounded-xl py-6 text-center hover:border-[#C8923A] transition-colors disabled:opacity-60"
                >
                  <FileArrowUp weight="fill" size={26} className="text-[#C8923A] mx-auto mb-1.5" />
                  <span className="block text-sm font-medium text-[#4A1E0A]">
                    {uploading ? 'Subiendo…' : 'Adjuntar receta (PDF o foto)'}
                  </span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </Field>

            <div className="mt-4">
              <label className={labelClass}>Notas internas</label>
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Indicaciones adicionales, controles, observaciones…"
                className={`${inputClass} resize-y`}
              />
            </div>
          </Card>

          {/* Acciones */}
          <div>
            {/* Copia compacta del error: el banner de arriba queda fuera de la
                pantalla en el teléfono justo cuando se pulsa «Guardar». */}
            {error && (
              <p className="flex items-start gap-1.5 text-xs text-[#A33625] font-medium mb-2">
                <WarningCircle weight="fill" size={14} className="shrink-0 mt-px" />
                <span>{error}</span>
              </p>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className={`bg-[#4A1E0A] text-[#F5ECD7] px-6 py-2.5 ${touchTarget} rounded-full text-sm font-medium hover:bg-[#7A3B1E] transition-colors disabled:opacity-60`}
              >
                {saving ? 'Guardando…' : isNew ? 'Crear receta' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={cancel}
                className={`border border-[#E8D5B5] text-[#4A1E0A] px-6 py-2.5 ${touchTarget} rounded-full text-sm font-medium hover:bg-[#E8D5B5] transition-colors`}
              >
                Cancelar
              </button>
              {!isNew && (
                <button
                  onClick={remove}
                  disabled={deleting}
                  className={`ml-auto inline-flex items-center ${touchTarget} text-xs text-[#C4513A] hover:text-[#A33625] font-medium transition-colors disabled:opacity-60`}
                >
                  {deleting ? 'Eliminando…' : 'Eliminar receta'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ---------------- Panel de cálculo ---------------- */}
        <div className="lg:sticky lg:top-6">
          <Card className="p-5 bg-[#4A1E0A] border-[#4A1E0A] text-[#F5ECD7]">
            <p className="font-display text-lg font-bold mb-1">Consumo calculado</p>
            <p className="text-xs text-[#F5ECD7]/60 mb-4">
              Se actualiza a medida que completas la posología.
            </p>

            {!hasPosology ? (
              <p className="text-sm text-[#F5ECD7]/70 py-4">
                Completa los gramos por unidad y la frecuencia para ver el cálculo.
              </p>
            ) : (
              <>
                <p className="text-xs text-[#C8923A] leading-relaxed mb-4">
                  {describePosology(posology, form.presentation || 'cápsula')}
                </p>

                <dl className="space-y-2.5 text-sm">
                  <Row label="Diario (promedio)" value={formatGrams(result.gramsPerDay)} />
                  <Row label="Semanal" value={formatGrams(result.gramsPerWeek)} />
                  <Row label="Mensual" value={formatGrams(result.gramsPerMonth)} highlight />
                  <Row
                    label="Días de toma/semana"
                    value={result.activeDaysPerWeek.toLocaleString('es-CL', {
                      maximumFractionDigits: 1,
                    })}
                  />
                </dl>

                <div className="mt-4 pt-4 border-t border-white/15">
                  <dl className="space-y-2.5 text-sm">
                    <Row label="Total del tratamiento" value={formatGrams(result.gramsTotal)} />
                    <Row
                      label="Unidades calculadas"
                      value={formatUnits(result.unitsTotal)}
                    />
                    {result.declaredTotalUnits !== null && (
                      <Row
                        label="Unidades declaradas"
                        value={formatUnits(result.declaredTotalUnits)}
                      />
                    )}
                  </dl>
                </div>

                {endDate && (
                  <p className="text-xs text-[#F5ECD7]/60 mt-4">
                    Vence el{' '}
                    <span className="text-[#F5ECD7] font-medium">
                      {formatExpiry(endDate)}
                    </span>
                  </p>
                )}

                {result.declaredMismatch && (
                  <div className="mt-4 flex items-start gap-2 bg-[#C8923A]/20 border border-[#C8923A]/40 rounded-xl p-3">
                    <Warning weight="fill" size={16} className="text-[#C8923A] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-[#F5ECD7]">
                      El total declarado en la receta ({formatUnits(result.declaredTotalUnits ?? 0)})
                      no coincide con el calculado ({formatUnits(result.unitsTotal)}). Para dispensar
                      manda lo declarado; revisa si la posología quedó bien registrada.
                    </p>
                  </div>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Resumen fijo en el teléfono: el panel de cálculo se apila al final de
          la página y obligaba a recorrerla entera para ver el resultado. */}
      {hasPosology && (
        <div
          className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-[#4A1E0A] text-[#F5ECD7] border-t border-[#7A3B1E] px-4 py-2.5 shadow-[0_-4px_14px_rgba(74,30,10,0.25)]"
        >
          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
            <MiniStat label="Mensual" value={formatGrams(result.gramsPerMonth)} highlight />
            <MiniStat label="Diario" value={formatGrams(result.gramsPerDay)} />
            <MiniStat label="Vence" value={endDate ? formatExpiry(endDate) : '—'} />
          </div>
        </div>
      )}
    </div>
  )
}

function formatExpiry(date: Date): string {
  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[#F5ECD7]/60 text-xs">{label}</dt>
      <dd className={highlight ? 'font-display font-bold text-[#C8923A] text-lg' : 'font-medium'}>
        {value}
      </dd>
    </div>
  )
}

function MiniStat({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-[#F5ECD7]/60">{label}</p>
      <p
        className={`truncate text-sm font-medium ${
          highlight ? 'font-display font-bold text-[#C8923A]' : 'text-[#F5ECD7]'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

export type { FormState as PrescriptionFormState }
