/**
 * One-off import script: reads ExportContacts.csv and bulk-inserts clients
 * into the portal DB via Prisma.
 *
 * Usage (from project root):
 *   npx tsx scripts/import-contacts.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '../src/generated/prisma/client.js';

// Required for @neondatabase/serverless to work in Node.js
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL ?? '';
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter } as never);

// ── Minimal CSV parser (handles double-quote escaping) ────────────────────────
function parseCsv(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      inQuote = !inQuote;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (current.trim()) lines.push(current);
      current = '';
      if (ch === '\r' && content[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const parseRow = (row: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let inQ = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inQ && row[i + 1] === '"') { field += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        fields.push(field.trim());
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// ── Extract city from address string ─────────────────────────────────────────
// Format: "street, city, province, country - postal" or variants
function extractCity(address: string): string {
  if (!address) return '';
  // Strip trailing comma if any
  const cleaned = address.replace(/,\s*$/, '');
  const parts = cleaned.split(',').map((p) => p.trim());
  // City is usually the 2nd part (index 1), but skip if it looks like a unit
  if (parts.length >= 2) {
    const candidate = parts[1].replace(/\s*(ON|Ontario)\s*\w*/i, '').trim();
    // Reject if it's a province/country name or postal code
    if (candidate && !/^(Ontario|Canada|ON)$/i.test(candidate) && candidate.length > 2) {
      // Sometimes "Oshawa, ON L1H 7K4" is all in one chunk — pull out just the city word(s)
      const cityOnly = candidate.replace(/\s+ON\s+\w+/i, '').replace(/\s+\w\d\w\s+\d\w\d.*/i, '').trim();
      return cityOnly;
    }
  }
  return '';
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = join(process.cwd(), '..', 'ExportContacts.csv');
  let csvContent: string;
  try {
    csvContent = readFileSync(csvPath, 'utf-8');
  } catch {
    // Try alternate path (running from project root)
    const altPath = join(process.cwd(), 'ExportContacts.csv');
    csvContent = readFileSync(altPath, 'utf-8');
  }

  const rows = parseCsv(csvContent);
  console.log(`Parsed ${rows.length} rows from CSV.`);

  // Find an admin user to use as createdByUserId
  const adminUser = await prisma.user.findFirst({ where: { role: 'admin' } });
  if (!adminUser) throw new Error('No admin user found in DB. Please seed a user first.');
  console.log(`Using admin: ${adminUser.name} (${adminUser.id})`);

  // Fetch existing client emails so we can skip duplicates
  const existingClients = await prisma.client.findMany({ select: { email: true, name: true } });
  const existingEmails = new Set(existingClients.map((c) => c.email.toLowerCase()).filter(Boolean));
  console.log(`${existingClients.length} clients already in DB.`);

  let created = 0;
  let skipped = 0;
  let noContact = 0;

  // Deduplicate within the CSV itself by email
  const seenInCsv = new Set<string>();

  for (const row of rows) {
    const name = (row['Name'] ?? '').trim();
    if (!name || name.toLowerCase().includes('showroom') || name.toLowerCase() === 'out from work') {
      skipped++;
      continue;
    }

    const email = (row['Email'] || row['Email1'] || '').trim().toLowerCase();
    const phone = (row['Phone'] || row['Phone1'] || '').trim();
    const rawAddress = (row['Address'] ?? '').trim();

    // Skip if no meaningful contact info at all
    if (!email && !phone) {
      noContact++;
      console.log(`  Skipping (no contact info): ${name}`);
      continue;
    }

    // Deduplicate by email
    if (email) {
      if (existingEmails.has(email) || seenInCsv.has(email)) {
        console.log(`  Skipping duplicate email: ${name} <${email}>`);
        skipped++;
        continue;
      }
      seenInCsv.add(email);
    }

    // Parse city from address
    const city = extractCity(rawAddress);
    // Use full address minus postal/country noise
    const address = rawAddress
      .replace(/,\s*Canada\s*-?\s*[A-Z0-9 ]+$/i, '')
      .replace(/,\s*Canada$/i, '')
      .trim();

    await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        city,
        projectTypes: [],
        internalNotes: '',
        source: 'import',
        createdByUserId: adminUser.id,
      },
    });

    created++;
    if (created % 50 === 0) console.log(`  ${created} clients imported…`);
  }

  console.log('\n── Import complete ──────────────────');
  console.log(`  Created : ${created}`);
  console.log(`  Skipped : ${skipped}`);
  console.log(`  No contact info: ${noContact}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
