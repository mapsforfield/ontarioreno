/**
 * One-off import: reads "Xavier Sales.csv" and creates historical Deal records
 * for Keven (rep id: cmq2n9ww9000004l22xiz5axn).
 *
 * isHistorical = true → excluded from leaderboard
 * status = 'won'      → shows in Keven's closed sales view
 *
 * Usage (from project root):
 *   npx tsx --env-file=.env.local scripts/import-keven-sales.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

const KEVEN_ID = 'cmq2n9ww9000004l22xiz5axn';

function parseValue(raw: string): number {
  return parseFloat(raw.replace(/[$,\s"]/g, '')) || 0;
}

function parseCsv(content: string): { name: string; rawValue: string }[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  return lines.slice(1).map((line) => {
    const match = line.match(/^"?([^",]+)"?,\s*"?([\d,. ]+)"?$/);
    if (match) return { name: match[1].trim(), rawValue: match[2].trim() };
    const idx = line.lastIndexOf(',');
    return {
      name: line.slice(0, idx).replace(/^"|"$/g, '').trim(),
      rawValue: line.slice(idx + 1).replace(/^"|"$/g, '').trim(),
    };
  });
}

async function findClient(csvName: string) {
  const lower = csvName.toLowerCase().replace(/[*]/g, '').trim();

  const exact = await prisma.client.findFirst({
    where: { name: { equals: lower, mode: 'insensitive' } },
  });
  if (exact) return exact;

  const tokens = lower
    .split(/[\s/&,]+/)
    .filter((t) => t.length > 2)
    .sort((a, b) => b.length - a.length);

  for (const token of tokens) {
    const partial = await prisma.client.findFirst({
      where: { name: { contains: token, mode: 'insensitive' } },
    });
    if (partial) return partial;
  }

  return null;
}

async function main() {
  let csvContent: string;
  try {
    csvContent = readFileSync(join(process.cwd(), '..', 'Xavier Sales.csv'), 'utf-8');
  } catch {
    csvContent = readFileSync(join(process.cwd(), 'Xavier Sales.csv'), 'utf-8');
  }

  const rows = parseCsv(csvContent);
  console.log(`Parsed ${rows.length} sales rows from CSV.\n`);

  let created = 0;
  let matched = 0;
  let unmatched = 0;

  for (const row of rows) {
    const value = parseValue(row.rawValue);
    if (!row.name || value === 0) {
      console.log(`  Skipping (no name or zero value): "${row.name}"`);
      continue;
    }

    const client = await findClient(row.name);
    if (client) {
      matched++;
      console.log(`  ✓ Matched: "${row.name}"  →  "${client.name}" (${client.id})`);
    } else {
      unmatched++;
      console.log(`  ~ No match: "${row.name}" — creating deal without client link`);
    }

    await prisma.deal.create({
      data: {
        homeownerName: row.name,
        phone: client?.phone ?? '',
        email: client?.email ?? '',
        city: client?.city ?? '',
        projectType: client ? (client.projectTypes[0] ?? 'Renovation') : 'Renovation',
        estimatedJobValue: value,
        financingRequired: false,
        assignedRepId: KEVEN_ID,
        assignedContractorId: null,
        status: 'won',
        isHistorical: true,
        notes: `Imported from pre-portal sales records. Original client name: ${row.name}`,
        nextFollowUpDate: '',
      },
    });

    created++;
  }

  const total = rows.reduce((sum, r) => sum + parseValue(r.rawValue), 0);
  console.log('\n── Import complete ──────────────────');
  console.log(`  Deals created : ${created}`);
  console.log(`  Client matches: ${matched}`);
  console.log(`  No match      : ${unmatched}`);
  console.log(`  Total volume  : $${total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
