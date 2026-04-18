// // app/api/test-db/route.ts
// import { NextResponse } from 'next/server'
// import { prisma } from '@/lib/db'

// export async function GET() {
//   try {
//     // Test basic query
//     const time = await prisma.$queryRaw`SELECT NOW() as now`
    
//     // Test your PostGIS query pattern
//     const sample = await prisma.$queryRaw`
//       SELECT 
//         id, title, 
//         ST_Y(location::geometry) as lat,
//         ST_X(location::geometry) as lng
//       FROM properties 
//       LIMIT 1
//     `
    
//     return NextResponse.json({ 
//       ok: true, 
//       time: time[0], 
//       sampleProperty: sample[0] || null 
//     })
//   } catch (error: any) {
//     console.error('DB test failed:', error)
//     return NextResponse.json(
//       { ok: false, error: error.message, code: error.code },
//       { status: 500 }
//     )
//   }
// }