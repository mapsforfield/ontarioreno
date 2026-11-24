import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldWelcomeReturningLead, type ReturningLeadFacts } from './returning-lead.js';

const now = new Date('2026-11-24T00:10:00Z');
// Nekiya Osman: first seen 31 Aug, came back through the basement form on 23 Nov.
const nekiya: ReturningLeadFacts = {
  status: 'new',
  phone: 'p:+16475501918',
  createdAt: new Date('2026-08-31T21:47:35Z'),
  fillAt: new Date('2026-11-24T00:07:04Z'),
  hasConversation: false,
  hadWelcome: false,
  now,
};

test('an old, unworked lead filling a new form gets the opener', () => {
  assert.equal(shouldWelcomeReturningLead(nekiya), true);
});

test('a webhook retry of a brand-new lead stays a plain merge', () => {
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, createdAt: new Date('2026-11-24T00:07:30Z') }), false);
});

test('a sheet re-sync of an old row never texts', () => {
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, fillAt: new Date('2026-09-01T00:00:00Z') }), false);
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, fillAt: null }), false);
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, fillAt: new Date('nope') }), false);
});

test('a worked or dispositioned lead is left alone', () => {
  for (const status of ['attempting', 'callback_scheduled', 'booked', 'lost', 'dead', 'duplicate']) {
    assert.equal(shouldWelcomeReturningLead({ ...nekiya, status }), false, status);
  }
});

test('no phone, an existing thread, or a past welcome means no second opener', () => {
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, phone: '' }), false);
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, hasConversation: true }), false);
  assert.equal(shouldWelcomeReturningLead({ ...nekiya, hadWelcome: true }), false);
});
