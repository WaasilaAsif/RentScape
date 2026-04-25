import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get lease with all related info
    const leaseResult = await pool.query(
      `SELECT 
        l.*,
        u.unit_number,
        p.id as property_id,
        p.title as property_title,
        p.landlord_id,
        prof.full_name as tenant_name,
        au.email as tenant_email
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       JOIN profiles prof ON l.tenant_id = prof.id
       LEFT JOIN auth.users au ON prof.id = au.id
       WHERE l.id = $1`,
      [id]
    )

    if (!leaseResult.rows[0]) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    const lease = leaseResult.rows[0]

    // Authorization check: Only landlord (owner) or tenant can view
    if (lease.landlord_id !== user.id && lease.tenant_id !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to view this lease' },
        { status: 403 }
      )
    }

    // Get payments for this lease
    const paymentsResult = await pool.query(
      `SELECT id, amount, due_date, paid_date, status, notes
       FROM payments 
       WHERE lease_id = $1 
       ORDER BY due_date DESC`,
      [id]
    )

    // Get family members for this lease
    const familyResult = await pool.query(
      `SELECT id, full_name, cnic, relation 
       FROM family_members 
       WHERE lease_id = $1`,
      [id]
    )

    return NextResponse.json({
      lease,
      payments: paymentsResult.rows,
      family_members: familyResult.rows
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/leases/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch lease details', message: error.message },
      { status: 500 }
    )
  }
}

const updateLeaseSchema = z.object({
  status: z.enum(['pending', 'active', 'expired', 'terminated']).optional(),
  end_date: z.string().optional(),
  monthly_rent: z.number().min(0).optional(),
  notes: z.string().optional(),
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
        { error: 'Only landlords can update leases' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify landlord owns this lease
    const ownerCheck = await pool.query<{ landlord_id: string, unit_id: string, status: string }>(
      `SELECT p.landlord_id, l.unit_id, l.status
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1`,
      [id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this lease' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = updateLeaseSchema.parse(body)

    // Build dynamic update
    const updates: string[] = []
    type SqlParam = string | number | boolean | Date | null
    const values: SqlParam[] = []
    let paramCount = 1

    if (validated.status) {
      updates.push(`status = $${paramCount++}`)
      values.push(validated.status)

      // If changing to active, mark unit as unavailable
      if (validated.status === 'active' && ownerCheck.rows[0].status !== 'active') {
        await pool.query(
          `UPDATE units SET is_available = false WHERE id = $1`,
          [ownerCheck.rows[0].unit_id]
        )
      }

      // If changing to terminated/expired, mark unit as available
      if ((validated.status === 'terminated' || validated.status === 'expired') && 
          ownerCheck.rows[0].status === 'active') {
        await pool.query(
          `UPDATE units SET is_available = true WHERE id = $1`,
          [ownerCheck.rows[0].unit_id]
        )
      }
    }

    if (validated.end_date) {
      updates.push(`end_date = $${paramCount++}`)
      values.push(validated.end_date)
    }

    if (validated.monthly_rent !== undefined) {
      updates.push(`monthly_rent = $${paramCount++}`)
      values.push(validated.monthly_rent)
    }

    if (validated.notes !== undefined) {
      updates.push(`notes = $${paramCount++}`)
      values.push(validated.notes)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push(`updated_at = NOW()`)

    const result = await pool.query(
      `UPDATE leases 
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      [...values, id]
    )

    return NextResponse.json({ lease: result.rows[0] }, { status: 200 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('PUT /api/leases/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update lease', message: error.message },
      { status: 500 }
    )
  }
}