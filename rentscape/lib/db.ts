import { PrismaClient } from '@/app/generated/prisma/client'; // Verify if /client is needed based on your folder
import { Pool } from 'pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // @ts-expect-error: Prisma 7 uses datasourceUrl, but local types may not have refreshed yet
    datasourceUrl: process.env.DATABASE_URL,
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  // Adding SSL config here ensures the raw 'pool' also works with Supabase IPv4
  ssl: {
    rejectUnauthorized: false
  }
});