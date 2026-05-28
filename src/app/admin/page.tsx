import { createClient } from '@/lib/supabase-server'
import { Article, ShoppingCart, Users, Eye } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('user_documents').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    {
      label: 'Posts publicados',
      value: `${publishedPosts ?? 0} / ${totalPosts ?? 0}`,
      Icon: Article,
      color: 'bg-[#C8923A]',
      href: '/admin/blog',
    },
    {
      label: 'Pedidos pendientes',
      value: `${pendingOrders ?? 0} / ${totalOrders ?? 0}`,
      Icon: ShoppingCart,
      color: 'bg-[#C4513A]',
      href: '/admin/pedidos',
    },
    {
      label: 'Usuarios registrados',
      value: String(totalUsers ?? 0),
      Icon: Users,
      color: 'bg-[#6B8F71]',
      href: '/admin/usuarios',
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[#4A1E0A]">Dashboard</h1>
        <p className="text-[#7A3B1E] mt-1">Bienvenido al panel de administración de Comunidad Fungi.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {stats.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-2xl border border-[#E8D5B5] p-6 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
          >
            <div className={`${s.color} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>
              <s.Icon weight="fill" size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[#7A3B1E] text-xs mb-1">{s.label}</p>
              <p className="font-display text-2xl font-bold text-[#4A1E0A]">{s.value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Accesos rápidos */}
      <h2 className="font-display text-xl font-bold text-[#4A1E0A] mb-4">Accesos rápidos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/admin/blog/nuevo"
          className="bg-[#4A1E0A] text-[#F5ECD7] rounded-2xl p-5 flex items-center gap-3 hover:bg-[#7A3B1E] transition-colors"
        >
          <Article weight="fill" size={22} className="text-[#C8923A]" />
          <div>
            <p className="font-semibold">Nuevo post de blog</p>
            <p className="text-xs text-white/60">Crear y publicar un artículo</p>
          </div>
        </Link>
        <Link
          href="/"
          target="_blank"
          className="bg-white border border-[#E8D5B5] text-[#4A1E0A] rounded-2xl p-5 flex items-center gap-3 hover:shadow-md transition-shadow"
        >
          <Eye weight="fill" size={22} className="text-[#C8923A]" />
          <div>
            <p className="font-semibold">Ver sitio web</p>
            <p className="text-xs text-[#7A3B1E]">Abrir la tienda pública</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
