import { supabaseAdmin } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  // Direct query to check discussions table
  const { data, error, count } = await supabaseAdmin
    .from('discussions')
    .select('*', { count: 'exact' })
    .limit(5)

  return NextResponse.json({
    count,
    error: error ? { message: error.message, code: error.code, details: error.details } : null,
    rows: data,
  })
}
