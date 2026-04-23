import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const maintenanceSchema = z.object({
  unit_id: z.string(), //take out the .uuid() bcz of the seed data problems for testing
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium')
})
// need valid use wale credentials
//skipping the checking will do larer
//we should add an image array in db as well for the tenants to upload images of the issue they are facing
//rest apis after frontend

export async function POST(request: NextRequest) {
  try {
    
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'tenant') {
      return NextResponse.json(
        //Will automate this role checks in later versions
        // because to validate
        // future idea : we add more roles a property manager who answers for multiplke properties to
        //the landlors

        { error: 'Only tenants can file maintenance requests' },
        { status: 403 }
      )
    }

    // 2. Validate input
    const body = await request.json()
    const validated = maintenanceSchema.parse(body)

    // 3. Verify tenant has active lease on this unit
    const leaseCheck = await pool.query(
      `SELECT id FROM leases 
       WHERE unit_id = $1 
         AND tenant_id = $2 
         AND status = 'active'`,
      [validated.unit_id, user.id]
    )

    if (leaseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'You do not have an active lease on this unit' },
        { status: 403 }
      )
    }

    // 4. Create maintenance request
    const result = await pool.query(
      `INSERT INTO maintenance_requests (
        unit_id, tenant_id, title, description, priority, status
      )
      VALUES ($1, $2, $3, $4, $5, 'open')
      RETURNING *`,
      [
        validated.unit_id,
        user.id,
        validated.title,
        validated.description,
        validated.priority
      ]
    )

    return NextResponse.json(
      { maintenance_request: result.rows[0] },
      { status: 201 }
    )

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('POST /api/maintenance error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create maintenance request', message: error.message },
      { status: 500 }
    )
  }
}

//Used claud idher had to do tne last royte to send fast
//testing ka time nhi mila will create test files later
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    //used vars here to sttore different queries for diff scenarios 
    // Does this improve efficiency? Maybe not much but it does improve readability and maintainability of code
    let query: string
    let params: string[]

    if (user.role === 'tenant') {
      // Tenants see only their own requests
      //Future rec: Can create a view for this? will increase performance and reduce complexity in code

      query = `
        SELECT 
          mr.*,
          u.unit_number,
          p.title as property_title
        FROM maintenance_requests mr
        JOIN units u ON mr.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        WHERE mr.tenant_id = $1
        ORDER BY mr.created_at DESC
      `
      params = [user.id]

    } else if (user.role === 'landlord') {
      // Landlords see all requests for their properties
      //same for here we can add a view ho saka hai behrta ho and meets deliverables
      query = `
        SELECT 
          mr.*,
          u.unit_number,
          p.title as property_title,
          prof.full_name as tenant_name
        FROM maintenance_requests mr
        JOIN units u ON mr.unit_id = u.id
        JOIN properties p ON u.property_id = p.id
        JOIN profiles prof ON mr.tenant_id = prof.id
        WHERE p.landlord_id = $1
        ORDER BY 
          CASE mr.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          mr.created_at DESC
      `
      params = [user.id]

    } else {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 403 }
      )
    }

    const result = await pool.query(query, params)

    return NextResponse.json({
      maintenance_requests: result.rows,
      count: result.rows.length
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/maintenance error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests', message: error.message },
      { status: 500 }
    )
  }
}