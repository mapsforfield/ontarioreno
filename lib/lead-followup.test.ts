// The link text + call follow-up (November 2026).
//
// The contract: text 1 is the October link text, unchanged and the default.
// Text 2 asks for a call two hours later, lands only between 10am and 8pm, and
// goes ONLY to a lead who is still silent when it is due. Once sent, the
// thread is in call mode so a time in the reply books a callback.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FOLLOWUP_KIND,
  followUpSendWall,
  followUpSender,
  followUpSkipReason,
  planLeadFollowUp,
  smsLeadFollowUp,
} from './lead-followup.js';
import { welcomeMode } from './call-booking.js';
import { drainOutbox, type OutboxStore } from './notification-drain.js';
import { smsLeadWelcome, torontoInstant } from './notifications.js';
import { torontoWallClock } from './scheduling.js';

const at = (date: string, time: string) => torontoInstant(date, time);

// ─── Which first text ─────────────────────────────────────────────────────────

test('the link text is the default first text; LEAD_WELCOME_MODE=call restores the call opener', () => {
  assert.equal(welcomeMode({} as NodeJS.ProcessEnv), 'link');
  assert.equal(welcomeMode({ LEAD_WELCOME_MODE: '' } as NodeJS.ProcessEnv), 'link');
  assert.equal(welcomeMode({ LEAD_WELCOME_MODE: 'link' } as NodeJS.ProcessEnv), 'link');
  assert.equal(welcomeMode({ LEAD_WELCOME_MODE: ' Call ' } as NodeJS.ProcessEnv), 'call');
});

test('text 1 is the October link text, word for word', () => {
  assert.equal(
    smsLeadWelcome({
      leadId: 'l1', name: 'Sarah Lee', phone: '6475550100',
      bookingUrl: 'https://ontarioreno.ca/consultation/basement', senderName: 'Michael',
    }),
    'Hi Sarah, this is Michael from OntarioReno about your basement. To get started, book your free in-home consultation here: https://ontarioreno.ca/consultation/basement'
  );
});

// ─── Text 2: wording ──────────────────────────────────────────────────────────

test('text 2 wording, signed by the same name as text 1', () => {
  const body = smsLeadFollowUp({ name: 'Sarah Lee', senderName: 'Michael' });
  assert.equal(body, 'Hi Sarah, Michael again. If a quick call is easier than the form, what time works today or tomorrow?');
  assert.ok(body.length <= 160, 'one SMS segment');
  assert.ok(!/[–—]/.test(body), 'no dashes');
  assert.equal(smsLeadFollowUp({ name: '', senderName: 'Michael' }).slice(0, 18), 'Hi, Michael again.');
  assert.equal(followUpSender(body), 'Michael');
  assert.equal(followUpSender('Hi, Mark again. If a quick call'), 'Mark');
});

// ─── Text 2: timing ───────────────────────────────────────────────────────────

test('text 2 waits two hours, inside 10am to 8pm only', () => {
  assert.equal(followUpSendWall(at('2026-11-27', '14:01')), '2026-11-27T16:01');
  assert.equal(followUpSendWall(at('2026-11-27', '17:59')), '2026-11-27T19:59');
  // Would land at 8pm or later: next morning at 10.
  assert.equal(followUpSendWall(at('2026-11-27', '18:00')), '2026-11-28T10:00');
  assert.equal(followUpSendWall(at('2026-11-27', '20:30')), '2026-11-28T10:00');
  // Overnight lead: 10am that morning.
  assert.equal(followUpSendWall(at('2026-11-28', '01:15')), '2026-11-28T10:00');
  assert.equal(followUpSendWall(at('2026-11-28', '07:59')), '2026-11-28T10:00');
  assert.equal(followUpSendWall(at('2026-11-28', '08:00')), '2026-11-28T10:00');
  assert.equal(followUpSendWall(at('2026-11-28', '08:30')), '2026-11-28T10:30');
});

test('the planned row is keyed to the lead and expires at 8pm on its send day', () => {
  const [row] = planLeadFollowUp(
    { leadId: 'lead1', name: 'Sarah', phone: '6475550100', senderName: 'Michael' },
    at('2026-11-27', '14:01')
  );
  assert.equal(row.kind, FOLLOWUP_KIND);
  assert.equal(row.idempotencyKey, 'lead1:sms:lead_followup');
  assert.equal(torontoWallClock(new Date(row.sendAfter)).slice(0, 16), '2026-11-27T16:01');
  assert.equal(torontoWallClock(new Date(row.expiresAt)).slice(0, 16), '2026-11-27T20:00');
  assert.deepEqual(planLeadFollowUp({ leadId: 'x', name: 'A', phone: ' ', senderName: 'Michael' }), []);
});

// ─── Text 2: only to a silent lead ────────────────────────────────────────────

type World = {
  lead?: Record<string, unknown> | null;
  thread?: boolean;
  replies?: string[];
  appointments?: string[];
  throws?: boolean;
};

const LEAD_CREATED = new Date('2026-11-27T19:00:00Z');

function world(w: World = {}) {
  const created: Array<Record<string, unknown>> = [];
  const lead =
    w.lead === null
      ? null
      : { id: 'lead1', phone: '+1 (647) 555-0100', status: 'new', appointmentId: null, deletedAt: null, createdAt: LEAD_CREATED, ...w.lead };
  let thread = Boolean(w.thread);
  const store = {
    lead: {
      findUnique: async () => {
        if (w.throws) throw new Error('db down');
        return lead;
      },
    },
    leadConversation: {
      findUnique: async () => (thread ? { id: 'c1' } : null),
      create: async (args: { data: Record<string, unknown> }) => {
        thread = true;
        created.push(args.data);
        return { id: 'c1', ...args.data };
      },
    },
    smsReply: { findMany: async () => (w.replies ?? []).map((fromNumber) => ({ fromNumber })) },
    appointment: {
      findMany: async () => (w.appointments ?? []).map((phone) => ({ phone })),
      findUnique: async () => null,
    },
  };
  return { store, created };
}

const ROW = { leadId: 'lead1', recipient: '6475550100' };

test('a silent lead gets text 2', async () => {
  assert.equal(await followUpSkipReason(world().store, ROW), null);
  // A reply or booking from a DIFFERENT number does not count.
  assert.equal(await followUpSkipReason(world({ replies: ['+14165550199'], appointments: ['905-555-0100'] }).store, ROW), null);
});

test('anyone who booked, replied or was picked up does not', async () => {
  assert.equal(await followUpSkipReason(world({ appointments: ['647.555.0100'] }).store, ROW), 'lead_booked');
  assert.equal(await followUpSkipReason(world({ replies: ['+16475550100'] }).store, ROW), 'lead_replied');
  assert.equal(await followUpSkipReason(world({ thread: true }).store, ROW), 'lead_replied');
  assert.equal(await followUpSkipReason(world({ lead: { status: 'attempting' } }).store, ROW), 'lead_already_worked');
  assert.equal(await followUpSkipReason(world({ lead: { status: 'callback_scheduled' } }).store, ROW), 'lead_already_worked');
  assert.equal(await followUpSkipReason(world({ lead: { appointmentId: 'a1' } }).store, ROW), 'lead_already_worked');
  assert.equal(await followUpSkipReason(world({ lead: { deletedAt: new Date() } }).store, ROW), 'lead_gone');
  assert.equal(await followUpSkipReason(world({ lead: null }).store, ROW), 'lead_gone');
});

test('when the check cannot answer, text 2 is not sent', async () => {
  assert.equal(await followUpSkipReason(world({ throws: true }).store, ROW), 'followup_check_failed');
  assert.equal(await followUpSkipReason({}, ROW), 'followup_check_unavailable');
  assert.equal(await followUpSkipReason(world().store, { leadId: null, recipient: '6475550100' }), 'followup_check_unavailable');
});

// ─── Through the drain ────────────────────────────────────────────────────────

function drainStore(w: World) {
  const { store, created } = world(w);
  const updates: Array<Record<string, unknown>> = [];
  let state = 'pending';
  const row = {
    id: 'o1', channel: 'sms', kind: FOLLOWUP_KIND, leadId: 'lead1', recipient: '6475550100',
    subject: '', body: smsLeadFollowUp({ name: 'Sarah', senderName: 'Michael' }), attempts: 0, expiresAt: '',
  };
  const prisma = {
    ...store,
    notificationOutbox: {
      findMany: async () => (state === 'pending' ? [row] : []),
      update: async (args: { data: Record<string, unknown> }) => {
        state = String(args.data.state ?? state);
        updates.push(args.data);
        return null;
      },
      updateMany: async (args: { where: { id?: string; state?: string }; data: { state: string } }) => {
        if (!args.where.id) return { count: 0 };
        if (state !== args.where.state) return { count: 0 };
        state = args.data.state;
        return { count: 1 };
      },
    },
  };
  return { prisma: prisma as unknown as OutboxStore, updates, created };
}

const PROD = {
  VERCEL_ENV: 'production', TWILIO_ACCOUNT_SID: 'AC_test', TWILIO_AUTH_TOKEN: 't', TWILIO_FROM_NUMBER: '+16475585900',
} as unknown as NodeJS.ProcessEnv;

test('drain: a silent lead is texted and the thread opens in call mode, signed Michael', async (t) => {
  const sent: string[] = [];
  t.mock.method(globalThis, 'fetch', async (_url: string, init: { body: string }) => {
    sent.push(new URLSearchParams(init.body).get('Body') ?? '');
    return new Response(JSON.stringify({ sid: 'SM1' }), { status: 201 });
  });
  const { prisma, updates, created } = drainStore({});
  const summary = await drainOutbox(prisma, 25, PROD);
  assert.equal(summary.sent, 1);
  assert.equal(sent[0], 'Hi Sarah, Michael again. If a quick call is easier than the form, what time works today or tomorrow?');
  assert.equal(updates.at(-1)?.state, 'sent');
  assert.equal(created.length, 1);
  assert.equal(created[0].mode, 'call');
  assert.equal(created[0].phase, 'awaiting_time_choice');
  assert.equal(created[0].sender, 'Michael');
  assert.equal(created[0].lastOutbound, sent[0]);
  assert.equal(created[0].phoneKey, '6475550100');
});

test('drain: a lead who booked through the form is never texted', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response('{}', { status: 201 }));
  const { prisma, updates, created } = drainStore({ appointments: ['+16475550100'] });
  const summary = await drainOutbox(prisma, 25, PROD);
  assert.equal(fetchMock.mock.callCount(), 0);
  assert.equal(summary.sent, 0);
  assert.equal(summary.suppressed, 1);
  assert.deepEqual([updates[0].state, updates[0].stateReason], ['suppressed', 'lead_booked']);
  assert.equal(created.length, 0);
});

test('drain: a failed send opens no thread', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ code: 21211, message: 'bad' }), { status: 400 }));
  const { prisma, created } = drainStore({});
  const summary = await drainOutbox(prisma, 25, PROD);
  assert.equal(summary.failed, 1);
  assert.equal(created.length, 0);
});
