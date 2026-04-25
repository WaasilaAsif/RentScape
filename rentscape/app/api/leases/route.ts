import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

// Validation schema for lease creation
const leaseSchema = z.object({
  unit_id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  monthly_rent: z.number().min(1),
  advance_amount: z.number().min(0),
  start_date: z.string(), // ISO date format: "2026-05-01"
  end_date: z.string(),
  is_family: z.boolean().default(false),
  occupant_count: z.number().min(1),
  notes: z.string().optional(),
  // Family members are optional
  family_members: z.array(z.object({
    full_name: z.string(),
    cnic: z.string().regex(/^\d{5}-\d{7}-\d$/), // Pakistani CNIC format
    relation: z.string()
  })).optional()
})
//Need to add this val;lidation 
// SELECT 1 FROM leases 
// WHERE unit_id = $1 AND status = 'active'
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check - only landlords can create leases
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can create leases' },
        { status: 403 }
      )
    }

    // 2. Validate input
    const body = await request.json()
    const validated = leaseSchema.parse(body)

    // 3. Verify unit exists and get details (property ownership, availability, max_occupants)
    const unitCheck = await pool.query<{
      property_id: string
      landlord_id: string
      is_available: boolean
      max_occupants: number
    }>(
      `SELECT 
        u.property_id, 
        p.landlord_id, 
        u.is_available, 
        u.max_occupants
       FROM units u
       JOIN properties p ON u.property_id = p.id
       WHERE u.id = $1`,
      [validated.unit_id]
    )

    if (!unitCheck.rows[0]) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 })
    }

    const unit = unitCheck.rows[0]

    // 4. Verify landlord owns the property
    if (unit.landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this property' },
        { status: 403 }
      )
    }

    // 5. Check unit availability
    if (!unit.is_available) {
      return NextResponse.json(
        { error: 'Unit is not available' },
        { status: 409 } // 409 = Conflict
      )
    }

    // 6. Belt-and-suspenders: Check no active lease exists
    // (is_available should already prevent this, but double-check)
    const existingLease = await pool.query(
      `SELECT id FROM leases WHERE unit_id = $1 AND status = 'active'`,
      [validated.unit_id]
    )

    if (existingLease.rows.length > 0) {
      return NextResponse.json(
        { error: 'Unit already has an active lease' },
        { status: 409 }
      )
    }

    // 7. Validate occupant count doesn't exceed unit limit
    if (validated.occupant_count > unit.max_occupants) {
      return NextResponse.json(
        { error: `Unit allows maximum ${unit.max_occupants} occupants` },
        { status: 400 }
      )
    }

    // 8. Use TRANSACTION for atomic operation
    // This ensures ALL operations succeed or ALL fail (no partial updates)
    const client = await pool.connect()
    
    try {
      await client.query('BEGIN') // Start transaction

      // Insert lease
      const leaseResult = await client.query(
        `INSERT INTO leases (
          unit_id, tenant_id, monthly_rent, advance_amount,
          start_date, end_date, status, is_family, occupant_count, notes
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, $8, $9)
        RETURNING *`,
        [
          validated.unit_id,
          validated.tenant_id,
          validated.monthly_rent,
          validated.advance_amount,
          validated.start_date,
          validated.end_date,
          validated.is_family,
          validated.occupant_count,
          validated.notes
        ]
      )

      const lease = leaseResult.rows[0]

      // Set unit as unavailable (critical - prevents double-booking)
      await client.query(
        'UPDATE units SET is_available = false WHERE id = $1',
        [validated.unit_id]
      )

      // Insert family members if provided
      if (validated.family_members && validated.family_members.length > 0) {
        for (const member of validated.family_members) {
          await client.query(
            `INSERT INTO family_members (lease_id, full_name, cnic, relation)
             VALUES ($1, $2, $3, $4)`,
            [lease.id, member.full_name, member.cnic, member.relation]
          )
        }
      }

      await client.query('COMMIT') // All succeeded - commit changes

      return NextResponse.json({ lease }, { status: 201 })

    } catch (err) {
      await client.query('ROLLBACK') // Something failed - undo everything
      throw err // Re-throw to outer catch block
    } finally {
      client.release() // Always return connection to pool
    }

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/leases error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create lease', message: error.message },
      { status: 500 }
    )
  }
}
// GET - List all leases for logged-in landlord
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Allow both landlord and tenant to fetch leases
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status') // e.g., "expired,terminated"

    let query: string
    let params: any[]

    if (user.role === 'landlord') {
      // Landlords see leases for their properties
      query = `
        SELECT 
          l.*,
          u.unit_number,
          p.id as property_id,
          p.title as property_title,
          prof.full_name as tenant_name
        FROM leases l
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN profiles prof ON l.tenant_id = prof.id
        WHERE p.landlord_id = $1
      `
      params = [user.id]

      // Add status filter if provided
      if (statusFilter) {
        const statuses = statusFilter.split(',').map(s => s.trim())
        query += ` AND l.status = ANY($2)`
        params.push(statuses)
      }

      query += ` ORDER BY l.created_at DESC`

    } else if (user.role === 'tenant') {
      // Tenants see only their own leases
      query = `
        SELECT 
          l.*,
          u.unit_number,
          p.id as property_id,
          p.title as property_title,
          p.landlord_id,
          landlord.full_name as landlord_name
        FROM leases l
        JOIN units u ON l.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN profiles landlord ON p.landlord_id = landlord.id
        WHERE l.tenant_id = $1
      `
      params = [user.id]

      // Add status filter if provided
      if (statusFilter) {
        const statuses = statusFilter.split(',').map(s => s.trim())
        query += ` AND l.status = ANY($2)`
        params.push(statuses)
      }

      query += ` ORDER BY l.created_at DESC`

    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 403 }
      )
    }

    const result = await pool.query(query, params)

    return NextResponse.json({ 
      leases: result.rows,
      count: result.rows.length 
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/leases error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch leases', message: error.message },
      { status: 500 }
    )
  }
}