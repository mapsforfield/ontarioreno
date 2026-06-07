/**
 * One-off import: reads "Oliver Sales.csv" and creates historical Deal records
 * for David (rep id: cmq2mv9ka000004jm9qlieibb).
 *
 * Rules:
 * - isHistorical = true  → excluded from leaderboard
 * - status = 'won'       → shows in David's closed sales view
 * - Matches clients by name (case-insensitive, partial) to link the deal to
 *   the existing client profile from the Setmore import.
 *
 * Usage (from project root):
 *   npx tsx --env-file=.env.local scripts/import-david-sales.ts
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

const DAVID_ID = 'cmq2mv9ka000004jm9qlieibb';

function parseValue(raw: string): number {
  return parseFloat(raw.replace(/[$,\s"]/g, '')) || 0;
}

function parseCsv(content: string): { name: string; rawValue: string }[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  // Skip header
  return lines.slice(1).map((line) => {
    // Handle quoted values like "40,000.00"
    const match = line.match(/^"?([^",]+)"?,\s*"?([\d,. ]+)"?$/);
    if (match) return { name: match[1].trim(), rawValue: match[2].trim() };
    // Fallback: split on last comma
    const idx = line.lastIndexOf(',');
    return {
      name: line.slice(0, idx).replace(/^"|"$/g, '').trim(),
      rawValue: line.slice(idx + 1).replace(/^"|"$/g, '').trim(),
    };
  });
}

/**
 * Try to match a CSV client name to an existing Client record.
 * Strategy (in order):
 *   1. Exact match (case-insensitive)
 *   2. The CSV name contains a word that appears in the DB name (or vice versa)
 *      — uses the longest word from the CSV name
 */
async function findClient(csvName: string) {
  const lower = csvName.toLowerCase().replace(/[*]/g, '').trim();

  // 1. Exact case-insensitive
  const exact = await prisma.client.findFirst({
    where: { name: { equals: lower, mode: 'insensitive' } },
  });
  if (exact) return exact;

  // 2. Longest token match
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
  const csvPath = join(process.cwd(), '..', 'Oliver Sales.csv');
  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch {
    csvContent = readFileSync(join(process.cwd(), 'Oliver Sales.csv'), 'utf-8');
  }

  const rows = parseCsv(csvContent);
  console.log(`Parsed ${rows.length} sales rows from CSV.\n`);

  let created = 0;
  let matched = 0;
  let unmatched = 0;

  for (const row of rows) {
    const value = parseValue(row.rawValue);
    if (!row.name || value === 0) {
      console.log(`  Skipping (no name or zero value): "${row.name}" / "${row.rawValue}"`);
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
        assignedRepId: DAVID_ID,
        assignedContractorId: null,
        status: 'won',
        isHistorical: true,
        notes: `Imported from pre-portal sales records. Original client name: ${row.name}`,
        nextFollowUpDate: '',
      },
    });

    created++;
  }

  console.log('\n── Import complete ──────────────────');
  console.log(`  Deals created : ${created}`);
  console.log(`  Client matches: ${matched}`);
  console.log(`  No match      : ${unmatched}`);
  const total = rows.reduce((sum, r) => sum + parseValue(r.rawValue), 0);
  console.log(`  Total volume  : $${total.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
