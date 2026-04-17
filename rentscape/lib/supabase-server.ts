import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// --- Server Client (cookie-based, respects RLS) ---
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // fill this in
        // ge`tAll: read all cookies from cookieStore
        // setAll: set all cookies on cookieStore
        getAll: () => {
          return cookieStore.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll: (cookies) => {
  try {
    for (const { name, value, ...options } of cookies) {
      cookieStore.set(name, value, { ...options })
    }
  } catch {
    // called from a Server Component — can't set cookies, ignore
  }
}
      }
    }
  )
}

// --- Admin Client (service role, bypasses RLS) ---
export function createSupabaseAdminClient() {
  // fill this in
  // createClient with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

}