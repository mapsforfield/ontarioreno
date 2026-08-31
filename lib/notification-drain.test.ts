import assert from 'node:assert/strict';
import test from 'node:test';

import { drainOutbox, type OutboxStore } from './notification-drain.js';

type Row = {
  id: string;
  channel: string;
  kind?: string;
  appointmentId?: string | null;
  recipient: string;
  subject: string;
  body: string;
  html?: string;
  attempts: number;
  expiresAt?: string;
};

type Appt = {
  id: string;
  customerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  status?: string;
  deletedAt?: Date | null;
};

/**
 * In-memory stand-in so the drain can be driven without a database.
 *
 * `states` models the one column the claim depends on. The compare-and-set is
 * the whole safety property, so a fake that ignored it would let a regression
 * through silently.
 */
function store(
  rows: Row[],
  appointments: Appt[] = [],
  options: { states?: Record<string, string>; claimedAt?: Record<string, string> } = {}
) {
  const updates: Array<{ id: string; state: string; stateReason: string; data: Record<string, unknown> }> = [];
  const states: Record<string, string> = { ...options.states };
  const claimedAt: Record<string, string> = { ...options.claimedAt };
  for (const r of rows) states[r.id] ??= 'pending';

  const prisma: OutboxStore = {
    notificationOutbox: {
      findMany: async () => rows.filter((r) => states[r.id] === 'pending'),
      update: async (args: unknown) => {
        const a = args as { where: { id: string }; data: Record<string, unknown> };
        states[a.where.id] = a.data.state as string;
        updates.push({
          id: a.where.id,
          state: a.data.state as string,
          stateReason: a.data.stateReason as string,
          data: a.data,
        });
        return null;
      },
      updateMany: async (args: unknown) => {
        const a = args as {
          where: { id?: string; state?: string; updatedAt?: { lt: string } };
          data: Record<string, unknown>;
        };
        // The claim: one specific row, only while it is still pending.
        if (a.where.id) {
          if (states[a.where.id] !== a.where.state) return { count: 0 };
          states[a.where.id] = a.data.state as string;
          claimedAt[a.where.id] = new Date().toISOString();
          return { count: 1 };
        }
        // The sweep: every row stuck in `sending` since before the cutoff.
        const cutoff = a.where.updatedAt?.lt ?? '';
        let count = 0;
        for (const id of Object.keys(states)) {
          if (states[id] !== a.where.state) continue;
          if (cutoff && (claimedAt[id] ?? '') >= cutoff) continue;
          states[id] = a.data.state as string;
          count++;
        }
        return { count };
      },
    },
    appointment: {
      findUnique: async (args: unknown) => {
        const a = args as { where: { id: string } };
        return appointments.find((x) => x.id === a.where.id) ?? null;
      },
    },
  };
  return { prisma, updates, states };
}

const inDays = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString().slice(0, 10);

const appt = (over: Partial<Appt> = {}): Appt => ({
  id: 'appt-1',
  customerName: 'Jane',
  phone: '9055550199',
  address: '100 King St W',
  city: 'Hamilton',
  appointmentDate: inDays(3),
  appointmentTime: '12:00',
  status: 'scheduled',
  deletedAt: null,
  ...over,
});

/** A queued reminder carrying a body written against an older slot. */
const reminderRow = (over: Partial<Row> = {}): Row => ({
  id: 'r1',
  channel: 'sms',
  kind: 'reminder_24h',
  appointmentId: 'appt-1',
  recipient: '9055550199',
  subject: '',
  body: 'Reminder: ... scheduled for tomorrow (Friday, August 7) at 12:00 PM ...',
  attempts: 0,
  expiresAt: '',
  ...over,
});

const PRODUCTION = { VERCEL_ENV: 'production' } as NodeJS.ProcessEnv;

function row(over: Partial<Row> = {}): Row {
  return {
    id: 'r1', channel: 'sms', recipient: '9055550199',
    subject: '', body: 'Reminder', attempts: 0, ...over,
  };
}

test('a reminder past its window is dropped, not sent', async () => {
  const expired = new Date(Date.now() - 60 * 60_000).toISOString();
  const { prisma, updates } = store([row({ expiresAt: expired })]);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.stale, 1);
  assert.equal(summary.sent, 0);
  assert.equal(updates[0]!.state, 'suppressed');
  assert.equal(updates[0]!.stateReason, 'stale_message_window_passed');
});

test('a reminder still inside its window is not treated as stale', async () => {
  const future = new Date(Date.now() + 60 * 60_000).toISOString();
  const { prisma } = store([row({ expiresAt: future })]);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.stale, 0);
  // No Twilio configured, so it parks rather than sending — the point here is
  // only that expiry did not fire.
  assert.equal(summary.blocked, 1);
});

test('a message with no expiry is never stale', async () => {
  const { prisma } = store([row({ expiresAt: '' })]);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.stale, 0);
});

test('an SMS row is no longer treated as an unsupported channel', async () => {
  const { prisma, updates } = store([row({ expiresAt: '' })]);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  // Before the Twilio adapter existed this fell through to the final else and
  // was recorded as unsupported. With no credentials it must park as blocked,
  // ready to send, not be discarded as undeliverable.
  assert.equal(updates[0]!.stateReason, 'no_sms_provider');
  assert.equal(summary.blocked, 1);
});

// ─── Reminders follow the appointment, not the stored message ─────────────────

test('a reminder whose visit moved later is carried forward, not sent', async () => {
  // The reported bug: booked for Friday, moved to the following Monday, and the
  // Friday reminder was still sitting due in the queue.
  const { prisma, updates } = store(
    [reminderRow()],
    [appt({ appointmentDate: inDays(10), appointmentTime: '16:00' })]
  );

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.sent, 0);
  assert.equal(summary.deferred, 1);
  const update = updates[0]!;
  assert.equal(update.state, undefined, 'stays pending');
  assert.ok(String(update.data.sendAfter) > new Date().toISOString());
  assert.ok(!String(update.data.body).includes('August 7'), 'old date is gone from the wording');
});

test('a reminder for a cancelled visit is dropped', async () => {
  const { prisma, updates } = store([reminderRow()], [appt({ status: 'cancelled' })]);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.sent, 0);
  assert.equal(summary.stale, 1);
  assert.equal(updates[0]!.state, 'suppressed');
  assert.equal(updates[0]!.stateReason, 'appointment_cancelled');
});

test('a reminder for a deleted visit is dropped', async () => {
  const { prisma, updates } = store([reminderRow()], [appt({ deletedAt: new Date() })]);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.sent, 0);
  assert.equal(updates[0]!.stateReason, 'appointment_deleted');
});

test('a reminder whose appointment is gone is dropped rather than sent blind', async () => {
  const { prisma, updates } = store([reminderRow()], []);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.sent, 0);
  assert.equal(summary.stale, 1);
  assert.equal(updates[0]!.stateReason, 'appointment_missing');
});

test('a stored expiry cannot veto a reminder the appointment still wants', async () => {
  // Expiry written against the ORIGINAL slot, which has since been moved out.
  // Under the old ordering this row was discarded as stale and the homeowner
  // heard nothing at all.
  const expired = new Date(Date.now() - 60 * 60_000).toISOString();
  const { prisma, updates } = store(
    [reminderRow({ expiresAt: expired })],
    [appt({ appointmentDate: inDays(10), appointmentTime: '16:00' })]
  );

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.stale, 0);
  assert.equal(summary.deferred, 1);
  assert.ok(String(updates[0]!.data.expiresAt) > new Date().toISOString());
});

test('non-reminder messages are sent as written', async () => {
  // Confirmations and team alerts state what was true when they were composed;
  // only reminders are rebuilt.
  const { prisma } = store([reminderRow({ kind: 'booking_confirmation' })], []);

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.stale, 0);
  assert.equal(summary.blocked, 1, 'reached delivery, parked only for want of Twilio');
});

test('expiry beats environment suppression so counts stay honest', async () => {
  const expired = new Date(Date.now() - 60 * 60_000).toISOString();
  const { prisma, updates } = store([row({ expiresAt: expired })]);

  // In a non-production environment nothing is delivered anyway, but the reason
  // recorded should say the message went stale rather than blaming the
  // environment — otherwise a real timing bug hides behind the preview flag.
  const summary = await drainOutbox(prisma, 25, { VERCEL_ENV: 'preview' } as NodeJS.ProcessEnv);

  assert.equal(summary.stale, 1);
  assert.equal(updates[0]!.stateReason, 'stale_message_window_passed');
});

// ─── The claim ────────────────────────────────────────────────────────────────
// Two drains now overlap by design: a cron every fifteen minutes, plus the
// inline drains a dozen portal actions trigger. Before the claim, both read the
// same pending row and both delivered it — the same reminder text arriving
// twice on a real homeowner's phone.

test('a row another drain is already sending is left alone', async () => {
  const { prisma, updates } = store(
    [row({ expiresAt: '' })],
    [],
    { states: { r1: 'sending' }, claimedAt: { r1: new Date().toISOString() } }
  );

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.considered, 0, 'a claimed row is not even due');
  assert.equal(updates.length, 0, 'nothing was delivered or recorded twice');
});

test('only one of two concurrent drains delivers a row', async () => {
  const { prisma, updates } = store([row({ expiresAt: '' })]);

  const [first, second] = await Promise.all([
    drainOutbox(prisma, 25, PRODUCTION),
    drainOutbox(prisma, 25, PRODUCTION),
  ]);

  // Whichever won, exactly one outcome was recorded for the row.
  assert.equal(first.skipped + second.skipped, 1, 'the loser skipped rather than sent');
  assert.equal(updates.length, 1, 'the message was handed to a provider once');
});

test('a row left behind by a drain that died is picked back up', async () => {
  // Serverless processes are killed mid-request routinely. Without the sweep a
  // row claimed by one of them stays in `sending` forever and the homeowner
  // simply never hears from us.
  const longAgo = new Date(Date.now() - 60 * 60_000).toISOString();
  const { prisma, states } = store(
    [row({ expiresAt: '' })],
    [],
    { states: { r1: 'sending' }, claimedAt: { r1: longAgo } }
  );

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.requeued, 1);
  assert.notEqual(states.r1, 'sending', 'it moved on rather than staying stuck');
});

test('a row claimed moments ago is left to the drain that has it', async () => {
  // The one way this mechanism could cause the double send it prevents is by
  // requeuing a message that is still genuinely in flight.
  const justNow = new Date(Date.now() - 30_000).toISOString();
  const { prisma } = store(
    [row({ expiresAt: '' })],
    [],
    { states: { r1: 'sending' }, claimedAt: { r1: justNow } }
  );

  const summary = await drainOutbox(prisma, 25, PRODUCTION);

  assert.equal(summary.requeued, 0);
});
