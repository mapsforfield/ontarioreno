// Recover the C/R replies that arrived BEFORE the inbound webhook existed.
//
// Until the Twilio number's "a message comes in" webhook was pointed at
// /api/sms/inbound, every reply went to the Google Apps Script and nowhere
// else. Our database has no record of them; the only copy is in Twilio. This
// pulls them back, runs them through the SAME classifier the webhook uses, and
// applies what the webhook would have applied.
//
//   npx tsx scripts/sms-reply-backfill.ts --since 2026-08-01
//   npx tsx scripts/sms-reply-backfill.ts --since 2026-08-01 --apply
//
// SENDS NOTHING. Not one rep email, not one acknowledgement text. Every message
// the webhook would have produced is days stale by now: a homeowner who asked
// to reschedule last week does not want a text this morning promising a call
// about it, and a rep does not want an alert for a visit that already happened.
// The record is corrected silently; the messages are not re-run.
//
// Dry run is the default.

import 'dotenv/config';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';
import { prisma } from '../lib/prisma.js';
import { classifyReply, matchReplyToAppointment, phoneKey } from '../lib/sms-replies.js';

neonConfig.webSocketConstructor = ws;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

type TwilioMessage = {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  date_sent: string;
};

/** Inbound messages to our number since `since`, following Twilio's paging. */
async function fetchInbound(since: string): Promise<TwilioMessage[]> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const to = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !token || !to) throw new Error('TWILIO_ACCOUNT_SID / AUTH_TOKEN / FROM_NUMBER required');

  const auth = `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`;
  const out: TwilioMessage[] = [];
  let url: string | null =
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json` +
    `?To=${encodeURIComponent(to)}&DateSent%3E=${encodeURIComponent(since)}&PageSize=100`;

  while (url) {
    const r: Response = await fetch(url, { headers: { Authorization: auth } });
    if (!r.ok) throw new Error(`Twilio ${r.status}: ${await r.text()}`);
    const page = (await r.json()) as { messages?: TwilioMessage[]; next_page_uri?: string | null };
    out.push(...(page.messages ?? []));
    url = page.next_page_uri ? `https://api.twilio.com${page.next_page_uri}` : null;
  }
  // Twilio's `To` filter still returns outbound rows whose To is a homeowner in
  // some accounts, so direction is checked rather than trusted.
  return out.filter((m) => m.direction.startsWith('inbound'));
}

/** Ontario wall clock for an instant, in the shape appointments are stored in. */
function ontarioAt(iso: string): string {
  const s = new Date(iso).toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const [d, t] = s.split(', ');
  return `${d.replace(/\//g, '-')}T${(t || '00:00').slice(0, 5)}`;
}

async function main() {
  const since = arg('--since');
  const apply = process.argv.includes('--apply');
  if (!since) {
    console.error('Usage: npx tsx scripts/sms-reply-backfill.ts --since YYYY-MM-DD [--apply]');
    process.exitCode = 1;
    return;
  }

  const messages = await fetchInbound(since);
  console.log(`${messages.length} inbound messages from Twilio since ${since}\n`);

  const appointments = await prisma.appointment.findMany({
    where: { deletedAt: null },
    include: { assignedRep: true },
  });
  const todayOntario = ontarioAt(new Date().toISOString());

  let applied = 0;
  let skipped = 0;

  for (const m of messages.sort((a, b) => a.date_sent.localeCompare(b.date_sent))) {
    const seen = await prisma.smsReply.findUnique({ where: { messageSid: m.sid } }).catch(() => null);
    if (seen) { skipped++; continue; }

    const intent = classifyReply(m.body);
    const key = phoneKey(m.from);
    const mine = appointments.filter((a) => phoneKey(a.phone ?? '') === key);

    // Matched against the moment the reply ARRIVED, not now. An appointment
    // that was upcoming when they answered is the one they were answering
    // about, even if it has since passed.
    const matched = matchReplyToAppointment(
      mine.map((a) => ({
        id: a.id,
        appointmentDate: a.appointmentDate,
        appointmentTime: a.appointmentTime,
        status: a.status,
        deletedAt: a.deletedAt,
      })),
      ontarioAt(m.date_sent)
    );
    const appt = matched ? mine.find((a) => a.id === matched.id) : null;

    const when = new Date(m.date_sent).toLocaleString('en-CA', { timeZone: 'America/Toronto' });
    console.log(`${when}  ${m.from}  ${JSON.stringify(m.body)}  -> ${intent}`);

    if (!appt) {
      console.log('   no live appointment was upcoming for this number at that time — recording only\n');
    } else {
      console.log(`   ${appt.customerName} — ${appt.appointmentDate} ${appt.appointmentTime} (${appt.assignedRep?.name ?? 'unassigned'})`);
    }

    // A confirmation only moves the STATUS while the visit is still ahead of us.
    // Flipping a visit that already happened to "Confirmed" would overwrite
    // whatever a rep recorded afterwards — completed, no-show — with a status
    // that is now weeks out of date.
    const stillUpcoming = appt
      ? `${appt.appointmentDate}T${appt.appointmentTime || '00:00'}` >= todayOntario
      : false;
    const setsStatus = Boolean(appt) && intent === 'confirm' && stillUpcoming;
    if (appt && intent === 'confirm' && !stillUpcoming) {
      console.log('   visit has already passed — recording the reply, leaving status alone');
    }
    if (setsStatus) console.log('   status -> confirmed');
    console.log('');

    if (!apply) continue;

    await prisma.smsReply.create({
      data: {
        messageSid: m.sid,
        fromNumber: m.from,
        toNumber: m.to,
        body: m.body,
        intent,
        appointmentId: appt?.id ?? null,
        receivedAt: new Date(m.date_sent).toISOString(),
      },
    });

    if (appt && intent !== 'unknown') {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: {
          smsReplyStatus: intent === 'confirm' ? 'confirmed' : 'reschedule_requested',
          smsReplyAt: new Date(m.date_sent).toISOString(),
          smsReplyBody: m.body,
          ...(setsStatus ? { status: 'confirmed' } : {}),
        },
      });

      if (setsStatus) {
        await prisma.activity.create({
          data: {
            actorUserId: appt.assignedRepId || appt.createdByUserId,
            actorName: appt.customerName || 'Homeowner',
            actorRole: 'homeowner',
            actionType: 'consultation_confirmed',
            actionLabel: `Consultation confirmed by text for ${appt.customerName} (recovered from Twilio)`,
            entityType: 'appointment',
            entityId: appt.id,
            entityLabel: appt.customerName,
            dealId: appt.dealId || undefined,
            metadata: {
              appointmentDate: appt.appointmentDate,
              appointmentTime: appt.appointmentTime,
              assignedRep: appt.assignedRep?.name ?? null,
              status: 'confirmed',
              via: 'sms_reply_backfill',
              repliedWith: m.body,
              // The homeowner answered here, not when this script ran.
              repliedAt: new Date(m.date_sent).toISOString(),
            },
          },
        });
      }
      applied++;
    }
  }

  console.log(`${applied} appointment${applied === 1 ? '' : 's'} updated, ${skipped} already recorded.`);
  if (!apply) console.log('\nDRY RUN — nothing written. Re-run with --apply.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
