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
    const status = searchParams.get('status')
    const baseFilters: string[] = []
    const params: string[] = []
    let paramCount = 1

    if (user.role === 'tenant') {
      baseFilters.push(`l.tenant_id = $${paramCount++}`)
      params.push(user.id)
    } else if (user.role === 'landlord') {
      baseFilters.push(`p.landlord_id = $${paramCount++}`)
      params.push(user.id)
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (leaseId) {
      baseFilters.push(`pay.lease_id = $${paramCount++}`)
      params.push(leaseId)
    }

    if (status) {
      baseFilters.push(`pay.status = $${paramCount++}::payment_status`)
      params.push(status)
    }

    const whereClause = baseFilters.length > 0 ? `WHERE ${baseFilters.join(' AND ')}` : ''

    const result = await pool.query(
      `SELECT 
        pay.id,
        pay.lease_id,
        pay.amount,
        pay.due_date,
        pay.paid_date,
        pay.status,
        pay.notes,
        pay.created_at,
        l.tenant_id,
        l.start_date,
        l.end_date,
        u.unit_number,
        p.id as property_id,
        p.title as property_title,
        p.city as property_city
       FROM payments pay
       JOIN leases l ON pay.lease_id = l.id
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       ${whereClause}
       ORDER BY pay.due_date ASC`,
      params
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