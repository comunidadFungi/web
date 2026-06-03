import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Verificar que es el admin
  const supabaseServer = await createClient()
  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const form = await req.formData()
  const file = form.get('file') as File
  if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'webp'
  const filename = `${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const supabase = createAdminClient()
  const { error } = await supabase.storage
    .from('productos')
    .upload(filename, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage
    .from('productos')
    .getPublicUrl(filename)

  return NextResponse.json({ url: publicUrl })
}
