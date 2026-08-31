'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Warning } from '@phosphor-icons/react'

import { deletePatient, savePatient } from '../actions'
import { Card, SectionTitle, inputClass } from '../ui'
import { Field } from '../form'
import type { Patient } from '@/types/dispensario'

const LIST = '/admin/dispensario/pacientes'

interface PatientForm {
  id?: string
  full_name: string
  rut: string
  birth_date: string
  email: string
  phone: string
  address: string
  comuna: string
  city: string
  notes: string
  active: boolean
}

const EMPTY: PatientForm = {
  full_name: '',
  rut: '',
  birth_date: '',
  email: '',
  phone: '',
  address: '',
  comuna: '',
  city: '',
  notes: '',
  active: true,
}

/** Los <input type="date"> solo aceptan YYYY-MM-DD, así que se recorta lo que venga de la base. */
function toDateInput(value: string | null | undefined): string {
  return value ? value.slice(0, 10) : ''
}

/** La base guarda null, no cadenas vacías: así no quedan campos "en blanco" pero presentes. */
function orNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

function fromPatient(p: Patient): PatientForm {
  return {
    id: p.id,
    full_name: p.full_name ?? '',
    rut: p.rut ?? '',
    birth_date: toDateInput(p.birth_date),
    email: p.email ?? '',
    phone: p.phone ?? '',
    address: p.address ?? '',
    comuna: p.comuna ?? '',
    city: p.city ?? '',
    notes: p.notes ?? '',
    active: p.active ?? true,
  }
}

export default function PatientEditor({ initial }: { initial?: Patient }) {
  const router = useRouter()
  const isNew = !initial?.id

  const [form, setForm] = useState<PatientForm>(initial ? fromPatient(initial) : EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  // Sube con cada error mostrado, aunque el texto se repita: así el banner
  // vuelve a la vista si se pulsa Guardar dos veces con el mismo fallo.
  const [errorSeq, setErrorSeq] = useState(0)
  const [nameError, setNameError] = useState('')
  const [success, setSuccess] = useState('')

  const errorRef = useRef<HTMLDivElement | null>(null)
  // Instantánea del formulario al abrirlo, para detectar cambios sin guardar.
  // Va en estado (nunca se actualiza) porque se lee al renderizar.
  const [initialSnapshot] = useState(() => JSON.stringify(initial ? fromPatient(initial) : EMPTY))

  const dirty = !success && JSON.stringify(form) !== initialSnapshot

  // El banner vive arriba y los botones abajo: en el teléfono el mensaje
  // quedaba fuera de pantalla y parecía que Guardar no respondía.
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

  function set<K extends keyof PatientForm>(field: K, value: PatientForm[K]) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (field === 'full_name') setNameError('')
  }

  async function save() {
    if (saving) return

    // El botón ya no se deshabilita: si falta el nombre, se dice cuál es.
    if (!form.full_name.trim()) {
      setNameError('Escribe el nombre del paciente.')
      setSuccess('')
      showError('Falta el nombre completo del paciente: es el único dato obligatorio.')
      return
    }

    setNameError('')
    setSaving(true)
    setError('')
    setSuccess('')

    const result = await savePatient({
      id: form.id,
      full_name: form.full_name,
      rut: orNull(form.rut),
      birth_date: orNull(form.birth_date),
      email: orNull(form.email),
      phone: orNull(form.phone),
      address: orNull(form.address),
      comuna: orNull(form.comuna),
      city: orNull(form.city),
      notes: orNull(form.notes),
      active: form.active,
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
    if (dirty && !confirm('Tienes cambios sin guardar en esta ficha. ¿Salir y descartarlos?')) return
    router.push(LIST)
  }

  async function remove() {
    if (!form.id) return
    if (
      !confirm(
        '¿Eliminar este paciente? Si no tiene historial, se borrarán también sus recetas. ' +
          'Esta acción no se puede deshacer.',
      )
    )
      return

    setDeleting(true)
    setError('')

    const result = await deletePatient(form.id)
    if ('error' in result) {
      // Puede ser un texto de dos frases explicando que hay que desactivar al
      // paciente en vez de borrarlo: se muestra entero, no recortado.
      showError(result.error)
      setDeleting(false)
      return
    }

    router.push(LIST)
  }

  return (
    <Card className="p-6">
      <SectionTitle hint="Los datos de contacto se usan en las fichas y en las entregas.">
        {isNew ? 'Datos del paciente' : 'Editar datos del paciente'}
      </SectionTitle>

      {error && (
        <div
          ref={errorRef}
          role="alert"
          className="bg-[#C4513A]/10 border border-[#C4513A]/40 text-[#C4513A] px-4 py-3 rounded-xl mb-5 text-sm flex items-start gap-2"
        >
          <Warning weight="fill" size={18} className="shrink-0 mt-0.5" />
          <span className="whitespace-pre-line">{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-[#6B8F71]/15 border border-[#6B8F71]/40 text-[#4d6b52] px-4 py-3 rounded-xl mb-5 text-sm">
          {success}
        </div>
      )}

      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre completo *" className="sm:col-span-2" error={nameError}>
            <input
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="Nombre y apellidos"
              className={inputClass}
            />
          </Field>

          <Field label="RUT" hint="Ej: 12.345.678-9">
            <input
              value={form.rut}
              onChange={e => set('rut', e.target.value)}
              placeholder="12.345.678-9"
              className={inputClass}
            />
          </Field>

          <Field label="Fecha de nacimiento">
            <input
              type="date"
              value={form.birth_date}
              onChange={e => set('birth_date', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="paciente@correo.cl"
              className={inputClass}
            />
          </Field>

          <Field label="Teléfono">
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+56 9 1234 5678"
              className={inputClass}
            />
          </Field>

          <Field label="Dirección" className="sm:col-span-2">
            <input
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Calle y número"
              className={inputClass}
            />
          </Field>

          <Field label="Comuna">
            <input
              value={form.comuna}
              onChange={e => set('comuna', e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Ciudad">
            <input
              value={form.city}
              onChange={e => set('city', e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <Field label="Notas" hint="Observaciones internas: alergias, preferencias de entrega, etc.">
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>

        <div>
          <label className="flex items-center gap-2 min-h-[2.75rem] text-sm text-[#4A1E0A] cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => set('active', e.target.checked)}
              className="accent-[#C8923A]"
            />
            Paciente activo
          </label>
          <p className="text-[11px] text-[#7A3B1E] mt-1">
            Desactivarlo lo retira de los listados sin perder su historial de recetas y entregas.
          </p>
        </div>

        <div className="space-y-3 pt-2">
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
              {saving ? 'Guardando…' : isNew ? 'Crear paciente' : 'Guardar cambios'}
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
                {deleting ? 'Eliminando…' : 'Eliminar paciente'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
