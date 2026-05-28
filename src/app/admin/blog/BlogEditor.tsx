'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

const CATEGORIES = ['Ciencia y Salud', 'Protocolos', 'Macrodosis', 'Cuidado Personal', 'General']

interface Post {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image: string
  category: string
  published: boolean
}

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

export default function BlogEditor({ initial }: { initial?: Post }) {
  const router = useRouter()
  const supabase = createClient()
  const isNew = !initial?.id

  const [form, setForm] = useState<Post>(initial ?? {
    title: '', slug: '', excerpt: '', content: '',
    cover_image: '', category: 'General', published: false,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function set(field: keyof Post, value: string | boolean) {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'title' && isNew) updated.slug = toSlug(value as string)
      return updated
    })
  }

  async function save(publish?: boolean) {
    setSaving(true)
    setError('')
    setSuccess('')
    const payload = { ...form, published: publish ?? form.published, updated_at: new Date().toISOString() }

    const { error: err } = isNew
      ? await supabase.from('blog_posts').insert(payload)
      : await supabase.from('blog_posts').update(payload).eq('id', form.id!)

    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(publish ? '¡Post publicado!' : 'Guardado como borrador.')
    setTimeout(() => router.push('/admin/blog'), 900)
  }

  async function deletePost() {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    await supabase.from('blog_posts').delete().eq('id', form.id!)
    router.push('/admin/blog')
  }

  return (
    <div className="max-w-3xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm">{success}</div>}

      <div className="space-y-5">
        {/* Título */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Título *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Título del artículo"
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">URL (slug) *</label>
          <div className="flex items-center border border-[#E8D5B5] rounded-xl bg-white overflow-hidden">
            <span className="px-3 py-3 text-xs text-[#7A3B1E] bg-[#F5ECD7] border-r border-[#E8D5B5]">/blog/</span>
            <input
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
              className="flex-1 px-3 py-3 text-sm focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Categoría</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Imagen de portada */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">URL imagen de portada</label>
          <input
            value={form.cover_image}
            onChange={e => set('cover_image', e.target.value)}
            placeholder="https://... o /images/..."
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
          />
        </div>

        {/* Extracto */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Extracto</label>
          <textarea
            value={form.excerpt}
            onChange={e => set('excerpt', e.target.value)}
            rows={3}
            placeholder="Breve descripción que aparece en la lista del blog..."
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white resize-none"
          />
        </div>

        {/* Contenido */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">
            Contenido
            <span className="text-xs font-normal text-[#7A3B1E] ml-2">(puedes usar Markdown: **negrita**, ## títulos, etc.)</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => set('content', e.target.value)}
            rows={18}
            placeholder="Escribe el contenido del artículo aquí..."
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white resize-y font-mono"
          />
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={() => save(true)}
            disabled={saving || !form.title || !form.slug}
            className="bg-[#4A1E0A] text-[#F5ECD7] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7A3B1E] transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : form.published ? 'Actualizar' : 'Publicar'}
          </button>
          <button
            onClick={() => save(false)}
            disabled={saving || !form.title || !form.slug}
            className="border border-[#E8D5B5] text-[#4A1E0A] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#E8D5B5] transition-colors disabled:opacity-50"
          >
            Guardar borrador
          </button>
          {!isNew && (
            <button
              onClick={deletePost}
              disabled={deleting}
              className="ml-auto text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              {deleting ? 'Eliminando…' : 'Eliminar artículo'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
