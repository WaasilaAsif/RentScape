import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // had to add await. Got an error: "TypeError: Cannot destructure property 'id' of 'params' as it is undefined."
    const { id } =  await params

    const propertyResult = await pool.query(
      `
      SELECT 
        p.id, p.landlord_id, p.title, p.city, p.area, p.property_type,
        p.total_units, p.max_occupants_per_unit, p.status,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng,
        p.created_at,
        prof.full_name as landlord_name,
        prof.phone as landlord_phone
      FROM properties p
      LEFT JOIN profiles prof ON p.landlord_id = prof.id
      WHERE p.id = $1
      `,
      [id]
    )

    if (propertyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    const property = propertyResult.rows[0]

    return NextResponse.json({
      property,
      units: []
    })

  } catch (err: unknown) {  // ✅ Fixed
    const error = err as Error
    console.error('GET /api/properties/[id] error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 })
  }
}