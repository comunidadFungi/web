import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('products').select('id, name')
  return NextResponse.json({ 
    count: data?.length ?? 0, 
    data,
    error: error?.message,
    env: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
      key: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
    }
  })
}
