import { createSupabaseServerClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error.message)
      return NextResponse.json(
        { error: 'Logout failed', message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Logout successful' })

  } catch (err: unknown) {
    const error = err as Error
    console.error('Logout error:', error.message)
    return NextResponse.json(
      { error: 'Logout failed', message: error.message },
      { status: 500 }
    )
  }
}
