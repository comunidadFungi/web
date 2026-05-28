'use client'

import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/products'
import { Trash, Plus, Minus, ShoppingCartSimple, CreditCard, ShieldCheck } from '@phosphor-icons/react'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCheckout() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      router.push('/login?next=/carrito')
      return
    }

    try {
      const res = await fetch('/api/flow/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, total, email: data.user.email }),
      })
      const json = await res.json()
      if (json.url) {
        clearCart()
        window.location.href = json.url
      } else {
        alert('Error al iniciar el pago. Intenta de nuevo.')
      }
    } catch {
      alert('Error de conexión. Intenta de nuevo.')
    }
    setLoading(false)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <ShoppingCartSimple weight="thin" size={80} className="text-[#C8923A] mx-auto mb-6" />
        <h2 className="font-display text-3xl font-bold text-[#4A1E0A] mb-3">Tu carrito está vacío</h2>
        <p className="text-[#7A3B1E] mb-8">Agrega productos para comenzar tu pedido.</p>
        <Link href="/productos" className="bg-[#C4513A] text-white px-8 py-3 rounded-full hover:bg-[#A83D28] transition-colors">
          Ver productos
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-display text-3xl font-bold text-[#4A1E0A] mb-8">Tu carrito</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 border border-[#E8D5B5] shadow-sm">
              <div className="w-20 h-20 bg-[#E8D5B5] rounded-xl flex items-center justify-center text-3xl shrink-0">
                🍄
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-[#4A1E0A] text-base leading-tight">{item.name}</h3>
                <p className="text-[#C4513A] font-bold mt-1">{formatPrice(item.price)}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-full border border-[#E8D5B5] flex items-center justify-center hover:bg-[#E8D5B5] transition-colors"
                  >
                    <Minus weight="bold" size={13} />
                  </button>
                  <span className="text-[#4A1E0A] font-medium w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-[#E8D5B5] flex items-center justify-center hover:bg-[#E8D5B5] transition-colors"
                  >
                    <Plus weight="bold" size={13} />
                  </button>
                  <span className="text-[#7A3B1E] text-sm ml-2">= {formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-[#C4513A] hover:text-[#A83D28] transition-colors self-start"
              >
                <Trash weight="fill" size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-[#E8D5B5] shadow-sm sticky top-24">
            <h2 className="font-display font-bold text-[#4A1E0A] text-xl mb-6">Resumen</h2>
            <div className="space-y-3 mb-6">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-[#7A3B1E]">
                  <span className="truncate mr-2">{item.name} x{item.quantity}</span>
                  <span className="shrink-0">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#E8D5B5] pt-4 mb-6">
              <div className="flex justify-between font-bold text-[#4A1E0A] text-lg">
                <span>Total</span>
                <span className="text-[#C4513A]">{formatPrice(total)}</span>
              </div>
            </div>
            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-[#C4513A] text-white py-4 rounded-xl font-medium hover:bg-[#A83D28] transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-lg flex items-center justify-center gap-2"
            >
              <CreditCard weight="fill" size={20} />
              {loading ? 'Procesando...' : 'Pagar con Flow'}
            </button>
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <ShieldCheck weight="fill" size={14} className="text-[#6B8F71]" />
              <p className="text-xs text-[#7A3B1E]">Pago seguro · WebPay, tarjetas y transferencia</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
