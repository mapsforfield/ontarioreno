import assert from 'node:assert/strict';
import test from 'node:test';

import { drainOutbox, type OutboxStore } from './notification-drain.js';

type Row = {
  id: string;
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  html?: string;
  attempts: number;
  expiresAt?: string;
};

/** In-memory stand-in so the drain can be driven without a database. */
function store(rows: Row[]) {
  const updates: Array<{ id: string; state: string; stateReason: string }> = [];
  const prisma: OutboxStore = {
    notificationOutbox: {
      findMany: async () => rows,
      update: async (args: unknown) => {
        const a = args as { where: { id: string }; data: { state: string; stateReason: string } };
        updates.push({ id: a.where.id, state: a.data.state, stateReason: a.data.stateReason });
        return null;
      },
    },
  };
  return { prisma, updates };
}

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
