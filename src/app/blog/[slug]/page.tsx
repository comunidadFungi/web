import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'
import { ArrowLeft, CalendarBlank, Tag } from '@phosphor-icons/react/dist/ssr'
import { marked } from 'marked'

const CATEGORY_COLORS: Record<string, string> = {
  'Ciencia y Salud': 'bg-[#6B8F71]/20 text-[#6B8F71]',
  'Protocolos':      'bg-[#C8923A]/20 text-[#C8923A]',
  'Macrodosis':      'bg-[#C4513A]/20 text-[#C4513A]',
  'Cuidado Personal':'bg-[#4A1E0A]/20 text-[#4A1E0A]',
  'General':         'bg-[#E8D5B5] text-[#7A3B1E]',
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) notFound()

  const htmlContent = post.content ? await marked(post.content) : null

  return (
    <div className="bg-[#F5ECD7] min-h-screen">
      {/* Cover Image / Hero */}
      <div className="relative w-full h-72 md:h-96 bg-[#4A1E0A]">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover opacity-70"
            priority
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">🍄</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#4A1E0A]/90 via-[#4A1E0A]/40 to-transparent" />

        {/* Back link */}
        <div className="absolute top-6 left-4 md:left-8 z-10">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[#F5ECD7]/80 hover:text-[#F5ECD7] bg-[#4A1E0A]/60 backdrop-blur-sm px-3 py-1.5 rounded-full transition-colors"
          >
            <ArrowLeft weight="bold" size={14} /> Volver al blog
          </Link>
        </div>

        {/* Title over image */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10">
          <div className="max-w-3xl mx-auto">
            <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full mb-3 ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS['General']}`}>
              {post.category}
            </span>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-[#F5ECD7] leading-tight">
              {post.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Meta + Content */}
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-[#7A3B1E] mb-8 pb-8 border-b border-[#E8D5B5]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarBlank weight="bold" size={14} />
            {new Date(post.created_at).toLocaleDateString('es-CL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Tag weight="bold" size={14} />
            {post.category}
          </span>
        </div>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-[#4A1E0A] text-lg leading-relaxed mb-8 font-medium">
            {post.excerpt}
          </p>
        )}

        {/* Markdown content */}
        {htmlContent ? (
          <article
            className="prose prose-stone max-w-none
              [&_h2]:font-display [&_h2]:text-[#4A1E0A] [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-8 [&_h2]:mb-4
              [&_h3]:font-display [&_h3]:text-[#4A1E0A] [&_h3]:font-semibold [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-3
              [&_p]:text-[#4A1E0A] [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:text-[#4A1E0A] [&_ul]:pl-5 [&_ul]:mb-4
              [&_ol]:text-[#4A1E0A] [&_ol]:pl-5 [&_ol]:mb-4
              [&_li]:mb-1.5
              [&_strong]:text-[#4A1E0A] [&_strong]:font-semibold
              [&_a]:text-[#C8923A] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[#C4513A]
              [&_blockquote]:border-l-4 [&_blockquote]:border-[#C8923A] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#7A3B1E] [&_blockquote]:my-6
              [&_hr]:border-[#E8D5B5] [&_hr]:my-8
              [&_img]:rounded-xl [&_img]:shadow-md [&_img]:my-6"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <p className="text-[#7A3B1E] italic">Este artículo no tiene contenido aún.</p>
        )}

        {/* Footer nav */}
        <div className="mt-12 pt-8 border-t border-[#E8D5B5]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-[#C8923A] font-medium hover:text-[#C4513A] transition-colors"
          >
            <ArrowLeft weight="bold" size={14} /> Ver todos los artículos
          </Link>
        </div>
      </div>
    </div>
  )
}
