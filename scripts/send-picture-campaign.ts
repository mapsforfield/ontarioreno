// A picture-message (MMS) re-engagement text to a CSV of contacts.
//
//   Test to one number — no Lead row, a fresh key every run:
//     npx tsx scripts/send-picture-campaign.ts --to 6475550100 --send
//
//   The real list, dry run first (the default), then for real:
//     npx tsx scripts/send-picture-campaign.ts --csv "<path>" --skip 6475550100,4165550100
//     npx tsx scripts/send-picture-campaign.ts --csv "<path>" --skip ... --send
//
// The CSV is `Name,Phone` with a header row — the shape a Meta lead export is
// trimmed to. Columns can be moved with --name-col / --phone-col (zero-based).
//
// Sibling of send-list-campaign.ts, which sends the plain-text basement offer.
// This one carries an image: the row's `mediaUrl` is handed to Twilio as
// MediaUrl, and Twilio fetches the file from the public site at send time — so
// the GIF must be live on ontarioreno.ca before --send, not merely committed.
//
// Same refusals as the sibling: numbers outside Ontario, non-Canadian numbers,
// duplicates and malformed numbers are skipped. Same non-check: CONSENT is the
// sender's call, not this script's.

import 'dotenv/config';
import fs from 'node:fs';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { prisma } from '../lib/prisma.js';
import { ensureSchema } from '../lib/schema.js';
import { drainOutbox } from '../lib/notification-drain.js';

neonConfig.webSocketConstructor = ws;

/** One send, one key. A re-run cannot double-text anybody on the list. */
const CAMPAIGN = 'bathroom_mms_2026_10';

const MEDIA_URL = 'https://ontarioreno.ca/sms/bathroom-booking.gif';

const ONTARIO = ['226','249','289','343','365','382','416','437','519','548','613','647','683','705','742','753','807','905','942'];
const CANADA = ['204','226','236','249','250','289','306','343','365','367','368','382','403','416','418','431','437','438','450','506','514','519','548','579','581','587','604','613','639','647','672','683','705','709','742','753','778','780','782','807','819','825','867','873','902','905','942'];

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/** The message, word for word as approved. Only the greeting varies. */
function body(firstName: string): string {
  const hey = firstName ? `Hey ${firstName}, following` : 'Hey, following';
  return [
    `${hey} up from Ontario Reno—are you still looking to get an estimate for your bathroom reno? We offer free quotes and $0 down options.`,
    '',
    'Grab a time slot here: https://ontarioreno.ca/consultation/bathroom',
    '',
    "(If you don't need this anymore, text STOP)",
  ].join('\n');
}

/**
 * First word only, title-cased — Meta exports arrive as "sheny" and
 * "ELIZABETH MCDOUGALL", and a greeting in the wrong case reads as a mail-merge.
 * A single letter or anything that is not a plain name gets no name at all.
 */
function firstNameOf(raw: string): string {
  const name = raw.replace(/^"|"$/g, '').trim();
  if (!name || name.includes('@')) return '';
  const first = name.split(/\s+/)[0] ?? '';
  if (first.length < 2 || !/^[A-Za-z][A-Za-z'’-]+$/.test(first)) return '';
  // Two capitals is initials ("LJ"), not shouting — keep them as typed.
  if (/^[A-Z]{2}$/.test(first)) return first;
  return first
    .toLowerCase()
    .replace(/(^|['’-])([a-z])/g, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
}

/** Split one CSV line, respecting quotes. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
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

/** Ten-digit NANP number, or null. */
function tenDigits(raw: string): string | null {
  const digits = raw.replace(/[^0-9]/g, '');
  const ten = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return ten.length === 10 ? ten : null;
}

type Row = { line: number; name: string; e164: string };

async function main() {
  const csvPath = arg('--csv');
  const testTo = arg('--to');
  const nameCol = Number(arg('--name-col') ?? 0);
  const phoneCol = Number(arg('--phone-col') ?? 1);
  const skip = new Set(
    (arg('--skip') ?? '').split(',').map((s) => tenDigits(s.trim())).filter((s): s is string => !!s)
  );
  const confirmed = process.argv.includes('--send');

  if (!csvPath && !testTo) {
    console.error('Usage: --to <number> [--send]   or   --csv <path> [--skip n1,n2] [--send]');
    process.exitCode = 1;
    return;
  }

  const batch: Row[] = [];
  const skipped = { foreign: 0, outOfProvince: 0, unusable: 0, duplicate: 0, listed: 0 };
  const skippedNames: string[] = [];

  if (testTo) {
    const ten = tenDigits(testTo);
    if (!ten) { console.error(`Not a usable number: ${testTo}`); process.exitCode = 1; return; }
    batch.push({ line: 0, name: arg('--name') ?? '', e164: `+1${ten}` });
  } else {
    const lines = fs.readFileSync(csvPath!, 'utf8').split(/\r?\n/);
    const seen = new Set<string>();
    for (let i = 1; i < lines.length; i += 1) {
      const raw = lines[i];
      if (!raw?.trim()) continue;
      const cells = splitCsvLine(raw);
      const name = cells[nameCol] ?? '';
      const ten = tenDigits(cells[phoneCol] ?? '');
      if (!ten) { skipped.unusable += 1; skippedNames.push(`${name} — unusable number`); continue; }
      if (skip.has(ten)) { skipped.listed += 1; skippedNames.push(`${name} — on --skip`); continue; }
      const area = ten.slice(0, 3);
      if (!CANADA.includes(area)) { skipped.foreign += 1; skippedNames.push(`${name} — not Canada`); continue; }
      if (!ONTARIO.includes(area)) { skipped.outOfProvince += 1; skippedNames.push(`${name} — outside Ontario (${area})`); continue; }
      if (seen.has(ten)) { skipped.duplicate += 1; skippedNames.push(`${name} — duplicate`); continue; }
      seen.add(ten);
      batch.push({ line: i + 1, name, e164: `+1${ten}` });
    }
  }

  for (const row of batch) {
    console.log(`  ${row.line ? `line ${String(row.line).padStart(3)}` : 'TEST    '}  ${row.e164}  ${firstNameOf(row.name) || '(no name)'}  ← ${row.name}`);
  }
  if (skippedNames.length > 0) {
    console.log('');
    console.log('Skipped:');
    for (const n of skippedNames) console.log(`   ${n}`);
  }
  console.log('');
  console.log(`Recipients: ${batch.length}`);
  console.log(`Picture: ${MEDIA_URL}`);
  console.log('');
  console.log('Message as it will send to the first recipient:');
  console.log('─'.repeat(64));
  console.log(body(firstNameOf(batch[0]?.name ?? '')));
  console.log('─'.repeat(64));
  console.log('');

  if (batch.length === 0) { console.log('Nothing to send.'); return; }

  // Twilio fetches the picture itself. If it is not live, every message fails
  // (or worse, arrives with a broken attachment), so check before queuing.
  const head = await fetch(MEDIA_URL, { method: 'HEAD' }).catch(() => null);
  const type = head?.headers.get('content-type') ?? '';
  if (!head?.ok || !type.startsWith('image/')) {
    console.log(`The picture is not live yet (${head?.status ?? 'no response'} ${type}). Deploy first.`);
    process.exitCode = 1;
    return;
  }
  console.log(`Picture is live: ${type}, ${head.headers.get('content-length') ?? '?'} bytes.`);

  if (!confirmed) {
    console.log('DRY RUN. Nothing queued, nothing sent.');
    console.log(`Re-run with --send to text these ${batch.length} for real.`);
    return;
  }

  // The mediaUrl column is new; make sure production has it before writing.
  await ensureSchema();

  if (!testTo) {
    const cleared = await prisma.notificationOutbox.deleteMany({
      where: { kind: 'campaign_mms', state: 'suppressed', idempotencyKey: { endsWith: `:${CAMPAIGN}` } },
    });
    if (cleared.count > 0) console.log(`Cleared ${cleared.count} undelivered rows from a previous run.`);
  }

  let queued = 0;
  for (const row of batch) {
    // A Lead row per real recipient, so a reply has somewhere to land — see
    // send-list-campaign.ts. A test send to our own phone gets none: it is not
    // a lead, and must not appear in the portal as one.
    let leadId: string | null = null;
    if (!testTo) {
      const existing = await prisma.lead.findFirst({
        where: { phone: row.e164, deletedAt: null },
        select: { id: true },
      });
      leadId = (
        existing ??
        (await prisma.lead.create({
          data: {
            name: row.name.replace(/^"|"$/g, '').trim() || 'Unknown',
            phone: row.e164,
            source: 'sms_campaign',
            sourceDetail: CAMPAIGN,
            status: 'new',
            notes: `Texted in the ${CAMPAIGN} batch (Meta lead, bathroom).`,
          },
          select: { id: true },
        }))
      ).id;
    }

    await prisma.notificationOutbox
      .create({
        data: {
          leadId,
          channel: 'sms',
          kind: 'campaign_mms',
          recipient: row.e164,
          subject: '',
          body: body(firstNameOf(row.name)),
          mediaUrl: MEDIA_URL,
          sendAfter: new Date().toISOString(),
          idempotencyKey: testTo
            ? `test:${row.e164}:${CAMPAIGN}:${Date.now()}`
            : `${leadId}:mms:${CAMPAIGN}`,
        },
      })
      .then(() => { queued += 1; })
      .catch(() => console.log(`  already texted, skipping: ${row.name}`));
  }

  console.log(`Queued ${queued}. Delivering…`);
  // Delivery switched on for this drain only — see send-list-campaign.ts for
  // why this is not put in .env.
  const deliverEnv = { ...process.env, VERCEL_ENV: 'production' };
  console.log(await drainOutbox(prisma as never, batch.length + 10, deliverEnv).catch((err) => {
    console.error('drain failed:', err);
    return null;
  }));
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
