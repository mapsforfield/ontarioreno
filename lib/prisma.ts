import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL ?? '';
  // PrismaNeon takes a PoolConfig object directly (not a Pool instance)
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter } as never);
}

// Singleton pattern for serverless — reuse across warm invocations
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
