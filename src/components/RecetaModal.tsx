'use client'

import { useState, useEffect } from 'react'
import { X, Stethoscope } from '@phosphor-icons/react'
import Link from 'next/link'

export default function RecetaModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem('receta-modal-seen')
    if (!seen) {
      const t = setTimeout(() => setOpen(true), 800)
      return () => clearTimeout(t)
    }
  }, [])

  function close() {
    sessionStorage.setItem('receta-modal-seen', '1')
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
      <div className="relative bg-[#F5ECD7] rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <button
          onClick={close}
          className="absolute top-4 right-4 text-[#7A3B1E] hover:text-[#4A1E0A] transition-colors"
        >
          <X weight="bold" size={22} />
        </button>

        <div className="w-16 h-16 bg-[#4A1E0A] rounded-full flex items-center justify-center mx-auto mb-5">
          <Stethoscope weight="fill" size={32} className="text-[#C8923A]" />
        </div>

        <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">
          ¿Tienes tu receta médica?
        </h2>
        <p className="text-[#7A3B1E] text-sm leading-relaxed mb-6">
          Todos nuestros productos son dispensados a pedido con receta médica válida.
          Operamos bajo un estricto compromiso con el marco legal vigente y el bienestar de nuestra comunidad.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={close}
            className="w-full bg-[#4A1E0A] text-[#F5ECD7] py-3 rounded-full font-medium hover:bg-[#7A3B1E] transition-colors"
          >
            Sí, tengo receta médica
          </button>
          <Link
            href="/comunidad-medica"
            onClick={close}
            className="w-full border-2 border-[#C8923A] text-[#4A1E0A] py-3 rounded-full font-medium hover:bg-[#C8923A]/10 transition-colors text-sm"
          >
            Necesito orientación médica
          </Link>
        </div>

        <p className="text-[#7A3B1E]/60 text-xs mt-5 leading-relaxed">
          Si no cuentas con receta, nuestra red de médicos aliados puede acompañarte en el proceso.
        </p>
      </div>
    </div>
  )
}
