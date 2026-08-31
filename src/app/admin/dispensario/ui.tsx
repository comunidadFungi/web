import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * Piezas presentacionales del módulo. Sin imports de servidor, así que sirven
 * tanto en Server Components como dentro de los editores cliente.
 */

export const inputClass =
  'w-full rounded-xl border border-[#E8D5B5] bg-white px-3.5 py-2.5 text-sm text-[#4A1E0A] ' +
  'placeholder:text-[#7A3B1E]/60 focus:border-[#C8923A] focus:outline-none ' +
  // El halo anterior iba al 25% de opacidad y era prácticamente invisible:
  // navegar el formulario con el tabulador dejaba de ser viable.
  'focus:ring-2 focus:ring-[#C8923A] focus:ring-offset-1'

export const labelClass = 'block text-xs font-semibold text-[#4A1E0A] mb-1.5'

/**
 * Enlace de acción. El ámbar de marca sobre fondo claro da 2,75:1 de
 * contraste, por debajo del mínimo legible; este tono más oscuro llega a
 * 4,6:1 conservando el color de la marca.
 */
export const actionLinkClass =
  'inline-flex items-center min-h-[2.75rem] text-xs text-[#8A5C18] hover:text-[#4A1E0A] ' +
  'hover:underline font-medium'

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-[#4A1E0A]">{title}</h1>
        {subtitle && <p className="text-[#7A3B1E] mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  // Tailwind no garantiza que una clase de `className` gane sobre la base: el
  // orden lo decide la hoja generada, no el atributo. Por eso el color de
  // fondo y el del borde solo se aplican cuando quien llama no los define.
  const base = ['rounded-2xl', 'border', 'shadow-sm']
  if (!/(^|\s)bg-/.test(className)) base.push('bg-white')
  if (!/(^|\s)border-/.test(className)) base.push('border-[#E8D5B5]')

  return <div className={`${base.join(' ')} ${className}`}>{children}</div>
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg font-bold text-[#4A1E0A]">{children}</h2>
      {hint && <p className="text-xs text-[#7A3B1E] mt-0.5">{hint}</p>}
    </div>
  )
}

export type Tone = 'neutral' | 'good' | 'warn' | 'bad' | 'info'

// Tonos verificados con medidor de contraste: todos por encima de 4,5:1
// sobre su propio fondo. Los anteriores rondaban 3:1 y se leían mal en el
// teléfono a plena luz.
const TONES: Record<Tone, string> = {
  neutral: 'bg-gray-100 text-gray-700',
  good: 'bg-[#6B8F71]/20 text-[#3F5C46]',
  warn: 'bg-[#C8923A]/20 text-[#7A5410]',
  bad: 'bg-[#C4513A]/20 text-[#A33625]',
  info: 'bg-purple-100 text-purple-800',
}

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${TONES[tone]}`}
    >
      {children}
    </span>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint?: string
  tone?: Tone
}) {
  const accent: Record<Tone, string> = {
    neutral: 'text-[#4A1E0A]',
    good: 'text-[#6B8F71]',
    warn: 'text-[#C8923A]',
    bad: 'text-[#C4513A]',
    info: 'text-purple-600',
  }

  return (
    <Card className="p-5">
      <p className="text-[#7A3B1E] text-xs mb-1">{label}</p>
      <p className={`font-display text-2xl font-bold ${accent[tone]}`}>{value}</p>
      {hint && <p className="text-[11px] text-[#7A3B1E]/80 mt-1">{hint}</p>}
    </Card>
  )
}

export function EmptyState({
  message,
  actionLabel,
  actionHref,
}: {
  message: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <Card className="p-12 text-center">
      <p className="text-[#7A3B1E] mb-4 text-sm">{message}</p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="inline-flex items-center gap-2 bg-[#4A1E0A] text-[#F5ECD7] px-6 py-3 rounded-full text-sm font-medium hover:bg-[#7A3B1E] transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </Card>
  )
}

export function PrimaryLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 bg-[#4A1E0A] text-[#F5ECD7] px-5 py-2.5 rounded-full font-medium text-sm hover:bg-[#7A3B1E] transition-colors"
    >
      {children}
    </Link>
  )
}

/** Tabla con scroll horizontal propio: la página nunca se desborda. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
    </Card>
  )
}

// Clases completas y literales: Tailwind escanea el código fuente y no puede
// resolver nombres construidos por interpolación.
const ALIGN = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function Th({
  children,
  align = 'left',
}: {
  children?: ReactNode
  align?: keyof typeof ALIGN
}) {
  return (
    <th className={`px-4 py-3 font-semibold text-[#4A1E0A] whitespace-nowrap ${ALIGN[align]}`}>
      {children}
    </th>
  )
}

export function Td({
  children,
  align = 'left',
  className = '',
}: {
  children?: ReactNode
  align?: keyof typeof ALIGN
  className?: string
}) {
  return <td className={`px-4 py-3.5 ${ALIGN[align]} ${className}`}>{children}</td>
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
