import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminSidebar from './AdminSidebar'

export const metadata = { title: 'Admin — Comunidad Fungi' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || (adminEmail && user.email !== adminEmail)) {
    redirect('/login?next=/admin')
  }

  return (
    <div className="flex min-h-screen bg-[#F0E6D0]">
      <AdminSidebar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">{children}</main>
    </div>
  )
}
