import { createClient } from '@/lib/supabase-server'

/**
 * Verificación de administrador, compartida por Server Actions y Route Handlers.
 *
 * Falla cerrado a propósito: si `ADMIN_EMAIL` no está definida, nadie pasa. La
 * forma anterior (`if (adminEmail && user.email !== adminEmail)`) hacía lo
 * contrario — sin la variable, cualquier usuario registrado quedaba como
 * administrador. Como el registro del sitio es abierto y todo el módulo
 * dispensario opera con la service role key (que omite RLS), eso habría dejado
 * los datos clínicos al alcance de cualquiera con una cuenta.
 */
export async function requireAdmin(): Promise<string | null> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) {
    console.error('[auth] ADMIN_EMAIL no está definida: se deniega el acceso al panel.')
    return null
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return null
  if (user.email !== adminEmail) return null

  return user.email
}

export async function isAdmin(): Promise<boolean> {
  return (await requireAdmin()) !== null
}
