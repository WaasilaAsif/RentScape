// app/api/debug/db/route.ts
import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    // Test raw DB connection
    const dbResult = await pool.query('SELECT NOW() as now')
    
    // Test Supabase client creation (not a real query)
    const supabase = createSupabaseServerClient()
    
    return NextResponse.json({
      status: 'ok',
      db: 'connected',
      supabase: 'client-created',
      timestamp: dbResult.rows[0].now
    })
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message, code: error.code },
      { status: 500 }
    )
  }
}