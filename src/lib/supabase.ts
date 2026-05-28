import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

export function createClient() {
  if (!supabaseUrl || supabaseUrl === 'TU_SUPABASE_URL') {
    return {
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: { message: 'Supabase no configurado' } }),
        signUp: async () => ({ error: { message: 'Supabase no configurado' } }),
        signOut: async () => {},
      },
    } as any
  }
  return createBrowserClient(supabaseUrl, supabaseKey)
}
