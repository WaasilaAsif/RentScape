import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { z } from 'zod'
import { getSession } from '@/lib/get-session'

const unitSchema = z.object({
  property_id: z.string().uuid(),
  unit_number: z.string().min(1),
  bedrooms: z.number().min(0),
  bathrooms: z.number().min(1),
  floor: z.number().int().optional(),
  monthly_rent: z.number().min(1),
  is_furnished: z.boolean().default(false),
  advance_required: z.boolean().default(true),
  advance_months: z.number().min(1).max(12).default(1),
  max_occupants: z.number().min(1),
  description: z.string().optional()
})
export async function GET (
    request: NextRequest,
    { params }: { params: { id: string } }
){
    try{
        // first off check auth of the user
       const user = await getSession()
        console.log('Session user:', user) // ADD THIS test statement could not find error
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


        
       


        
}
    catch (error) {}
}