import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const markPaidSchema = z.object({
  paid_date: z.string(), // ISO date: "2026-05-02"
  payment_method: z.enum(['cash', 'bank_transfer', 'cheque', 'online'])
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
        { error: 'Only landlords can mark payments as paid' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Verify landlord owns the property this payment belongs to
    // Complex ownership chain: payments → leases → units → properties
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      `SELECT p.landlord_id
       FROM payments pay
       JOIN leases l ON pay.lease_id = l.id
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE pay.id = $1`,
      [id]
    )

    if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own the property for this payment' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = markPaidSchema.parse(body)

    // Update payment status to paid
    const result = await pool.query(
      `UPDATE payments 
       SET status = 'paid', 
           paid_date = $1, 
           payment_method = $2, 
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [validated.paid_date, validated.payment_method, id]
    )

    return NextResponse.json({ payment: result.rows[0] }, { status: 200 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('PUT /api/payments/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update payment', message: error.message },
      { status: 500 }
    )
  }
}