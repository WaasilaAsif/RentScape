import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const linkAmenitySchema = z.object({
  amenity_id: z.string().uuid(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get amenities linked to this property
    const result = await pool.query(
      `SELECT a.*
       FROM amenities a
       JOIN property_amenities pa ON a.id = pa.amenity_id
       WHERE pa.property_id = $1
       ORDER BY a.name`,
      [id]
    )

    return NextResponse.json({ amenities: result.rows })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/properties/[id]/amenities error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch property amenities', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can manage amenities' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify landlord owns this property
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      `SELECT landlord_id FROM properties WHERE id = $1`,
      [id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this property' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = linkAmenitySchema.parse(body)

    // Link amenity to property
    const result = await pool.query(
      `INSERT INTO property_amenities (property_id, amenity_id)
       VALUES ($1, $2)
       ON CONFLICT (property_id, amenity_id) DO NOTHING
       RETURNING *`,
      [id, validated.amenity_id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Amenity already linked to this property' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'Amenity linked successfully' },
      { status: 201 }
    )

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/properties/[id]/amenities error:', error.message)
    return NextResponse.json(
      { error: 'Failed to link amenity', message: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can manage amenities' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify ownership
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      `SELECT landlord_id FROM properties WHERE id = $1`,
      [id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this property' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const amenityId = searchParams.get('amenity_id')

    if (!amenityId) {
      return NextResponse.json(
        { error: 'amenity_id query parameter required' },
        { status: 400 }
      )
    }

    // Unlink amenity
    const result = await pool.query(
      `DELETE FROM property_amenities
       WHERE property_id = $1 AND amenity_id = $2
       RETURNING *`,
      [id, amenityId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Amenity not linked to this property' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Amenity unlinked successfully' })

  } catch (err: unknown) {
    const error = err as Error
    console.error('DELETE /api/properties/[id]/amenities error:', error.message)
    return NextResponse.json(
      { error: 'Failed to unlink amenity', message: error.message },
      { status: 500 }
    )
  }
}