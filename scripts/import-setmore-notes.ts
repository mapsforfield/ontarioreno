/**
 * Import Setmore customer notes → Client.internalNotes in the portal DB
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads customer_notes.csv (produced by scrape-setmore-notes.ts) and updates
 * each matched Client record's internalNotes field.
 *
 * Matching priority:
 *   1. Email  (most reliable)
 *   2. Phone  (digits-only comparison)
 *
 * Rows with blank notes or UI noise ("Cancel", "Save", etc.) are skipped —
 * those clients simply keep whatever internalNotes they already have (blank).
 *
 * Usage (from project root):
 *   npx tsx --env-file=.env.local scripts/import-setmore-notes.ts
 *
 * Pass --dry-run to preview matches without writing to the DB.
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

const DRY_RUN = process.argv.includes('--dry-run');
const CSV_PATH        = join(process.cwd(), 'customer_notes.csv');
const EXPORT_CSV_PATH = join(process.cwd(), '..', 'ExportContacts.csv');

// ─── UI noise strings to treat as "no note" ────────────────────────────────
const NOISE = new Set(['cancel', 'save', 'add note', 'no notes', 'edit', 'delete', 'add a note', 'write a note', 'cance']);

function isRealNote(text: string): boolean {
  const t = text.trim();
  if (!t || t.length < 4) return false;
  if (NOISE.has(t.toLowerCase())) return false;
  // Also skip if it's ONLY "Cancel\nSave" or similar button combos
  const lines = t.split('\n').map((l) => l.trim().toLowerCase()).filter(Boolean);
  if (lines.every((l) => NOISE.has(l))) return false;
  return true;
}

function normalisePhone(p: string): string {
  return p.replace(/\D/g, '');
}

/** Strip the avatar letter prefix Setmore adds to sidebar list item text.
 *  e.g. "AAbdelhalim" → "Abdelhalim", "aadam" → "adam"
 *  Pattern: first char is always the first letter of the real name (avatar),
 *  so stripping char[0] recovers the original name. */
function stripAvatarPrefix(name: string): string {
  if (!name || name.length < 2) return name;
  // If first two chars are same letter (case-insensitive), strip first one
  if (name[0].toLowerCase() === name[1].toLowerCase()) return name.slice(1);
  // If name starts with a single uppercase letter then another uppercase (e.g. "AAlexander")
  if (/^[A-Z][A-Z]/.test(name)) return name.slice(1);
  return name;
}

// ─── Simple CSV parser ──────────────────────────────────────────────────────
function parseCsv(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') { inQuotes = !inQuotes; current += ch; }
    else if (ch === '\n' && !inQuotes) { lines.push(current.replace(/\r$/, '')); current = ''; }
    else { current += ch; }
  }
  if (current.trim()) lines.push(current);

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { q = !q; field += ch; }
      else if (ch === ',' && !q) { fields.push(field.replace(/^"|"$/g, '')); field = ''; }
      else { field += ch; }
    }
    fields.push(field.replace(/^"|"$/g, ''));
    return fields;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1).filter((l) => l.trim()).map((line) => {
    const vals = parseRow(line);
    return Object.fromEntries(headers.map((h, i) => [h.trim(), (vals[i] ?? '').trim()]));
  });
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n════════════════════════════════════════════════');
  console.log('  Setmore Notes → Portal Client Import');
  if (DRY_RUN) console.log('  MODE: DRY RUN (no changes written)');
  console.log('════════════════════════════════════════════════\n');

  if (!existsSync(CSV_PATH)) {
    console.error(`  ✖ customer_notes.csv not found at ${CSV_PATH}`);
    process.exit(1);
  }

  const csvRows = parseCsv(readFileSync(CSV_PATH, 'utf-8'));
  console.log(`  Loaded ${csvRows.length} rows from customer_notes.csv`);

  // Only rows that have real notes
  const rowsWithNotes = csvRows.filter((r) => isRealNote(r['notes'] ?? ''));
  console.log(`  ${rowsWithNotes.length} rows have real notes to import\n`);

  // Load ExportContacts.csv to get email/phone by name (since scraper had empty email/phone)
  const exportMap = new Map<string, Record<string, string>>();
  if (existsSync(EXPORT_CSV_PATH)) {
    const exportRows = parseCsv(readFileSync(EXPORT_CSV_PATH, 'utf-8'));
    for (const r of exportRows) {
      const name = (r['Name'] ?? r['name'] ?? '').trim();
      if (name) exportMap.set(name.toLowerCase(), r);
    }
    console.log(`  Loaded ${exportMap.size} contacts from ExportContacts.csv\n`);
  }

  // Load all clients from DB
  const clients = await prisma.client.findMany({
    select: { id: true, name: true, email: true, phone: true, internalNotes: true },
  });
  console.log(`  ${clients.length} clients in portal DB\n`);

  // Build lookup maps
  const byEmail = new Map<string, typeof clients[0]>();
  const byPhone = new Map<string, typeof clients[0]>();
  const byName  = new Map<string, typeof clients[0]>();
  for (const c of clients) {
    if (c.email) byEmail.set(c.email.toLowerCase().trim(), c);
    const p = normalisePhone(c.phone);
    if (p.length >= 7) byPhone.set(p, c);
    byName.set(c.name.toLowerCase().trim(), c);
  }

  let matched        = 0;
  let noMatch        = 0;
  let alreadyHasNote = 0;

  for (const row of rowsWithNotes) {
    const note     = row['notes'].trim();
    const rowName  = (row['name'] ?? '').trim();
    let   email    = (row['email'] ?? '').toLowerCase().trim();
    let   phone    = normalisePhone(row['phone'] ?? '');

    // Clean the avatar-prefix artifact from the name
    const cleanName = stripAvatarPrefix(rowName);

    // If the CSV has no email/phone, look them up from ExportContacts by name
    if ((!email && !phone) && cleanName) {
      const exportEntry = exportMap.get(cleanName.toLowerCase()) ?? exportMap.get(rowName.toLowerCase());
      if (exportEntry) {
        email = (exportEntry['Email'] ?? exportEntry['email'] ?? '').toLowerCase().trim();
        phone = normalisePhone(exportEntry['Phone'] ?? exportEntry['phone'] ?? '');
      }
    }

    // Match: email → phone → cleaned name → raw name
    const client =
      (email && byEmail.get(email)) ||
      (phone.length >= 7 && byPhone.get(phone)) ||
      byName.get(cleanName.toLowerCase()) ||
      byName.get(rowName.toLowerCase()) ||
      null;

    if (!client) {
      console.log(`  ✗ No match  — "${rowName}"  email: ${email || '—'}  phone: ${phone || '—'}`);
      noMatch++;
      continue;
    }

    // If client already has a non-empty internalNotes, append rather than overwrite
    const existing = client.internalNotes?.trim() ?? '';
    const newNote  = existing
      ? existing.includes(note) ? existing : `${existing}\n\n[Setmore] ${note}`
      : note;

    if (existing && existing === newNote) {
      console.log(`  ~ Already up-to-date: ${client.name}`);
      alreadyHasNote++;
      continue;
    }

    console.log(`  ✓ ${client.name}  →  "${note.slice(0, 60)}${note.length > 60 ? '…' : ''}"`);

    if (!DRY_RUN) {
      await prisma.client.update({
        where: { id: client.id },
        data: { internalNotes: newNote },
      });
    }

    matched++;
  }

  console.log('\n════════════════════════════════════════════════');
  console.log(`  Matched & updated : ${matched}`);
  console.log(`  Already up-to-date: ${alreadyHasNote}`);
  console.log(`  No portal match   : ${noMatch}`);
  console.log(`  Rows without notes: ${csvRows.length - rowsWithNotes.length} (skipped)`);
  if (DRY_RUN) console.log('\n  Dry run — nothing was written to the DB.');
  console.log('════════════════════════════════════════════════\n');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
