import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

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
        p.title as property_title,
        p.landlord_id,
        prof.full_name as tenant_name
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       JOIN profiles prof ON l.tenant_id = prof.id
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
      `SELECT id, amount, due_date, paid_date, status
       FROM payments 
       WHERE lease_id = $1 
       ORDER BY due_date`,
      [id]
    )

    // Get family members for this lease
    const familyResult = await pool.query(
      `SELECT full_name, relation 
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