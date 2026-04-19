import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  try {
    // A simple query to get the current time from the DB
    const result = await pool.query('SELECT NOW() as time, version();');
    
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      time: result.rows[0].time,
      version: result.rows[0].version
    });
  } catch (err) {
  // Cast the unknown error to the standard Error type
  const error = err as Error;
  
  console.error('Database connection error:', error.message);
  
  return NextResponse.json({
    status: 'unhealthy',
    error: error.message,
    hint: 'Check your SSL settings and Hotspot connection'
  }, { status: 500 });
}
}

