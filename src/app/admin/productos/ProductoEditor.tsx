'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { saveProduct, deleteProduct } from './actions'

const CATEGORIES = ['Microdosis', 'Macrodosis', 'Aceites', 'Otros']

interface Variant {
  id: string
  label: string
  price: number
}

interface Producto {
  id?: string
  name: string
  slug: string
  description: string
  long_description: string
  price: number
  image: string
  category: string
  access: 'public' | 'members'
  stock: number
  requires_prescription: boolean
  active: boolean
  features: string
  variants: Variant[]
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

export default function ProductoEditor({ initial }: { initial?: Producto }) {
  const router = useRouter()
  const isNew = !initial?.id

  const [form, setForm] = useState<Producto>(initial ?? {
    name: '', slug: '', description: '', long_description: '',
    price: 0, image: '', category: 'Microdosis',
    access: 'public', stock: 0, requires_prescription: false,
    active: true, features: '', variants: [],
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const data = new FormData()
    data.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: data })
    const json = await res.json()
    setUploading(false)
    if (json.url) set('image', json.url)
    else setError(json.error ?? 'Error al subir imagen')
  }

  function set<K extends keyof Producto>(field: K, value: Producto[K]) {
    setForm(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'name' && isNew) updated.slug = toSlug(value as string)
      return updated
    })
  }

  function addVariant() {
    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { id: crypto.randomUUID(), label: '', price: prev.price }],
    }))
  }

  function updateVariant(idx: number, field: keyof Variant, value: string | number) {
    setForm(prev => {
      const variants = [...prev.variants]
      variants[idx] = { ...variants[idx], [field]: value }
      return { ...prev, variants }
    })
  }

  function removeVariant(idx: number) {
    setForm(prev => ({ ...prev, variants: prev.variants.filter((_, i) => i !== idx) }))
  }

  async function save() {
    setSaving(true)
    setError('')
    setSuccess('')

    const payload = {
      id: form.id,
      name: form.name,
      slug: form.slug,
      description: form.description,
      long_description: form.long_description,
      price: form.price,
      image: form.image,
      category: form.category,
      access: form.access,
      stock: form.stock,
      requires_prescription: form.requires_prescription,
      active: form.active,
      features: form.features.split('\n').filter(Boolean),
      variants: form.variants,
    }

    const result = await saveProduct(payload)
    setSaving(false)
    if (result.error) { setError(result.error); return }
    setSuccess('Guardado correctamente.')
    setTimeout(() => router.push('/admin/productos'), 900)
  }

  async function deleteProducto() {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    await deleteProduct(form.id!)
    router.push('/admin/productos')
  }

  return (
    <div className="max-w-3xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-5 text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-5 text-sm">{success}</div>}

      <div className="space-y-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Nombre *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="Nombre del producto"
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">URL (slug) *</label>
          <div className="flex items-center border border-[#E8D5B5] rounded-xl bg-white overflow-hidden">
            <span className="px-3 py-3 text-xs text-[#7A3B1E] bg-[#F5ECD7] border-r border-[#E8D5B5]">/productos/</span>
            <input
              value={form.slug}
              onChange={e => set('slug', e.target.value)}
              className="flex-1 px-3 py-3 text-sm focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Categoría y Acceso */}
        <div className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Acceso</label>
            <select
              value={form.access}
              onChange={e => set('access', e.target.value as 'public' | 'members')}
              className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
            >
              <option value="public">Público</option>
              <option value="members">Solo miembros</option>
            </select>
          </div>
        </div>

        {/* Precio y Stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Precio base (CLP)</label>
            <input
              type="number"
              value={form.price}
              onChange={e => set('price', Number(e.target.value))}
              className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Stock</label>
            <input
              type="number"
              value={form.stock}
              onChange={e => set('stock', Number(e.target.value))}
              className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
            />
          </div>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Imagen del producto</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-[#E8D5B5] rounded-xl p-5 cursor-pointer hover:border-[#C8923A] transition-colors bg-white text-center"
          >
            {form.image ? (
              <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F5ECD7]">
                  <Image src={form.image} alt="Preview" fill className="object-cover" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-[#4A1E0A]">Imagen cargada</p>
                  <p className="text-xs text-[#7A3B1E] mt-0.5 break-all">{form.image.split('/').pop()}</p>
                  <p className="text-xs text-[#C8923A] mt-1">Click para cambiar</p>
                </div>
              </div>
            ) : (
              <div className="py-4">
                <p className="text-2xl mb-2">🖼️</p>
                <p className="text-sm font-medium text-[#4A1E0A]">
                  {uploading ? 'Subiendo imagen...' : 'Click para subir imagen'}
                </p>
                <p className="text-xs text-[#7A3B1E] mt-1">JPG, PNG o WEBP · Máx. 5 MB</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageUpload}
          />
          {uploading && (
            <p className="text-xs text-[#C8923A] mt-1.5 animate-pulse">Subiendo imagen...</p>
          )}
        </div>

        {/* Descripción corta */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Descripción corta</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            rows={2}
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white resize-none"
          />
        </div>

        {/* Descripción larga */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">Descripción larga</label>
          <textarea
            value={form.long_description}
            onChange={e => set('long_description', e.target.value)}
            rows={5}
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white resize-y"
          />
        </div>

        {/* Características */}
        <div>
          <label className="block text-sm font-semibold text-[#4A1E0A] mb-1.5">
            Características
            <span className="text-xs font-normal text-[#7A3B1E] ml-2">(una por línea)</span>
          </label>
          <textarea
            value={form.features}
            onChange={e => set('features', e.target.value)}
            rows={4}
            placeholder="Dosificación exacta&#10;Requiere receta médica&#10;..."
            className="w-full border border-[#E8D5B5] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white resize-none"
          />
        </div>

        {/* Variantes */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-[#4A1E0A]">Variantes</label>
            <button
              type="button"
              onClick={addVariant}
              className="text-xs text-[#C8923A] hover:underline font-medium"
            >
              + Agregar variante
            </button>
          </div>
          {form.variants.length === 0 && (
            <p className="text-xs text-[#7A3B1E] italic">Sin variantes — se usa el precio base.</p>
          )}
          <div className="space-y-2">
            {form.variants.map((v, i) => (
              <div key={v.id} className="flex gap-2 items-center">
                <input
                  value={v.label}
                  onChange={e => updateVariant(i, 'label', e.target.value)}
                  placeholder="Ej: 30 unidades"
                  className="flex-1 border border-[#E8D5B5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
                />
                <input
                  type="number"
                  value={v.price}
                  onChange={e => updateVariant(i, 'price', Number(e.target.value))}
                  placeholder="Precio"
                  className="w-32 border border-[#E8D5B5] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C8923A] bg-white"
                />
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="text-red-400 hover:text-red-600 text-xs px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Opciones */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-[#4A1E0A] cursor-pointer">
            <input
              type="checkbox"
              checked={form.requires_prescription}
              onChange={e => set('requires_prescription', e.target.checked)}
              className="accent-[#C8923A]"
            />
            Requiere receta médica
          </label>
          <label className="flex items-center gap-2 text-sm text-[#4A1E0A] cursor-pointer">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => set('active', e.target.checked)}
              className="accent-[#C8923A]"
            />
            Producto activo
          </label>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={save}
            disabled={saving || !form.name || !form.slug}
            className="bg-[#4A1E0A] text-[#F5ECD7] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#7A3B1E] transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando…' : isNew ? 'Crear producto' : 'Guardar cambios'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/productos')}
            className="border border-[#E8D5B5] text-[#4A1E0A] px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[#E8D5B5] transition-colors"
          >
            Cancelar
          </button>
          {!isNew && (
            <button
              onClick={deleteProducto}
              disabled={deleting}
              className="ml-auto text-xs text-red-500 hover:text-red-700 transition-colors"
            >
              {deleting ? 'Eliminando…' : 'Eliminar producto'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
