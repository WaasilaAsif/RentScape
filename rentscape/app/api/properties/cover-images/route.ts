import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// GET /api/properties/cover-images?ids=id1,id2,id3
// Returns a map of { [property_id]: image_url } for primary images only
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ids = searchParams.get('ids')

  if (!ids) return NextResponse.json({ covers: {} })

  const propertyIds = ids.split(',').filter(Boolean).slice(0, 100) // max 100
  if (propertyIds.length === 0) return NextResponse.json({ covers: {} })

  try {
    const result = await pool.query(
      `SELECT DISTINCT ON (property_id) property_id, image_url
       FROM property_images
       WHERE property_id = ANY($1::uuid[])
       ORDER BY property_id, is_primary DESC, created_at ASC`,
      [propertyIds]
    )

    // Build a simple { property_id -> image_url } map
    const covers: Record<string, string> = {}
    for (const row of result.rows) {
      covers[row.property_id] = row.image_url
    }

    return NextResponse.json({ covers })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}