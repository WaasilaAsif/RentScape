
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const radius = parseInt(searchParams.get('radius') || '5000')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Missing lat/lng parameters' },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `
      SELECT 
        id, landlord_id, title, city, area, property_type,
        total_units, max_occupants_per_unit, status,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng,
        ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
        ) as distance_meters
      FROM properties
      WHERE status = 'active'
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
          $3
        )
      ORDER BY distance_meters ASC
      `,
      [lat, lng, radius]
    )

    return NextResponse.json({ 
      properties: result.rows,
      search_center: { lat, lng },
      radius_meters: radius
    })

  } catch (err: unknown) {  // ✅ Fixed
    const error = err as Error
    console.error('GET /api/properties/nearby error:', error.message)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}