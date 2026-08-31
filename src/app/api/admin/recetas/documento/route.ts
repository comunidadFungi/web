import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/auth'

/**
 * Documentos de receta (PDF o foto).
 *
 * A diferencia de /api/admin/upload, que publica en el bucket público
 * "productos", esto usa el bucket privado "recetas": el archivo contiene
 * RUT, diagnóstico y domicilio del paciente, y no puede quedar accesible
 * por URL directa. Se guarda la ruta y se entrega mediante URL firmada
 * de corta duración.
 *
 * Requiere crear el bucket "recetas" en Supabase Storage marcado como
 * privado (Dashboard → Storage → New bucket → desmarcar "Public bucket").
 */

const BUCKET = 'recetas'
const SIGNED_URL_TTL_SECONDS = 300

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic']
const MAX_BYTES = 10 * 1024 * 1024

async function assertAdmin() {
  return (await requireAdmin()) !== null
}

/** Formato que genera el POST: `AAAA/uuid.ext`. Nada más se firma. */
const STORAGE_PATH = /^\d{4}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]{1,5}$/

export async function POST(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'El archivo supera los 10 MB' }, { status: 400 })
  }

  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: 'Formato no admitido. Usa PDF, JPG, PNG o WEBP.' },
      { status: 400 },
    )
  }

  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'pdf'
  const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    const hint = /not found/i.test(error.message)
      ? 'Falta crear el bucket privado "recetas" en Supabase Storage.'
      : error.message
    return NextResponse.json({ error: hint }, { status: 500 })
  }

  // Se guarda la ruta, no una URL: el acceso siempre pasa por este endpoint.
  return NextResponse.json({ path })
}

/** Redirige a una URL firmada temporal para ver el documento. */
export async function GET(req: NextRequest) {
  if (!(await assertAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const path = req.nextUrl.searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'Falta la ruta' }, { status: 400 })

  // Se firma solo lo que el propio sistema generó, y solo si sigue asociado a
  // una receta. Evita usar este endpoint para enumerar el bucket.
  if (!STORAGE_PATH.test(path)) {
    return NextResponse.json({ error: 'Ruta no válida' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: prescription } = await supabase
    .from('prescriptions')
    .select('id')
    .eq('document_url', path)
    .maybeSingle()

  if (!prescription) {
    return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'No se pudo abrir' }, { status: 404 })
  }

  return NextResponse.redirect(data.signedUrl)
}
