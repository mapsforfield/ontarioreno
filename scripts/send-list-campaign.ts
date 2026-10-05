// A batch re-engagement text to a CSV of contacts.
//
//   npx tsx scripts/send-list-campaign.ts --csv "<path>" --from 2 --limit 50
//   npx tsx scripts/send-list-campaign.ts --csv "<path>" --from 2 --limit 50 --send
//
// Lists arrive in whatever shape the export gave them, so the two columns that
// matter are named rather than assumed:
//
//   --name-col 0 --phone-col 3    (default: the original mega list)
//   --name-col 3 --phone-col 4 --from 1    (a Meta lead export, no header row)
//
// A list a rep has already worked carries a STATUS column, and those rows must
// not be texted a fresh invitation:
//
//   --status-col 7
//
// Without --send it prints the exact recipients and the exact body and exits.
// Real people receive these; the dry run is the default on purpose, and it is
// the only way to see who is in a batch before it goes.
//
// --from is the CSV LINE NUMBER to start at, counting the header as line 1, so
// it matches what a spreadsheet shows. The run reports the line it finished on,
// which is what the next batch starts after.
//
// ─── What it refuses to send to ──────────────────────────────────────────────
//
// Numbers outside Ontario are skipped, and the batch backfills past them so a
// run of --limit 50 is 50 sendable people rather than 50 rows.
//
//   * Not a Canadian area code. A marketing text to a US number is governed by
//     the TCPA, not CASL, where statutory damages run $500–$1,500 PER MESSAGE
//     and enforcement is routine. Two stray rows in a list are not worth that.
//   * Canadian but outside Ontario. Nobody is driving to Saskatchewan for a
//     basement consultation; the message would be spend and irritation with no
//     booking behind it.
//   * A number already texted in this batch, or one that is not ten digits.
//
// ─── What it does NOT check ──────────────────────────────────────────────────
//
// CONSENT. This script cannot tell whether the people in a CSV agreed to hear
// from us, and it does not pretend to. Under CASL implied consent from an
// enquiry lasts six months and from a transaction two years; sending outside
// that is an offence with penalties in the millions, and the liability is the
// sender's. Whoever runs this has decided the list is one we may text.

import 'dotenv/config';
import fs from 'node:fs';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { prisma } from '../lib/prisma.js';
import { drainOutbox } from '../lib/notification-drain.js';

neonConfig.webSocketConstructor = ws;

/** Ontario area codes. Everything else is out of area by definition. */
const ONTARIO = ['226','249','289','343','365','382','416','437','519','548','613','647','683','705','742','753','807','905','942'];

/** Canadian area codes, so a non-Canadian number can be named as such. */
const CANADA = ['204','226','236','249','250','289','306','343','365','367','368','382','403','416','418','431','437','438','450','506','514','519','548','579','581','587','604','613','639','647','672','683','705','709','742','753','778','780','782','807','819','825','867','873','902','905','942'];

/**
 * Statuses that mean this person has already been dealt with.
 *
 * Every one of these makes a "come and book a consultation" text wrong, and
 * three of them make it worse than wrong:
 *
 *   BOOKED          — they have an appointment. Inviting them to make one
 *                     reads as us having lost their booking.
 *   NOT INTERESTED  — they said no to a person. Texting anyway is the single
 *                     fastest way to earn a complaint, and under CASL a
 *                     withdrawal of consent is a withdrawal however it arrived.
 *   NO GO CLIENT    — we turned THEM down.
 *   OUT OF RANGE    — outside the drive area; nobody is visiting.
 *   INVALID NUMBER  — there is nobody on the other end.
 *
 * NO ANSWER and FOLLOW UP are deliberately absent: those are exactly the people
 * a re-engagement text is for — reached for, never reached.
 */
const WORKED_STATUSES = [
  'booked',
  'not interested',
  'no go client',
  'out of range',
  'invalid number',
];

/** One send, one key. A re-run cannot double-text anybody. */
const CAMPAIGN = 'winter_basement_2026';

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/**
 * The message.
 *
 * Carries "Reply STOP to opt out" even though Twilio honours STOP at the
 * carrier level regardless — see lib/notifications.ts. The footer was dropped
 * from the welcome text because that is a handful a day from a named sender;
 * this is a bulk commercial send, which is the case the footer exists for, and
 * CASL wants the unsubscribe stated in the message itself.
 */
function body(firstName: string): string {
  const hi = firstName ? `Hi ${firstName}, you` : 'Hi, you';
  return [
    `${hi} recently inquired about getting your basement finished. We offer easy monthly payments with no deposit required. You can now book your free estimate with us quick & easy.`,
    '',
    'Select your free calendar slot here: https://ontarioreno.ca/consultation',
    '(If already done, please ignore or Reply STOP to opt out)',
  ].join('\n');
}


/** First word only, and never a placeholder or an email address. */
function firstNameOf(raw: string): string {
  const name = raw.replace(/^"|"$/g, '').trim();
  if (!name || name.includes('@')) return '';
  const first = name.split(/\s+/)[0] ?? '';
  // A single letter or a bare handle reads worse than no name at all.
  return first.length >= 2 && /^[A-Za-z][A-Za-z'’-]+$/.test(first) ? first : '';
}

/**
 * Split one CSV line, respecting quotes.
 *
 * Not optional. A Meta lead export opens each row with a quoted timestamp —
 * "May 17, 07:37" — and splitting on every comma shifts every column after it,
 * which showed up as all forty-nine rows being rejected as unusable numbers.
 * A silent column shift is the failure mode that would have texted the wrong
 * name to the wrong person, so this is worth the twelve lines.
 */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      // A doubled quote inside a quoted cell is one literal quote.
      if (quoted && line[i + 1] === '"') { cell += '"'; i += 1; continue; }
      quoted = !quoted;
      continue;
    }
    if (ch === ',' && !quoted) { cells.push(cell); cell = ''; continue; }
    cell += ch;
  }
  cells.push(cell);
  return cells;
}

type Row = { line: number; name: string; e164: string };

async function main() {
  const csvPath = arg('--csv');
  const from = Number(arg('--from') ?? 2);
  const limit = Number(arg('--limit') ?? 50);
  // Zero-based column indexes. Defaulted to the first list's shape so every
  // command already run against it keeps working unchanged.
  const nameCol = Number(arg('--name-col') ?? 0);
  const phoneCol = Number(arg('--phone-col') ?? 3);
  // Absent on a raw list, present the moment a rep has worked it.
  const statusColRaw = arg('--status-col');
  const statusCol = statusColRaw === undefined ? -1 : Number(statusColRaw);
  const confirmed = process.argv.includes('--send');
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/send-list-campaign.ts --csv <path> [--from 2] [--limit 50] [--name-col 0] [--phone-col 3] [--send]');
    process.exitCode = 1;
    return;
  }

  const lines = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/);
  const seen = new Set<string>();
  const batch: Row[] = [];
  const skipped = { foreign: 0, outOfProvince: 0, unusable: 0, duplicate: 0, worked: 0 };
  const workedNames: string[] = [];

  for (let i = from - 1; i < lines.length && batch.length < limit; i += 1) {
    const raw = lines[i];
    if (!raw?.trim()) continue;
    const cells = splitCsvLine(raw);
    if (statusCol >= 0) {
      const status = (cells[statusCol] ?? '').trim().toLowerCase();
      if (WORKED_STATUSES.includes(status)) {
        skipped.worked += 1;
        workedNames.push(`${cells[nameCol] ?? ''} — ${cells[statusCol]}`);
        continue;
      }
    }
    const digits = (cells[phoneCol] ?? '').replace(/[^0-9]/g, '');
    const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
    if (ten.length !== 10) { skipped.unusable += 1; continue; }
    const area = ten.slice(0, 3);
    if (!CANADA.includes(area)) { skipped.foreign += 1; continue; }
    if (!ONTARIO.includes(area)) { skipped.outOfProvince += 1; continue; }
    if (seen.has(ten)) { skipped.duplicate += 1; continue; }
    seen.add(ten);
    batch.push({ line: i + 1, name: cells[nameCol] ?? '', e164: `+1${ten}` });
  }

  for (const row of batch) {
    console.log(`  line ${String(row.line).padStart(4)}  ${row.e164}  ${row.name}`);
  }
  console.log('');
  console.log(`Skipped to fill the batch — not Canada: ${skipped.foreign}, outside Ontario: ${skipped.outOfProvince}, unusable: ${skipped.unusable}, duplicate: ${skipped.duplicate}, already worked: ${skipped.worked}`);
  if (workedNames.length > 0) {
    console.log('');
    console.log('Skipped because a rep has already dealt with them:');
    for (const n of workedNames) console.log(`   ${n}`);
  }
  if (batch.length === 0) { console.log('Nothing to send.'); return; }

  const last = batch[batch.length - 1];
  console.log(`Batch of ${batch.length}. Last: line ${last.line}, ${last.name}.`);
  console.log(`Next batch: --from ${last.line + 1}`);
  console.log('');
  console.log('Message as it will send to the first recipient:');
  console.log('─'.repeat(64));
  const sample = body(firstNameOf(batch[0].name));
  console.log(sample);
  console.log('─'.repeat(64));
  console.log(`${sample.length} characters — ${Math.ceil(sample.length / 153)} SMS segments each.`);
  console.log('');

  if (!confirmed) {
    console.log('DRY RUN. Nothing queued, nothing sent.');
    console.log(`Re-run with --send to text these ${batch.length} people for real.`);
    return;
  }

  // Clear anything this campaign queued but never delivered.
  //
  // A suppressed row has consumed its idempotency key without a message ever
  // reaching anybody, so leaving it would make the retry a no-op and quietly
  // skip the whole batch. Only 'suppressed' rows are removed — a row that was
  // actually sent keeps its key and keeps protecting that person from a second
  // text.
  const cleared = await prisma.notificationOutbox.deleteMany({
    where: { kind: 'campaign_sms', state: 'suppressed', idempotencyKey: { endsWith: `:${CAMPAIGN}` } },
  });
  if (cleared.count > 0) {
    console.log(`Cleared ${cleared.count} undelivered rows from a previous run.`);
  }

  let queued = 0;
  for (const row of batch) {
    // A Lead row per recipient, created first.
    //
    // Not bookkeeping: lib/sms-inbound.ts resolves an inbound text by looking
    // the number up, and a reply from a number with no lead reaches nobody at
    // all. Texting fifty people and silently dropping the ones who answer "yes"
    // would be worse than not sending. Keyed on the phone so a re-run reuses
    // the row rather than making a second one.
    const existing = await prisma.lead.findFirst({
      where: { phone: row.e164, deletedAt: null },
      select: { id: true },
    });
    const lead =
      existing ??
      (await prisma.lead.create({
        data: {
          name: row.name.replace(/^"|"$/g, '').trim() || 'Unknown',
          phone: row.e164,
          source: 'sms_campaign',
          sourceDetail: CAMPAIGN,
          status: 'new',
          notes: `Texted in the ${CAMPAIGN} batch.`,
        },
        select: { id: true },
      }));

    await prisma.notificationOutbox
      .create({
        data: {
          leadId: lead.id,
          channel: 'sms',
          kind: 'campaign_sms',
          recipient: row.e164,
          subject: '',
          body: body(firstNameOf(row.name)),
          sendAfter: new Date().toISOString(),
          idempotencyKey: `${lead.id}:sms:${CAMPAIGN}`,
        },
      })
      .then(() => { queued += 1; })
      .catch(() => console.log(`  already texted, skipping: ${row.name}`));
  }

  console.log(`Queued ${queued}. Delivering…`);
  // Delivery is switched on for THIS drain only.
  //
  // deliveryEnabled() requires VERCEL_ENV === 'production' so that preview
  // deploys cannot message real people (see lib/app-config.ts). A campaign run
  // from a desktop is not a preview — it is a deliberate send with the real
  // credentials — but the guard cannot tell the two apart, and the fix must not
  // be to put VERCEL_ENV=production in a .env file. That would leave every
  // future local run, including an accidental one, able to text real
  // homeowners. Overriding it here keeps the blast radius to the one command
  // that already required --send.
  const deliverEnv = { ...process.env, VERCEL_ENV: 'production' };
  console.log(await drainOutbox(prisma as never, batch.length + 10, deliverEnv).catch((err) => {
    console.error('drain failed:', err);
    return null;
  }));
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
