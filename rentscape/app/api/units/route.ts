//For now only get and post routes for units, we will add patch and delete later when we have the update and delete functionality in place for the units

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { z } from 'zod'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { RedirectType } from 'next/navigation'
//ok so Imma write code to explain my choice of param validators
const unitSchema = z.object({
    //For landlord to access specific property we do this 
  property_id: z.string().uuid(),
  // By default every property will have a unit number of 1 but if the landlord wants to add more units to the same property they can specify the unit number and it should be unique for that property
  unit_number: z.string().min(1),
  //min is at zer cuz socho 
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(1),
  floor: z.number().int().optional(),
  monthly_rent: z.number().min(1),
  // is_furnished: z.boolean().default(false),
  advance_required: z.boolean().default(true),
  advance_months: z.number().min(1).max(12).default(1),
  max_occupants: z.number().min(1),
  description: z.string().optional()
})

export async function POST (request : NextRequest){
    try {
        const user = await getUserWithRole()
        // firsst offf chek the user if he actually iis there
        if (!user ){
            //return NextResponse.redirect(new URL('/login', request.url))
            // or we could return a 401 unauthorized response
            return NextResponse.json({error: 'Unauthorized Login again'}, {status: 401})
        }
        // then we check if the user is a landlord

        if (user.role !== 'landlord') {
      return NextResponse.json(
        { error: 'Only landlords can create units' },
        { status: 403 }
      )
    }

     const body = await request.json()
    const validated = unitSchema.parse(body)

   // 4. Verify property ownership
    const ownerCheck = await pool.query<{ landlord_id: string }>(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [validated.property_id]
    )
     if (!ownerCheck.rows[0]) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    if (ownerCheck.rows[0].landlord_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not own this property' },
        { status: 403 }
      )
    }

    // Check unit number and property_id uniqueness
    // duplicate check does not have a return type or does not follow the syntax of providieng a type for pooolm query becasue
    // we are only interested in the length of the rows array to check for duplicates, and we don't need to define a specific type for the query result in this case. The query will return an array of rows, and we can simply check if the length of that array is greater than 0 to determine if a duplicate exists.
    // It sort of acts like a bool
    // We use the return type format of syntax <> when we want to specify the type of the result of the query, but in this case we are not interested in the specific type of the result, we just want to check if there are any rows returned, so we can omit the return type and let TypeScript infer it.
    const duplicateCheck = await pool.query(
        `
        Select id from units where property_id = $1 and unit_number = $2`,
        [validated.property_id, validated.unit_number]
    )
    if (duplicateCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Unit number already exists for this property' }, 
        // 409 : Conflict status code indicates that the request could not be completed due to a conflict with the current state of the resource. In this case, it means that there is already a unit with the same unit number for the specified property, and therefore the request to create a new unit cannot be fulfilled.
        { status: 409 })
    }
    const result = await pool.query (
        `
        INSERT INTO units (
        property_id ,
        unit_number,
        bedrooms,
        bathrooms,
        floor,
        monthly_rent,
        
        advance_required,
        advance_months,
        max_occupants,
        description,
        is_available
        
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10 , true)
        RETURNING id
        `
        ,
        [
            validated.property_id,
            validated.unit_number,
            validated.bedrooms,
            validated.bathrooms,
            validated.floor, //rearranged the order
            validated.monthly_rent,
            // validated.is_furnished,
            validated.advance_required,
            validated.advance_months,
            validated.max_occupants,
            validated.description
        ]

    )
   return NextResponse.json(
      { message: "Unit created", unit: result.rows[0] },
      { status: 201 }
    );
  }
  catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.issues },
        { status: 400 }
      )
    }
    const error = err as Error
    console.error('POST /api/units error:', error.message)
    return NextResponse.json(
      { error: 'Failed to create unit', message: error.message },
      { status: 500 }
    )
}
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const availableOnly = searchParams.get('available_only') === 'true'

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id parameter is required' },
        { status: 400 }
      )
    }

    let query = 'SELECT * FROM units WHERE property_id = $1'
    if (availableOnly) {
      query += ' AND is_available = true'
    }
    query += ' ORDER BY unit_number'

    const result = await pool.query(query, [propertyId])

    return NextResponse.json({ 
      units: result.rows,
      count: result.rows.length 
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/units error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch units', message: error.message },
      { status: 500 }
    )
  }
}