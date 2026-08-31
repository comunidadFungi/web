'use client'

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'

import { inputClass, labelClass } from './ui'

/**
 * Primitivas de formulario. Van aparte de `ui.tsx` porque usan hooks: ese
 * módulo lo importan también los componentes de servidor.
 */

/**
 * Rótulo, campo y ayuda, correctamente enlazados.
 *
 * Genera el `id` y se lo pasa al hijo junto con `aria-describedby`. Antes el
 * `<label>` era solo texto suelto: tocarlo no enfocaba el campo y un lector de
 * pantalla anunciaba un campo sin nombre.
 */
export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label: string
  hint?: string
  /** Marca el campo en rojo y anuncia el problema al lector de pantalla. */
  error?: string
  children: ReactNode
  className?: string
}) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined

  const field = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })
    : children

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <div className={error ? 'rounded-xl ring-2 ring-[#C4513A]' : undefined}>{field}</div>
      {error && (
        <p id={errorId} className="text-[11px] text-[#C4513A] font-medium mt-1">{error}</p>
      )}
      {hint && (
        <p id={hintId} className="text-[11px] text-[#7A3B1E] mt-1">{hint}</p>
      )}
    </div>
  )
}

/**
 * Campo numérico que acepta la coma decimal.
 *
 * Un `<input type="number">` solo admite punto: al teclear «0,2» —como se
 * escribe en Chile, y como ofrece el teclado del teléfono en español— el
 * navegador devolvía cadena vacía sin marcar el campo como inválido. En el
 * editor de lotes eso guardaba 0 gramos en silencio.
 */
export function DecimalInput({
  value,
  onChange,
  className = '',
  ...rest
}: {
  value: string
  onChange: (value: string) => void
  className?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={e => onChange(e.target.value.replace(/[^\d.,-]/g, ''))}
      className={`${inputClass} ${className}`}
    />
  )
}

/** Convierte a número lo que escriba el usuario, con coma o con punto. */
export function toNumber(value: string): number {
  const parsed = Number(String(value).trim().replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : 0
}

/** Prepara un valor de la base para editarlo, con coma como en Chile. */
export function toEditable(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return ''
  return String(value).replace('.', ',')
}
