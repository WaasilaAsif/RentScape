import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getSession } from '@/lib/get-session'
import { propertySchema } from '@/lib/validations/property'

/**
 * FULL REWRITE: Bypassing Prisma entirely to avoid 
 * PrismaClientConstructorValidationError and connection drops.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate JSON body
    const body = await request.json()
    const parsed = propertySchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const data = parsed.data

    // 2. Get User Session
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. Authorize — Check landlord role via RAW SQL (Replaces Prisma/Supabase Client)
    const profileResult = await pool.query<{ role: string }>(
      'SELECT role FROM public.profiles WHERE id = $1',
      [user.id]
    )
    
    const profile = profileResult.rows[0]

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (profile.role !== 'landlord') {
      return NextResponse.json({ error: 'Forbidden: Landlord access required' }, { status: 403 })
    }

    // 4. Insert Property with PostGIS Geography data
    const insertResult = await pool.query<{
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
        landlord_id, 
        title, 
        city, 
        area, 
        property_type,
        total_units, 
        max_occupants_per_unit, 
        location
      )
      VALUES (
        $1::uuid, 
        $2, 
        $3, 
        $4, 
        $5::property_type, 
        $6, 
        $7,
        ST_SetSRID(ST_MakePoint($8, $9), 4326)::geography
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

    // 5. Success! Return the created property as JSON
    return NextResponse.json({ property: insertResult.rows[0] }, { status: 201 })

  }catch (err) {
    // We treat 'err' as unknown for type safety
    const error = err as Error;
    console.error('CRITICAL API ERROR:', error.message);

    return NextResponse.json(
      { 
        error: 'Database connection error', 
        message: error.message,
        hint: 'Check if you are still on the mobile hotspot and Port 5432 is open.'
      }, 
      { status: 500 }
    )
  }
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const property_type = searchParams.get('property_type')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = `
      SELECT 
        id, landlord_id, title, city, area, property_type,
        total_units, max_occupants_per_unit, status,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng,
        created_at
      FROM properties
      WHERE status = 'active'
    `
    const params: (string | number)[] = [] 
    let paramCount = 1

    if (city) {
      query += ` AND city = $${paramCount}`
      params.push(city)
      paramCount++
    }

    if (property_type) {
      query += ` AND property_type = $${paramCount}::property_type`
      params.push(property_type)
      paramCount++
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`
    params.push(limit, offset)

    const result = await pool.query(query, params)

    return NextResponse.json({ 
      properties: result.rows,
      count: result.rows.length 
    })

  } catch (err: unknown) {  
    const error = err as Error
    console.error('GET /api/properties error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 })
  }
}