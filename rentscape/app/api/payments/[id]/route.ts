import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const markPaidSchema = z.object({
  status: z.enum(['tenant_confirmed', 'paid']),
  paid_date: z.string().optional(), // ISO date: "2026-05-02"
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

    const { id } = await params

    // Verify payment access + role ownership
    const accessCheck = await pool.query<{ landlord_id: string; tenant_id: string; status: string; notes: string | null }>(
      `SELECT p.landlord_id, l.tenant_id, pay.status, pay.notes
       FROM payments pay
       JOIN leases l ON pay.lease_id = l.id
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE pay.id = $1`,
      [id]
    )

    if (!accessCheck.rows[0]) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const { landlord_id, tenant_id, status: currentStatus, notes } = accessCheck.rows[0]

    const canLandlordUpdate = user.role === 'landlord' && landlord_id === user.id
    const canTenantConfirm = user.role === 'tenant' && tenant_id === user.id
    if (!canLandlordUpdate && !canTenantConfirm) {
      return NextResponse.json(
        { error: 'You are not authorized to update this payment' },
        { status: 403 }
      )
    }

    if (currentStatus === 'paid') {
      return NextResponse.json({ error: 'Payment is already marked as paid' }, { status: 409 })
    }

    const body = await request.json()
    const validated = markPaidSchema.parse(body)
    const notesText = notes ?? ''
    const hasTenantConfirmation = notesText.includes('TENANT_CONFIRMED_AT=')

    if (validated.status === 'tenant_confirmed') {
      if (!canTenantConfirm) {
        return NextResponse.json(
          { error: 'Only the tenant can submit payment confirmation' },
          { status: 403 }
        )
      }

      if (hasTenantConfirmation) {
        return NextResponse.json(
          { error: 'Payment confirmation already submitted and pending landlord approval' },
          { status: 409 }
        )
      }

      const confirmationNote =
        notesText.trim().length > 0
          ? `${notesText}\nTENANT_CONFIRMED_AT=${new Date().toISOString()}`
          : `TENANT_CONFIRMED_AT=${new Date().toISOString()}`

      const result = await pool.query(
        `UPDATE payments
         SET notes = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [confirmationNote, id]
      )

      return NextResponse.json({
        payment: result.rows[0],
        message: 'Payment confirmation submitted to landlord.',
      })
    }

    if (!canLandlordUpdate) {
      return NextResponse.json(
        { error: 'Only the landlord can finalize payment as paid' },
        { status: 403 }
      )
    }

    if (!hasTenantConfirmation) {
      return NextResponse.json(
        { error: 'Tenant has not confirmed this payment yet' },
        { status: 409 }
      )
    }

    const paidDate = validated.paid_date ?? new Date().toISOString().slice(0, 10)

    // Landlord final approval.
    const result = await pool.query(
      `UPDATE payments 
       SET status = 'paid', 
           paid_date = $1, 
           notes = NULLIF(REGEXP_REPLACE(COALESCE(notes, ''), E'\\n?TENANT_CONFIRMED_AT=.*$', '', 'g'), ''),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [paidDate, id]
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