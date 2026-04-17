import { PrismaClient } from '@/app/generated/prisma/client'
import { Pool } from 'pg';

// --- Prisma Singleton ---

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  // store the instance on globalThis so hot-reload reuses it
  // fill this in — one line
  globalForPrisma.prisma = prisma
}

// --- pg Pool ---

export const pool = new Pool({
  // fill this in — connectionString from environment, max 10
  connectionString: process.env.DATABASE_URL,
  max: 10
})