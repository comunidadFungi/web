import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import { ArrowRight, EnvelopeSimple } from '@phosphor-icons/react/dist/ssr'

const CATEGORY_COLORS: Record<string, string> = {
  'Ciencia y Salud': 'bg-[#6B8F71]/20 text-[#6B8F71]',
  'Protocolos':      'bg-[#C8923A]/20 text-[#C8923A]',
  'Macrodosis':      'bg-[#C4513A]/20 text-[#C4513A]',
  'Cuidado Personal':'bg-[#4A1E0A]/20 text-[#4A1E0A]',
  'General':         'bg-[#E8D5B5] text-[#7A3B1E]',
}

export default async function BlogPage() {
  const supabase = await createClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, cover_image, category, created_at')
    .eq('published', true)
    .order('created_at', { ascending: false })

  return (
    <div className="bg-[#F5ECD7] min-h-screen">
      {/* Header */}
      <section className="relative bg-[#4A1E0A] text-[#F5ECD7] py-28 px-4 text-center overflow-hidden">
        <Image
          src="/images/1. Comunidad Fungi/WEB Imagenes/Blog/Hongo 1.webp"
          alt="Blog"
          fill
          className="object-cover opacity-35"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#4A1E0A]/60 via-[#4A1E0A]/45 to-[#4A1E0A]/90" />
        <div className="relative z-10">
          <p className="text-[#C8923A] text-xs font-medium tracking-[0.3em] uppercase mb-4">Educación y comunidad</p>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-5">Blog</h1>
          <p className="text-white/75 text-lg max-w-2xl mx-auto leading-relaxed">
            Noticias, investigación científica y guías prácticas para tu proceso terapéutico.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {!posts?.length ? (
          /* Sin posts aún */
          <div className="text-center py-16">
            <div className="inline-block bg-[#C8923A]/20 text-[#7A3B1E] text-sm font-medium px-4 py-1.5 rounded-full mb-6">
              Contenido en desarrollo
            </div>
            <p className="text-[#7A3B1E]">Pronto publicaremos artículos sobre hongos medicinales, protocolos y bienestar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="bg-white rounded-2xl border border-[#E8D5B5] overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
              >
                {/* Cover */}
                <div className="relative h-44 bg-[#EFE0C4]">
                  {post.cover_image ? (
                    <Image src={post.cover_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍄</div>
                  )}
                  <span className={`absolute top-3 left-3 text-xs font-medium px-3 py-1 rounded-full ${CATEGORY_COLORS[post.category] ?? CATEGORY_COLORS['General']}`}>
                    {post.category}
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-[#7A3B1E] text-xs mb-2">
                    {new Date(post.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <h2 className="font-display font-bold text-[#4A1E0A] text-lg mb-2 leading-snug group-hover:text-[#C4513A] transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-[#7A3B1E] text-sm leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs text-[#C8923A] font-medium">
                    Leer artículo <ArrowRight weight="bold" size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Newsletter */}
      <section className="bg-[#4A1E0A] py-16 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-14 h-14 bg-[#C8923A]/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <EnvelopeSimple weight="fill" size={28} className="text-[#C8923A]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-[#F5ECD7] mb-3">Newsletter</h2>
          <p className="text-[#F5ECD7]/70 text-sm mb-6 leading-relaxed">
            Suscríbete y recibe nuestras guías de bienestar directamente en tu correo. Una vez al mes, sin spam.
          </p>
          <p className="text-[#F5ECD7]/40 text-xs">Próximamente disponible</p>
        </div>
      </section>
    </div>
  )
}
