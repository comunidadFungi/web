'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import ProductCard from '@/components/ProductCard'
import { Product } from '@/types'

const CATEGORIES = ['Todos', 'Microdosis', 'Macrodosis', 'Aceites']

export default function ProductsClient({ allProducts, isLoggedIn }: { allProducts: Product[], isLoggedIn: boolean }) {
  const [filter, setFilter] = useState('Todos')

  const filtered = allProducts.filter(p =>
    filter === 'Todos' || p.category === filter
  )

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-[#4A1E0A] text-[#F5ECD7] py-28 px-4 text-center overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Inicio/Hongo 4.webp"
          alt="Dispensario"
          fill
          className="object-cover opacity-60"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A1E0A]/40 via-[#4A1E0A]/25 to-[#4A1E0A]/65" />
        <div className="relative z-10">
          <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Dispensario Psylocibe</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-5">Nuestros productos</h1>
          <p className="text-white/75 text-lg max-w-xl mx-auto">
            Todos los productos son dispensados a pedido con receta médica válida. Calidad garantizada.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* Aviso registro */}
        {!isLoggedIn && (
          <div className="bg-[#4A1E0A] text-[#F5ECD7] rounded-2xl px-6 py-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-[#C8923A] mb-1">Crea tu cuenta para ver precios</p>
              <p className="text-sm text-white/70">Para acceder a precios y realizar pedidos necesitas registrarte y adjuntar tus documentos.</p>
            </div>
            <Link
              href="/registro"
              className="shrink-0 bg-[#C8923A] text-[#4A1E0A] px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-[#d9a84e] transition-colors"
            >
              Registrarse
            </Link>
          </div>
        )}

        {/* Filtros por categoría */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === cat
                  ? 'bg-[#4A1E0A] text-[#F5ECD7]'
                  : 'bg-white text-[#4A1E0A] border border-[#E8D5B5] hover:border-[#4A1E0A]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Aviso macrodosis */}
        {(filter === 'Todos' || filter === 'Macrodosis') && (
          <div className="bg-[#4A1E0A]/5 border border-[#C8923A]/30 rounded-xl px-5 py-3 mb-8 text-sm text-[#7A3B1E] flex items-center gap-2">
            <span className="text-[#C8923A] font-bold">*</span>
            Los productos de Macrodosis requieren receta médica vigente.
          </div>
        )}

        {/* Grid productos */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-[#7A3B1E]">No hay productos en esta categoría.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} isLoggedIn={isLoggedIn} />
            ))}
          </div>
        )}

        {/* Aviso documentos para comprar */}
        {isLoggedIn && (
          <div className="mt-12 bg-[#F5ECD7] border border-[#E8D5B5] rounded-2xl p-6 text-sm text-[#7A3B1E]">
            <p className="font-semibold text-[#4A1E0A] mb-2">Documentos requeridos para comprar</p>
            <p className="mb-3">Para procesar tu pedido debes adjuntar los siguientes documentos en tu perfil:</p>
            <ul className="space-y-1">
              {['Cédula de identidad (CI)', 'Receta médica vigente', 'Certificado de antecedentes'].map(doc => (
                <li key={doc} className="flex items-center gap-2">
                  <span className="text-[#C8923A]">✓</span> {doc}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
