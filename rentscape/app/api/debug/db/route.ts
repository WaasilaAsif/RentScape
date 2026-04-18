import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/get-session'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { propertySchema } from '@/lib/validations/property'

export async function POST(request: NextRequest) {
  // 1. Parse and validate
  const body = await request.json()
  const parsed = propertySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const data = parsed.data

  // 2. Session
  const user = await getSession()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Authorize — must be a landlord
  const supabase = await createSupabaseServerClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error fetching user profile:', profileError, 'User ID:', user.id)
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 })
  }

  if (profile.role !== 'landlord') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 4. Insert with PostGIS (raw SQL via pg pool — Prisma adapter can't handle geography)
  try {
    const result = await pool.query<{
      id: string
      title: string
      city: string
      area: string | null
      property_type: string
      total_units: number
      status: string
      lat: number
      lng: number
    }>(
      `
      INSERT INTO properties (
        landlord_id, title, city, area, property_type,
        total_units, max_occupants_per_unit, location
      )
      VALUES (
        $1::uuid, $2, $3, $4, $5::property_type, $6, $7,
        ST_MakePoint($8, $9)::geography
      )
      RETURNING id, title, city, area, property_type, total_units, status,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng
      `,
      [
        user.id,
        data.title,
        data.city,
        data.area,
        data.property_type,
        data.total_units,
        data.max_occupants_per_unit,
        data.lng,
        data.lat,
      ]
    )

    return NextResponse.json({ property: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('DB error creating property:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}