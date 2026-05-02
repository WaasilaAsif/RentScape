import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'tenant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const leaseId = searchParams.get('lease_id')

    type SqlParam = string | number | boolean | Date | null
    let query: string
    let params: SqlParam[]

    if (leaseId) {
      // Verify this lease actually belongs to this tenant before returning data
      const leaseCheck = await pool.query<{ tenant_id: string }>(
        `SELECT tenant_id FROM leases WHERE id = $1`,
        [leaseId]
      )

      if (!leaseCheck.rows[0]) {
        return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
      }

      if (leaseCheck.rows[0].tenant_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      query = `
        SELECT
          pay.*,
          p.title AS property_title,
          p.city  AS property_city,
          u.unit_number
        FROM payments pay
        JOIN leases l ON pay.lease_id = l.id
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        WHERE pay.lease_id = $1
        ORDER BY pay.due_date DESC
      `
      params = [leaseId]
    } else {
      // All payments across every lease this tenant has ever had
      query = `
        SELECT
          pay.*,
          p.title AS property_title,
          p.city  AS property_city,
          u.unit_number
        FROM payments pay
        JOIN leases l ON pay.lease_id = l.id
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        WHERE l.tenant_id = $1
        ORDER BY
          CASE pay.status
            WHEN 'overdue' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'paid'    THEN 3
            WHEN 'waived'  THEN 4
          END,
          pay.due_date DESC
      `
      params = [user.id]
    }

    const result = await pool.query(query, params)

    return NextResponse.json({
      payments: result.rows,
      count: result.rows.length,
    })
  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/tenant/payments error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch payments', message: error.message },
      { status: 500 }
    )
  }
}