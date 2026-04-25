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

import { z } from 'zod'

const createPaymentSchema = z.object({
  lease_id: z.string().uuid(),
  amount: z.number().min(0),
  due_date: z.string(), // ISO date format
  notes: z.string().optional(),
  status: z.enum(['pending', 'paid', 'overdue', 'waived']).default('pending')
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json({ error: 'Only landlords can create payments' }, { status: 403 })
    }

    const body = await request.json()
    const validated = createPaymentSchema.parse(body)

    // Verify landlord owns the property for this lease
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      `SELECT p.landlord_id
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1`,
      [validated.lease_id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own the property for this lease' },
        { status: 403 }
      )
    }

    // Create payment
    const result = await pool.query(
      `INSERT INTO payments (lease_id, amount, due_date, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [validated.lease_id, validated.amount, validated.due_date, validated.status, validated.notes]
    )

    return NextResponse.json({ payment: result.rows[0] }, { status: 201 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/payments error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create payment', message: error.message },
      { status: 500 }
    )
  }
}