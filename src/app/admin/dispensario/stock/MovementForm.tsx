'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from '@phosphor-icons/react'

import { MOVEMENT_LABELS, type MovementType } from '@/types/dispensario'

import { addStockMovement } from '../actions'
import { Card, inputClass } from '../ui'
import { DecimalInput, Field, toNumber } from '../form'

export interface Option {
  id: string
  label: string
}

export interface PrescriptionOption extends Option {
  patientId: string
  /** Gramos por cápsula: permite convertir entre gramos y unidades. */
  unitSizeG: number
  /** Unidades que aún autoriza la receta. */
  remainingUnits: number
}

interface FormState {
  type: MovementType
  batch_id: string
  patient_id: string
  prescription_id: string
  /** Texto para admitir el campo vacío, la coma decimal y el signo del ajuste. */
  grams: string
  units: string
  occurred_at: string
  notes: string
}

const EMPTY: FormState = {
  type: 'entrada',
  batch_id: '',
  patient_id: '',
  prescription_id: '',
  grams: '',
  units: '',
  occurred_at: '',
  notes: '',
}

const TYPES = Object.keys(MOVEMENT_LABELS) as MovementType[]

/** <input type="datetime-local"> espera YYYY-MM-DDTHH:mm en hora local, no ISO. */
function nowLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Redondea a un decimal sin arrastrar la imprecisión de coma flotante. */
function round1(n: number): string {
  if (!Number.isFinite(n) || n === 0) return ''
  return String(Math.round(n * 10) / 10).replace('.', ',')
}

export default function MovementForm({
  batches,
  patients,
  prescriptions,
  initialPatientId,
  initialPrescriptionId,
}: {
  batches: Option[]
  patients: Option[]
  prescriptions: PrescriptionOption[]
  /** Vienen de la ficha de una receta, para no reescribirlo todo a mano. */
  initialPatientId?: string
  initialPrescriptionId?: string
}) {
  const router = useRouter()

  const [form, setForm] = useState<FormState>(() =>
    initialPatientId || initialPrescriptionId
      ? {
          ...EMPTY,
          type: 'dispensacion',
          patient_id: initialPatientId ?? '',
          prescription_id: initialPrescriptionId ?? '',
        }
      : EMPTY,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [errorField, setErrorField] = useState<keyof FormState | null>(null)
  const [success, setSuccess] = useState('')
  const errorRef = useRef<HTMLDivElement>(null)

  // «Ahora» depende del reloj del navegador: calcularlo al renderizar daría un
  // valor distinto en el servidor y rompería la hidratación.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valor solo disponible en el cliente
    setForm(prev => (prev.occurred_at ? prev : { ...prev, occurred_at: nowLocal() }))
  }, [])

  const isDispensing = form.type === 'dispensacion'
  const isAdjustment = form.type === 'ajuste'
  const needsBatch = !isAdjustment

  // Con un paciente elegido solo tienen sentido sus propias recetas.
  const visiblePrescriptions = form.patient_id
    ? prescriptions.filter(p => p.patientId === form.patient_id)
    : prescriptions

  const selectedPrescription = prescriptions.find(p => p.id === form.prescription_id) ?? null
  const unitSize = selectedPrescription?.unitSizeG ?? 0

  function clearFeedback() {
    setError('')
    setErrorField(null)
    setSuccess('')
  }

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    clearFeedback()
  }

  /**
   * Gramos y unidades se rellenan mutuamente cuando la receta dice cuántos
   * gramos tiene cada cápsula. Antes había que teclear ambos a mano, y anotar
   * solo gramos hacía que la dispensación contara como cero contra el tope.
   */
  function setGrams(value: string) {
    setForm(prev => ({
      ...prev,
      grams: value,
      units: unitSize > 0 ? round1(toNumber(value) / unitSize) : prev.units,
    }))
    clearFeedback()
  }

  function setUnits(value: string) {
    setForm(prev => ({
      ...prev,
      units: value,
      grams: unitSize > 0 ? round1(toNumber(value) * unitSize) : prev.grams,
    }))
    clearFeedback()
  }

  function changeType(type: MovementType) {
    setForm(prev => ({
      ...prev,
      type,
      patient_id: type === 'dispensacion' ? prev.patient_id : '',
      prescription_id: type === 'dispensacion' ? prev.prescription_id : '',
    }))
    clearFeedback()
  }

  function changePatient(patientId: string) {
    setForm(prev => {
      const stillValid = prescriptions.some(
        p => p.id === prev.prescription_id && p.patientId === patientId,
      )
      return {
        ...prev,
        patient_id: patientId,
        prescription_id: stillValid ? prev.prescription_id : '',
      }
    })
    clearFeedback()
  }

  function reject(message: string, field: keyof FormState) {
    setError(message)
    setErrorField(field)
    setSuccess('')
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  async function submit() {
    const grams = toNumber(form.grams)
    const units = toNumber(form.units)

    if (grams === 0 && units === 0) {
      return reject('Indica una cantidad en gramos o unidades', 'grams')
    }
    // El ajuste es el único tipo con signo libre.
    if (!isAdjustment && (grams < 0 || units < 0)) {
      return reject(
        'Las cantidades deben ser positivas: el signo lo aplica el tipo de movimiento',
        'grams',
      )
    }
    if (needsBatch && !form.batch_id) {
      return reject('Indica de qué lote sale o entra el producto', 'batch_id')
    }
    if (isDispensing && !form.patient_id) {
      return reject('Una dispensación debe indicar el paciente', 'patient_id')
    }
    if (isDispensing && !form.prescription_id) {
      return reject(
        'Una dispensación debe ir asociada a la receta que la autoriza',
        'prescription_id',
      )
    }

    setSaving(true)
    clearFeedback()

    const result = await addStockMovement({
      batch_id: form.batch_id || null,
      prescription_id: isDispensing ? form.prescription_id || null : null,
      patient_id: isDispensing ? form.patient_id || null : null,
      type: form.type,
      grams,
      units,
      occurred_at: form.occurred_at
        ? new Date(form.occurred_at).toISOString()
        : new Date().toISOString(),
      notes: form.notes.trim() || null,
    })

    setSaving(false)
    if ('error' in result) {
      setError(result.error)
      errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setForm({ ...EMPTY, occurred_at: nowLocal(), type: form.type, batch_id: form.batch_id })
    setSuccess('Movimiento registrado.')
    router.refresh()
  }

  return (
    <Card className="p-6">
      <div ref={errorRef}>
        {error && (
          <div className="bg-[#C4513A]/10 border border-[#C4513A]/40 text-[#A33625] px-4 py-3 rounded-xl mb-5 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-[#6B8F71]/15 border border-[#6B8F71]/40 text-[#3F5C46] px-4 py-3 rounded-xl mb-5 text-sm">
            {success}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Tipo de movimiento *">
            <select
              value={form.type}
              onChange={e => changeType(e.target.value as MovementType)}
              className={inputClass}
            >
              {TYPES.map(t => (
                <option key={t} value={t}>{MOVEMENT_LABELS[t]}</option>
              ))}
            </select>
          </Field>

          <Field
            label={needsBatch ? 'Lote *' : 'Lote'}
            error={errorField === 'batch_id' ? 'Elige un lote' : undefined}
            hint={
              needsBatch
                ? 'Sin lote el movimiento no descontaría del inventario.'
                : 'Opcional en los ajustes de inventario global.'
            }
          >
            <select
              value={form.batch_id}
              onChange={e => set('batch_id', e.target.value)}
              className={inputClass}
            >
              <option value="">{needsBatch ? 'Elige un lote…' : 'Sin lote'}</option>
              {batches.map(b => (
                <option key={b.id} value={b.id}>{b.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {isAdjustment && (
          <div className="flex items-start gap-3 rounded-xl border border-[#C8923A]/40 bg-[#C8923A]/10 px-4 py-3">
            <Info weight="fill" size={18} className="text-[#7A5410] shrink-0 mt-0.5" />
            <p className="text-xs text-[#7A3B1E]">
              En un ajuste de inventario puedes ingresar cantidades negativas para restar del
              saldo (por ejemplo <span className="font-semibold">−12</span>) y positivas para
              sumarlo. En los demás tipos el signo lo aplica el sistema.
            </p>
          </div>
        )}

        {isDispensing && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Paciente *"
              error={errorField === 'patient_id' ? 'Elige el paciente' : undefined}
            >
              <select
                value={form.patient_id}
                onChange={e => changePatient(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona un paciente</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </Field>

            <Field
              label="Receta *"
              error={errorField === 'prescription_id' ? 'Elige la receta que autoriza la entrega' : undefined}
              hint={
                selectedPrescription
                  ? `Quedan ${round1(selectedPrescription.remainingUnits) || '0'} unidades por dispensar.`
                  : 'Solo aparecen las recetas vigentes y no vencidas.'
              }
            >
              <select
                value={form.prescription_id}
                onChange={e => set('prescription_id', e.target.value)}
                className={inputClass}
              >
                <option value="">Selecciona la receta</option>
                {visiblePrescriptions.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field
            label="Gramos"
            error={errorField === 'grams' ? 'Indica una cantidad' : undefined}
            hint={unitSize > 0 ? 'Se convierte solo a unidades.' : undefined}
          >
            <DecimalInput value={form.grams} onChange={setGrams} placeholder="0" />
          </Field>

          <Field
            label="Unidades"
            hint={unitSize > 0 ? `Cápsulas de ${String(unitSize).replace('.', ',')} g.` : undefined}
          >
            <DecimalInput value={form.units} onChange={setUnits} placeholder="0" />
          </Field>

          <Field label="Fecha y hora">
            <input
              type="datetime-local"
              value={form.occurred_at}
              onChange={e => set('occurred_at', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Nota">
          <input
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="Observación opcional"
            className={inputClass}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={submit}
            disabled={saving}
            className="bg-[#4A1E0A] text-[#F5ECD7] px-6 py-2.5 min-h-[2.75rem] rounded-full text-sm font-medium hover:bg-[#7A3B1E] transition-colors disabled:opacity-50"
          >
            {saving ? 'Registrando…' : 'Registrar movimiento'}
          </button>
          {error && <span className="text-xs text-[#A33625] font-medium">{error}</span>}
        </div>
      </div>
    </Card>
  )
}
