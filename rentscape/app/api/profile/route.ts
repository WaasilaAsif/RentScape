import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'
import { z } from 'zod'

const updateProfileSchema = z.object({
  full_name: z.string().min(3).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  police_verification_url: z.string().url().optional().or(z.literal('')),
})

// export async function GET(request: NextRequest) {
//   try {
//     const user = await getUserWithRole()
//     if (!user) {
//       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//     }

//     // Get profile with email from auth.users
//     const profileResult = await pool.query(
//       `SELECT 
//         p.*,
//         au.email
//        FROM profiles p
//        LEFT JOIN auth.users au ON p.id = au.id
//        WHERE p.id = $1`,
//       [user.id]
//     )

//     if (!profileResult.rows[0]) {
//       return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
//     }

//     // Get ratings received
//     const ratingsResult = await pool.query(
//       `SELECT 
//         r.*,
//         reviewer.full_name as reviewer_name,
//         l.start_date,
//         l.end_date,
//         p.title as property_title,
//         u.unit_number
//        FROM ratings r
//        JOIN profiles reviewer ON r.reviewer_id = reviewer.id
//        LEFT JOIN leases l ON r.lease_id = l.id
//        LEFT JOIN units u ON l.unit_id = u.id
//        LEFT JOIN properties p ON u.property_id = p.id
//        WHERE r.target_id = $1
//        ORDER BY r.created_at DESC`,
//       [user.id]
//     )

//     // Calculate average rating
//     const avgResult = await pool.query(
//       `SELECT AVG(score)::float as average_rating, COUNT(*) as total_ratings
//        FROM ratings
//        WHERE target_id = $1`,
//       [user.id]
//     )

//     return NextResponse.json({
//       profile: profileResult.rows[0],
//       ratings: ratingsResult.rows,
//       average_rating: avgResult.rows[0].average_rating || 0,
//       total_ratings: parseInt(avgResult.rows[0].total_ratings) || 0,
//     })

//   } catch (err: unknown) {
//     const error = err as Error
//     console.error('GET /api/profile error:', error.message)
//     return NextResponse.json(
//       { error: 'Failed to fetch profile', message: error.message },
//       { status: 500 }
//     )
//   }
// }

 export async function PUT(request: NextRequest) {
   try {
     const user = await getUserWithRole()
     if (!user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
     }

     const body = await request.json()
     const validated = updateProfileSchema.parse(body)

     // Build dynamic update
     const updates: string[] = []
     type Value = string | null
     const values: Value[] = []
     let paramCount = 1

     if (validated.full_name) {
       updates.push(`full_name = $${paramCount++}`)
       values.push(validated.full_name.trim())
     }

     if (validated.phone !== undefined) {
       updates.push(`phone = $${paramCount++}`)
       values.push(validated.phone.replace(/[\s-]/g, '') || null)
     }

     if (validated.address !== undefined) {
       updates.push(`address = $${paramCount++}`)
       values.push(validated.address.trim() || null)
     }

     if (validated.emergency_contact_name !== undefined) {
       updates.push(`emergency_contact_name = $${paramCount++}`)
       values.push(validated.emergency_contact_name.trim() || null)
     }

     if (validated.emergency_contact_phone !== undefined) {
       updates.push(`emergency_contact_phone = $${paramCount++}`)
       values.push(validated.emergency_contact_phone.replace(/[\s-]/g, '') || null)
     }

     if (validated.police_verification_url !== undefined) {
       updates.push(`police_verification_url = $${paramCount++}`)
       values.push(validated.police_verification_url || null)
     }

     if (updates.length === 0) {
       return NextResponse.json(
         { error: 'No fields to update' },
         { status: 400 }
       )
     }

     updates.push(`updated_at = NOW()`)

     const result = await pool.query(
       `UPDATE profiles 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *`,
       [...values, user.id]
     )
     return NextResponse.json({ profile: result.rows[0] }, { status: 200 })
   } catch (err: unknown) {
     if (err instanceof z.ZodError) {
       return NextResponse.json(
         { error: 'Validation failed', details: err.issues },
         { status: 400 }
       )
     }

     const error = err as Error
     console.error('PUT /api/profile error:', error.message)
     return NextResponse.json(
       { error: 'Failed to update profile', message: error.message },
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

    // Single query with all data
    const result = await pool.query(
      `WITH profile_data AS (
        SELECT 
          p.*,
          au.email
        FROM profiles p
        LEFT JOIN auth.users au ON p.id = au.id
        WHERE p.id = $1
      ),
      ratings_data AS (
        SELECT 
          r.*,
          reviewer.full_name as reviewer_name,
          l.start_date,
          l.end_date,
          p.title as property_title,
          u.unit_number
        FROM ratings r
        JOIN profiles reviewer ON r.reviewer_id = reviewer.id
        LEFT JOIN leases l ON r.lease_id = l.id
        LEFT JOIN units u ON l.unit_id = u.id
        LEFT JOIN properties p ON u.property_id = p.id
        WHERE r.target_id = $1
        ORDER BY r.created_at DESC
      ),
      rating_stats AS (
        SELECT 
          COALESCE(AVG(score)::float, 0) as average_rating,
          COUNT(*)::int as total_ratings
        FROM ratings
        WHERE target_id = $1
      )
      SELECT 
        json_build_object(
          'profile', (SELECT row_to_json(profile_data.*) FROM profile_data),
          'ratings', COALESCE((SELECT json_agg(row_to_json(ratings_data.*)) FROM ratings_data), '[]'::json),
          'average_rating', (SELECT average_rating FROM rating_stats),
          'total_ratings', (SELECT total_ratings FROM rating_stats)
        ) as result`,
      [user.id]
    )

    const data = result.rows[0].result

    return NextResponse.json(data)

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/profile error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch profile', message: error.message },
      { status: 500 }
    )
  }
}