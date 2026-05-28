import Image from 'next/image'

export default function TerminosPage() {
  return (
    <div className="bg-[#F5ECD7] min-h-screen">
      <section className="relative bg-[#4A1E0A] text-[#F5ECD7] py-28 px-4 text-center overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Termino y condiciones/Hongo 1.webp"
          alt="Términos y condiciones"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A1E0A]/65 via-[#4A1E0A]/50 to-[#4A1E0A]/90" />
        <div className="relative z-10">
          <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Legal</p>
          <h1 className="font-display text-5xl font-bold mb-4">Términos y Condiciones</h1>
          <p className="text-white/60 text-sm">Última actualización: Mayo 2026</p>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-10">

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">1. Uso del servicio</h2>
          <p className="text-[#7A3B1E] leading-relaxed">
            Comunidad Fungi es una asociación de usuarios consumidores de hongos y plantas medicinales con
            fines terapéuticos. El acceso a nuestros productos y servicios está reservado exclusivamente a
            personas mayores de 18 años que cuenten con receta médica válida emitida por un profesional
            habilitado. Al acceder a esta plataforma, el usuario declara cumplir con estos requisitos.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">2. Dispensación de productos</h2>
          <p className="text-[#7A3B1E] leading-relaxed mb-3">
            Todos los productos del dispensario son dispensados únicamente:
          </p>
          <ul className="space-y-2 text-[#7A3B1E] text-sm">
            {[
              'Con presentación de receta médica vigente',
              'A personas mayores de 18 años',
              'Para uso personal y terapéutico, no para distribución o reventa',
              'En las cantidades indicadas por el médico tratante',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#C8923A] mt-0.5 shrink-0">•</span>{item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">3. Plazos y envíos</h2>
          <p className="text-[#7A3B1E] leading-relaxed mb-3">
            Los pedidos son procesados una vez verificada la receta médica. Los plazos de despacho son:
          </p>
          <ul className="space-y-2 text-[#7A3B1E] text-sm">
            {[
              'Región Metropolitana: 1-2 días hábiles',
              'Regiones: 2-4 días hábiles según operador logístico',
              'Los envíos se realizan de lunes a viernes en horario hábil',
              'Se entrega número de seguimiento una vez despachado el pedido',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#C8923A] mt-0.5 shrink-0">•</span>{item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">4. Devoluciones</h2>
          <p className="text-[#7A3B1E] leading-relaxed mb-3">
            Dado el carácter médico de los productos, las devoluciones se aceptan únicamente en los
            siguientes casos:
          </p>
          <ul className="space-y-2 text-[#7A3B1E] text-sm">
            {[
              'Producto dañado o defectuoso al momento de recepción',
              'Error en el pedido imputable a Comunidad Fungi',
              'El reclamo debe realizarse dentro de las 24 horas posteriores a la recepción',
              'No se aceptan devoluciones por cambio de opinión una vez dispensado el producto',
            ].map(item => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#C8923A] mt-0.5 shrink-0">•</span>{item}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">5. Responsabilidad</h2>
          <p className="text-[#7A3B1E] leading-relaxed">
            Comunidad Fungi no se hace responsable por el uso indebido de los productos, por efectos
            adversos derivados del no seguimiento de las indicaciones médicas, ni por el incumplimiento
            de las condiciones de uso establecidas en estos términos. El usuario asume la plena
            responsabilidad del uso de los productos dentro del marco de su tratamiento médico.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">6. Privacidad</h2>
          <p className="text-[#7A3B1E] leading-relaxed">
            Los datos personales y médicos de nuestros usuarios son tratados con absoluta confidencialidad,
            conforme a la Ley N° 19.628 sobre Protección de la Vida Privada de Chile. No compartimos
            información con terceros salvo requerimiento legal expreso.
          </p>
        </section>

        <section>
          <h2 className="font-display text-2xl font-bold text-[#4A1E0A] mb-3">7. Contacto</h2>
          <p className="text-[#7A3B1E] leading-relaxed">
            Para cualquier consulta sobre estos términos, contáctanos en{' '}
            <a href="mailto:hola@comunidadfungi.com" className="text-[#C4513A] hover:underline">
              hola@comunidadfungi.com
            </a>{' '}
            o al{' '}
            <a href="https://wa.me/56940547049" target="_blank" rel="noopener noreferrer" className="text-[#C4513A] hover:underline">
              +56 9 4054 7049
            </a>.
          </p>
        </section>

      </div>
    </div>
  )
}
