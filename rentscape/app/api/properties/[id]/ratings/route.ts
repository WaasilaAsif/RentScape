import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params

    const result = await pool.query<{
      id: string
      score: number
      comment: string | null
      created_at: string
      reviewer_name: string
    }>(
      `SELECT
         r.id,
         r.score,
         r.comment,
         r.created_at,
         prof.full_name AS reviewer_name
       FROM ratings r
       JOIN profiles prof ON r.reviewer_id = prof.id
       WHERE r.target_type = 'property'
         AND r.target_id = $1
       ORDER BY r.created_at DESC`,
      [propertyId]
    )

    const reviews = result.rows
    const total_reviews = reviews.length
    const average_rating =
      total_reviews > 0
        ? reviews.reduce((sum, r) => sum + r.score, 0) / total_reviews
        : 0

    return NextResponse.json({
      average_rating: Math.round(average_rating * 10) / 10,
      total_reviews,
      reviews,
    })
  } catch (err) {
    const error = err as Error
    console.error('GET /api/properties/[id]/ratings error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch ratings', message: error.message },
      { status: 500 }
    )
  }
}