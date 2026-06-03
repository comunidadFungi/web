import Link from 'next/link'
import Image from 'next/image'
import {
  Shield, Users, Heartbeat, ArrowRight, Flask, Star,
  Brain, Globe, BookOpen, Atom, Stethoscope, ShieldCheck,
} from '@phosphor-icons/react/dist/ssr'
import { products } from '@/lib/products'
import HeroSlider from '@/components/HeroSlider'
import RecetaModal from '@/components/RecetaModal'

const testimonials = [
  {
    texto: 'Gracias a la comunidad y al acompañamiento médico, pude integrar mi proceso de una manera segura y transformadora. Cambió mi perspectiva completamente.',
    nombre: 'María J.',
    rol: 'Paciente, Santiago',
  },
  {
    texto: 'La calidad de los productos y la seriedad del equipo me dieron la confianza que necesitaba para comenzar mi tratamiento. Totalmente recomendado.',
    nombre: 'Andrés P.',
    rol: 'Paciente, Valparaíso',
  },
  {
    texto: 'Encontré en Comunidad Fungi la información, el producto y el apoyo profesional que buscaba. Una experiencia de principio a fin impecable.',
    nombre: 'Constanza R.',
    rol: 'Paciente, Concepción',
  },
]

const strains = [
  { cepa: 'Iceberg', mental: 4, corporal: 3, estimulante: 2, creatividad: 5, disolucion: 4 },
  { cepa: 'DC Mac350', mental: 5, corporal: 4, estimulante: 3, creatividad: 4, disolucion: 5 },
  { cepa: 'Flying Tee Pee', mental: 3, corporal: 5, estimulante: 4, creatividad: 3, disolucion: 2 },
  { cepa: 'Albino (A+)', mental: 4, corporal: 3, estimulante: 3, creatividad: 4, disolucion: 3 },
]

const scienceStats = [
  { n: '+5.000', label: 'estudios científicos publicados', Icon: BookOpen },
  { n: '70+',   label: 'años de investigación activa',    Icon: Atom },
  { n: '100+',  label: 'países con ensayos clínicos',     Icon: Globe },
  { n: '80%',   label: 'efectividad en depresión resistente', Icon: Brain },
]

const doctors = ['M.J.', 'A.P.', 'F.V.', 'R.M.', 'C.R.']

function Dots({ value }: { value: number }) {
  return (
    <div className="flex gap-1 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < value ? 'bg-[#C8923A]' : 'bg-[#E8D5B5]'}`} />
      ))}
    </div>
  )
}

export default function HomePage() {
  const microdosis = products.filter(p => p.category === 'Microdosis')
  const macrodosis = products.filter(p => p.category === 'Macrodosis')

  return (
    <div>
      <RecetaModal />

      {/* ── HERO ── */}
      <section className="relative h-[90vh] min-h-[600px] flex items-center justify-center text-[#F5ECD7] overflow-hidden">
        <HeroSlider />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#4A1E0A]/65" />

<div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <p className="animate-fade-in-up text-[#C8923A] text-xs font-medium tracking-[0.4em] uppercase mb-5">
            Bienvenido a
          </p>
          <h1 className="animate-fade-in-up delay-100 font-display text-6xl md:text-8xl font-bold mb-6 leading-tight drop-shadow-lg">
            Comunidad<br />
            <span className="gradient-text">Fungi</span>
          </h1>
          <p className="animate-fade-in-up delay-200 text-white/85 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Dispensamos a toda nuestra comunidad hongos medicinales con calidad garantizada,
            acompañamiento profesional y educación.
          </p>
          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/productos"
              className="animate-pulse-glow bg-[#C4513A] text-white px-10 py-4 rounded-full text-lg font-medium hover:bg-[#A83D28] transition-colors shadow-xl"
            >
              Ver dispensario
            </Link>
            <Link
              href="/comunidad-medica"
              className="border-2 border-[#C8923A] text-[#C8923A] px-10 py-4 rounded-full text-lg font-medium hover:bg-[#C8923A] hover:text-[#4A1E0A] transition-all backdrop-blur-sm"
            >
              Comunidad médica
            </Link>
          </div>

          {/* Trust badges */}
          <div className="animate-fade-in-up delay-400 hidden sm:flex flex-wrap items-center justify-center gap-5 mt-10 text-white/55 text-xs">
            <span className="flex items-center gap-1.5">
              <ShieldCheck weight="fill" size={14} className="text-[#6B8F71]" />
              Marco legal vigente
            </span>
            <span className="text-white/25">·</span>
            <span className="flex items-center gap-1.5">
              <Stethoscope weight="fill" size={14} className="text-[#C8923A]" />
              Acompañamiento médico
            </span>
            <span className="text-white/25">·</span>
            <span className="flex items-center gap-1.5">
              <Flask weight="fill" size={14} className="text-[#C8923A]" />
              Calidad garantizada
            </span>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F5ECD7] to-transparent" />
      </section>

      {/* ── QUÉ HACEMOS ── */}
      <section className="relative bg-[#F5ECD7] py-24 overflow-hidden">
        <div className="absolute inset-0 dot-pattern opacity-50" />
        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-3">Nuestra esencia</p>
            <h2 className="font-display text-4xl font-bold text-[#4A1E0A]">Medicina con propósito</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                Icon: Flask,
                color: 'text-[#C8923A]',
                bg: 'bg-gradient-to-br from-[#C8923A]/20 to-[#C8923A]/5',
                title: '¿Qué hacemos?',
                desc: 'Dispensamos a toda nuestra comunidad hongos medicinales bajo un marco de absoluta transparencia, ética y respeto.',
                delay: '',
              },
              {
                Icon: Shield,
                color: 'text-[#6B8F71]',
                bg: 'bg-gradient-to-br from-[#6B8F71]/20 to-[#6B8F71]/5',
                title: 'Nuestro compromiso',
                desc: 'Calidad garantizada, acompañamiento profesional y educación. Operamos bajo un estricto compromiso con el marco legal vigente.',
                delay: 'delay-100',
              },
              {
                Icon: Heartbeat,
                color: 'text-[#C4513A]',
                bg: 'bg-gradient-to-br from-[#C4513A]/20 to-[#C4513A]/5',
                title: 'Reducción de riesgos',
                desc: 'Proporcionamos información clara y productos que cumplen con estándares de pureza y dosificación responsable.',
                delay: 'delay-200',
              },
            ].map(item => (
              <div
                key={item.title}
                className={`card-lift animate-fade-in-up ${item.delay} text-center p-8 bg-white rounded-2xl border border-[#E8D5B5] shadow-sm group`}
              >
                <div className={`flex items-center justify-center w-16 h-16 ${item.bg} rounded-2xl mx-auto mb-6 transition-transform group-hover:scale-110`}>
                  <item.Icon weight="fill" size={32} className={item.color} />
                </div>
                <h3 className="font-display font-bold text-[#4A1E0A] text-xl mb-3">{item.title}</h3>
                <p className="text-[#7A3B1E] text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SOBRE LA COMUNIDAD ── */}
      <section className="relative py-24 bg-[#4A1E0A] text-[#F5ECD7] overflow-hidden noise">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8923A]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#C4513A]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Sobre la comunidad</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Una asociación de <span className="text-[#C8923A]">usuarios médicos</span>
              </h2>
              <p className="text-[#F5ECD7]/75 leading-relaxed mb-4">
                Comunidad Fungi es una asociación compuesta por usuarios consumidores de hongos y plantas medicinales con fines terapéuticos.
              </p>
              <p className="text-[#F5ECD7]/75 leading-relaxed mb-4">
                Somos productores y usuarios médicos apasionados que compartimos una misión única: entregar la mejor calidad para tus tratamientos.
              </p>
              <p className="text-[#F5ECD7]/75 leading-relaxed mb-10">
                Nuestro propósito es facilitar el acceso de estas medicinas ancestrales bajo un marco de absoluta transparencia, ética y respeto.
              </p>

              {/* Mini stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { n: '500+', label: 'Miembros activos' },
                  { n: '20+',  label: 'Médicos aliados' },
                  { n: '6',    label: 'Variedades' },
                ].map(stat => (
                  <div key={stat.n} className="glass-card rounded-xl p-4 text-center">
                    <p className="font-display text-2xl font-bold text-[#C8923A]">{stat.n}</p>
                    <p className="text-xs text-[#F5ECD7]/55 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>

              <Link href="/legalidad" className="inline-flex items-center gap-2 text-[#C8923A] font-medium hover:underline text-sm">
                Conoce nuestro marco legal <ArrowRight weight="bold" size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden aspect-square relative shadow-2xl">
                <Image src="/images/comunidad1.webp" alt="Comunidad Fungi" fill className="object-cover" />
              </div>
              <div className="rounded-2xl overflow-hidden aspect-square relative mt-8 shadow-2xl">
                <Image src="/images/comunidad2.webp" alt="Comunidad Fungi" fill className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISPENSARIO ── */}
      <section className="py-24 bg-[#EFE0C4]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-3">Dispensario Psylocibe</p>
            <h2 className="font-display text-4xl font-bold text-[#4A1E0A] mb-4">Nuestros productos</h2>
            <p className="text-[#7A3B1E] max-w-xl mx-auto text-sm leading-relaxed">
              Todos nuestros productos son dispensados a pedido con receta médica. Calidad garantizada y dosificación precisa.
            </p>
          </div>

          {/* Microdosis */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-[#6B8F71] text-white text-xs px-3 py-1 rounded-full font-medium">Microdosis</span>
              <span className="text-[#7A3B1E] text-xs">A pedido según receta médica</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {microdosis.map(p => (
                <Link
                  key={p.id}
                  href={`/productos/${p.slug}`}
                  className="card-lift glow-border bg-white rounded-2xl border border-[#E8D5B5] overflow-hidden flex gap-4 items-center p-5 group"
                >
                  <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-[#F5ECD7]">
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-display font-bold text-[#4A1E0A] mb-1 group-hover:text-[#C4513A] transition-colors">{p.name}</h4>
                    <p className="text-[#7A3B1E] text-xs mb-3 leading-relaxed line-clamp-2">{p.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {p.variants?.map(v => (
                        <span key={v.id} className="text-xs bg-[#F5ECD7] border border-[#C8923A]/30 text-[#4A1E0A] px-3 py-1 rounded-full">
                          {v.label} — ${v.price.toLocaleString('es-CL')}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight weight="bold" size={18} className="text-[#C8923A] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Macrodosis */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-[#C4513A] text-white text-xs px-3 py-1 rounded-full font-medium">Macrodosis</span>
              <span className="text-[#C4513A] text-xs font-medium">* Se requiere receta médica</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {macrodosis.map(p => (
                <Link
                  key={p.id}
                  href={`/productos/${p.slug}`}
                  className="card-lift bg-white rounded-2xl border border-[#E8D5B5] overflow-hidden group"
                >
                  <div className="relative aspect-square bg-[#F5ECD7]">
                    <Image src={p.image} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-4">
                    <h4 className="font-display font-bold text-[#4A1E0A] text-sm mb-1 group-hover:text-[#C4513A] transition-colors">
                      {p.name.replace('Hongos Secos — ', '')}
                    </h4>
                    <p className="text-[#7A3B1E] text-xs mb-3 line-clamp-2">{p.description}</p>
                    <p className="text-[#C8923A] font-bold text-sm">
                      Desde ${p.variants?.[0].price.toLocaleString('es-CL')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 bg-[#4A1E0A] text-[#F5ECD7] px-8 py-3 rounded-full font-medium hover:bg-[#7A3B1E] transition-colors shadow-lg"
            >
              Ver todos los productos <ArrowRight weight="bold" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── COMPARATIVA DE CEPAS ── */}
      <section className="bg-[#F5ECD7] py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-3">Variedades y efectos</p>
            <h2 className="font-display text-3xl font-bold text-[#4A1E0A]">Comparativa de cepas</h2>
          </div>
          <div className="bg-white rounded-2xl border border-[#E8D5B5] overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-[#4A1E0A] to-[#7A3B1E] text-[#F5ECD7]">
                    <th className="text-left px-5 py-4 font-semibold">Cepa</th>
                    <th className="text-center px-4 py-4 font-semibold">Mental</th>
                    <th className="text-center px-4 py-4 font-semibold">Corporal</th>
                    <th className="text-center px-4 py-4 font-semibold">Estimulante</th>
                    <th className="text-center px-4 py-4 font-semibold">Creatividad</th>
                    <th className="text-center px-4 py-4 font-semibold">Disolución</th>
                  </tr>
                </thead>
                <tbody>
                  {strains.map((s, i) => (
                    <tr key={s.cepa} className={`border-b border-[#E8D5B5] last:border-0 hover:bg-[#FBF4E8] transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-[#FAF3E5]'}`}>
                      <td className="px-5 py-4 font-semibold text-[#4A1E0A]">{s.cepa}</td>
                      <td className="px-4 py-4"><Dots value={s.mental} /></td>
                      <td className="px-4 py-4"><Dots value={s.corporal} /></td>
                      <td className="px-4 py-4"><Dots value={s.estimulante} /></td>
                      <td className="px-4 py-4"><Dots value={s.creatividad} /></td>
                      <td className="px-4 py-4"><Dots value={s.disolucion} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-[#7A3B1E]/55 text-xs text-center mt-4 italic">
            * La potencia puede variar significativamente según la sensibilidad individual. Siempre comenzar con dosis bajas.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIOS ── */}
      <section className="py-24 bg-[#EFE0C4]">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-3">Nuestros pacientes</p>
            <h2 className="font-display text-3xl font-bold text-[#4A1E0A]">Lo que dice nuestra comunidad</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`card-lift animate-fade-in-up ${['', 'delay-100', 'delay-200'][i]} bg-white rounded-2xl border border-[#E8D5B5] p-7 shadow-sm flex flex-col relative overflow-hidden`}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#C8923A] to-[#C4513A]" />
                <div className="flex gap-1 mb-5 mt-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} weight="fill" size={16} className="text-[#C8923A]" />
                  ))}
                </div>
                <p className="text-[#7A3B1E] text-sm leading-relaxed flex-1 mb-6 italic">"{t.texto}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A1E0A] to-[#7A3B1E] flex items-center justify-center text-[#C8923A] font-bold text-sm shrink-0">
                    {t.nombre[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-[#4A1E0A] text-sm">{t.nombre}</p>
                    <p className="text-[#7A3B1E] text-xs">{t.rol}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── RESPALDO CIENTÍFICO ── */}
      <section className="relative bg-[#2E1005] text-[#F5ECD7] py-28 overflow-hidden noise">
        <div className="absolute inset-0 dot-pattern opacity-20" />
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-[#C8923A]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[#C4513A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4">
          {/* Badge + heading */}
          <div className="text-center mb-18">
            <span className="inline-flex items-center gap-2 border border-[#C8923A]/40 text-[#C8923A] text-xs tracking-[0.3em] uppercase px-5 py-2 rounded-full mb-7">
              <Atom weight="fill" size={13} /> Evidencia científica
            </span>
            <h2 className="font-display text-4xl md:text-6xl font-bold leading-tight">
              Respaldado por<br />
              <span className="gradient-text">décadas de investigación</span>
            </h2>
            <p className="text-[#F5ECD7]/55 mt-6 text-base max-w-xl mx-auto leading-relaxed">
              La psilocibina cuenta con uno de los perfiles de investigación más sólidos en medicina moderna.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-14 mb-16">
            {scienceStats.map((stat, i) => (
              <div
                key={i}
                className={`glass-card glow-border rounded-2xl p-6 text-center animate-fade-in-up ${['', 'delay-100', 'delay-200', 'delay-300'][i]}`}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-[#C8923A]/15 rounded-xl mx-auto mb-4">
                  <stat.Icon weight="fill" size={24} className="text-[#C8923A]" />
                </div>
                <p className="font-display text-3xl md:text-4xl font-bold gradient-text mb-2">{stat.n}</p>
                <p className="text-xs text-[#F5ECD7]/50 leading-relaxed">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Section divider */}
          <div className="section-divider mb-10" />

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://clinicaltrials.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-[#C8923A] text-[#C8923A] px-8 py-3 rounded-full text-sm font-medium hover:bg-[#C8923A] hover:text-[#4A1E0A] transition-colors"
            >
              ClinicalTrials.gov <ArrowRight weight="bold" size={14} />
            </a>
            <Link
              href="/legalidad"
              className="inline-flex items-center gap-2 text-[#F5ECD7]/55 px-8 py-3 rounded-full text-sm hover:text-[#F5ECD7] transition-colors"
            >
              Marco legal en Chile <ArrowRight weight="bold" size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA COMUNIDAD MÉDICA ── */}
      <section className="relative py-28 overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Inicio/Hongo 9.webp"
          alt=""
          fill
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#3A5540]/88 via-[#4A6B50]/82 to-[#3A5540]/92" />
        <div className="absolute inset-0 dot-pattern opacity-15" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#4A1E0A]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 text-center text-white">
          {/* Doctor avatar cluster */}
          <div className="flex items-center justify-center mb-10">
            {doctors.map((init, i) => (
              <div
                key={i}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4A1E0A] to-[#7A3B1E] border-2 border-white/30 flex items-center justify-center text-[#C8923A] text-xs font-bold shadow-lg"
                style={{ marginLeft: i > 0 ? '-10px' : '0', zIndex: doctors.length - i }}
              >
                {init}
              </div>
            ))}
            <div
              className="w-12 h-12 rounded-full bg-white/25 border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold shadow-lg"
              style={{ marginLeft: '-10px' }}
            >
              +15
            </div>
          </div>

          <p className="text-white/60 text-xs font-medium tracking-[0.3em] uppercase mb-4">Red de apoyo profesional</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
            No camines solo<br />en tu proceso
          </h2>
          <p className="text-white/65 mb-10 text-lg leading-relaxed max-w-xl mx-auto">
            Hemos creado una red de aliados de la salud mental listos para apoyarte en tu proceso terapéutico con conocimiento, empatía y respeto.
          </p>

          {/* Role chips */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {['Psiquiatras', 'Psicólogos', 'Médicos integrales', 'Acompañantes'].map(role => (
              <span key={role} className="bg-white/12 border border-white/20 text-white/80 text-xs px-4 py-2 rounded-full backdrop-blur-sm">
                {role}
              </span>
            ))}
          </div>

          <Link
            href="/comunidad-medica"
            className="inline-flex items-center gap-2 bg-[#4A1E0A] text-[#F5ECD7] px-10 py-4 rounded-full text-lg font-medium hover:bg-white hover:text-[#4A1E0A] transition-all shadow-2xl"
          >
            Conoce a nuestros médicos <ArrowRight weight="bold" size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
