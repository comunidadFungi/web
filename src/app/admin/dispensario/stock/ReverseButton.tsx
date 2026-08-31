'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUUpLeft } from '@phosphor-icons/react'

import { reverseStockMovement } from '../actions'

/**
 * Anula un movimiento con otro de signo contrario. Pide confirmación porque
 * está en una tabla que en el teléfono se recorre arrastrando el dedo, justo
 * el gesto que provoca toques accidentales.
 */
export default function ReverseButton({
  id,
  summary,
}: {
  id: string
  summary: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function undo() {
    if (!confirm(`¿Anular este movimiento?\n\n${summary}\n\nSe registrará una corrección de signo contrario; el movimiento original seguirá constando en el historial.`)) {
      return
    }

    setBusy(true)
    setError('')
    const res = await reverseStockMovement(id)
    setBusy(false)

    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  return (
    <>
      <button
        onClick={undo}
        disabled={busy}
        title="Anular movimiento"
        className="inline-flex items-center gap-1.5 text-xs text-[#C4513A] hover:underline font-medium whitespace-nowrap disabled:opacity-50 min-h-[2.75rem] px-1"
      >
        <ArrowUUpLeft size={14} weight="bold" />
        {busy ? 'Anulando…' : 'Anular'}
      </button>
      {error && <span className="block text-[11px] text-red-600 mt-1">{error}</span>}
    </>
  )
}
