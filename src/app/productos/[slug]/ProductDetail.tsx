'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck, ArrowLeft, Stethoscope, ShoppingCartSimple, CheckCircle, WhatsappLogo
} from '@phosphor-icons/react'
import { Product, ProductVariant } from '@/types'
import { useCart } from '@/context/CartContext'

function Dots({ value }: { value: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < value ? 'bg-[#C8923A]' : 'bg-[#E8D5B5]'}`} />
      ))}
    </div>
  )
}

export default function ProductDetail({ product }: { product: Product }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    product.variants?.[0] ?? null
  )
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const images = product.images?.length ? product.images : [product.image]
  const displayPrice = selectedVariant?.price ?? product.price

  const waText = encodeURIComponent(
    `Hola, me interesa ${product.name}${selectedVariant ? ` — ${selectedVariant.label}` : ''}. ¿Podrían indicarme los pasos para solicitarlo con mi receta médica?`
  )
  const waUrl = `https://wa.me/56940547049?text=${waText}`

  function handleAddToCart() {
    addItem({ ...product, price: displayPrice })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[#7A3B1E] mb-8">
        <Link href="/" className="hover:text-[#C4513A] transition-colors">Inicio</Link>
        <span>/</span>
        <Link href="/productos" className="hover:text-[#C4513A] transition-colors">Productos</Link>
        <span>/</span>
        <span className="text-[#4A1E0A] font-medium">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Galería */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#F5ECD7] shadow-lg">
            <Image
              src={images[selectedImage]}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-3">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-[#C4513A] shadow-md scale-105' : 'border-[#E8D5B5] hover:border-[#C8923A]'
                  }`}
                >
                  <Image src={img} alt={`Vista ${i + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <span className={`text-white text-xs px-3 py-1 rounded-full font-medium ${
              product.category === 'Macrodosis' ? 'bg-[#C4513A]' : 'bg-[#6B8F71]'
            }`}>
              {product.category}
            </span>
            {product.requiresPrescription && (
              <span className="flex items-center gap-1 text-xs bg-[#F5ECD7] border border-[#C8923A]/40 text-[#7A3B1E] px-3 py-1 rounded-full">
                <Stethoscope weight="fill" size={12} className="text-[#C8923A]" />
                Requiere receta médica
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-4xl font-bold text-[#4A1E0A] mb-4 leading-tight">
            {product.name}
          </h1>

          {/* Variantes */}
          {product.variants && product.variants.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-medium text-[#4A1E0A] mb-2">Seleccionar cantidad / tamaño:</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-colors ${
                      selectedVariant?.id === v.id
                        ? 'bg-[#4A1E0A] border-[#4A1E0A] text-[#F5ECD7]'
                        : 'bg-white border-[#E8D5B5] text-[#4A1E0A] hover:border-[#C8923A]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Precio */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-4xl font-bold text-[#C4513A]">
              ${displayPrice.toLocaleString('es-CL')}
            </span>
          </div>

          {/* Descripción */}
          <p className="text-[#4A1E0A] leading-relaxed mb-6 text-base">
            {product.longDescription || product.description}
          </p>

          {/* Features */}
          {product.features && (
            <div className="grid grid-cols-2 gap-2 mb-6">
              {product.features.map(f => (
                <div key={f} className="flex items-center gap-2 bg-[#F5ECD7] rounded-xl px-3 py-2">
                  <ShieldCheck weight="fill" size={14} className="text-[#6B8F71] shrink-0" />
                  <span className="text-xs text-[#4A1E0A] font-medium">{f}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tabla de efectos */}
          {product.effectsTable && (() => {
            const ef = product.effectsTable!
            const rows: Array<[string, number]> = [
              ['Efecto mental', ef.mental],
              ['Sensibilidad corporal', ef.corporal],
              ['Nivel estimulante', ef.estimulante],
              ['Creatividad', ef.creatividad],
              ['Disolución del yo', ef.disolucion],
            ]
            return (
              <div className="bg-[#F5ECD7] rounded-2xl p-5 mb-6">
                <p className="font-semibold text-[#4A1E0A] text-sm mb-4">Perfil de efectos</p>
                <div className="space-y-2.5 text-sm">
                  {rows.map(([label, val]) => (
                    <div key={label} className="flex items-center justify-between gap-3">
                      <span className="text-[#7A3B1E] w-36 shrink-0">{label}</span>
                      <Dots value={val} />
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* CTA — Agregar al carrito */}
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-3 bg-[#C4513A] text-white py-4 rounded-xl font-medium text-lg hover:bg-[#A83D28] transition-colors shadow-md mb-3"
          >
            {added
              ? <><CheckCircle weight="fill" size={24} /> Agregado al carrito</>
              : <><ShoppingCartSimple weight="fill" size={24} /> Agregar al carrito</>
            }
          </button>
          {added && (
            <Link
              href="/carrito"
              className="w-full flex items-center justify-center text-sm text-[#C4513A] font-medium hover:underline"
            >
              Ver carrito →
            </Link>
          )}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 bg-[#25D366] text-white py-4 rounded-xl font-medium text-lg hover:bg-[#1ebe5d] transition-colors shadow-md mt-1"
          >
            <WhatsappLogo weight="fill" size={24} />
            Solicitar por WhatsApp
          </a>

          {/* Link a comunidad médica */}
          <div className="mt-5 pt-5 border-t border-[#E8D5B5] text-center">
            <p className="text-sm text-[#7A3B1E] mb-2">¿No tienes receta médica aún?</p>
            <Link href="/comunidad-medica" className="text-[#C4513A] font-medium text-sm hover:underline">
              Conoce nuestra red de médicos aliados →
            </Link>
          </div>
        </div>
      </div>

      {/* Volver */}
      <div className="mt-12">
        <Link
          href="/productos"
          className="flex items-center gap-2 text-[#C4513A] hover:text-[#A83D28] font-medium transition-colors"
        >
          <ArrowLeft weight="bold" size={18} />
          Volver a productos
        </Link>
      </div>
    </div>
  )
}
