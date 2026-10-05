// The basement lead email, sent to a CSV of contacts.
//
//   npx tsx scripts/send-basement-email.ts --csv "<path>"
//   npx tsx scripts/send-basement-email.ts --csv "<path>" --send
//
// Without --send it prints the exact recipients and the exact subject and
// exits. Real people receive these; the dry run is the default on purpose,
// and it is the only way to see who is in a batch before it goes.
//
//   --csv <path>   the file. Any column layout - see below.
//   --limit <n>    stop after n sendable people (default: everyone)
//   --from <n>     CSV LINE NUMBER to start at, header counted as line 1, so
//                  it matches what a spreadsheet shows. The run reports the
//                  line it finished on, which is what the next batch follows.
//   --send         actually send. Without it, nothing leaves the machine.
//
// ─── The CSV ─────────────────────────────────────────────────────────────────
//
// Column names are matched case-insensitively and the order does not matter.
// Export straight from Meta and it works.
//
//   email   <- email, email_address, e-mail, work_email
//   name    <- name, full_name, first_name, firstname, contact_name
//
// The name is optional. Without one the greeting renders "Hi," which reads
// fine - that is why the template has no merge-tag fallback syntax.
//
// ─── What it refuses to send to ──────────────────────────────────────────────
//
// The batch backfills past skipped rows, so --limit 50 is 50 sendable people
// rather than 50 rows.
//
//   * Anything that is not a plausible email address.
//   * A duplicate within the same CSV.
//   * Anyone in emails/unsubscribed.txt. Add a line there the moment somebody
//     asks out - the template's unsubscribe is a mailto, so honouring it is
//     manual and this file is the mechanism.
//   * Anyone already sent this campaign. Every successful send is appended to
//     emails/.sent-basement-lead.log, so re-running the same CSV will not
//     double-send. Delete that file only if you genuinely want to send again.
//
// ─── What it does NOT check ──────────────────────────────────────────────────
//
// CONSENT. This script cannot tell whether the people in a CSV agreed to hear
// from us, and it does not pretend to. Under CASL implied consent from an
// enquiry lasts six months. Whoever runs this has decided the list is one we
// may email.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Resend } from 'resend';

const TEMPLATE = path.join(process.cwd(), 'emails', 'basement-lead.html');
const SUPPRESS = path.join(process.cwd(), 'emails', 'unsubscribed.txt');
const SENTLOG = path.join(process.cwd(), 'emails', '.sent-basement-lead.log');

const FROM = 'OntarioReno.ca <info@ontarioreno.ca>';
const REPLY_TO = 'info@ontarioreno.ca';
const SUBJECT = 'Finish your basement from $399/month';

/** Resend's free tier allows 2 requests/second. Stay comfortably under it. */
const GAP_MS = 600;

// ─── args ────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? undefined : argv[i + 1];
};
const csvPath = flag('csv');
const limit = Number(flag('limit') ?? Infinity);
const startLine = Number(flag('from') ?? 2);
const armed = argv.includes('--send');

if (!csvPath) {
  console.error('Missing --csv <path>. See the header of this file.');
  process.exit(1);
}

// ─── CSV ─────────────────────────────────────────────────────────────────────

/** Split one CSV line, honouring quoted fields and "" escapes. */
function splitRow(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out.map((f) => f.trim().replace(/^"|"$/g, ''));
}

const EMAIL_COLS = ['email', 'email_address', 'e-mail', 'work_email'];
const NAME_COLS = ['first_name', 'firstname', 'name', 'full_name', 'contact_name'];

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
const lines = raw.split(/\r?\n/).filter((l) => l.trim() !== '');
if (lines.length < 2) { console.error('CSV has no data rows.'); process.exit(1); }

const header = splitRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
const findCol = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
const emailIdx = findCol(EMAIL_COLS);
const nameIdx = findCol(NAME_COLS);

if (emailIdx === -1) {
  console.error(`No email column found. Header was: ${header.join(', ')}`);
  console.error(`Expected one of: ${EMAIL_COLS.join(', ')}`);
  process.exit(1);
}

// ─── suppression ─────────────────────────────────────────────────────────────

const readList = (p: string): Set<string> =>
  fs.existsSync(p)
    ? new Set(fs.readFileSync(p, 'utf8').split(/\r?\n/)
        .map((l) => l.trim().toLowerCase()).filter((l) => l && !l.startsWith('#')))
    : new Set<string>();

const unsubscribed = readList(SUPPRESS);
const alreadySent = readList(SENTLOG);

const looksLikeEmail = (e: string) => /^[^@\s]+@[^@\s.]+\.[^@\s]{2,}$/.test(e);
/**
 * First token of the name, tidied for use in a greeting.
 * All-lowercase entries get title-cased ("imelda" -> "Imelda"), but anything
 * already carrying capitals is left alone, so "TJ" and "NanduOturkar" survive
 * rather than becoming "Tj" and "Nanduoturkar".
 */
const firstNameOf = (name: string): string => {
  const first = name.trim().split(/\s+/)[0] ?? '';
  if (!first) return '';
  if (first === first.toLowerCase()) {
    return first.charAt(0).toUpperCase() + first.slice(1);
  }
  return first;
};

// ─── build the batch ─────────────────────────────────────────────────────────

type Row = { line: number; email: string; firstName: string };
const batch: Row[] = [];
const seen = new Set<string>();
const skipped = { invalid: 0, duplicate: 0, unsubscribed: 0, alreadySent: 0 };
let lastLine = startLine - 1;

for (let i = startLine - 1; i < lines.length; i++) {
  if (batch.length >= limit) break;
  lastLine = i + 1;
  const fields = splitRow(lines[i]);
  const email = (fields[emailIdx] ?? '').toLowerCase();
  const name = nameIdx >= 0 ? (fields[nameIdx] ?? '') : '';

  if (!looksLikeEmail(email)) { skipped.invalid++; continue; }
  if (seen.has(email)) { skipped.duplicate++; continue; }
  if (unsubscribed.has(email)) { skipped.unsubscribed++; continue; }
  if (alreadySent.has(email)) { skipped.alreadySent++; continue; }

  seen.add(email);
  batch.push({ line: i + 1, email, firstName: firstNameOf(name) });
}

// ─── render ──────────────────────────────────────────────────────────────────

const template = fs.readFileSync(TEMPLATE, 'utf8');
const render = (firstName: string) =>
  template.replace(/\{\{FirstName\}\}/g, firstName)
          // "Hi {{FirstName}}," with no name would leave "Hi ,"
          .replace(/Hi\s+,/g, 'Hi,');

// ─── report ──────────────────────────────────────────────────────────────────

console.log(`\nTemplate : ${path.relative(process.cwd(), TEMPLATE)}`);
console.log(`Subject  : ${SUBJECT}`);
console.log(`From     : ${FROM}`);
console.log(`CSV      : ${csvPath}  (starting at line ${startLine})`);
console.log(`\nSkipped  : ${skipped.invalid} invalid, ${skipped.duplicate} duplicate, ` +
            `${skipped.unsubscribed} unsubscribed, ${skipped.alreadySent} already sent`);
console.log(`Sending  : ${batch.length} people\n`);

for (const r of batch) {
  console.log(`  line ${String(r.line).padStart(4)}  ${r.email.padEnd(38)} ${r.firstName || '(no name)'}`);
}

if (!batch.length) { console.log('\nNothing to send.'); process.exit(0); }

if (!armed) {
  console.log(`\nDRY RUN - nothing was sent.`);
  console.log(`Re-run with --send to send to the ${batch.length} people above.`);
  process.exit(0);
}

// ─── send ────────────────────────────────────────────────────────────────────

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) { console.error('\nRESEND_API_KEY is not set.'); process.exit(1); }
const resend = new Resend(apiKey);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let ok = 0;
const failures: Array<{ email: string; error: string }> = [];

console.log(`\nSending...\n`);
for (const r of batch) {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: r.email,
      subject: SUBJECT,
      html: render(r.firstName),
    });
    if (error) throw new Error(error.message ?? String(error));
    fs.appendFileSync(SENTLOG, `${r.email}\n`);   // append per send, not at the
    ok++;                                          // end, so a crash cannot
    console.log(`  sent    ${r.email}`);           // cause a double-send
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    failures.push({ email: r.email, error: msg });
    console.log(`  FAILED  ${r.email}  - ${msg}`);
  }
  await sleep(GAP_MS);
}

console.log(`\nSent ${ok} of ${batch.length}. Finished at CSV line ${lastLine}.`);
if (failures.length) {
  console.log(`\n${failures.length} failed - these were NOT logged as sent, so`);
  console.log(`re-running the same CSV will retry them:`);
  for (const f of failures) console.log(`  ${f.email}  ${f.error}`);
}
console.log(`\nNext batch:  --from ${lastLine + 1}`);
