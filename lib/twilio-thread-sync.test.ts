// The dedupe rules, which are the only place this can do damage: a sync that
// re-imports what the portal already sent shows a thread saying everything
// twice, and a sync that skips a hand-sent message leaves lastOutbound wrong —
// the bug the whole module exists to fix.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { missingFromThread, type SyncableMessage } from './twilio-thread-sync.js';

const remote = (sid: string, direction: 'in' | 'out', body: string): SyncableMessage => ({
  messageSid: sid,
  direction,
  body,
  sentAt: new Date('2026-08-28T12:00:00Z'),
});

test('imports a message sent from the Twilio dashboard', () => {
  const out = missingFromThread(
    [remote('SM1', 'out', 'We have Thursday at 6pm available for Sept 3rd, does that work?')],
    [{ messageSid: null, body: 'Hi Syed, this is Michael', direction: 'out' }]
  );
  assert.equal(out.length, 1);
  assert.equal(out[0].messageSid, 'SM1');
});

test('does not re-import what the portal itself sent, which carries no SID', () => {
  const body = 'Weekdays or weekends?';
  const out = missingFromThread(
    [remote('SM2', 'out', body)],
    [{ messageSid: null, body, direction: 'out' }]
  );
  assert.equal(out.length, 0);
});

test('does not re-import an inbound the webhook already recorded by SID', () => {
  const out = missingFromThread(
    [remote('SM3', 'in', 'Weekend any time')],
    [{ messageSid: 'SM3', body: 'Weekend any time', direction: 'in' }]
  );
  assert.equal(out.length, 0);
});

test('keeps an identical body sent in the other direction', () => {
  // "yes" from us and "yes" from them are different events; matching on body
  // alone would silently drop one of them.
  const out = missingFromThread(
    [remote('SM4', 'in', 'yes')],
    [{ messageSid: null, body: 'yes', direction: 'out' }]
  );
  assert.equal(out.length, 1);
});
