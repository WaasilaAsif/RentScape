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
import { Pool } from 'pg'
import { PrismaClient } from '@/app/generated/prisma/client'

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Local dev only — Supabase cert not in Node trust store
  },
  max: 10,
})

// Stub Prisma to prevent import errors in other files
export const prisma = {} as unknown as PrismaClient