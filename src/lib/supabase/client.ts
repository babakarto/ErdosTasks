import { createClient } from '@supabase/supabase-js'

// Browser-side Supabase client using public anon key
// Used for client-side data fetching with RLS enforcement

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables for browser client')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
