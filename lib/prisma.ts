import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { resolveDatabaseUrl } from './db-url.js';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Preview deployments resolve ONLY from PREVIEW_DATABASE_*; resolveDatabaseUrl
  // throws rather than falling back, so a misconfigured Preview cannot open a
  // connection to production. Production/local behaviour is unchanged.
  const connectionString = resolveDatabaseUrl();
  // PrismaNeon takes a PoolConfig object directly (not a Pool instance)
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter } as never);
}

// Singleton pattern for serverless — reuse across warm invocations
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
