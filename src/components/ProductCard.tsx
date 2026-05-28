'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Stethoscope, ArrowRight } from '@phosphor-icons/react'
import { Product } from '@/types'

interface Props {
  product: Product
  isLoggedIn: boolean
}

export default function ProductCard({ product, isLoggedIn }: Props) {
  const startingPrice = product.variants?.[0]?.price ?? product.price

  return (
    <Link
      href={`/productos/${product.slug}`}
      className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col border border-[#E8D5B5] group"
    >
      {/* Image */}
      <div className="relative h-52 bg-[#F5ECD7] overflow-hidden">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {product.category === 'Aceites' ? '🫗' : '🍄'}
          </div>
        )}

        <div className={`absolute top-3 left-3 text-white text-xs px-2 py-1 rounded-full font-medium z-10 ${
          product.category === 'Macrodosis' ? 'bg-[#C4513A]' :
          product.category === 'Aceites'    ? 'bg-[#C8923A]' : 'bg-[#6B8F71]'
        }`}>
          {product.category}
        </div>

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-center justify-center z-10">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white text-[#4A1E0A] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
            Ver producto <ArrowRight weight="bold" size={12} />
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-bold text-[#4A1E0A] text-base mb-1 leading-tight group-hover:text-[#C4513A] transition-colors">
          {product.name}
        </h3>
        <p className="text-[#7A3B1E] text-xs leading-relaxed flex-1 mb-3 line-clamp-2">
          {product.description}
        </p>

        {product.variants && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.variants.map(v => (
              <span key={v.id} className="text-[10px] bg-[#F5ECD7] border border-[#E8D5B5] text-[#7A3B1E] px-2 py-0.5 rounded-full">
                {v.label}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto">
          {isLoggedIn ? (
            <div>
              <p className="text-xs text-[#7A3B1E]">Desde</p>
              <span className="text-xl font-bold text-[#C4513A]">
                ${startingPrice.toLocaleString('es-CL')}
              </span>
            </div>
          ) : (
            <Link
              href="/registro"
              onClick={e => e.stopPropagation()}
              className="text-xs bg-[#4A1E0A] text-[#F5ECD7] px-3 py-1.5 rounded-full hover:bg-[#7A3B1E] transition-colors"
            >
              Regístrate para ver precio
            </Link>
          )}

          {product.requiresPrescription && (
            <div className="flex items-center gap-1 text-[10px] text-[#7A3B1E] bg-[#F5ECD7] border border-[#E8D5B5] px-2 py-1 rounded-full">
              <Stethoscope weight="fill" size={11} className="text-[#C8923A]" />
              Receta médica
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
