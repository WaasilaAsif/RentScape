import { NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'

/**
 * GET /api/auth/me
 * Returns current logged-in user with role
 */
export async function GET() {
  try {
    const user = await getUserWithRole()

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user })

  } catch (err: unknown) {
    const error = err as Error
    console.error('Get user error:', error.message)
    return NextResponse.json(
      { error: 'Failed to get user', message: error.message },
      { status: 500 }
    )
  }
}