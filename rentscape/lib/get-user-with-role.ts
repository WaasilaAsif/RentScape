import { createSupabaseServerClient } from "./supabase-server"
import { pool } from "./db"

export type UserwithRole = {
  id: string
  email: string | undefined
  role: 'tenant' | 'landlord' | 'admin'
  full_name: string
}

/**
 * Get authenticated user session with role
 * Tries JWT first (fast), falls back to database (for old users)
 */
export async function getUserWithRole(): Promise<UserwithRole | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Try JWT first (new users have role in app_metadata)
  const jwtRole = user.app_metadata?.role || user.user_metadata?.role

  if (jwtRole) {
    return {
      id: user.id,
      email: user.email,
      role: jwtRole as 'tenant' | 'landlord' | 'admin',
      full_name: user.user_metadata?.full_name || user.email || 'User'
    }
  }

  // Fallback to database (old users)
  console.warn('User has no role in JWT, falling back to database:', user.id)
  try {
    const result = await pool.query<{ role: string; full_name: string }>(
      'SELECT role, full_name FROM profiles WHERE id = $1',
      [user.id]
    )

    if (!result.rows[0]) {
      console.error('User has no profile:', user.id)
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: result.rows[0].role as 'tenant' | 'landlord' | 'admin',
      full_name: result.rows[0].full_name
    }
  } catch (err) {
    console.error('Failed to fetch user role:', err)
    return null
  }
}
