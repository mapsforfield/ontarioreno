/**
 * Setmore Customer Notes Scraper
 * ─────────────────────────────────────────────────────────────────────────────
 * Logs into Setmore, iterates every customer profile, clicks the Notes tab,
 * extracts all note text, and writes customer_notes.csv.
 *
 * Features:
 *  - Resumes from last completed customer if interrupted (progress.json)
 *  - Read-only: never clicks Save, Edit, or Delete
 *  - Polite delays between actions to avoid rate-limiting
 *  - Matches against ExportContacts.csv by email → phone → name
 *
 * Usage:
 *   npx tsx scripts/scrape-setmore-notes.ts
 *
 * You will be prompted to log in manually in the browser window that opens.
 * Once you are on the Customers page the script takes over automatically.
 *
 * Output:
 *   customer_notes.csv     — final export (name, email, phone, notes)
 *   scraper-progress.json  — checkpoint file; delete to restart from scratch
 */

import { firefox } from 'playwright';
import { createWriteStream, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';

// ─── Config ───────────────────────────────────────────────────────────────────

const SETMORE_LOGIN_URL = 'https://my.setmore.com/';
const CUSTOMERS_URL     = 'https://my.setmore.com/customers';
const OUTPUT_CSV        = join(process.cwd(), 'customer_notes.csv');
const PROGRESS_FILE     = join(process.cwd(), 'scraper-progress.json');
const EXPORT_CSV        = join(process.cwd(), '..', 'ExportContacts.csv');

// Delays (ms) — generous to be polite
const DELAY_BETWEEN_CUSTOMERS  = 1200;  // between opening each customer
const DELAY_AFTER_CLICK        = 800;   // after clicking a customer row
const DELAY_NOTES_TAB          = 600;   // after clicking Notes tab
const DELAY_PAGE_LOAD          = 2000;  // initial page/navigation waits

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomerRecord = {
  name:  string;
  email: string;
  phone: string;
  notes: string;
};

type Progress = {
  completed: string[];   // keys of customers already processed
  lastIndex: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Parse a simple CSV (handles quoted fields with commas/newlines). */
function parseCsv(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === '\n' && !inQuotes) {
      lines.push(current.replace(/\r$/, ''));
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);

  const parseRow = (line: string): string[] => {
    const fields: string[] = [];
    let field = '';
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { q = !q; field += ch; }
      else if (ch === ',' && !q) { fields.push(field.replace(/^"|"$/g, '').trim()); field = ''; }
      else { field += ch; }
    }
    fields.push(field.replace(/^"|"$/g, '').trim());
    return fields;
  };

  const headers = parseRow(lines[0]);
  return lines.slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const vals = parseRow(line);
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']));
    });
}

/** Escape a value for CSV output. */
function csvField(val: string): string {
  const s = (val ?? '').replace(/\r?\n/g, ' ').trim();
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function loadProgress(): Progress {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, 'utf-8'));
    } catch { /* ignore corrupt file */ }
  }
  return { completed: [], lastIndex: 0 };
}

function saveProgress(p: Progress) {
  writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

/** Load ExportContacts.csv for cross-matching. Returns map keyed by normalised name. */
function loadExportContacts(): Map<string, Record<string, string>> {
  const map = new Map<string, Record<string, string>>();
  try {
    const content = readFileSync(EXPORT_CSV, 'utf-8');
    const rows = parseCsv(content);
    for (const row of rows) {
      const name = normalise(row['Name'] ?? '');
      if (name) map.set(name, row);
    }
    console.log(`  Loaded ${map.size} contacts from ExportContacts.csv for cross-matching.`);
  } catch {
    console.log('  ExportContacts.csv not found — will use scraped data only.');
  }
  return map;
}

/** Wait for a user to press Enter in the terminal. */
function waitForEnter(prompt: string): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, () => { rl.close(); resolve(); });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n════════════════════════════════════════════');
  console.log('  Setmore Customer Notes Scraper');
  console.log('════════════════════════════════════════════\n');

  const exportContacts = loadExportContacts();
  const progress = loadProgress();
  const completedSet = new Set(progress.completed);

  console.log(`  Progress file: ${completedSet.size} customers already completed.\n`);

  // ── Launch Playwright Chromium with a dedicated persistent profile ──────
  // A dedicated profile directory means:
  //  - First run: log in with Google (works fine — not conflicting with Chrome)
  //  - Every run after: already logged in (session is saved)
  // Never conflicts with your regular Chrome because it's a separate directory.
  const SCRAPER_PROFILE_DIR = join(process.cwd(), '.scraper-profile');

  const context = await firefox.launchPersistentContext(SCRAPER_PROFILE_DIR, {
    headless: false,
    slowMo: 50,
    viewport: { width: 1280, height: 900 },
    timeout: 30000,
  });

  const page = context.pages()[0] ?? await context.newPage();

  // ── Step 1: Navigate to Setmore and wait for manual login ───────────────
  console.log('  Opening Setmore login page…');
  await page.goto(SETMORE_LOGIN_URL, { waitUntil: 'domcontentloaded' });

  await waitForEnter(
    '\n  ► Please log in to Setmore in the browser window that just opened.\n' +
    '    Once you are on the CUSTOMERS page, press Enter here to continue…\n'
  );

  // Ensure we are on the customers/contacts page
  if (!page.url().includes('/customer') && !page.url().includes('/contact')) {
    console.log('  Navigating to Customers page…');
    await page.goto('https://go.setmore.com/contacts', { waitUntil: 'networkidle' });
    await sleep(DELAY_PAGE_LOAD);
  }

  // Dismiss the "Grow with Pro" banner if present
  try {
    const closeBtn = page.locator('[class*="banner"] button, [class*="trial"] button, button[aria-label*="close"], button[aria-label*="dismiss"]').first();
    await closeBtn.click({ timeout: 2000 });
    await sleep(300);
  } catch { /* no banner, that's fine */ }

  console.log('\n  Starting customer scrape…\n');
  await sleep(DELAY_PAGE_LOAD);

  // ── Step 2: Load all customer names from ExportContacts.csv ───────────
  // No need to scroll the sidebar — we already have all names from the export.
  const allNames = [...exportContacts.keys()].map((k) => exportContacts.get(k)!['Name'] ?? k);
  console.log(`  Processing ${allNames.length} customers from ExportContacts.csv\n`);

  // ── Step 3: Open a CSV write stream ────────────────────────────────────
  const isNewFile = !existsSync(OUTPUT_CSV) || completedSet.size === 0;
  const csvStream = createWriteStream(OUTPUT_CSV, { flags: isNewFile ? 'w' : 'a' });
  if (isNewFile) csvStream.write('name,email,phone,notes\n');

  let processed = 0;
  let withNotes = 0;

  // ── Step 4: Iterate every name, search in Setmore, grab notes ──────────
  for (let globalIndex = 0; globalIndex < allNames.length; globalIndex++) {
    const rawName = allNames[globalIndex];
    if (!rawName) continue;
    {
      const customerKey = normalise(rawName.slice(0, 60));

      if (completedSet.has(customerKey)) {
        console.log(`  [${globalIndex}] Skipping (already done): ${rawName}`);
        continue;
      }

      // ── Use search box to navigate directly to this customer ────
      try {
        const searchBox = page.locator('input[type="search"], input[placeholder*="earch"], input[class*="search"]').first();

        // Snapshot the right panel BEFORE navigating so we can detect when it changes
        const beforeText = await page.evaluate((): string => {
          const els = Array.from(document.querySelectorAll('*')).filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left > 300 && r.top > 100 && el.children.length === 0;
          });
          return els.map((el) => (el as HTMLElement).innerText?.trim() ?? '').join('|').slice(0, 200);
        });

        // Type the name into search
        await searchBox.click({ timeout: 3000 });
        await searchBox.fill('');
        await searchBox.type(rawName.trim(), { delay: 50 });
        await sleep(800);

        // Click the first sidebar list item that matches the name
        const firstResult = page.locator('li').filter({ hasText: rawName.trim() }).first();
        await firstResult.click({ timeout: 4000 });
        await sleep(500);

        // Wait until the right panel actually changes (i.e. new customer loaded)
        await page.waitForFunction(
          ([before]: [string]) => {
            const els = Array.from(document.querySelectorAll('*')).filter((el) => {
              const r = el.getBoundingClientRect();
              return r.left > 300 && r.top > 100 && (el as Element & {children: HTMLCollection}).children.length === 0;
            });
            const now = els.map((el) => (el as HTMLElement).innerText?.trim() ?? '').join('|').slice(0, 200);
            return now !== before;
          },
          [beforeText] as [string],
          { timeout: 4000 }
        ).catch(() => {}); // if panel didn't change, continue anyway

        // DO NOT clear search yet — clearing it resets the sidebar and loses the selected customer.
        // We clear it after notes are extracted (see below).
      } catch {
        console.log(`  [${globalIndex}] Could not click "${rawName}" — skipping.`);
        continue;
      }

    // Panel already waited for inside the click block above.

    // ── Click the Notes tab ──────────────────────────────────────────
    let noteText = '';
    try {
      const notesTab = page.locator('a:has-text("Notes"), button:has-text("Notes"), [role="tab"]:has-text("Notes"), li:has-text("Notes"), span:has-text("Notes")').first();
      await notesTab.click({ timeout: 4000 });
      await sleep(DELAY_NOTES_TAB);

      // Grab ALL text from the right panel (x > 300px, below banner)
      // then strip known UI button strings — what remains is the note.
      noteText = await page.evaluate((): string => {
        const NOISE_WORDS = new Set(['cancel', 'save', 'edit', 'delete', 'add note', 'no notes',
          'add a note', 'write a note', 'about', 'notes', 'appointments', 'updates',
          'book appointment', 'start free trial', 'grow with pro']);

        const leaves = Array.from(document.querySelectorAll('*'))
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.left > 300 && r.top > 120 && el.children.length === 0 && r.width > 5;
          })
          .map((el) => (el as HTMLElement).innerText?.trim() ?? '')
          .filter((t) => t.length > 0 && !NOISE_WORDS.has(t.toLowerCase()));

        return leaves.join('\n').trim();
      });
    } catch {
      noteText = '';
    }

    // ── Cross-match with ExportContacts.csv ───────────────────────────
    const displayName = rawName;
    let matchedEmail = '';
    let matchedPhone = '';

    if (exportContacts.size > 0) {
      const csvMatch =
        (matchedEmail && [...exportContacts.values()].find((r) =>
          normalise(r['Email'] ?? '') === normalise(matchedEmail)
        )) ||
        (matchedPhone && [...exportContacts.values()].find((r) =>
          (r['Phone'] ?? '').replace(/\D/g, '') === matchedPhone.replace(/\D/g, '')
        )) ||
        exportContacts.get(normalise(displayName));

      if (csvMatch) {
        matchedEmail = matchedEmail || (csvMatch['Email'] ?? '');
        matchedPhone = matchedPhone || (csvMatch['Phone'] ?? '');
      }
    }

    const record: CustomerRecord = {
      name:  displayName,
      email: matchedEmail,
      phone: matchedPhone,
      notes: noteText,
    };

      csvStream.write([record.name, record.email, record.phone, record.notes].map(csvField).join(',') + '\n');
      completedSet.add(customerKey);
      saveProgress({ completed: [...completedSet], lastIndex: globalIndex });
      processed++;
      if (noteText) withNotes++;

      const preview = noteText ? `  📝 "${noteText.slice(0, 50)}${noteText.length > 50 ? '…' : ''}"` : '';
      console.log(`  [${globalIndex}] ${displayName}${preview}`);

      // NOW clear the search — after notes are safely extracted
      try {
        const searchBox = page.locator('input[type="search"], input[placeholder*="earch"], input[class*="search"]').first();
        await searchBox.fill('');
        await sleep(400);
      } catch { /* ignore */ }

      // Scroll the list down a bit after each customer to reveal the next batch
      await page.evaluate((): void => {
        const candidates = Array.from(document.querySelectorAll('*')).filter((el) => {
          const r = el.getBoundingClientRect();
          return r.left < 320 && r.width > 100 && r.width < 360 && r.height > 300
            && (el as HTMLElement).scrollHeight > r.height + 10;
        });
        const list = candidates.sort((a, b) =>
          (b as HTMLElement).scrollHeight - (a as HTMLElement).scrollHeight
        )[0] as HTMLElement | undefined;
        if (list) list.scrollTop += 50;
      });

      await sleep(DELAY_BETWEEN_CUSTOMERS);
    }

    // Scroll down to load the next batch of names
    await page.evaluate((): void => {
      const candidates = Array.from(document.querySelectorAll('*')).filter((el) => {
        const r = el.getBoundingClientRect();
        return r.left < 320 && r.width > 100 && r.width < 360 && r.height > 300
          && (el as HTMLElement).scrollHeight > r.height + 10;
      });
      const list = candidates.sort((a, b) =>
        (b as HTMLElement).scrollHeight - (a as HTMLElement).scrollHeight
      )[0] as HTMLElement | undefined;
      if (list) list.scrollTop += 400;
    });
    await sleep(800);
  }

  csvStream.end();
  await context.close();

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════');
  console.log('  Scrape complete!');
  console.log(`  Customers processed : ${processed}`);
  console.log(`  With notes          : ${withNotes}`);
  console.log(`  Output              : ${OUTPUT_CSV}`);
  console.log('════════════════════════════════════════════\n');

  // Clean up progress file on successful completion
  if (existsSync(PROGRESS_FILE)) {
    const p = loadProgress();
    if (p.completed.length > 0) {
      console.log('  Deleting progress checkpoint (scrape finished successfully).\n');
      writeFileSync(PROGRESS_FILE, JSON.stringify({ completed: [], lastIndex: 0 }, null, 2));
    }
  }
}

main().catch((err) => {
  console.error('\n  ✖ Scraper error:', err);
  console.error('  Progress has been saved. Re-run the script to resume.\n');
  process.exit(1);
});
