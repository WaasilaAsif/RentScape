import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const createFamilyMemberSchema = z.object({
  lease_id: z.string().uuid(),
  full_name: z.string().min(2),
  cnic: z.string().optional(),
  relation: z.string().min(2),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can add family members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createFamilyMemberSchema.parse(body)

    // Verify landlord owns the property for this lease
    const ownerCheck = await pool.query<{ landlord_id: string, is_family: boolean }>(
      `SELECT p.landlord_id, l.is_family
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
        { error: 'You do not own this lease' },
        { status: 403 }
      )
    }

    if (!ownerCheck.rows[0].is_family) {
      return NextResponse.json(
        { error: 'This is not a family lease' },
        { status: 400 }
      )
    }

    // Create family member
    const result = await pool.query(
      `INSERT INTO family_members (lease_id, full_name, cnic, relation)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [validated.lease_id, validated.full_name, validated.cnic, validated.relation]
    )

    return NextResponse.json({ family_member: result.rows[0] }, { status: 201 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/family-members error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create family member', message: error.message },
      { status: 500 }
    )
  }
}

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
    const accessCheck = await pool.query<{ landlord_id: string, tenant_id: string }>(
      `SELECT p.landlord_id, l.tenant_id
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1`,
      [leaseId]
    )

    if (!accessCheck.rows[0]) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    const { landlord_id, tenant_id } = accessCheck.rows[0]

    if (user.id !== landlord_id && user.id !== tenant_id) {
      return NextResponse.json(
        { error: 'You are not authorized to view these family members' },
        { status: 403 }
      )
    }

    const result = await pool.query(
      `SELECT * FROM family_members WHERE lease_id = $1 ORDER BY created_at`,
      [leaseId]
    )

    return NextResponse.json({ family_members: result.rows })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/family-members error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch family members', message: error.message },
      { status: 500 }
    )
  }
}