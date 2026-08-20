// ─── Twilio inbound webhook ───────────────────────────────────────────────────
// The impure half of inbound replies: signature checking, the database, and
// handing the two outgoing messages to the outbox. Every decision it makes is
// delegated to lib/sms-replies.ts, which is pure and tested.
//
// Folded into the api/appointments function rather than living at api/sms/
// because Vercel's Hobby plan caps this project at 12 serverless functions and
// we are at the cap — the same reason Grant Radar routes through there. A
// rewrite in vercel.json keeps the public URL honest: /api/sms/inbound.

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  classifyReply,
  matchReplyToAppointment,
  phoneKey,
  replyAlertBody,
  replyAlertHtml,
  replyAlertSubject,
  replyUnclearBody,
  replyUnclearSubject,
  rescheduleAckSms,
  shouldRelayDownstream,
  verifyTwilioSignature,
  type ReplyIntent,
} from './sms-replies.js';
import { drainOutbox } from './notification-drain.js';

/** Empty TwiML — we answer the homeowner through the outbox, not the webhook
 *  response, so the reply is recorded, deduped and gated like every other
 *  message we send. Returning message TwiML here would bypass all of that. */
const EMPTY_TWIML = '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';

function twiml(res: VercelResponse, xml = EMPTY_TWIML, status = 200) {
  res.setHeader('Content-Type', 'text/xml');
  return res.status(status).send(xml);
}

/** How long the downstream handler gets before we answer Twilio ourselves. */
const FORWARD_TIMEOUT_MS = 8000;

/**
 * Pass the request on to the handler that owned this webhook before us.
 *
 * A Twilio number has ONE "a message comes in" webhook and OntarioReno's Google
 * Apps Script already had it — that script is what sends a brand-new lead their
 * first text. Rather than take the slot, we sit in front and forward everything
 * untouched, so the script keeps seeing exactly the traffic it always saw.
 *
 * Deliberately called BEFORE the signature check and outside every other branch
 * in this file. First contact with a new lead is older and more valuable than
 * anything we do here, and it must not be able to break because our token is
 * misconfigured, our database is down, or we threw. The script never verified
 * signatures itself — Apps Script cannot read request headers — so forwarding
 * unverified traffic lowers no bar that was ever raised.
 *
 * Returns the script's TwiML if it sent any, so Twilio still acts on it.
 */
async function forwardDownstream(
  params: Record<string, string>,
  env: NodeJS.ProcessEnv
): Promise<string | null> {
  const url = env.SMS_FORWARD_URL;
  if (!url) return null;

  const timeout = AbortSignal.timeout(FORWARD_TIMEOUT_MS);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params).toString(),
      signal: timeout,
      // Apps Script answers with a 302 to googleusercontent; following it is
      // the only way to see the body.
      redirect: 'follow',
    });
    const text = await r.text().catch(() => '');
    return shouldRelayDownstream(r.status, text) ? text.trim() : null;
  } catch (err) {
    // A dead or slow downstream must not fail the webhook — Twilio would retry
    // the whole thing and we would process the same reply again.
    console.error('[sms-inbound] forward to downstream handler failed:', err);
    return null;
  }
}

/**
 * Every URL Twilio might have signed.
 *
 * The vercel.json rewrite means the URL Twilio called (/api/sms/inbound) is not
 * the path this function sees, and the signature covers the URL exactly as
 * Twilio called it. Set TWILIO_WEBHOOK_URL to the number's configured webhook
 * and this stops being guesswork; the reconstructed form is the fallback.
 */
function candidateUrls(req: VercelRequest, env: NodeJS.ProcessEnv): string[] {
  const urls: string[] = [];
  if (env.TWILIO_WEBHOOK_URL) urls.push(env.TWILIO_WEBHOOK_URL);
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  if (host && req.url) urls.push(`${proto}://${host}${req.url}`);
  return urls;
}

type Store = {
  smsReply: {
    findUnique: (args: unknown) => Promise<{ id: string } | null>;
    create: (args: unknown) => Promise<unknown>;
  };
  appointment: {
    findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
    update: (args: unknown) => Promise<unknown>;
    findUnique: (args: unknown) => Promise<unknown>;
  };
  activity: {
    create: (args: unknown) => Promise<unknown>;
  };
  notificationOutbox: {
    create: (args: unknown) => Promise<unknown>;
    findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>;
    update: (args: unknown) => Promise<unknown>;
  };
};

/** Ontario wall clock, as the same "YYYY-MM-DDTHH:MM" shape appointments use. */
export function ontarioNow(at = new Date()): string {
  const s = at.toLocaleString('en-CA', {
    timeZone: 'America/Toronto',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
  const [datePart, timePart] = s.split(', ');
  return `${datePart.replace(/\//g, '-')}T${(timePart || '00:00').slice(0, 5)}`;
}

const REPLY_STATUS: Record<Exclude<ReplyIntent, 'unknown'>, string> = {
  confirm: 'confirmed',
  reschedule: 'reschedule_requested',
};

export async function handleInboundSms(
  req: VercelRequest,
  res: VercelResponse,
  prisma: Store,
  env: NodeJS.ProcessEnv = process.env
) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });

  const params: Record<string, string> = {};
  const raw = (req.body ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(raw)) params[k] = typeof v === 'string' ? v : String(v ?? '');

  // ── Downstream first ──
  // Before anything else, and regardless of what we go on to decide, the Apps
  // Script that owned this webhook before us sees the request. See
  // forwardDownstream: first contact with a new lead cannot be allowed to
  // depend on our correctness.
  const downstreamTwiml = await forwardDownstream(params, env);

  // ── Authenticity ──
  // Governs OUR actions only — the forward above has already happened. This
  // endpoint writes to live appointments and can trigger a text to a real
  // homeowner, so an unsigned POST gets no further than here.
  const signature = (req.headers['x-twilio-signature'] as string) || '';
  const token = env.TWILIO_AUTH_TOKEN ?? '';
  const signed = candidateUrls(req, env).some((url) =>
    verifyTwilioSignature(url, params, token, signature)
  );
  if (!signed) {
    console.warn('[sms-inbound] unsigned request — forwarded, but not acted on');
    // Still answer with the downstream TwiML. Refusing here would discard the
    // Apps Script's instruction to text a new lead.
    return twiml(res, downstreamTwiml ?? EMPTY_TWIML);
  }

  const messageSid = params.MessageSid || params.SmsSid || '';
  const from = params.From || '';
  const body = params.Body || '';
  if (!messageSid || !from) return twiml(res, downstreamTwiml ?? EMPTY_TWIML);

  // Twilio retries a webhook it believes failed. Without this guard a slow
  // response would alert the rep twice and text the homeowner twice.
  const seen = await prisma.smsReply.findUnique({ where: { messageSid } }).catch(() => null);
  if (seen) return twiml(res, downstreamTwiml ?? EMPTY_TWIML);

  const intent = classifyReply(body);
  const nowLocal = ontarioNow();
  const today = nowLocal.slice(0, 10);

  // Candidates are only ever upcoming appointments, so this stays a small read
  // however long the history gets. Phone formats are reconciled in JS because
  // the portal stores whatever a rep typed.
  const key = phoneKey(from);
  const upcoming = key
    ? await prisma.appointment
        .findMany({
          where: {
            appointmentDate: { gte: today },
            status: { in: ['scheduled', 'confirmed', 'rescheduled'] },
            deletedAt: null,
          },
          include: { assignedRep: true },
        })
        .catch(() => [])
    : [];

  const mine = upcoming.filter((a) => phoneKey(String(a.phone ?? '')) === key);
  const matched = matchReplyToAppointment(
    mine.map((a) => ({
      id: String(a.id),
      appointmentDate: String(a.appointmentDate ?? ''),
      appointmentTime: String(a.appointmentTime ?? ''),
      status: String(a.status ?? ''),
      deletedAt: a.deletedAt as Date | null,
    })),
    nowLocal
  );
  const appointment = matched ? mine.find((a) => a.id === matched.id) : null;

  const receivedAt = new Date().toISOString();
  await prisma.smsReply
    .create({
      data: {
        messageSid,
        fromNumber: from,
        toNumber: params.To || '',
        body,
        intent,
        appointmentId: appointment ? String(appointment.id) : null,
        receivedAt,
      },
    })
    .catch((err: unknown) => {
      console.error('[sms-inbound] could not record reply:', err);
    });

  // A reply from a number with no live upcoming appointment is logged and
  // nothing more — there is nobody to tell and nothing to stamp.
  if (!appointment) return twiml(res, downstreamTwiml ?? EMPTY_TWIML);

  const rep = (appointment.assignedRep ?? null) as { name?: string; email?: string } | null;
  const ctx = {
    intent: intent as Exclude<ReplyIntent, 'unknown'>,
    repName: rep?.name ?? '',
    customerName: String(appointment.customerName ?? '') || 'The homeowner',
    customerPhone: from,
    date: String(appointment.appointmentDate ?? ''),
    time: String(appointment.appointmentTime ?? ''),
    address: [appointment.address, appointment.city].filter(Boolean).join(', '),
    rawBody: body,
  } as const;

  // ── An unreadable reply goes straight to the rep, uninterpreted ──
  // "Cancel", "Running late", "Can we do Friday instead" all land here. We make
  // no claim about what they mean and change nothing — but silence loses real
  // messages the night before a visit, so a human sees the words.
  if (intent === 'unknown') {
    if (rep?.email) {
      const unclear = {
        repName: rep.name ?? '',
        customerName: ctx.customerName,
        customerPhone: from,
        date: ctx.date,
        time: ctx.time,
        address: ctx.address,
        rawBody: body,
      };
      await prisma.notificationOutbox
        .create({
          data: {
            appointmentId: appointment.id,
            channel: 'email',
            kind: 'reply_unclear',
            recipient: rep.email,
            subject: replyUnclearSubject(unclear),
            body: replyUnclearBody(unclear),
            html: '',
            sendAfter: receivedAt,
            expiresAt: '',
            idempotencyKey: `${messageSid}:email:reply_unclear`,
          },
        })
        .catch((err: unknown) => console.error('[sms-inbound] could not queue notification:', err));
      try {
        await drainOutbox(prisma as never, 25, env);
      } catch (err) {
        console.error('[sms-inbound] inline drain failed:', err);
      }
    }
    // Deliberately no smsReplyStatus stamp: we do not know what they meant, and
    // a chip claiming otherwise is worse than no chip.
    return twiml(res, downstreamTwiml ?? EMPTY_TWIML);
  }

  // ── What the answer changes on the appointment ──
  //
  // A CONFIRM moves `status` to 'confirmed'. That status already exists in the
  // portal and means exactly this, and leaving a confirmed visit reading
  // "Scheduled" made the pill and the chip disagree about the same fact.
  //
  // A RESCHEDULE REQUEST does not touch `status`, and there is no status that
  // would be true: the nearest one, 'rescheduled', claims a new time has been
  // agreed when nothing has been rebooked. It is work for a rep, not a change
  // to the booking, and the slot stays held until a human moves it. The amber
  // chip and the rep's email carry it instead.
  await prisma.appointment
    .update({
      where: { id: appointment.id },
      data: {
        smsReplyStatus: REPLY_STATUS[intent],
        smsReplyAt: receivedAt,
        smsReplyBody: body,
        ...(intent === 'confirm' ? { status: 'confirmed' } : {}),
      },
    })
    .catch((err: unknown) => console.error('[sms-inbound] could not stamp appointment:', err));

  // A status that changes with nothing in the history explaining it is worse
  // than one that does not change at all — a rep seeing 'Confirmed' has to be
  // able to find out who confirmed it. The portal writes this row when a rep
  // uses the dropdown (see store.tsx); the homeowner's text deserves the same
  // line, attributed to the homeowner rather than to whoever happens to be
  // looking at it. 'system' as the actor id is the portal's own convention for
  // an action no user performed.
  if (intent === 'confirm') {
    await prisma.activity
      .create({
        data: {
          actorUserId: 'system',
          actorName: ctx.customerName,
          actorRole: 'homeowner',
          actionType: 'consultation_confirmed',
          actionLabel: `Consultation confirmed by text for ${ctx.customerName}`,
          entityType: 'appointment',
          entityId: String(appointment.id),
          entityLabel: ctx.customerName,
          dealId: (appointment.dealId as string) || undefined,
          metadata: {
            appointmentDate: ctx.date,
            appointmentTime: ctx.time,
            assignedRep: rep?.name ?? null,
            status: 'confirmed',
            via: 'sms_reply',
            repliedWith: body,
          },
        },
      })
      .catch((err: unknown) => console.error('[sms-inbound] could not log activity:', err));
  }

  // ── Outgoing: the rep's email, and the homeowner's acknowledgement ──
  // Both go through the outbox so they inherit its idempotency key, its
  // non-production suppression and its failure record. Keyed on the message
  // SID, so a duplicate webhook cannot produce a duplicate send even if the
  // dedupe read above raced.
  const queued: Array<Record<string, unknown>> = [];
  if (rep?.email) {
    queued.push({
      appointmentId: appointment.id,
      channel: 'email',
      kind: 'reply_alert',
      recipient: rep.email,
      subject: replyAlertSubject(ctx),
      body: replyAlertBody(ctx),
      html: replyAlertHtml(ctx),
      sendAfter: receivedAt,
      expiresAt: '',
      idempotencyKey: `${messageSid}:email:reply_alert`,
    });
  }
  if (intent === 'reschedule') {
    queued.push({
      appointmentId: appointment.id,
      channel: 'sms',
      kind: 'reschedule_ack',
      recipient: from,
      subject: '',
      body: rescheduleAckSms({ customerName: ctx.customerName, repName: ctx.repName }),
      html: '',
      sendAfter: receivedAt,
      // Still true whenever it lands — it promises a call, not a time.
      expiresAt: '',
      idempotencyKey: `${messageSid}:sms:reschedule_ack`,
    });
  }

  for (const data of queued) {
    await prisma.notificationOutbox.create({ data }).catch((err: unknown) => {
      console.error('[sms-inbound] could not queue notification:', err);
    });
  }

  // Deliver inline rather than waiting for the daily drain: a rep who learns
  // tomorrow that today's visit was cancelled has learned nothing. The outbox
  // row is still the record, and a failure here is retried by the next drain.
  try {
    await drainOutbox(prisma as never, 25, env);
  } catch (err) {
    console.error('[sms-inbound] inline drain failed:', err);
  }

  return twiml(res, downstreamTwiml ?? EMPTY_TWIML);
}
