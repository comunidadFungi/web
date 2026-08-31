'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CaretLeft, CaretRight, MagnifyingGlass, X } from '@phosphor-icons/react'

import { Card, inputClass } from './ui'

/**
 * Controles de listado compartidos por el módulo. El estado vive en la URL:
 * así el listado se puede compartir, recargar y volver atrás, y el filtrado
 * ocurre en el servidor sin duplicar los datos en el cliente.
 */

/** Sin retardo se navegaría en cada tecla; con más, la espera se nota. */
const DEBOUNCE_MS = 300

/** 44 px: el mínimo cómodo para el pulgar, que es como se usa esto a diario. */
const CONTROL_HEIGHT = 'min-h-[2.75rem]'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterConfig {
  /** Nombre del parámetro en la URL. */
  name: string
  label: string
  options: FilterOption[]
  /** Valor implícito cuando el parámetro no está en la URL. */
  defaultValue: string
}

export default function ListControls({
  searchLabel,
  placeholder,
  filter,
}: {
  searchLabel: string
  placeholder: string
  filter?: FilterConfig
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const urlQuery = searchParams.get('q') ?? ''
  const [text, setText] = useState(urlQuery)

  // Lo último que esta caja empujó a la URL. Va en estado, no en una ref,
  // porque se lee durante el render y las refs no pueden leerse ahí.
  const [lastPushed, setLastPushed] = useState(urlQuery)

  // La caja debe reflejar los cambios de URL que NO vienen de teclear aquí:
  // el enlace «limpiar filtros» o el botón atrás. Se ajusta durante el render
  // —el patrón que recomienda React— y no en un efecto.
  const [seenQuery, setSeenQuery] = useState(urlQuery)
  if (urlQuery !== seenQuery) {
    setSeenQuery(urlQuery)
    // Si la URL trae justo lo último que empujamos, la caja va por delante
    // (el usuario siguió escribiendo) y sobrescribirla se comería sus teclas.
    if (urlQuery !== lastPushed) setText(urlQuery)
  }

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      // Cualquier cambio de criterio invalida la página en la que estábamos:
      // quedarse en la 3 de un resultado de 4 filas muestra una tabla vacía.
      params.delete('pagina')

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  // El retardo se gestiona en el propio manejador: así la ref del temporizador
  // solo se toca fuera del render, y no hace falta un efecto por cada tecla.
  function onSearchChange(value: string) {
    setText(value)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const trimmed = value.trim()
      setLastPushed(trimmed)
      applyParams({ q: trimmed })
    }, DEBOUNCE_MS)
  }

  // Al desmontar no debe quedar una navegación pendiente.
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  function clearSearch() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setText('')
    setLastPushed('')
    applyParams({ q: '' })
  }

  const filterValue = (() => {
    if (!filter) return ''
    const current = searchParams.get(filter.name)
    return current && filter.options.some(o => o.value === current)
      ? current
      : filter.defaultValue
  })()

  return (
    <Card className="p-3 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MagnifyingGlass
            size={18}
            weight="bold"
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A3B1E]"
          />
          <input
            type="search"
            value={text}
            onChange={event => onSearchChange(event.target.value)}
            aria-label={searchLabel}
            placeholder={placeholder}
            className={`${inputClass} ${CONTROL_HEIGHT} pl-10 pr-11`}
          />
          {text !== '' && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full text-[#7A3B1E] hover:bg-[#F5ECD7] hover:text-[#4A1E0A] transition-colors"
            >
              <X size={16} weight="bold" />
            </button>
          )}
        </div>

        {filter && (
          <select
            value={filterValue}
            aria-label={filter.label}
            onChange={event =>
              applyParams({
                [filter.name]:
                  event.target.value === filter.defaultValue ? '' : event.target.value,
              })
            }
            className={`${inputClass} ${CONTROL_HEIGHT} sm:w-60`}
          >
            {filter.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </Card>
  )
}

/**
 * «Anterior / Siguiente» conservando el resto de parámetros. Se prefiere a una
 * lista de números porque en el teléfono los números quedan demasiado juntos.
 */
export function Pagination({
  page,
  pageSize,
  total,
}: {
  page: number
  pageSize: number
  total: number
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (total === 0) return null

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  function hrefFor(target: number): string {
    const params = new URLSearchParams(searchParams.toString())
    // La página 1 es el estado por omisión: no ensucia la URL.
    if (target > 1) params.set('pagina', String(target))
    else params.delete('pagina')

    const query = params.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  const stepClass =
    'inline-flex items-center gap-1 min-h-[2.75rem] px-4 rounded-full border ' +
    'border-[#E8D5B5] text-sm font-medium transition-colors'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <p className="text-xs text-[#7A3B1E]">
        Mostrando {from}–{to} de {total}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={`${stepClass} text-[#4A1E0A] hover:bg-[#F5ECD7]`}>
              <CaretLeft size={14} weight="bold" />
              Anterior
            </Link>
          ) : (
            <span className={`${stepClass} text-[#7A3B1E] opacity-40`} aria-disabled="true">
              <CaretLeft size={14} weight="bold" />
              Anterior
            </span>
          )}

          <span className="text-xs text-[#7A3B1E] px-1 whitespace-nowrap">
            {page} / {totalPages}
          </span>

          {page < totalPages ? (
            <Link href={hrefFor(page + 1)} className={`${stepClass} text-[#4A1E0A] hover:bg-[#F5ECD7]`}>
              Siguiente
              <CaretRight size={14} weight="bold" />
            </Link>
          ) : (
            <span className={`${stepClass} text-[#7A3B1E] opacity-40`} aria-disabled="true">
              Siguiente
              <CaretRight size={14} weight="bold" />
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Hay datos, pero ninguno pasa los filtros. Distinto del `EmptyState` de «aún
 * no hay nada»: aquí el remedio es quitar filtros, no crear un registro.
 */
export function NoResults({ message }: { message: string }) {
  const pathname = usePathname()

  return (
    <Card className="p-10 text-center">
      <p className="text-[#7A3B1E] text-sm">{message}</p>
      <Link
        href={pathname}
        className="inline-flex items-center min-h-[2.75rem] px-5 mt-4 rounded-full border border-[#E8D5B5] text-sm font-medium text-[#4A1E0A] hover:bg-[#F5ECD7] transition-colors"
      >
        Limpiar filtros
      </Link>
    </Card>
  )
}
