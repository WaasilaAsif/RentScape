import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const updateSchema = z.object({
  monthly_rent: z.number().min(1).optional(),
  advance_required: z.boolean().optional(),
  advance_months: z.number().min(1).max(12).optional(),
  description: z.string().optional(),
})

export async function PUT(
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
        { error: 'Only landlords can edit units' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify ownership via property
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      `SELECT p.landlord_id 
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1`,
      [id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this unit\'s property' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Check for forbidden fields
    const forbiddenFields = ['property_id', 'is_available', 'created_at']
    for (const field of forbiddenFields) {
      if (field in body) {
        return NextResponse.json(
          { error: `Cannot update '${field}'` },
          { status: 400 }
        )
      }
    }

    // Build dynamic UPDATE
    const updates: string[] = []
    const values: (string | number | boolean)[] = []
    let paramCount = 1

    if (validated.monthly_rent !== undefined) {
      updates.push(`monthly_rent = $${paramCount++}`)
      values.push(validated.monthly_rent)
    }
    if (validated.advance_required !== undefined) {
      updates.push(`advance_required = $${paramCount++}`)
      values.push(validated.advance_required)
    }
    if (validated.advance_months !== undefined) {
      updates.push(`advance_months = $${paramCount++}`)
      values.push(validated.advance_months)
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(validated.description)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      )
    }

    const query = `
      UPDATE units 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *

    `
    values.push(id)

    const result = await pool.query(query, values)

    return NextResponse.json({ unit: result.rows[0] }, { status: 200 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        //err.errors willl fail always because of the new update in zod 6, we need to use err.issues instead
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('PUT /api/units/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update unit', message: error.message },
      { status: 500 }
    )
  }
}