// ─── Booking, texting and alerting for call conversations ────────────────────
// The database side of call mode. The decisions live in lib/lead-conversation.ts
// and lib/call-slots.ts; this file only does what they decide.
//
// A booked call is a CALLBACK on the lead (callbackAt + status
// 'callback_scheduled'), the same record a rep creates with "Schedule callback"
// in the Workspace. It is deliberately not an Appointment: an appointment is a
// visit with an address, reminders and rep travel rules, and none of that is
// true of a five-minute phone call.

import { deliveryEnabled } from './app-config.js';
import { drainOutbox } from './notification-drain.js';
import { torontoInstant } from './notifications.js';
import { torontoWallClock } from './scheduling.js';
import { callSlotLabel, CALLS_PER_SLOT, pickCallSlots } from './call-slots.js';
import { slotLabel, type OfferedSlot } from './lead-reply-templates.js';

/** Who makes the calls and gets the alerts. A real User.id. */
export function callOwnerId(env: NodeJS.ProcessEnv = process.env): string {
  return (env.LEAD_CALL_OWNER_ID ?? '').trim() || 'sabah';
}

/** Who the call texts sign as. */
export function callSender(env: NodeJS.ProcessEnv = process.env): string {
  return (env.LEAD_CALL_SENDER ?? '').trim() || 'Mark';
}

/**
 * 'call' unless switched off. LEAD_WELCOME_MODE=link restores the old
 * link-to-the-booking-page text without a deploy.
 */
export function welcomeMode(env: NodeJS.ProcessEnv = process.env): 'call' | 'link' {
  return (env.LEAD_WELCOME_MODE ?? '').trim().toLowerCase() === 'link' ? 'link' : 'call';
}

/** Loose on purpose: callers pass the real Prisma client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Store = any;

/** Wall-clock starts of every call still to come, for the capacity check. */
export async function takenCallWalls(store: Store, now = new Date()): Promise<string[]> {
  const rows: Array<{ callbackAt: Date | null }> = await store.lead
    .findMany({
      where: { deletedAt: null, status: 'callback_scheduled', callbackAt: { gte: now } },
      select: { callbackAt: true },
    })
    .catch(() => []);
  return rows
    .filter((r) => r.callbackAt)
    .map((r) => torontoWallClock(new Date(r.callbackAt as Date)));
}

/** The two best times to offer right now. */
export async function currentCallSlots(store: Store, nowWall = torontoWallClock()): Promise<OfferedSlot[]> {
  return pickCallSlots(nowWall, await takenCallWalls(store));
}

/**
 * Book a call. SLOT_TAKEN when the half hour filled up, or when it is too
 * close (or already past) by the time they answered.
 */
export async function bookCall(
  store: Store,
  leadId: string,
  slot: OfferedSlot,
  env: NodeJS.ProcessEnv = process.env
): Promise<'BOOKED' | 'SLOT_TAKEN' | 'CANNOT_BOOK'> {
  try {
    const at = torontoInstant(slot.date, slot.time);
    if (at.getTime() < Date.now() + 10 * 60_000) return 'SLOT_TAKEN';

    const wall = `${slot.date}T${slot.time}`;
    const taken = await takenCallWalls(store);
    if (taken.filter((t) => t === wall).length >= CALLS_PER_SLOT) return 'SLOT_TAKEN';

    const lead = await store.lead.update({
      where: { id: leadId },
      data: { callbackAt: at, status: 'callback_scheduled' },
      select: { id: true, name: true, phone: true },
    });
    // A booked call nobody makes is worse than no call. Reminder to the
    // caller's phone; the drain runs every 15 minutes, so 20 minutes ahead
    // lands it 5 to 20 minutes before the call. Expires at the call time.
    const ownerPhone = (env.LEAD_CALL_OWNER_PHONE ?? '').trim();
    if (ownerPhone) {
      await store.notificationOutbox
        .create({
          data: {
            leadId,
            channel: 'sms',
            kind: 'reply_alert',
            recipient: ownerPhone,
            subject: '',
            body: `Call ${String(lead.name ?? '').trim() || 'a homeowner'} at ${slotLabel(slot)}: ${String(lead.phone ?? '')}. They booked it by text.`,
            html: '',
            sendAfter: new Date(at.getTime() - 20 * 60_000).toISOString(),
            expiresAt: at.toISOString(),
            idempotencyKey: `${leadId}:${slot.date}T${slot.time}:sms:call_reminder`,
          },
        })
        .catch((err: unknown) => console.error('[call-booking] reminder queue failed:', err));
    }
    // The history line a rep reads on the lead. actorUserId-style foreign keys
    // need a real user, so it is attributed to the caller.
    await store.interaction
      ?.create({
        data: {
          leadId,
          userId: callOwnerId(env),
          channel: 'system',
          direction: 'internal',
          body: `Homeowner booked a call by text for ${slotLabel(slot)}.`,
        },
      })
      .catch((err: unknown) => console.error('[call-booking] history row failed:', err));
    void lead;
    return 'BOOKED';
  } catch (err) {
    console.error('[call-booking] could not book call:', err);
    return 'CANNOT_BOOK';
  }
}

/** Queue one conversation text and deliver it now. Keyed so a retry cannot double-text. */
export async function sendConversationSms(
  store: Store,
  leadId: string,
  phone: string,
  body: string,
  key: string
): Promise<void> {
  await store.notificationOutbox
    .create({
      data: {
        leadId,
        channel: 'sms',
        kind: 'lead_conversation',
        recipient: phone,
        subject: '',
        body,
        html: '',
        sendAfter: new Date().toISOString(),
        expiresAt: '',
        idempotencyKey: key,
      },
    })
    .catch((err: unknown) => console.error('[call-booking] queue failed:', err));
  await drainOutbox(store).catch(() => null);
}

/** Push to one user's devices. Production only; never throws. */
export async function pushToUser(
  store: Store,
  userId: string,
  payload: { title: string; body: string; url?: string },
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  if (!userId || !store.pushSubscription || !deliveryEnabled(env)) return;
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return;
  try {
    const webpush = await import('web-push');
    webpush.default.setVapidDetails(
      `mailto:${env.VAPID_CONTACT_EMAIL ?? 'noreply@ontarioreno.ca'}`,
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    const subs: Array<{ endpoint: string; p256dh: string; auth: string }> =
      await store.pushSubscription.findMany({ where: { userId } });
    await Promise.allSettled(
      subs.map((sub) =>
        webpush.default.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        )
      )
    );
  } catch (err) {
    console.error('[call-booking] push failed:', err);
  }
}

/**
 * Tell the caller, on every channel that actually reaches them.
 *
 * Push alone is not enough: production has no VAPID keys (November 2026) and
 * the caller had no push subscription, so a push-only alert was silence. A
 * text to the caller's own phone (LEAD_CALL_OWNER_PHONE) is the channel that
 * cannot be missed; the team inbox email is the record. Both go through the
 * outbox, keyed on the homeowner's message, so a webhook retry cannot double
 * alert. Never throws.
 */
export async function notifyCaller(
  store: Store,
  leadId: string,
  messageKey: string,
  copy: { title: string; body: string; url: string },
  env: NodeJS.ProcessEnv = process.env
): Promise<void> {
  await pushToUser(store, callOwnerId(env), copy, env);
  const link = `https://ontarioreno.ca${copy.url}`;
  const rows: Array<Record<string, unknown>> = [];
  const phone = (env.LEAD_CALL_OWNER_PHONE ?? '').trim();
  if (phone) {
    rows.push({
      channel: 'sms',
      recipient: phone,
      subject: '',
      body: `${copy.title}. ${copy.body} ${link}`,
      idempotencyKey: `${messageKey}:sms:caller_alert`,
    });
  }
  const inbox = (env.TEAM_INBOX_EMAIL ?? '').trim() || 'mapsforfield@gmail.com';
  rows.push({
    channel: 'email',
    recipient: inbox,
    subject: copy.title,
    body: `${copy.body}\n\n${link}`,
    idempotencyKey: `${messageKey}:email:caller_alert`,
  });
  for (const row of rows) {
    await store.notificationOutbox
      .create({
        data: {
          leadId,
          kind: 'reply_alert',
          html: '',
          sendAfter: new Date().toISOString(),
          expiresAt: '',
          ...row,
        },
      })
      .catch((err: unknown) => console.error('[call-booking] alert queue failed:', err));
  }
  await drainOutbox(store).catch(() => null);
}

/** What the caller's phone says, by reason. */
export function alertCopy(
  reason: string,
  leadName: string,
  rawBody: string,
  booked?: { slot: OfferedSlot; nowWall: string }
): { title: string; body: string } {
  const who = leadName.trim() || 'A homeowner';
  if (reason === 'CALL_BOOKED' && booked) {
    return {
      title: `Call booked: ${who}`,
      body: `${callSlotLabel(booked.slot, booked.nowWall)}. They said: "${rawBody.slice(0, 120)}"`,
    };
  }
  return {
    title: `${who} replied, needs you`,
    body: `"${rawBody.slice(0, 140)}"`,
  };
}
