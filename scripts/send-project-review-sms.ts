// Send one Project Review booking text to a lead that already exists.
//
// For leads that came in BEFORE the /match form started posting to our API —
// they are in an inbox and a Lead row, but no text was ever queued for them.
// Everything goes through the same path a live submission uses: the same copy
// builder, the same outbox row, the same idempotency key, the same drain. It
// is not a side channel, so a lead texted this way cannot be texted again by
// the normal flow.
//
//   npx tsx scripts/send-project-review-sms.ts --lead <leadId>
//   npx tsx scripts/send-project-review-sms.ts --lead <leadId> --send
//
// Without --send it prints exactly what WOULD go out and exits. Real people
// receive these; the dry run is the default on purpose.

import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { prisma } from '../lib/prisma.js';
import { planProjectReviewSms } from '../lib/project-review.js';
import { drainOutbox } from '../lib/notification-drain.js';

neonConfig.webSocketConstructor = ws;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function main() {
  const leadId = arg('--lead');
  const confirmed = process.argv.includes('--send');
  if (!leadId) {
    console.error('Usage: npx tsx scripts/send-project-review-sms.ts --lead <leadId> [--send]');
    process.exitCode = 1;
    return;
  }

  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) {
    console.error(`No lead with id ${leadId}`);
    process.exitCode = 1;
    return;
  }

  const plan = planProjectReviewSms({
    name: lead.name ?? '',
    phone: lead.phone ?? '',
    projectType: lead.projectType ?? '',
  });

  console.log(`Lead:         ${lead.name} (${lead.id})`);
  console.log(`Phone:        ${lead.phone}`);
  console.log(`Project type: ${lead.projectType}`);
  console.log('');

  if (plan.send === false) {
    console.log(`Nothing to send — ${plan.reason}.`);
    if (plan.reason === 'no_form_for_project_type') {
      console.log('This project type has no consultation form by design; it needs a phone call.');
    }
    return;
  }

  const idempotencyKey = `${lead.id}:sms:project_review_booking`;
  const existing = await prisma.notificationOutbox.findUnique({ where: { idempotencyKey } });
  if (existing) {
    console.log(`Already queued on ${existing.createdAt.toISOString()} — state: ${existing.state}`);
    console.log('Not sending again. That key is what stops a homeowner being texted twice.');
    return;
  }

  console.log(`To:   ${lead.phone}`);
  console.log(`Text: ${plan.body}`);
  console.log('');

  if (!confirmed) {
    console.log('DRY RUN — nothing sent. Re-run with --send to deliver this.');
    return;
  }

  await prisma.notificationOutbox.create({
    data: {
      leadId: lead.id,
      channel: 'sms',
      kind: 'project_review_booking',
      recipient: lead.phone ?? '',
      subject: '',
      body: plan.body,
      html: '',
      sendAfter: new Date().toISOString(),
      expiresAt: '',
      idempotencyKey,
    },
  });

  const summary = await drainOutbox(prisma as never, 25);
  console.log('Drain:', JSON.stringify(summary));

  const row = await prisma.notificationOutbox.findUnique({ where: { idempotencyKey } });
  console.log(`Result: ${row?.state}${row?.stateReason ? ` (${row.stateReason})` : ''}`);
  if (row?.lastError) console.log(`Error:  ${row.lastError}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
