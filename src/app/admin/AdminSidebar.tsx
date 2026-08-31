'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  House, Article, ShoppingCart, Users, SignOut, Plant,
  ChartPieSlice, UserList, Prescription, Stethoscope, Flask, Package,
  List, X,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase'

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<{ weight?: 'fill'; size?: number }>
}

const SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Dispensario',
    items: [
      { href: '/admin/dispensario',            label: 'Panel',      Icon: ChartPieSlice },
      { href: '/admin/dispensario/pacientes',  label: 'Pacientes',  Icon: UserList },
      { href: '/admin/dispensario/recetas',    label: 'Recetas',    Icon: Prescription },
      { href: '/admin/dispensario/medicos',    label: 'Médicos',    Icon: Stethoscope },
      { href: '/admin/dispensario/produccion', label: 'Producción', Icon: Flask },
      { href: '/admin/dispensario/stock',      label: 'Stock',      Icon: Package },
    ],
  },
  {
    title: 'Sitio web',
    items: [
      { href: '/admin',           label: 'Dashboard', Icon: House },
      { href: '/admin/productos', label: 'Productos', Icon: Plant },
      { href: '/admin/blog',      label: 'Blog',      Icon: Article },
      { href: '/admin/pedidos',   label: 'Pedidos',   Icon: ShoppingCart },
      { href: '/admin/usuarios',  label: 'Usuarios',  Icon: Users },
    ],
  },
]

/**
 * El enlace activo es el de ruta más específica que coincida, para que
 * /admin/dispensario/recetas no marque también /admin/dispensario ni /admin.
 */
function useActiveHref(pathname: string): string {
  const all = SECTIONS.flatMap(s => s.items.map(i => i.href))
  return all
    .filter(href => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0] ?? ''
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const activeHref = useActiveHref(pathname)

  // Al navegar se cierra el menú móvil. Se ajusta durante el render en vez de
  // en un efecto: así no hay un fotograma con el cajón abierto sobre la página
  // nueva, y se respeta la regla del proyecto sobre setState en efectos.
  const [lastPath, setLastPath] = useState(pathname)
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setOpen(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const nav = (
    <>
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <Image src="/logo.webp" alt="Logo" width={44} height={44} className="rounded-full" />
        <div>
          <p className="font-bold text-sm leading-tight">Comunidad Fungi</p>
          <p className="text-[#C8923A] text-xs">Panel admin</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
        {SECTIONS.map(section => (
          <div key={section.title}>
            <p className="px-4 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#C8923A]/70">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    activeHref === href
                      ? 'bg-[#C8923A] text-[#4A1E0A]'
                      : 'hover:bg-white/10 text-[#F5ECD7]/80'
                  }`}
                >
                  <Icon weight="fill" size={18} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-6 pt-2">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#F5ECD7]/60 hover:bg-white/10 hover:text-[#F5ECD7] transition-colors"
        >
          <SignOut weight="bold" size={18} />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Barra superior — solo móvil */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 bg-[#4A1E0A] text-[#F5ECD7] px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Image src="/logo.webp" alt="" width={32} height={32} className="rounded-full shrink-0" />
          <p className="font-bold text-sm truncate">Comunidad Fungi</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        >
          <List weight="bold" size={22} />
        </button>
      </header>

      {/* Cajón lateral — solo móvil */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#4A1E0A] text-[#F5ECD7] flex flex-col h-full">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-5 right-4 text-[#F5ECD7]/60 hover:text-[#F5ECD7] z-10"
            >
              <X weight="bold" size={20} />
            </button>
            {nav}
          </aside>
        </div>
      )}

      {/* Barra lateral — escritorio */}
      <aside className="hidden md:flex w-60 shrink-0 bg-[#4A1E0A] text-[#F5ECD7] flex-col min-h-screen sticky top-0 max-h-screen">
        {nav}
      </aside>
    </>
  )
}
