// import { NextRequest, NextResponse } from 'next/server'
// import { pool } from '@/lib/db'

// export async function GET(
//   request: NextRequest,
//   { params }: { params: { id: string } }
// ) {
//   try {
//     // had to add await. Got an error: "TypeError: Cannot destructure property 'id' of 'params' as it is undefined."
//     const { id } =  await params

//     const propertyResult = await pool.query(
//       `
//       SELECT 
//         p.id, p.landlord_id, p.title, p.city, p.area, p.property_type,
//         p.total_units, p.max_occupants_per_unit, p.status,
//         ST_Y(p.location::geometry) as lat,
//         ST_X(p.location::geometry) as lng,
//         p.created_at,
//         prof.full_name as landlord_name,
//         prof.phone as landlord_phone
//       FROM properties p
//       LEFT JOIN profiles prof ON p.landlord_id = prof.id
//       WHERE p.id = $1
//       `,
//       [id]
//     )

//     if (propertyResult.rows.length === 0) {
//       return NextResponse.json({ error: 'Property not found' }, { status: 404 })
//     }

//     const property = propertyResult.rows[0]

//     return NextResponse.json({
//       property,
//       units: []
//     })

//   } catch (err: unknown) {  // ✅ Fixed
//     const error = err as Error
//     console.error('GET /api/properties/[id] error:', error.message)
//     return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 })
//   }
// }

//Better version will test and update
//Acha to this api basically gets all the amneties properties and the units based on how you search it testing is left
//will create unit tests soon as well

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { z } from 'zod'
import { getSession } from '@/lib/get-session'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get property
    const propertyResult = await pool.query(
      `
      SELECT 
        p.id, p.landlord_id, p.title, p.city, p.area, p.property_type,
        p.total_units, p.max_occupants_per_unit, p.status,
        ST_Y(p.location::geometry) as lat,
        ST_X(p.location::geometry) as lng,
        p.created_at,
        prof.full_name as landlord_name,
        prof.phone as landlord_phone
      FROM properties p
      LEFT JOIN profiles prof ON p.landlord_id = prof.id
      WHERE p.id = $1
      `,
      [id]
    )

    if (propertyResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    //const property = propertyResult.rows[0]

    // Get units
    const unitsResult = await pool.query(
      `
      SELECT 
        id, unit_number, floor, bedrooms, monthly_rent, is_available, 
        advance_required, advance_months, max_occupants, description
        , created_at
      FROM units
      WHERE property_id = $1 and is_available = true
      ORDER BY unit_number
      `,
      [id]
    )

    // Get amenities
    const amenitiesResult = await pool.query(
      `
      Select a.name from amenities a join 
      property_amenities pa on 
      pa.amenity_id = a.id 
      where pa.property_id = $1
      `,
      [id]
    )

    return NextResponse.json({
      property: propertyResult.rows[0],
      units: unitsResult.rows,
      amenities: amenitiesResult.rows.map(row => row.name)
    })

  } catch (err) {
    const error = err as Error
    console.error('GET /api/properties/[id] error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch property details' }, { status: 500 })
  }
}

// app/api/properties/[id]/route.ts
const updateSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
  area: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['active', 'inactive', 'under_maintenance']).optional(),
  total_units: z.number().min(1).optional(),
  max_occupants_per_unit: z.number().min(1).optional(),
})
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    const user = await getSession()
    console.log('Session user:', user) // ADD THIS test statement could not find error
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get property ID from params
    const { id } = await params
    console.log('🔍 Property ID:', id) // ADD THIS

    // 3. Check role
    const roleResult = await pool.query<{ role: string }>(
      'SELECT role FROM profiles WHERE id = $1',
      [user.id]
    )
    console.log('🔍 Role result:', roleResult.rows[0]) // ADD THIS

    if (roleResult.rows[0]?.role !== 'landlord') {
      console.log('❌ Not a landlord') // ADD THIS
      return NextResponse.json({ error: 'Only landlords can edit properties' }, { status: 403 })
    }

    // 4. Verify ownership
    const ownerResult = await pool.query<{ landlord_id: string }>(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [id]
    )
    console.log('🔍 Owner result:', ownerResult.rows[0]) // ADD THIS
    console.log('🔍 Comparing:', { 
      ownerLandlordId: ownerResult.rows[0]?.landlord_id, 
      currentUserId: user.id,
      match: ownerResult.rows[0]?.landlord_id === user.id 
    }) // ADD THIS

    if (!ownerResult.rows[0]) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (ownerResult.rows[0].landlord_id !== user.id) {
      console.log('❌ Not the owner') // ADD THIS
      return NextResponse.json({ error: 'You do not own this property' }, { status: 403 })
    }

    // ... rest of code
    // 5. Parse and validate body
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // 6. Check for forbidden fields
    const forbiddenFields = ['location', 'lat', 'lng', 'property_type', 'landlord_id', 'created_at']
    for (const field of forbiddenFields) {
      if (field in body) {
        return NextResponse.json(
          { error: `Cannot update '${field}'. Create a new property instead.` },
          { status: 400 }
        )
      }
    }

    // 7. Build dynamic UPDATE query
    const updates: string[] = []
    const values: (string | number)[] = []
    let paramCount = 1

    if (validated.title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(validated.title)
    }
    if (validated.description !== undefined) {
      updates.push(`description = $${paramCount++}`)
      values.push(validated.description)
    }
    if (validated.area !== undefined) {
      updates.push(`area = $${paramCount++}`)
      values.push(validated.area)
    }
    if (validated.address !== undefined) {
      updates.push(`address = $${paramCount++}`)
      values.push(validated.address)
    }
    if (validated.status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(validated.status)
    }
    if (validated.total_units !== undefined) {
      updates.push(`total_units = $${paramCount++}`)
      values.push(validated.total_units)
    }
    if (validated.max_occupants_per_unit !== undefined) {
      updates.push(`max_occupants_per_unit = $${paramCount++}`)
      values.push(validated.max_occupants_per_unit)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // 8. Execute update
    const query = `
      UPDATE properties 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *,
        ST_Y(location::geometry) as lat,
        ST_X(location::geometry) as lng
    `
    values.push(id)

    const result = await pool.query(query, values)

    return NextResponse.json({ property: result.rows[0] }, { status: 200 })

  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err  },
        { status: 400 }
      )
    }

    const error = err as Error
    console.error('PUT /api/properties/[id] error:', error.message)
    return NextResponse.json(
      { error: 'Failed to update property', message: error.message },
      { status: 500 }
    )
  }
}


// delete funtion
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    const user = await getSession()
    console.log('Session user:', user) // ADD THIS test statement could not find error
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get property ID from params
    const { id } = await params
    console.log('Property ID:', id) // ADD THIS

    // 3. Check role
    const roleResult = await pool.query<{ role: string }>(
      'SELECT role FROM profiles WHERE id = $1',
      [user.id]
    )
    console.log('🔍 Role result:', roleResult.rows[0]) // ADD THIS

    if (roleResult.rows[0]?.role !== 'landlord') {
      console.log(' Not a landlord') // ADD THIS
      return NextResponse.json({ error: 'Only landlords can edit properties' }, { status: 403 })
    }

    // 4. Verify ownership
    const ownerResult = await pool.query<{ landlord_id: string }>(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [id]
    )
    console.log(' Owner result:', ownerResult.rows[0]) // ADD THIS
    console.log(' Comparing:', { 
      ownerLandlordId: ownerResult.rows[0]?.landlord_id, 
      currentUserId: user.id,
      match: ownerResult.rows[0]?.landlord_id === user.id 
    }) 

    if (!ownerResult.rows[0]) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (ownerResult.rows[0].landlord_id !== user.id) {
      console.log(' Not the owner') // ADD THIS
      return NextResponse.json({ error: 'You do not own this property' }, { status: 403 })
    }

    const leaseCheck = await pool.query(
      `
      SELECT COUNT(*) FROM leases l
      JOIN units u ON l.unit_id = u.id
      WHERE u.property_id = $1 AND l.status = 'active'
      `,
      [id]
    )
    if (parseInt(leaseCheck.rows[0].count) > 0) {
      return NextResponse.json({ error: 'Cannot delete property with active leases' }, { status: 400 })
    }
    await pool.query(
      `
      
      UPDATE properties SET status = 'inactive' , updated_at = NOW() WHERE id = $1`
      ,
      [id]
    )
  } catch (err) {
    const error = err as Error
    console.error('DELETE /api/properties/[id] error:', error.message)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 }) 
   
  }
}

