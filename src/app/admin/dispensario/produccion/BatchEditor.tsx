'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Info, Warning } from '@phosphor-icons/react'

import { deleteBatch, saveBatch } from '../actions'
import { BATCH_STATUS_LABELS, type BatchStatus, type ProductionBatch } from '@/types/dispensario'
import { Card, SectionTitle, inputClass } from '../ui'
import { DecimalInput, Field, toEditable, toNumber } from '../form'

const LIST = '/admin/dispensario/produccion'

const STATUS_OPTIONS = Object.entries(BATCH_STATUS_LABELS) as [BatchStatus, string][]

/**
 * Las cantidades viajan como texto mientras se editan: así «0,2» se conserva
 * tal cual se teclea y solo se convierte a número al guardar. Con
 * `<input type="number">` el navegador devolvía cadena vacía ante la coma y el
 * lote acababa registrando 0 gramos sin avisar.
 */
interface FormState {
  code: string
  product_name: string
  species: string
  started_at: string
  harvested_at: string
  dried_grams: string
  encapsulated_units: string
  unit_size_g: string
  expires_at: string
  status: BatchStatus
  notes: string
}

const EMPTY: FormState = {
  code: '',
  product_name: '',
  species: '',
  started_at: '',
  harvested_at: '',
  dried_grams: '',
  encapsulated_units: '',
  unit_size_g: '',
  expires_at: '',
  status: 'cultivo',
  notes: '',
}

/** Los <input type="date"> solo aceptan YYYY-MM-DD. */
function toDateInput(value: string | null | undefined): string {
  return value ? String(value).slice(0, 10) : ''
}

function toForm(b: ProductionBatch): FormState {
  return {
    code: b.code ?? '',
    product_name: b.product_name ?? '',
    species: b.species ?? '',
    started_at: toDateInput(b.started_at),
    harvested_at: toDateInput(b.harvested_at),
    dried_grams: toEditable(b.dried_grams),
    encapsulated_units: toEditable(b.encapsulated_units),
    unit_size_g: toEditable(b.unit_size_g),
    expires_at: toDateInput(b.expires_at),
    status: b.status ?? 'cultivo',
    notes: b.notes ?? '',
  }
}

/** Vacío viaja como null, nunca como cadena vacía. */
function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/** Un campo numérico en blanco no es cero: se guarda como null. */
function numberOrNull(value: string): number | null {
  return value.trim() === '' ? null : toNumber(value)
}

interface FieldErrors {
  code?: string
  product_name?: string
}

export default function BatchEditor({ initial }: { initial?: ProductionBatch }) {
  const router = useRouter()
  const isNew = !initial?.id

  const [form, setForm] = useState<FormState>(initial ? toForm(initial) : EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  // Sube cada vez que se muestra un error, aunque el texto se repita: así el
  // banner vuelve a la vista si se pulsa Guardar dos veces con el mismo fallo.
  const [errorSeq, setErrorSeq] = useState(0)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [success, setSuccess] = useState('')

  const errorRef = useRef<HTMLDivElement | null>(null)
  // Instantánea del formulario al abrirlo, para saber si hay cambios sin
  // guardar. Va en estado (nunca se actualiza) porque se lee al renderizar.
  const [initialSnapshot] = useState(() => JSON.stringify(initial ? toForm(initial) : EMPTY))

  const dirty = !success && JSON.stringify(form) !== initialSnapshot

  // El banner de error vive arriba del todo y los botones abajo: en el teléfono
  // el mensaje quedaba fuera de pantalla y parecía que Guardar no hacía nada.
  useEffect(() => {
    if (!error) return
    errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error, errorSeq])

  // Avisa antes de cerrar la pestaña o recargar con cambios pendientes.
  useEffect(() => {
    if (!dirty) return
    function warn(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function showError(message: string) {
    setError(message)
    setErrorSeq(n => n + 1)
  }

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    // Al corregir un obligatorio se retira su marca roja.
    if (field === 'code') setFieldErrors(prev => (prev.code ? { ...prev, code: undefined } : prev))
    if (field === 'product_name') {
      setFieldErrors(prev => (prev.product_name ? { ...prev, product_name: undefined } : prev))
    }
  }

  async function save() {
    if (saving) return

    // El botón ya no se deshabilita: si falta algo, se dice cuál es el campo.
    const missing: FieldErrors = {}
    if (!form.code.trim()) missing.code = 'Escribe el código del lote.'
    if (!form.product_name.trim()) missing.product_name = 'Indica el producto del lote.'

    setFieldErrors(missing)
    if (missing.code || missing.product_name) {
      setSuccess('')
      showError(
        'Faltan datos obligatorios: ' +
          [missing.code && 'código de lote', missing.product_name && 'producto']
            .filter(Boolean)
            .join(' y ') +
          '.',
      )
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    const result = await saveBatch({
      id: initial?.id,
      code: form.code.trim(),
      product_name: form.product_name.trim(),
      species: orNull(form.species),
      started_at: orNull(form.started_at),
      harvested_at: orNull(form.harvested_at),
      dried_grams: toNumber(form.dried_grams),
      encapsulated_units: toNumber(form.encapsulated_units),
      unit_size_g: numberOrNull(form.unit_size_g),
      expires_at: orNull(form.expires_at),
      status: form.status,
      notes: orNull(form.notes),
    })

    setSaving(false)
    if ('error' in result) {
      showError(result.error)
      return
    }

    setSuccess('Guardado correctamente.')
    setTimeout(() => router.push(LIST), 900)
  }

  function cancel() {
    if (dirty && !confirm('Tienes cambios sin guardar en este lote. ¿Salir y descartarlos?')) return
    router.push(LIST)
  }

  async function remove() {
    if (!initial?.id) return
    if (!confirm('¿Eliminar este lote? Esta acción no se puede deshacer.')) return

    setDeleting(true)
    setError('')

    const result = await deleteBatch(initial.id)
    if ('error' in result) {
      showError(result.error)
      setDeleting(false)
      return
    }

    router.push(LIST)
  }

  return (
    <div className="max-w-3xl">
      {error && (
        <div
          ref={errorRef}
          role="alert"
          className="bg-[#C4513A]/10 border border-[#C4513A]/30 text-[#C4513A] px-4 py-3 rounded-xl mb-5 text-sm"
        >
          {error}
        </div>
      )}
      {success && (
        <div className="bg-[#6B8F71]/15 border border-[#6B8F71]/40 text-[#4d6b52] px-4 py-3 rounded-xl mb-5 text-sm">
          {success}
        </div>
      )}

      {/* Este editor solo describe el lote: el inventario se mueve en otra pantalla. */}
      <Card className="p-5 mb-5 border-[#C8923A]/40 bg-[#C8923A]/5 flex items-start gap-3">
        <Info weight="fill" size={20} className="text-[#C8923A] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sm text-[#4A1E0A]">
            Guardar el lote no genera stock
          </p>
          <p className="text-xs text-[#7A3B1E] mt-1">
            Los datos de este formulario describen la producción del lote. El stock disponible se
            registra desde la sección Stock con un movimiento de tipo «Entrada de producción».
          </p>
        </div>
      </Card>

      <Card className="p-6 mb-5">
        <SectionTitle hint="Identificación y origen del lote.">Datos del lote</SectionTitle>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Código de lote *" error={fieldErrors.code}>
              <input
                value={form.code}
                onChange={e => set('code', e.target.value)}
                placeholder="Ej: L-2026-01"
                className={inputClass}
              />
            </Field>

            <Field label="Producto *" error={fieldErrors.product_name}>
              <input
                value={form.product_name}
                onChange={e => set('product_name', e.target.value)}
                placeholder="Nombre del producto del lote"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Especie">
            <input
              value={form.species}
              onChange={e => set('species', e.target.value)}
              placeholder="Ej: Hericium erinaceus"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Inicio de cultivo">
              <input
                type="date"
                value={form.started_at}
                onChange={e => set('started_at', e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Cosecha">
              <input
                type="date"
                value={form.harvested_at}
                onChange={e => set('harvested_at', e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-5">
        <SectionTitle hint="Rendimiento obtenido tras el secado y el encapsulado.">
          Rendimiento
        </SectionTitle>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Gramos secos" hint="Puedes escribir la coma decimal: 800,5.">
              <DecimalInput
                value={form.dried_grams}
                onChange={value => set('dried_grams', value)}
                placeholder="0"
              />
            </Field>

            <Field label="Unidades encapsuladas">
              <DecimalInput
                value={form.encapsulated_units}
                onChange={value => set('encapsulated_units', value)}
                placeholder="0"
              />
            </Field>

            <Field label="Tamaño de unidad" hint="Gramos por cápsula. Ej: 0,25.">
              <DecimalInput
                value={form.unit_size_g}
                onChange={value => set('unit_size_g', value)}
                placeholder="0"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Vencimiento">
              <input
                type="date"
                value={form.expires_at}
                onChange={e => set('expires_at', e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Estado">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value as BatchStatus)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Card>

      <Card className="p-6 mb-5">
        <SectionTitle>Notas</SectionTitle>

        <Field label="Observaciones del lote">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>
      </Card>

      <div className="space-y-3">
        {/* Copia corta del error junto al botón: el banner de arriba queda
            fuera de pantalla en el teléfono. */}
        {error && (
          <p className="flex items-start gap-2 text-xs font-medium text-[#C4513A]">
            <Warning weight="fill" size={16} className="shrink-0 mt-px" />
            <span>{error}</span>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={save}
            aria-busy={saving}
            className="inline-flex items-center justify-center min-h-[2.75rem] bg-[#4A1E0A] text-[#F5ECD7] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7A3B1E] transition-colors"
          >
            {saving ? 'Guardando…' : isNew ? 'Crear lote' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={cancel}
            className="inline-flex items-center justify-center min-h-[2.75rem] border border-[#E8D5B5] text-[#4A1E0A] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#E8D5B5] transition-colors"
          >
            Cancelar
          </button>
          {!isNew && (
            <button
              type="button"
              onClick={remove}
              disabled={deleting}
              className="ml-auto inline-flex items-center justify-center min-h-[2.75rem] px-2 text-xs text-[#C4513A] hover:underline transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando…' : 'Eliminar lote'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
