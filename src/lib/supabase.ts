import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

type BrowserClient = SupabaseClient

/**
 * Cliente de navegador. Si no hay configuración devuelve un sustituto inerte
 * para que la interfaz siga montando en un entorno sin variables, en vez de
 * romperse al arrancar.
 */
export function createClient(): BrowserClient {
  if (!supabaseUrl || supabaseUrl === 'TU_SUPABASE_URL') {
    const offline = {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase no configurado' } }),
        signUp: async () => ({ error: { message: 'Supabase no configurado' } }),
        signOut: async () => {},
      },
    }
    // El sustituto solo implementa lo que usa la interfaz; el `unknown`
    // intermedio evita `any` y deja constancia de que es deliberado.
    return offline as unknown as BrowserClient
  }
  return createBrowserClient(supabaseUrl, supabaseKey)
}
