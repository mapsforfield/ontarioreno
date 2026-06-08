/**
 * Backfill postalCode on existing Client rows from ExportContacts.csv
 *
 * The original import stripped postal codes from the address string before
 * saving, so we re-read them directly from the CSV and match by email → name.
 *
 * Usage (from project root):
 *   npx tsx --env-file=.env.local scripts/backfill-postal-codes.ts
 */

import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

neonConfig.webSocketConstructor = ws;
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

// Matches Canadian postal codes: L9E 1S7, L1H7K4, etc.
const POSTAL_RE = /\b([A-Z]\d[A-Z]\s?\d[A-Z]\d)\b/i;

function extractPostalCode(address: string): string {
  const m = address.match(POSTAL_RE);
  if (!m) return '';
  const raw = m[1].toUpperCase().replace(/\s/g, '');
  return `${raw.slice(0, 3)} ${raw.slice(3)}`;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') { inQuotes = !inQuotes; current += ch; }
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (current.trim()) lines.push(current.replace(/\r$/, ''));
      current = '';
      if (ch === '\r' && content[i + 1] === '\n') i++;
    } else { current += ch; }
  }
  if (current.trim()) lines.push(current);

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { q = !q; }
      else if (ch === ',' && !q) { fields.push(field.trim()); field = ''; }
      else { field += ch; }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]));
  });
}

async function main() {
  // Load ExportContacts.csv
  const csvPath = existsSync(join(process.cwd(), '..', 'ExportContacts.csv'))
    ? join(process.cwd(), '..', 'ExportContacts.csv')
    : join(process.cwd(), 'ExportContacts.csv');

  const rows = parseCsv(readFileSync(csvPath, 'utf-8'));
  console.log(`Loaded ${rows.length} rows from ExportContacts.csv`);

  // Build lookup: email → postal, name → postal
  const byEmail = new Map<string, string>();
  const byName  = new Map<string, string>();
  for (const row of rows) {
    const postal = extractPostalCode(row['Address'] ?? '');
    if (!postal) continue;
    const email = (row['Email'] || row['Email1'] || '').toLowerCase().trim();
    const name  = (row['Name'] ?? '').toLowerCase().trim();
    if (email) byEmail.set(email, postal);
    if (name)  byName.set(name, postal);
  }
  console.log(`  ${byEmail.size} postal codes indexed by email`);
  console.log(`  ${byName.size} postal codes indexed by name\n`);

  // Load all clients that don't have a postal code yet
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, email: true, postalCode: true },
  });
  console.log(`Found ${clients.length} clients in DB. Backfilling…\n`);

  let updated = 0;
  let skipped = 0;

  for (const client of clients) {
    if (client.postalCode && client.postalCode.trim() !== '') {
      skipped++;
      continue;
    }

    const postal =
      (client.email && byEmail.get(client.email.toLowerCase().trim())) ||
      byName.get(client.name.toLowerCase().trim()) ||
      '';

    if (!postal) {
      skipped++;
      continue;
    }

    await prisma.client.update({
      where: { id: client.id },
      data: { postalCode: postal },
    });

    console.log(`  ✓ ${client.name} → ${postal}`);
    updated++;
  }

  console.log('\n── Backfill complete ──────────────────');
  console.log(`  Updated : ${updated}`);
  console.log(`  Skipped : ${skipped} (no postal found or already set)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
