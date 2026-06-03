import Image from 'next/image'
import { Stethoscope, ArrowRight, WhatsappLogo } from '@phosphor-icons/react/dist/ssr'

const LAR_URL = 'https://beta-sacmed.novacaribe.com/reservaonline/11311'

export default function ComunidadMedicaPage() {
  return (
    <div className="bg-[#F5ECD7] min-h-screen">
      {/* Header */}
      <section className="relative bg-[#4A1E0A] text-[#F5ECD7] py-28 px-4 text-center overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Comunidad Medica/Hongo 6.webp"
          alt="Consultas médicas"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A1E0A]/45 via-[#4A1E0A]/30 to-[#4A1E0A]/65" />
        <div className="relative z-10">
          <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Red de apoyo</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-5">Consultas Médicas</h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto leading-relaxed">
            Entendemos que el uso de psilocibina es una herramienta poderosa para el autoconocimiento. No camines solo en tu proceso.
          </p>
        </div>
      </section>

      {/* Descripción + CTA */}
      <section className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-[#4A1E0A] rounded-full flex items-center justify-center mx-auto mb-8">
          <Stethoscope weight="fill" size={32} className="text-[#C8923A]" />
        </div>

        <h2 className="font-display text-3xl font-bold text-[#4A1E0A] mb-6">
          Acompañamiento profesional para tu proceso
        </h2>

        <p className="text-[#7A3B1E] text-lg leading-relaxed mb-5">
          Para maximizar los beneficios y garantizar un entorno seguro, contamos con una red de profesionales
          de la salud mental listos para apoyarte en tu proceso terapéutico.
        </p>
        <p className="text-[#7A3B1E] text-base leading-relaxed mb-12">
          Todos los profesionales de nuestra red tienen experiencia trabajando con psicodélicos en contextos
          clínicos y terapéuticos, y comparten nuestro compromiso con la ética, la seguridad y el bienestar.
        </p>

        {/* Botón principal */}
        <a
          href={LAR_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#4A1E0A] text-[#F5ECD7] px-10 py-5 rounded-full text-lg font-semibold hover:bg-[#7A3B1E] transition-colors shadow-xl"
        >
          <Stethoscope weight="fill" size={22} />
          Consultas médicas
          <ArrowRight weight="bold" size={20} />
        </a>

        <p className="text-[#7A3B1E]/60 text-sm mt-5">
          Serás redirigido a nuestro servicio de asesoría médica
        </p>
      </section>

      {/* Info cards */}
      <section className="bg-[#4A1E0A] py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { titulo: 'Evaluación previa', desc: 'El profesional evalúa tu situación de salud antes de iniciar el proceso' },
              { titulo: 'Acompañamiento', desc: 'Seguimiento profesional durante todo tu proceso terapéutico' },
              { titulo: 'Integración', desc: 'Apoyo después de la experiencia para integrar los aprendizajes' },
            ].map(item => (
              <div key={item.titulo} className="bg-white/10 rounded-2xl p-6 text-center">
                <p className="font-semibold text-[#C8923A] text-lg mb-2">{item.titulo}</p>
                <p className="text-[#F5ECD7]/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#7A3B1E] mb-6 leading-relaxed">
          ¿Tienes dudas antes de agendar? Contáctanos directamente por WhatsApp.
        </p>
        <a
          href="https://wa.me/56940547049?text=Hola,%20necesito%20orientaci%C3%B3n%20m%C3%A9dica%20para%20mi%20proceso%20con%20psilocibina."
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 bg-[#25D366] text-white px-8 py-3.5 rounded-full font-medium hover:bg-[#1ebe5d] transition-colors shadow-md"
        >
          <WhatsappLogo weight="fill" size={20} />
          Consultar por WhatsApp
        </a>
      </section>
    </div>
  )
}
