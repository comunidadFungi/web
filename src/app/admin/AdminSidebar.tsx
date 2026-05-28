'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  House, Article, ShoppingCart, Users, SignOut,
} from '@phosphor-icons/react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const nav = [
  { href: '/admin',          label: 'Dashboard',  Icon: House },
  { href: '/admin/blog',     label: 'Blog',        Icon: Article },
  { href: '/admin/pedidos',  label: 'Pedidos',     Icon: ShoppingCart },
  { href: '/admin/usuarios', label: 'Usuarios',    Icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-60 shrink-0 bg-[#4A1E0A] text-[#F5ECD7] flex flex-col min-h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <Image src="/logo.webp" alt="Logo" width={44} height={44} className="rounded-full" />
        <div>
          <p className="font-bold text-sm leading-tight">Comunidad Fungi</p>
          <p className="text-[#C8923A] text-xs">Panel admin</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#C8923A] text-[#4A1E0A]'
                  : 'hover:bg-white/10 text-[#F5ECD7]/80'
              }`}
            >
              <Icon weight="fill" size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[#F5ECD7]/60 hover:bg-white/10 hover:text-[#F5ECD7] transition-colors"
        >
          <SignOut weight="bold" size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
