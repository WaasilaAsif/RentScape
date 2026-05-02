// // lib/db.ts
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // THE BRUTE FORCE FIX

// import { Pool } from 'pg';
// import { PrismaClient } from '@/app/generated/prisma/client';

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false,
//   },
// });

// export const prisma = {} as unknown as PrismaClient;

// lib/db.ts
// Go thrpogh this file again while running ui 
// First check no UI is using prisma and then delete and revert this file to the original pg pool implementation if not using prisma in UI
import { Pool } from 'pg'
//import { PrismaClient } from '@/app/generated/prisma/client'
//import { PrismaPg } from '@prisma/adapter-pg'

// --- Prisma Singleton ---

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined
// }

// export const prisma =
//   globalForPrisma.prisma ?? new PrismaClient({
//     adapter: new PrismaPg({
//       connectionString: process.env.DATABASE_URL,
//     }),
//   })

// if (process.env.NODE_ENV !== 'production') {
//   // store the instance on globalThis so hot-reload reuses it
//   globalForPrisma.prisma = prisma
// }

// --- pg Pool ---

// export const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
//   ssl: {
//     rejectUnauthorized: false, // Local dev only — Supabase cert not in Node trust store
//   },
//   max: 10,
// })

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
})

// Prisma stub (prevent import errors, not actually used)
// export const prisma = {} as unknown as PrismaClient 