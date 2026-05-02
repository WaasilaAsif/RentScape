import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { pool } from '@/lib/db'

const BUCKET = 'property-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// GET /api/properties/[id]/images
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getUserWithRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const result = await pool.query(
      `SELECT * FROM property_images
       WHERE property_id = $1
       ORDER BY is_primary DESC, created_at ASC`,
      [id]
    )
    return NextResponse.json({ images: result.rows })
  } catch (err: unknown) {
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST /api/properties/[id]/images
// Body: FormData with "file" and optional "is_primary" = "true"
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getUserWithRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify this landlord owns the property
  const ownerCheck = await pool.query(
    `SELECT id FROM properties WHERE id = $1 AND landlord_id = $2`,
    [id, user.id]
  )
  if (ownerCheck.rows.length === 0)
    return NextResponse.json({ error: 'Property not found or access denied' }, { status: 403 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const isPrimary = formData.get('is_primary') === 'true'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, or GIF allowed' }, { status: 400 })

  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json({ error: 'File too large. Max 5 MB.' }, { status: 400 })

  const supabase = await createSupabaseServerClient()
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `private/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, file, { contentType: file.type, upsert: false })

  if (uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filename)

  try {
    // If setting as primary, unset all others first
    if (isPrimary) {
      await pool.query(
        `UPDATE property_images SET is_primary = false WHERE property_id = $1`,
        [id]
      )
    }

    const result = await pool.query(
      `INSERT INTO property_images (property_id, image_url, is_primary)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, publicUrl, isPrimary]
    )

    return NextResponse.json({ image: result.rows[0] }, { status: 201 })
  } catch (err: unknown) {
    // Clean up orphaned storage file
    await supabase.storage.from(BUCKET).remove([filename])
    const error = err as Error
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE /api/properties/[id]/images
// Body: { image_id: string }
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getUserWithRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ownerCheck = await pool.query(
    `SELECT id FROM properties WHERE id = $1 AND landlord_id = $2`,
    [id, user.id]
  )
  if (ownerCheck.rows.length === 0)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { image_id } = await req.json()
  if (!image_id) return NextResponse.json({ error: 'image_id required' }, { status: 400 })

  const imageResult = await pool.query(
    `SELECT * FROM property_images WHERE id = $1 AND property_id = $2`,
    [image_id, id]
  )
  if (imageResult.rows.length === 0)
    return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  const image = imageResult.rows[0]

  // Extract storage path from public URL and delete from bucket
  const supabase = await createSupabaseServerClient()
  const urlParts = image.image_url.split(`/${BUCKET}/`)
  if (urlParts.length === 2) {
    await supabase.storage.from(BUCKET).remove([urlParts[1]])
  }

  await pool.query(`DELETE FROM property_images WHERE id = $1`, [image_id])

  return NextResponse.json({ success: true })
}

// PATCH /api/properties/[id]/images
// Body: { image_id: string } — sets as primary/cover photo
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const user = await getUserWithRole()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ownerCheck = await pool.query(
    `SELECT id FROM properties WHERE id = $1 AND landlord_id = $2`,
    [id, user.id]
  )
  if (ownerCheck.rows.length === 0)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { image_id } = await req.json()
  if (!image_id) return NextResponse.json({ error: 'image_id required' }, { status: 400 })

  await pool.query(
    `UPDATE property_images SET is_primary = false WHERE property_id = $1`,
    [id]
  )
  await pool.query(
    `UPDATE property_images SET is_primary = true WHERE id = $1 AND property_id = $2`,
    [image_id, id]
  )

  return NextResponse.json({ success: true })
}