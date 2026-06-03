'use client'

import { useState } from 'react'
import Image from 'next/image'
import { MapPin, Phone, Envelope, WhatsappLogo, PaperPlaneTilt } from '@phosphor-icons/react'

const WHATSAPP_NUMBER = '56940547049'

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: '', email: '', asunto: '', mensaje: '' })
  const [enviado, setEnviado] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const texto = `Hola! Soy ${form.nombre} (${form.email}).\n\nAsunto: ${form.asunto}\n\n${form.mensaje}`
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setEnviado(true)
  }

  return (
    <div className="bg-[#F5ECD7] min-h-screen">
      {/* Header */}
      <section className="relative bg-[#4A1E0A] text-[#F5ECD7] py-28 px-4 text-center overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Contacto/Hongo 1.webp"
          alt="Contacto"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A1E0A]/60 via-[#4A1E0A]/45 to-[#4A1E0A]/90" />
        <div className="relative z-10">
          <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Estamos aquí para ayudarte</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-5">Contáctanos</h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto">
            ¿Tienes dudas sobre pedidos, receta médica o quieres unirte a la comunidad? ¡Escríbenos!
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">

        {/* Info de contacto */}
        <div className="space-y-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-[#4A1E0A] mb-6">Información de contacto</h2>
            <p className="text-[#7A3B1E] leading-relaxed mb-8">
              Somos una comunidad chilena apasionada por la micología. Respondemos consultas de lunes a viernes,
              y también los fines de semana por WhatsApp.
            </p>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-[#4A1E0A] rounded-full flex items-center justify-center shrink-0">
                <MapPin weight="fill" size={20} className="text-[#C8923A]" />
              </div>
              <div>
                <p className="font-semibold text-[#4A1E0A]">Ubicación</p>
                <p className="text-[#7A3B1E] text-sm">Santiago, Chile</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-[#4A1E0A] rounded-full flex items-center justify-center shrink-0">
                <WhatsappLogo weight="fill" size={20} className="text-[#C8923A]" />
              </div>
              <div>
                <p className="font-semibold text-[#4A1E0A]">WhatsApp</p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C4513A] text-sm hover:underline"
                >
                  +56 9 4054 7049
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-[#4A1E0A] rounded-full flex items-center justify-center shrink-0">
                <Envelope weight="fill" size={20} className="text-[#C8923A]" />
              </div>
              <div>
                <p className="font-semibold text-[#4A1E0A]">Email</p>
                <a href="mailto:hola@comunidadfungi.com" className="text-[#C4513A] text-sm hover:underline">
                  hola@comunidadfungi.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-[#4A1E0A] rounded-full flex items-center justify-center shrink-0">
                <Phone weight="fill" size={20} className="text-[#C8923A]" />
              </div>
              <div>
                <p className="font-semibold text-[#4A1E0A]">Horario de atención</p>
                <p className="text-[#7A3B1E] text-sm">Lun – Vie: 9:00 – 18:00</p>
                <p className="text-[#7A3B1E] text-sm">Sáb: 10:00 – 14:00</p>
              </div>
            </div>
          </div>

          {/* CTA WhatsApp directo */}
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('¡Hola! Tengo una consulta sobre Comunidad Fungi 🍄')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 bg-[#25D366] text-white px-6 py-3 rounded-full font-medium hover:bg-[#1ebe5d] transition-colors shadow-md"
          >
            <WhatsappLogo weight="fill" size={22} />
            Escribir por WhatsApp
          </a>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {enviado ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-10">
              <div className="w-16 h-16 bg-[#C8923A]/20 rounded-full flex items-center justify-center mb-4">
                <PaperPlaneTilt weight="fill" size={32} className="text-[#C8923A]" />
              </div>
              <h3 className="font-display text-2xl font-bold text-[#4A1E0A] mb-2">¡Mensaje enviado!</h3>
              <p className="text-[#7A3B1E] mb-6">Te redirigimos a WhatsApp para completar tu consulta.</p>
              <button
                onClick={() => setEnviado(false)}
                className="text-[#C4513A] text-sm hover:underline"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-6">Envíanos un mensaje</h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#4A1E0A] mb-1.5">Nombre</label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      className="w-full border border-[#C8923A]/30 rounded-lg px-4 py-2.5 text-sm bg-[#F5ECD7]/50 focus:outline-none focus:ring-2 focus:ring-[#C8923A] focus:border-transparent placeholder:text-[#7A3B1E]/40"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#4A1E0A] mb-1.5">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      className="w-full border border-[#C8923A]/30 rounded-lg px-4 py-2.5 text-sm bg-[#F5ECD7]/50 focus:outline-none focus:ring-2 focus:ring-[#C8923A] focus:border-transparent placeholder:text-[#7A3B1E]/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A1E0A] mb-1.5">Asunto</label>
                  <select
                    name="asunto"
                    required
                    value={form.asunto}
                    onChange={handleChange}
                    className="w-full border border-[#C8923A]/30 rounded-lg px-4 py-2.5 text-sm bg-[#F5ECD7]/50 focus:outline-none focus:ring-2 focus:ring-[#C8923A] focus:border-transparent text-[#4A1E0A]"
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="Consulta sobre productos">Consulta sobre productos</option>
                    <option value="Estado de mi pedido">Estado de mi pedido</option>
                    <option value="Consulta sobre cultivo">Consulta sobre cultivo</option>
                    <option value="Membresía">Membresía</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#4A1E0A] mb-1.5">Mensaje</label>
                  <textarea
                    name="mensaje"
                    required
                    rows={5}
                    value={form.mensaje}
                    onChange={handleChange}
                    placeholder="Cuéntanos tu consulta..."
                    className="w-full border border-[#C8923A]/30 rounded-lg px-4 py-2.5 text-sm bg-[#F5ECD7]/50 focus:outline-none focus:ring-2 focus:ring-[#C8923A] focus:border-transparent resize-none placeholder:text-[#7A3B1E]/40"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#C4513A] text-white py-3 rounded-full font-medium hover:bg-[#A83D28] transition-colors flex items-center justify-center gap-2 shadow-md"
                >
                  <PaperPlaneTilt weight="fill" size={18} />
                  Enviar por WhatsApp
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
