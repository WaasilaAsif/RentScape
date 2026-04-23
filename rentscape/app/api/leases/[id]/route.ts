import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const tenantLeaseActionSchema = z.object({
  action: z.enum(['accept']),
})

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
    const body = await request.json()
    const parsed = tenantLeaseActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action', details: parsed.error.issues }, { status: 400 })
    }

    const leaseResult = await pool.query<{
      id: string
      tenant_id: string
      status: string
      monthly_rent: string
      start_date: string
    }>(
      `SELECT id, tenant_id, status, monthly_rent, start_date
       FROM leases
       WHERE id = $1`,
      [id]
    )

    const lease = leaseResult.rows[0]
    if (!lease) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    if (user.role !== 'tenant' || lease.tenant_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (parsed.data.action === 'accept') {
      if (lease.status !== 'pending') {
        return NextResponse.json({ error: 'Only pending leases can be accepted' }, { status: 409 })
      }
      const client = await pool.connect()
      try {
        await client.query('BEGIN')

        const updateResult = await client.query(
          `UPDATE leases
           SET status = 'active', updated_at = NOW()
           WHERE id = $1
           RETURNING *`,
          [id]
        )

        // Create first invoice/payment automatically once lease is accepted.
        const existingPayment = await client.query(
          `SELECT id
           FROM payments
           WHERE lease_id = $1
             AND due_date = $2::date
           LIMIT 1`,
          [id, lease.start_date]
        )

        if (!existingPayment.rows[0]) {
          await client.query(
            `INSERT INTO payments (lease_id, amount, due_date, status)
             VALUES ($1, $2, $3::date, 'pending')`,
            [id, lease.monthly_rent, lease.start_date]
          )
        }

        await client.query('COMMIT')
        return NextResponse.json({ lease: updateResult.rows[0] })
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 })
  } catch (err: unknown) {
    const error = err as Error
    console.error('PUT /api/leases/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update lease', message: error.message },
      { status: 500 }
    )
  }
}