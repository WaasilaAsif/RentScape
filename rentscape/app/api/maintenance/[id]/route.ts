import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const updateStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed'])
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can update maintenance status' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify landlord owns the property this request belongs to
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      `SELECT p.landlord_id
       FROM maintenance_requests mr
       JOIN units u ON mr.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE mr.id = $1`,
      [id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own the property for this maintenance request' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateStatusSchema.parse(body)

    // Update status and set resolved_at if status is 'resolved' or 'closed'
    const resolvedAt = ['resolved', 'closed'].includes(validated.status)
      ? 'NOW()'
      : 'NULL'

    const result = await pool.query(
      `UPDATE maintenance_requests 
       SET status = $1, 
           resolved_at = ${resolvedAt},
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [validated.status, id]
    )

    return NextResponse.json(
      { maintenance_request: result.rows[0] },
      { status: 200 }
    )

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues},
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('PUT /api/maintenance/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update maintenance request', message: error.message },
      { status: 500 }
    )
  }
}