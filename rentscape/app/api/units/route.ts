import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { z } from 'zod'

// GET /api/units?property_id=X or ?available=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const availableOnly = searchParams.get('available') === 'true'
    const mine = searchParams.get('mine') === 'true'

    let query = `
      SELECT 
        u.id, u.unit_number, u.floor, u.bedrooms, u.bathrooms,
        u.monthly_rent::float as monthly_rent, u.is_available,
        u.advance_required, u.advance_months, u.max_occupants, u.description,
        u.created_at,
        p.id as property_id, p.title as property_title, p.city, p.area,
        p.property_type,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng
      FROM units u
      JOIN properties p ON u.property_id = p.id
      WHERE 1=1
    `
    // define rhe typw when sure later
    type SqlParam = string | number | boolean | Date | null

const params: SqlParam[] = []
let paramCount = 1
    if (propertyId) {
      query += ` AND u.property_id = $${paramCount++}`
      params.push(propertyId)
    }

    if (availableOnly) {
      query += ` AND u.is_available = true AND p.status = 'active'`
    }

    if (mine) {
      const user = await getUserWithRole()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      query += ` AND p.landlord_id = $${paramCount++}`
      params.push(user.id)
    }

    query += ` ORDER BY p.created_at DESC, u.unit_number ASC`

    const result = await pool.query(query, params)

    return NextResponse.json({ units: result.rows })
  } catch (error) {
    const err = error as Error
    console.error('GET /api/units error:', err.message)
    return NextResponse.json(
      { error: 'Failed to fetch units', message: err.message },
      { status: 500 }
    )
  }
}

// POST /api/units (keep your existing POST handler)
const createSchema = z.object({
  property_id: z.string().uuid(),
  unit_number: z.string().min(1),
  floor: z.number().int().optional(),
  bedrooms: z.number().int().min(0),
  bathrooms: z.number().int().min(0),
  monthly_rent: z.number().min(0),
  is_available: z.boolean().default(true),
  advance_required: z.boolean().default(false),
  advance_months: z.number().int().min(1).max(12).optional(),
  max_occupants: z.number().int().min(1),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json({ error: 'Only landlords can create units' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createSchema.parse(body)

    // Verify ownership
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [validated.property_id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json({ error: 'You do not own this property' }, { status: 403 })
    }

    // Check for duplicate unit_number in this property
    const duplicateCheck = await pool.query(
      'SELECT id FROM units WHERE property_id = $1 AND unit_number = $2',
      [validated.property_id, validated.unit_number]
    )

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: `Unit ${validated.unit_number} already exists in this property` },
        { status: 400 }
      )
    }

    const result = await pool.query(
      `INSERT INTO units (
        property_id, unit_number, floor, bedrooms, bathrooms,
        monthly_rent, is_available, advance_required, advance_months,
        max_occupants, description
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, unit_number, floor, bedrooms, bathrooms,
        monthly_rent::float as monthly_rent, is_available,
        advance_required, advance_months, max_occupants, description,
        created_at`,
      [
        validated.property_id,
        validated.unit_number,
        validated.floor,
        validated.bedrooms,
        validated.bathrooms,
        validated.monthly_rent,
        validated.is_available,
        validated.advance_required,
        validated.advance_months,
        validated.max_occupants,
        validated.description,
      ]
    )

    return NextResponse.json({ unit: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    const err = error as Error
    console.error('POST /api/units error:', err.message)
    return NextResponse.json(
      { error: 'Failed to create unit', message: err.message },
      { status: 500 }
    )
  }
}