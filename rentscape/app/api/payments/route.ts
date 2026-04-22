import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leaseId = searchParams.get('lease_id')

    if (!leaseId) {
      return NextResponse.json(
        { error: 'lease_id parameter is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this lease (landlord or tenant)
    const accessCheck = await pool.query<{
      tenant_id: string
      landlord_id: string
    }>(
      `SELECT l.tenant_id, p.landlord_id
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1`,
      [leaseId]
    )

    if (!accessCheck.rows[0]) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    const { tenant_id, landlord_id } = accessCheck.rows[0]

    // Authorization: Only landlord or tenant on this lease
    if (user.id !== tenant_id && user.id !== landlord_id) {
      return NextResponse.json(
        { error: 'You are not authorized to view these payments' },
        { status: 403 }
      )
    }

    // Fetch payments for this lease
    const result = await pool.query(
      `SELECT * FROM payments 
       WHERE lease_id = $1 
       ORDER BY due_date`,
      [leaseId]
    )

    return NextResponse.json({ 
      payments: result.rows,
      count: result.rows.length 
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/payments error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch payments', message: error.message },
      { status: 500 }
    )
  }
}