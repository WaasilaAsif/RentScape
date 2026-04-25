import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const createRatingSchema = z.object({
  lease_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: z.enum(['tenant', 'landlord', 'property']),
  score: z.number().min(1).max(5),
  comment: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createRatingSchema.parse(body)

    // Verify user is part of this lease
    const leaseCheck = await pool.query<{
      tenant_id: string
      landlord_id: string
      property_id: string
      status: string
    }>(
      `SELECT 
        l.tenant_id,
        l.status,
        p.landlord_id,
        p.id as property_id
       FROM leases l
       JOIN units u ON l.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE l.id = $1`,
      [validated.lease_id]
    )

    if (!leaseCheck.rows[0]) {
      return NextResponse.json({ error: 'Lease not found' }, { status: 404 })
    }

    const lease = leaseCheck.rows[0]

    // Authorization: Only tenant or landlord from this lease can rate
    if (user.id !== lease.tenant_id && user.id !== lease.landlord_id) {
      return NextResponse.json(
        { error: 'You are not part of this lease' },
        { status: 403 }
      )
    }

    // Can only rate completed/expired leases
    if (lease.status !== 'expired' && lease.status !== 'terminated') {
      return NextResponse.json(
        { error: 'Can only rate after lease ends' },
        { status: 400 }
      )
    }

    // Validate target based on type
    if (validated.target_type === 'landlord' && validated.target_id !== lease.landlord_id) {
      return NextResponse.json({ error: 'Invalid landlord target' }, { status: 400 })
    }

    if (validated.target_type === 'tenant' && validated.target_id !== lease.tenant_id) {
      return NextResponse.json({ error: 'Invalid tenant target' }, { status: 400 })
    }

    if (validated.target_type === 'property' && validated.target_id !== lease.property_id) {
      return NextResponse.json({ error: 'Invalid property target' }, { status: 400 })
    }

    // Check for duplicate rating
    const duplicateCheck = await pool.query(
      `SELECT id FROM ratings 
       WHERE lease_id = $1 
         AND reviewer_id = $2 
         AND target_id = $3 
         AND target_type = $4`,
      [validated.lease_id, user.id, validated.target_id, validated.target_type]
    )

    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json(
        { error: 'You have already rated this' },
        { status: 409 }
      )
    }

    // Create rating
    const result = await pool.query(
      `INSERT INTO ratings (lease_id, reviewer_id, target_id, target_type, score, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        validated.lease_id,
        user.id,
        validated.target_id,
        validated.target_type,
        validated.score,
        validated.comment,
      ]
    )

    return NextResponse.json({ rating: result.rows[0] }, { status: 201 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/ratings error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create rating', message: error.message },
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

    let query: string
    let params: string[]

    if (leaseId) {
      // Get ratings for a specific lease
      query = `
        SELECT 
          r.*,
          reviewer.full_name as reviewer_name,
          target.full_name as target_name
        FROM ratings r
        JOIN profiles reviewer ON r.reviewer_id = reviewer.id
        JOIN profiles target ON r.target_id = target.id
        WHERE r.lease_id = $1
        ORDER BY r.created_at DESC
      `
      params = [leaseId]
    } else {
      // Get all ratings where user is reviewer (ratings I gave)
      query = `
        SELECT 
          r.*,
          target.full_name as target_name,
          p.title as property_title,
          u.unit_number
        FROM ratings r
        JOIN profiles target ON r.target_id = target.id
        LEFT JOIN leases l ON r.lease_id = l.id
        LEFT JOIN units u ON l.unit_id = u.id
        LEFT JOIN properties p ON u.property_id = p.id
        WHERE r.reviewer_id = $1
        ORDER BY r.created_at DESC
      `
      params = [user.id]
    }

    const result = await pool.query(query, params)

    return NextResponse.json({ ratings: result.rows })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/ratings error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch ratings', message: error.message },
      { status: 500 }
    )
  }
}