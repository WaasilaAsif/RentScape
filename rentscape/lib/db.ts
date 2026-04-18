import { PrismaClient } from '@/app/generated/prisma/client'
import {PrismaPg} from '@prisma/adapter-pg'
import { Pool } from 'pg';

// --- Prisma Singleton ---

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({
    adapter
  })

if (process.env.NODE_ENV !== 'production') {
  // store the instance on globalThis so hot-reload reuses it
  // fill this in — one line
  globalForPrisma.prisma = prisma
}

// --- pg Pool ---

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: { rejectUnauthorized: false },
})