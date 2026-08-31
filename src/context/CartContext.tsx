'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { CartItem, Product } from '@/types'

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}

const CartContext = createContext<CartContextType | null>(null)

/**
 * El carrito se rehidrata en el primer render del cliente, no en un efecto:
 * así no hay un parpadeo con el carrito vacío ni una cascada de renders.
 * En el servidor `window` no existe y se parte de la lista vacía.
 */
function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = window.localStorage.getItem('fungi-cart')
    return saved ? (JSON.parse(saved) as CartItem[]) : []
  } catch {
    // Almacenamiento bloqueado o contenido corrupto: se empieza de cero.
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)

  // Se lee tras montar para no desajustar la hidratación, pero en un solo
  // paso y sin volver a escribir el almacenamiento con la lista vacía.
  useEffect(() => {
    const stored = readStoredCart()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage solo existe en el cliente
    if (stored.length > 0) setItems(stored)
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem('fungi-cart', JSON.stringify(items))
    } catch {
      // Sin almacenamiento el carrito no persiste; no es motivo para fallar.
    }
  }, [items, hydrated])

  function addItem(product: Product) {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id)
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i)
      }
      return [...prev, { ...product, quantity: 1 }]
    })
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQuantity(id: string, quantity: number) {
    if (quantity < 1) return removeItem(id)
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity } : i))
  }

  function clearCart() {
    setItems([])
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
