import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { handleInboundSms } from './sms-inbound.js';

// ─── A fake Twilio request, correctly signed ──────────────────────────────────
// Signing for real rather than stubbing the check: an unsigned request takes a
// different path through the handler, so a test that skipped the signature
// would be exercising the wrong branch.

const WEBHOOK_URL = 'https://ontarioreno.ca/api/sms/inbound';
const TOKEN = 'test-token';

function sign(params: Record<string, string>): string {
  const payload =
    WEBHOOK_URL + Object.keys(params).sort().map((k) => k + params[k]).join('');
  return createHmac('sha1', TOKEN).update(Buffer.from(payload, 'utf-8')).digest('base64');
}

function fakeReq(body: string) {
  const params = { MessageSid: `SM${body}`, From: '+14379997504', To: '+16475585900', Body: body };
  return {
    method: 'POST',
    headers: { 'x-twilio-signature': sign(params) },
    body: params,
    url: '/api/appointments?resource=sms-inbound',
  } as never;
}

function fakeRes() {
  const sent: { status?: number; body?: unknown } = {};
  const res = {
    setHeader() {},
    status(code: number) { sent.status = code; return res; },
    send(b: unknown) { sent.body = b; return res; },
    json(b: unknown) { sent.body = b; return res; },
  };
  return { res: res as never, sent };
}

type Store = Parameters<typeof handleInboundSms>[2];

/** Records every write so a test can assert on what the handler decided. */
function fakeStore(appointment: Record<string, unknown>) {
  const writes = {
    appointmentUpdates: [] as Record<string, unknown>[],
    activities: [] as Record<string, unknown>[],
    outbox: [] as Record<string, unknown>[],
  };
  const store = {
    smsReply: {
      findUnique: async () => null,
      create: async () => ({}),
    },
    appointment: {
      findMany: async () => [appointment],
      findUnique: async () => appointment,
      update: async (args: { data: Record<string, unknown> }) => {
        writes.appointmentUpdates.push(args.data);
        return {};
      },
    },
    activity: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.activities.push(args.data);
        return {};
      },
    },
    notificationOutbox: {
      create: async (args: { data: Record<string, unknown> }) => {
        writes.outbox.push(args.data);
        return {};
      },
      // Nothing is due, so the inline drain is a no-op — delivery is covered by
      // notification-drain.test.ts and is not what this file is about.
      findMany: async () => [],
      update: async () => ({}),
    },
  };
  return { store: store as unknown as Store, writes };
}

/** Far enough ahead that the match is never sensitive to when this runs. */
function upcomingAppointment() {
  const d = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return {
    id: 'apt-1',
    phone: '(437) 999-7504',
    customerName: 'Jay',
    appointmentDate: d,
    appointmentTime: '18:00',
    status: 'scheduled',
    address: '15 Eastway Street',
    city: 'Brampton',
    dealId: null,
    deletedAt: null,
    assignedRep: { name: 'Steven', email: 'steven@example.com' },
  };
}

const env = { TWILIO_AUTH_TOKEN: TOKEN, TWILIO_WEBHOOK_URL: WEBHOOK_URL } as NodeJS.ProcessEnv;

test('C moves the booking to confirmed and says who confirmed it', async () => {
  const { store, writes } = fakeStore(upcomingAppointment());
  const { res } = fakeRes();
  await handleInboundSms(fakeReq('C'), res, store, env);

  const update = writes.appointmentUpdates[0];
  assert.equal(update.status, 'confirmed');
  assert.equal(update.smsReplyStatus, 'confirmed');
  assert.equal(update.smsReplyBody, 'C');

  // A status that changes with nothing in the history explaining it is worse
  // than one that does not change — a rep seeing "Confirmed" must be able to
  // find out who confirmed it, and it was not them.
  const activity = writes.activities[0];
  assert.ok(activity, 'no history entry was written for the status change');
  assert.equal(activity.actionType, 'consultation_confirmed');
  assert.equal(activity.actorRole, 'homeowner');
  assert.equal(activity.actorName, 'Jay');
  assert.match(String(activity.actionLabel), /confirmed by text/);
});

test('R never touches the booking status', async () => {
  const { store, writes } = fakeStore(upcomingAppointment());
  const { res } = fakeRes();
  await handleInboundSms(fakeReq('R'), res, store, env);

  const update = writes.appointmentUpdates[0];
  assert.equal(update.smsReplyStatus, 'reschedule_requested');
  // No status is true here. 'rescheduled' would claim a new time has been
  // agreed when nothing has been rebooked, and a rep scanning the calendar
  // would read it as already handled. The slot stays held.
  assert.equal('status' in update, false);
  assert.equal(writes.activities.length, 0);

  // The rep is told, and the homeowner is promised a call.
  const kinds = writes.outbox.map((o) => o.kind);
  assert.deepEqual(kinds, ['reply_alert', 'reschedule_ack']);
});

test('a reply we cannot read changes nothing and alerts the rep', async () => {
  const { store, writes } = fakeStore(upcomingAppointment());
  const { res } = fakeRes();
  await handleInboundSms(fakeReq('Cancel'), res, store, env);

  assert.equal(writes.appointmentUpdates.length, 0, 'an unread reply must not stamp anything');
  assert.equal(writes.activities.length, 0);
  assert.deepEqual(writes.outbox.map((o) => o.kind), ['reply_unclear']);
});

test('an unsigned request is forwarded but acted on by nobody', async () => {
  const { store, writes } = fakeStore(upcomingAppointment());
  const { res } = fakeRes();
  const req = fakeReq('C');
  (req as unknown as { headers: Record<string, string> }).headers['x-twilio-signature'] = 'wrong';

  await handleInboundSms(req, res, store, env);

  // This endpoint is public and writes to live appointments. Anyone could POST
  // "C" for a number they guessed.
  assert.equal(writes.appointmentUpdates.length, 0);
  assert.equal(writes.activities.length, 0);
  assert.equal(writes.outbox.length, 0);
});
