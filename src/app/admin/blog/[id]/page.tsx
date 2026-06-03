import { createAdminClient } from '@/lib/supabase-admin'
import { notFound } from 'next/navigation'
import BlogEditor from '../BlogEditor'
import Link from 'next/link'
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr'

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: post } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  if (!post) notFound()

  return (
    <div>
      <Link href="/admin/blog" className="inline-flex items-center gap-1.5 text-sm text-[#7A3B1E] hover:text-[#4A1E0A] mb-6">
        <ArrowLeft weight="bold" size={14} /> Volver al blog
      </Link>
      <h1 className="font-display text-3xl font-bold text-[#4A1E0A] mb-8">Editar artículo</h1>
      <BlogEditor initial={post} />
    </div>
  )
}
