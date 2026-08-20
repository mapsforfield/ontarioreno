// Read-only check on inbound SMS replies.
//
// Answers "did the webhook actually receive and understand it?" without
// waiting on an inbox. Shows the most recent replies, whether each matched an
// appointment, and whether the rep alert was queued and sent.
//
//   DATABASE_URL='<neon url>' npx tsx scripts/sms-reply-audit.ts
//
// Writes nothing, sends nothing.

import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { prisma } from '../lib/prisma.js';

neonConfig.webSocketConstructor = ws;

async function main() {
  const replies = await prisma.smsReply.findMany({
    orderBy: { createdAt: 'desc' },
    take: 15,
  });

  if (replies.length === 0) {
    console.log('No inbound replies recorded yet.');
    console.log('If you have just texted the number, give it a few seconds and re-run.');
    return;
  }

  console.log(`Most recent ${replies.length} inbound replies\n`);

  for (const r of replies) {
    const when = r.receivedAt || r.createdAt.toISOString();
    console.log(`${when}  ${r.fromNumber}`);
    console.log(`  text:   ${JSON.stringify(r.body)}`);
    console.log(`  read as: ${r.intent}${r.intent === 'unknown' ? '  (nobody alerted — by design)' : ''}`);

    if (!r.appointmentId) {
      console.log('  matched: NO live upcoming appointment for this number');
      console.log('');
      continue;
    }

    const appt = await prisma.appointment.findUnique({
      where: { id: r.appointmentId },
      include: { assignedRep: true },
    });
    console.log(
      `  matched: ${appt?.customerName ?? '?'} — ${appt?.appointmentDate ?? '?'} ${appt?.appointmentTime ?? ''}` +
        `  (rep: ${appt?.assignedRep?.name ?? 'unassigned'})`
    );
    console.log(`  stamped: ${appt?.smsReplyStatus || '(none)'}`);

    const outbox = await prisma.notificationOutbox.findMany({
      where: { idempotencyKey: { startsWith: `${r.messageSid}:` } },
    });
    if (outbox.length === 0) {
      console.log('  outgoing: nothing queued');
    }
    for (const o of outbox) {
      const why = o.stateReason || o.lastError;
      console.log(
        `  outgoing: ${o.channel}/${o.kind} -> ${o.recipient}  [${o.state}]${why ? ` ${why}` : ''}`
      );
    }
    console.log('');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
