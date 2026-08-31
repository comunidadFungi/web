import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import AdminSidebar from './AdminSidebar'

export const metadata = { title: 'Admin — Comunidad Fungi' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // `requireAdmin` falla cerrado: sin ADMIN_EMAIL definida no pasa nadie.
  if (!(await requireAdmin())) {
    redirect('/login')
  }

  return (
    // En móvil la barra va arriba y el contenido debajo; desde md, en columnas.
    <div className="min-h-screen bg-[#F0E6D0] md:flex">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-4 sm:p-6 md:p-10">{children}</main>
    </div>
  )
}
