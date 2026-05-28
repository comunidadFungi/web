import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-[#4A1E0A] text-[#F5ECD7]">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2">
          <div className="mb-4">
            <Image src="/logo.webp" alt="Comunidad Fungi" width={90} height={90} className="rounded-full object-cover" />
          </div>
          <p className="text-[#C8923A] text-sm leading-relaxed mb-3">
            Dispensamos hongos medicinales a nuestra comunidad con calidad garantizada, acompañamiento profesional y educación.
          </p>
          <p className="text-[#F5ECD7]/70 text-xs leading-relaxed">
            Todos nuestros productos son dispensados a pedido con receta médica válida. Operamos bajo el marco legal vigente.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5">
            <a href="https://instagram.com/comunidadfungi" target="_blank" rel="noopener noreferrer" className="text-[#C8923A] hover:text-[#F5ECD7] transition-colors text-sm">
              @comunidadfungi
            </a>
            <span className="text-[#F5ECD7]/40">·</span>
            <a href="mailto:hola@comunidadfungi.com" className="text-[#C8923A] hover:text-[#F5ECD7] transition-colors text-sm">
              hola@comunidadfungi.com
            </a>
            <span className="text-[#F5ECD7]/40">·</span>
            <a href="https://wa.me/56940547049" target="_blank" rel="noopener noreferrer" className="text-[#C8923A] hover:text-[#F5ECD7] transition-colors text-sm">
              +56 9 4054 7049
            </a>
          </div>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#C8923A]">Dispensario</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/productos" className="hover:text-[#C8923A] transition-colors">Todos los productos</Link></li>
            <li><Link href="/productos?categoria=Microdosis" className="hover:text-[#C8923A] transition-colors">Microdosis</Link></li>
            <li><Link href="/productos?categoria=Macrodosis" className="hover:text-[#C8923A] transition-colors">Macrodosis</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-4 text-[#C8923A]">Comunidad</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/comunidad-medica" className="hover:text-[#C8923A] transition-colors">Comunidad médica</Link></li>
            <li><Link href="/blog" className="hover:text-[#C8923A] transition-colors">Blog</Link></li>
            <li><Link href="/legalidad" className="hover:text-[#C8923A] transition-colors">Legalidad</Link></li>
            <li><Link href="/terminos" className="hover:text-[#C8923A] transition-colors">Términos y condiciones</Link></li>
            <li><Link href="/contacto" className="hover:text-[#C8923A] transition-colors">Contacto</Link></li>
          </ul>
          <p className="text-xs mt-6 text-[#F5ECD7]/70">
            © {new Date().getFullYear()} Comunidad Fungi · Chile
          </p>
        </div>
      </div>
    </footer>
  )
}
