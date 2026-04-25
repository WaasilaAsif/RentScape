import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    let query = 'SELECT id, full_name, phone FROM profiles WHERE is_active = true'
    const params: string[] = []

    if (role) {
      query += ' AND role = $1'
      params.push(role)
    }

    query += ' ORDER BY full_name'

    const result = await pool.query(query, params)

    // Get emails from auth.users
    const profilesWithEmails = await Promise.all(
      result.rows.map(async (profile) => {
        const emailResult = await pool.query(
          'SELECT email FROM auth.users WHERE id = $1',
          [profile.id]
        )
        return {
          ...profile,
          email: emailResult.rows[0]?.email || 'No email'
        }
      })
    )

    return NextResponse.json({ profiles: profilesWithEmails })

  } catch (error) {
    const err = error as Error
    console.error('GET /api/profiles error:', err.message)
    return NextResponse.json(
      { error: 'Failed to fetch profiles', message: err.message },
      { status: 500 }
    )
  }
}