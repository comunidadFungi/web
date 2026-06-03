import Image from 'next/image'
import { Scales, ShieldCheck, BookOpen, ArrowRight } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

export default function LegalidadPage() {
  return (
    <div className="bg-[#F5ECD7] min-h-screen">
      {/* Header */}
      <section className="relative bg-[#4A1E0A] text-[#F5ECD7] py-28 px-4 text-center overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Legalidad/Hongo 3.webp"
          alt="Legalidad"
          fill
          className="object-cover opacity-55"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A1E0A]/45 via-[#4A1E0A]/30 to-[#4A1E0A]/65" />
        <div className="relative z-10">
          <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Marco legal</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-5">Legalidad</h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto leading-relaxed">
            Operamos bajo un estricto compromiso con el marco legal vigente y el bienestar de nuestra comunidad.
          </p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Compromiso legal */}
        <div className="bg-white rounded-2xl border border-[#E8D5B5] p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-[#4A1E0A] rounded-2xl flex items-center justify-center shrink-0">
              <Scales weight="fill" size={28} className="text-[#C8923A]" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">Nuestro compromiso legal</h2>
              <p className="text-[#7A3B1E] leading-relaxed">
                Operamos bajo un estricto compromiso con el marco legal vigente. Nuestra labor se centra en
                la reducción de riesgos y daños, proporcionando información clara y productos que cumplen
                con estándares de pureza y dosificación responsable. Creemos firmemente que el acceso a
                la información es la base de la libertad personal.
              </p>
            </div>
          </div>
        </div>

        {/* Receta médica */}
        <div className="bg-white rounded-2xl border border-[#E8D5B5] p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-[#6B8F71] rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck weight="fill" size={28} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">Dispensación con receta médica</h2>
              <p className="text-[#7A3B1E] leading-relaxed mb-4">
                Todos nuestros productos son dispensados exclusivamente a pedido y con presentación de
                receta médica válida emitida por un profesional habilitado. Este protocolo garantiza:
              </p>
              <ul className="space-y-2">
                {[
                  'Evaluación previa de la idoneidad del tratamiento para cada paciente',
                  'Dosificación personalizada según el estado de salud del usuario',
                  'Seguimiento y acompañamiento profesional durante el proceso',
                  'Cumplimiento con la normativa sanitaria vigente en Chile',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[#7A3B1E] text-sm">
                    <span className="text-[#C8923A] mt-0.5 shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Marco científico */}
        <div className="bg-white rounded-2xl border border-[#E8D5B5] p-8 mb-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 bg-[#C8923A] rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen weight="fill" size={28} className="text-white" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">Respaldo científico</h2>
              <p className="text-[#7A3B1E] leading-relaxed mb-4">
                Más de 5.000 estudios e investigaciones científicas avalan el uso terapéutico de la
                psilocibina en los últimos 70 años. Instituciones como Johns Hopkins, Imperial College London
                y la Fundación ECOH lideran la investigación en este campo.
              </p>
              <a
                href="https://clinicaltrials.gov"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[#C4513A] text-sm font-medium hover:underline"
              >
                Ver estudios en ClinicalTrials.gov <ArrowRight weight="bold" size={14} />
              </a>
            </div>
          </div>
        </div>

        {/* Reducción de riesgos */}
        <div className="bg-[#4A1E0A] rounded-2xl p-8 text-[#F5ECD7] mb-8">
          <h2 className="font-display text-2xl font-bold mb-4">Reducción de riesgos y daños</h2>
          <p className="text-[#F5ECD7]/80 leading-relaxed mb-6">
            Nuestra misión incluye la educación como pilar fundamental. Proporcionamos información clara
            sobre set &amp; setting, dosis seguras, contraindicaciones y protocolos de integración post-experiencia.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { titulo: 'Set & Setting', desc: 'Preparación mental y entorno adecuado para una experiencia segura' },
              { titulo: 'Dosificación', desc: 'Productos con dosificación precisa y verificada en laboratorio' },
              { titulo: 'Integración', desc: 'Acompañamiento profesional antes, durante y después del proceso' },
            ].map(item => (
              <div key={item.titulo} className="bg-white/10 rounded-xl p-4">
                <p className="font-semibold text-[#C8923A] mb-1">{item.titulo}</p>
                <p className="text-[#F5ECD7]/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/terminos"
            className="inline-flex items-center justify-center gap-2 bg-[#4A1E0A] text-[#F5ECD7] px-7 py-3.5 rounded-full font-medium hover:bg-[#7A3B1E] transition-colors"
          >
            Términos y condiciones
          </Link>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center gap-2 border-2 border-[#4A1E0A] text-[#4A1E0A] px-7 py-3.5 rounded-full font-medium hover:bg-[#4A1E0A] hover:text-[#F5ECD7] transition-colors"
          >
            Consultar dudas legales
          </Link>
        </div>
      </div>
    </div>
  )
}
