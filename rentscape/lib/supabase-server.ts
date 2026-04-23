//Can be changed refer Day 3
// @/lib/supabase-server.ts
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// ✅ Server client: respects RLS, uses user's session
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or anon key is missing from environment variables.')
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // server components can't always set cookies
          }
        }
      }
    }
  )
}
// ✅ Admin client: bypasses RLS — USE WITH CAUTION
export function createSupabaseAdminClient() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials are missing from environment variables.')
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey // Never expose this key in the browser.
  )
}