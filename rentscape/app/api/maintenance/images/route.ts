import { NextRequest, NextResponse } from 'next/server'
import { getUserWithRole } from '@/lib/get-user-with-role'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { pool } from '@/lib/db'

const BUCKET = 'maintenance-images'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== 'tenant') {
      return NextResponse.json(
        { error: 'Only tenants can upload maintenance images' },
        { status: 403 }
      )
    }

    // 2. Parse FormData
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const requestId = formData.get('request_id') as string | null

    if (!file || !requestId) {
      return NextResponse.json(
        { error: 'file and request_id are required' },
        { status: 400 }
      )
    }

    // 3. Validate file
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and WebP images are allowed' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size must be under 5MB' },
        { status: 400 }
      )
    }

    // 4. Verify tenant owns this maintenance request
    const ownerCheck = await pool.query(
      `SELECT id FROM maintenance_requests 
       WHERE id = $1 AND tenant_id = $2`,
      [requestId, user.id]
    )

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Maintenance request not found or access denied' },
        { status: 403 }
      )
    }

    // 5. Upload to Supabase Storage
    const supabase = await createSupabaseServerClient()
    const ext = file.name.split('.').pop()
    const filename = `private/${requestId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filename, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError.message)
      return NextResponse.json(
        { error: 'Failed to upload image', message: uploadError.message },
        { status: 500 }
      )
    }

    // 6. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filename)

    // 7. Save URL to maintenance_images table
    const result = await pool.query(
      `INSERT INTO maintenance_images (request_id, image_url)
       VALUES ($1, $2)
       RETURNING *`,
      [requestId, publicUrl]
    )

    return NextResponse.json(
      { image: result.rows[0] },
      { status: 201 }
    )

  } catch (err: unknown) {
    const error = err as Error
    console.error('POST /api/maintenance/images error:', error.message)
    return NextResponse.json(
      { error: 'Failed to upload image', message: error.message },
      { status: 500 }
    )
  }
}

// GET images for a specific maintenance request
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithRole()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('request_id')

    if (!requestId) {
      return NextResponse.json(
        { error: 'request_id is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this request (tenant or landlord)
    const accessCheck = await pool.query(
      `SELECT mr.id FROM maintenance_requests mr
       JOIN units u ON mr.unit_id = u.id
       JOIN properties p ON u.property_id = p.id
       WHERE mr.id = $1
         AND (mr.tenant_id = $2 OR p.landlord_id = $2)`,
      [requestId, user.id]
    )

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const result = await pool.query(
      `SELECT * FROM maintenance_images
       WHERE request_id = $1
       ORDER BY created_at ASC`,
      [requestId]
    )

    return NextResponse.json({
      images: result.rows,
      count: result.rows.length,
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('GET /api/maintenance/images error:', error.message)
    return NextResponse.json(
      { error: 'Failed to fetch images', message: error.message },
      { status: 500 }
    )
  }
}