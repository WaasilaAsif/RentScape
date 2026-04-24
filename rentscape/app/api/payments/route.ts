import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const leaseId = searchParams.get('lease_id')

    let query: string
    type SqlParam = string | number | boolean | Date | null
    let params: SqlParam[]

    if (leaseId) {
      // Single lease payments
      query = `
        SELECT 
          pay.*,
          prof.full_name as tenant_name,
          p.title as property_title,
          u.unit_number
        FROM payments pay
        JOIN leases l ON pay.lease_id = l.id
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN profiles prof ON l.tenant_id = prof.id
        WHERE pay.lease_id = $1
        ORDER BY pay.due_date DESC
      `
      params = [leaseId]
    } else {
      // All landlord's payments
      query = `
        SELECT 
          pay.*,
          prof.full_name as tenant_name,
          p.title as property_title,
          u.unit_number
        FROM payments pay
        JOIN leases l ON pay.lease_id = l.id
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN profiles prof ON l.tenant_id = prof.id
        WHERE p.landlord_id = $1
        ORDER BY 
          CASE pay.status
            WHEN 'overdue' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'paid' THEN 3
            WHEN 'waived' THEN 4
          END,
          pay.due_date DESC
      `
      params = [user.id]
    }

    const result = await pool.query(query, params)

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