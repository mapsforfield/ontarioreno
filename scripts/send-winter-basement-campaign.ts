// A batch re-engagement text to leads we already have.
//
//   npx tsx scripts/send-winter-basement-campaign.ts --limit 50
//   npx tsx scripts/send-winter-basement-campaign.ts --limit 50 --send
//
// Without --send it prints the exact list and the exact body and exits. Real
// people receive these; the dry run is the default on purpose, and it is the
// only way to see who is actually in the batch before it goes.
//
// Everything goes through NotificationOutbox and drainOutbox, the same path the
// reminders and lead replies use — same idempotency key, same delivery, same
// record. That matters for two reasons: a lead texted here has a row proving it
// and cannot be silently texted twice by a re-run, and the send is visible in
// the portal alongside every other message rather than being a side channel
// nobody can audit.
//
// ─── Who is eligible ─────────────────────────────────────────────────────────
//
// This is a COMMERCIAL message, which is not the same thing as the transactional
// texts the rest of this repo sends. Under CASL it needs consent, and the only
// consent we can evidence is implied consent from the lead's own enquiry. So the
// query below is deliberately narrow:
//
//   * they gave us their number themselves (a lead row from our own forms)
//   * within CASL's six-month implied-consent window for an enquiry
//   * they never booked (appointmentId is null) — anyone who did is a customer
//     conversation, not a campaign target
//   * not deleted, not already closed out as not-interested or a wrong number
//
// Widening any of that is a legal decision, not a code change. Do not loosen it
// to hit a number.

import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { prisma } from '../lib/prisma.js';
import { drainOutbox } from '../lib/notification-drain.js';

neonConfig.webSocketConstructor = ws;

/** CASL implied consent from an enquiry lasts six months. */
const CONSENT_WINDOW_DAYS = 183;

/** Statuses that mean "do not contact again", whatever the window says. */
const EXCLUDED_STATUSES = ['not_interested', 'wrong_number', 'duplicate', 'booked', 'already_booked'];

/** One send, one key. A re-run of this script cannot double-text anybody. */
const CAMPAIGN = 'winter_basement_2026';

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

/**
 * The message.
 *
 * Keeps "Reply STOP to opt out" even though Twilio honours STOP at the carrier
 * level regardless — see the note in lib/notifications.ts. That footer was
 * dropped from the welcome text because it is a handful a day from a named
 * sender; this is a bulk commercial send, which is exactly the case the footer
 * exists for, and CASL wants an unsubscribe mechanism stated in the message.
 */
function body(firstName: string): string {
  const hi = firstName ? `Hi ${firstName}, just` : 'Hi, just';
  return [
    `${hi} checking in, if you're still looking to finish your basement before winter, OntarioReno has some great monthly options available right now.`,
    '',
    'Grab a quick quote here: https://ontarioreno.ca/consultation',
    '',
    "(If it's already done, please ignore this. Reply STOP to opt out)",
  ].join('\n');
}

const firstNameOf = (name: string) => name.trim().split(/\s+/)[0] ?? '';

async function main() {
  const limit = Number(arg('--limit') ?? 50);
  const confirmed = process.argv.includes('--send');

  const since = new Date(Date.now() - CONSENT_WINDOW_DAYS * 86_400_000);

  const leads = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      appointmentId: null,
      createdAt: { gte: since },
      status: { notIn: EXCLUDED_STATUSES },
      phone: { not: '' },
    },
    // Oldest first: these are the ones furthest from their enquiry and closest
    // to falling out of the consent window, so they are the ones a campaign is
    // actually for.
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, phone: true, createdAt: true, status: true, source: true },
  });

  // One number, one message — a person who enquired twice is still one person.
  const seen = new Set<string>();
  const batch: typeof leads = [];
  for (const lead of leads) {
    const key = lead.phone.replace(/\D/g, '').slice(-10);
    if (key.length < 10 || seen.has(key)) continue;
    seen.add(key);
    batch.push(lead);
    if (batch.length >= limit) break;
  }

  console.log(`Eligible in the ${CONSENT_WINDOW_DAYS}-day window: ${leads.length}`);
  console.log(`After de-duplicating by number:                    ${seen.size}`);
  console.log(`This batch (--limit ${limit}):                     ${batch.length}`);
  console.log('');
  for (const lead of batch) {
    console.log(
      `  ${lead.createdAt.toISOString().slice(0, 10)}  ${lead.phone.padEnd(16)}  ${lead.status.padEnd(14)}  ${lead.name}`
    );
  }
  console.log('');
  console.log('Message as it will send to the first recipient:');
  console.log('─'.repeat(60));
  console.log(body(firstNameOf(batch[0]?.name ?? '')));
  console.log('─'.repeat(60));
  const sample = body(firstNameOf(batch[0]?.name ?? ''));
  console.log(`${sample.length} characters — ${Math.ceil(sample.length / 153)} SMS segments each.`);
  console.log('');

  if (batch.length === 0) {
    console.log('Nothing to send.');
    return;
  }

  if (!confirmed) {
    console.log(`DRY RUN. Nothing was queued and nothing was sent.`);
    console.log(`Re-run with --send to text these ${batch.length} people for real.`);
    return;
  }

  let queued = 0;
  for (const lead of batch) {
    // skipDuplicates via the unique key: if this campaign already reached them,
    // the create throws and we move on rather than sending twice.
    await prisma.notificationOutbox
      .create({
        data: {
          leadId: lead.id,
          channel: 'sms',
          kind: 'campaign_sms',
          recipient: lead.phone,
          subject: '',
          body: body(firstNameOf(lead.name)),
          sendAfter: new Date().toISOString(),
          idempotencyKey: `${lead.id}:sms:${CAMPAIGN}`,
        },
      })
      .then(() => {
        queued += 1;
      })
      .catch(() => {
        console.log(`  already texted, skipping: ${lead.name} (${lead.id})`);
      });
  }

  console.log(`Queued ${queued} messages. Delivering…`);
  // Limit raised past the default 25 so a batch of 50 goes in one pass rather
  // than leaving half of it for the next cron tick.
  const delivery = await drainOutbox(prisma as never, batch.length + 10).catch((err) => {
    console.error('drain failed:', err);
    return null;
  });
  console.log(delivery);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
