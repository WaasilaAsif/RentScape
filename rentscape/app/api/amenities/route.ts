import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { z } from 'zod'

const createAmenitySchema = z.object({
  name: z.string().min(2).max(100),
})

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT * FROM amenities ORDER BY name ASC`
    )

    return NextResponse.json({ amenities: result.rows })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/amenities error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetc amenities', message: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createAmenitySchema.parse(body)

    const result = await pool.query(
      `INSERT INTO amenities (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING *`,
      [validated.name.trim()]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Amenity already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json({ amenity: result.rows[0] }, { status: 201 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/amenities error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create amenity', message: error.message },
      { status: 500 }
    )
  }
}