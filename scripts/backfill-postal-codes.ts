/**
 * Backfill postalCode on existing Client rows by re-parsing the address
 * strings that were already stored in the DB.
 *
 * Canadian postal code pattern: A1A 1A1  (with or without space)
 *
 * Usage (from project root):
 *   npx tsx --env-file=.env.local scripts/backfill-postal-codes.ts
 */

import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

// Matches Canadian postal codes with or without a space: K1A0A9 or K1A 0A9
const POSTAL_RE = /\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i;

function extractPostalCode(address: string): string {
  const m = address.match(POSTAL_RE);
  if (!m) return '';
  // Normalise to uppercase with space in the middle: "K1A 0A9"
  const raw = m[1].toUpperCase().replace(/\s/g, '');
  return `${raw.slice(0, 3)} ${raw.slice(3)}`;
}

async function main() {
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, address: true, postalCode: true },
  });

  console.log(`Found ${clients.length} clients. Scanning for postal codes…\n`);

  let updated = 0;
  let skipped = 0;

  for (const client of clients) {
    // Skip if already has a postal code
    if (client.postalCode && client.postalCode.trim() !== '') {
      skipped++;
      continue;
    }

    const postal = extractPostalCode(client.address);
    if (!postal) {
      skipped++;
      continue;
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { postalCode: postal },
    });

    console.log(`  ✓ ${client.name} → ${postal}  (from: "${client.address}")`);
    updated++;
  }

  console.log('\n── Backfill complete ──────────────────');
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped} (no postal found or already set)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
