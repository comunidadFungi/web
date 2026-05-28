'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Basket, List, X, SignOut, Storefront, House, Users, ChatCircle, Article, Scales } from '@phosphor-icons/react'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'
import { createClient } from '@/lib/supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const { count } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: any) => setUser(data.user))
    const { data: listener } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      setUser(session?.user ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <nav className="bg-[#4A1E0A] text-[#F5ECD7] sticky top-0 z-50 shadow-lg" style={{ viewTransitionName: 'site-header' }}>
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.webp" alt="Comunidad Fungi" width={64} height={64} className="rounded-full object-cover" />
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          <Link href="/" className="flex items-center gap-1.5 hover:text-[#C8923A] transition-colors text-sm font-medium">
            <House weight="fill" size={16} />Inicio
          </Link>
          <Link href="/productos" className="flex items-center gap-1.5 hover:text-[#C8923A] transition-colors text-sm font-medium">
            <Storefront weight="fill" size={16} />Productos
          </Link>
          <Link href="/comunidad-medica" className="flex items-center gap-1.5 hover:text-[#C8923A] transition-colors text-sm font-medium">
            <Users weight="fill" size={16} />Consultas médicas
          </Link>
          <Link href="/blog" className="flex items-center gap-1.5 hover:text-[#C8923A] transition-colors text-sm font-medium">
            <Article weight="fill" size={16} />Blog
          </Link>
          <Link href="/legalidad" className="flex items-center gap-1.5 hover:text-[#C8923A] transition-colors text-sm font-medium">
            <Scales weight="fill" size={16} />Legalidad
          </Link>
          <Link href="/contacto" className="flex items-center gap-1.5 hover:text-[#C8923A] transition-colors text-sm font-medium">
            <ChatCircle weight="fill" size={16} />Contacto
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link href="/carrito" className="relative p-2 hover:text-[#C8923A] transition-colors">
            <Basket weight="fill" size={24} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C4513A] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-[#C8923A] max-w-[120px] truncate">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs border border-[#C8923A] px-3 py-1.5 rounded-full hover:bg-[#C8923A] hover:text-[#4A1E0A] transition-colors"
              >
                <SignOut weight="bold" size={14} />
                Salir
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="text-sm hover:text-[#C8923A] transition-colors">
                Ingresar
              </Link>
              <Link href="/registro" className="bg-[#C4513A] text-white text-sm px-4 py-1.5 rounded-full hover:bg-[#A83D28] transition-colors">
                Registrarse
              </Link>
            </div>
          )}

          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X weight="bold" size={22} /> : <List weight="bold" size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-[#3A1506] px-4 pb-4 flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2 py-2 border-b border-[#7A3B1E] hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>
            <House weight="fill" size={16} />Inicio
          </Link>
          <Link href="/productos" className="flex items-center gap-2 py-2 border-b border-[#7A3B1E] hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>
            <Storefront weight="fill" size={16} />Productos
          </Link>
          <Link href="/comunidad-medica" className="flex items-center gap-2 py-2 border-b border-[#7A3B1E] hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>
            <Users weight="fill" size={16} />Consultas médicas
          </Link>
          <Link href="/blog" className="flex items-center gap-2 py-2 border-b border-[#7A3B1E] hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>
            <Article weight="fill" size={16} />Blog
          </Link>
          <Link href="/legalidad" className="flex items-center gap-2 py-2 border-b border-[#7A3B1E] hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>
            <Scales weight="fill" size={16} />Legalidad
          </Link>
          <Link href="/contacto" className="flex items-center gap-2 py-2 border-b border-[#7A3B1E] hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>
            <ChatCircle weight="fill" size={16} />Contacto
          </Link>
          {user ? (
            <>
              <span className="text-xs text-[#C8923A]">{user.email}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 text-left py-2 hover:text-[#C8923A]">
                <SignOut weight="bold" size={16} />Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="py-2 hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>Ingresar</Link>
              <Link href="/registro" className="py-2 hover:text-[#C8923A]" onClick={() => setMenuOpen(false)}>Registrarse</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
