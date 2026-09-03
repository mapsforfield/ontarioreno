/**
 * The Twilio REST → dashboard-UI translation.
 *
 * These are not shape-for-shape tests of trivial code. The dashboard was
 * written against the `twilio` SDK's camelCase objects and now reads raw REST
 * snake_case, and every mistake in that mapping FAILS SILENTLY: a wrong key
 * yields `undefined`, which renders as an empty bubble or "Invalid Date"
 * rather than an error anyone would see in a log.
 *
 * The payloads below are real Twilio REST shapes, including the RFC-2822 dates
 * the API actually returns — not ISO strings, which is the mistake that would
 * otherwise sail through a hand-written fixture.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conversationKey,
  mediaProxyUrl,
  mergeMessagesBySid,
  normalizeMedia,
  normalizeMessage,
  sortMessagesNewestFirst,
} from './twilio-dashboard.js';

const OUR_NUMBER = '+16475585900';

/** A message exactly as the REST API returns one. */
const restRow = (over: Record<string, unknown> = {}) => ({
  sid: 'SM1',
  from: OUR_NUMBER,
  to: '+14375804198',
  body: 'Hi Richard, your site visit is confirmed.',
  direction: 'outbound-api',
  status: 'delivered',
  date_sent: 'Mon, 01 Sep 2026 19:57:00 +0000',
  date_created: 'Mon, 01 Sep 2026 19:56:58 +0000',
  num_media: '0',
  ...over,
});

test('a REST row keeps its body, its parties and its status', () => {
  const m = normalizeMessage(restRow());

  assert.equal(m.sid, 'SM1');
  assert.equal(m.from, OUR_NUMBER);
  assert.equal(m.to, '+14375804198');
  assert.equal(m.body, 'Hi Richard, your site visit is confirmed.');
  assert.equal(m.status, 'delivered');
  // An empty body would render as a blank bubble and look like a UI bug.
  assert.ok(m.body.length > 0);
});

test('the date is read from snake_case and stays parseable', () => {
  const m = normalizeMessage(restRow());

  assert.equal(m.dateSent, 'Mon, 01 Sep 2026 19:57:00 +0000');
  // The UI does `new Date(msg.dateSent)`. RFC 2822 must survive that, or every
  // timestamp in the thread reads "Invalid Date".
  assert.ok(Number.isFinite(new Date(m.dateSent!).getTime()));
});

test('a queued message with no date_sent falls back to date_created', () => {
  // Twilio leaves date_sent null until the message actually goes out. Without
  // the fallback a just-sent text sorts to the epoch and drops to the bottom
  // of the thread the moment the rep hits Send.
  const m = normalizeMessage(restRow({ date_sent: null, status: 'queued' }));

  assert.equal(m.dateSent, 'Mon, 01 Sep 2026 19:56:58 +0000');
  assert.ok(Number.isFinite(new Date(m.dateSent!).getTime()));
});

test('num_media arrives as a string and becomes a number', () => {
  // REST sends "2", the SDK sent 2. The handler skips media fetching on a
  // falsy value, and the string "0" is truthy — so getting this wrong means
  // an attachment fetch on every text-only message in the log.
  const none = normalizeMessage(restRow({ num_media: '0' }));
  const some = normalizeMessage(restRow({ num_media: '2' }));

  assert.equal(none.numMedia, 0);
  assert.equal(some.numMedia, 2);
  assert.equal(typeof none.numMedia, 'number');
});

test('a row missing every optional field still produces a usable message', () => {
  const m = normalizeMessage({ sid: 'SM9' });

  assert.equal(m.sid, 'SM9');
  assert.equal(m.body, '');
  assert.equal(m.dateSent, null);
  assert.equal(m.numMedia, 0);
  // Never the string "undefined" — that would be rendered to a rep verbatim.
  assert.equal(m.from, '');
});

test('messages sort newest first', () => {
  const older = normalizeMessage(restRow({ sid: 'SM1', date_sent: 'Mon, 01 Sep 2026 15:29:00 +0000' }));
  const newer = normalizeMessage(restRow({ sid: 'SM2', date_sent: 'Mon, 01 Sep 2026 19:57:00 +0000' }));

  assert.deepEqual(
    sortMessagesNewestFirst([older, newer]).map((m) => m.sid),
    ['SM2', 'SM1']
  );
});

test('a message returned by both direction queries appears once', () => {
  // The From=us and To=us calls both return anything we sent to our own
  // number. Merging by SID is what stops it rendering twice.
  const row = normalizeMessage(restRow({ sid: 'SM_DUP' }));

  const merged = mergeMessagesBySid([row, { ...row }]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].sid, 'SM_DUP');
});

test('merging keeps every distinct message and orders it', () => {
  const a = normalizeMessage(restRow({ sid: 'SM1', date_sent: 'Mon, 01 Sep 2026 15:29:00 +0000' }));
  const b = normalizeMessage(restRow({ sid: 'SM2', date_sent: 'Mon, 01 Sep 2026 19:57:00 +0000' }));
  const c = normalizeMessage(restRow({ sid: 'SM3', date_sent: 'Sun, 31 Aug 2026 09:06:00 +0000' }));

  assert.deepEqual(
    mergeMessagesBySid([a, c, b]).map((m) => m.sid),
    ['SM2', 'SM1', 'SM3']
  );
});

test('a message with no date at all does not break the sort', () => {
  const dated = normalizeMessage(restRow({ sid: 'SM1' }));
  const undatedRow = normalizeMessage({ sid: 'SM2' });

  const merged = mergeMessagesBySid([undatedRow, dated]);

  assert.equal(merged.length, 2);
  assert.equal(merged[0].sid, 'SM1');
});

test('a conversation is keyed by the other party, whichever way it went', () => {
  const outbound = normalizeMessage(restRow({ from: OUR_NUMBER, to: '+14375804198' }));
  const inbound = normalizeMessage(restRow({ from: '+14375804198', to: OUR_NUMBER }));

  // Both halves of one thread must land under the same contact, or the
  // homeowner's reply opens a second conversation beside the one it answers.
  assert.equal(conversationKey(outbound, OUR_NUMBER), '+14375804198');
  assert.equal(conversationKey(inbound, OUR_NUMBER), '+14375804198');
});

test('attachments are served through our own proxy, never Twilio directly', () => {
  const media = normalizeMedia('SM1', [
    { sid: 'ME1', content_type: 'image/jpeg' },
  ]);

  assert.equal(media.length, 1);
  assert.equal(media[0].contentType, 'image/jpeg');
  // A raw api.twilio.com URL here would leave a homeowner's photo readable by
  // anyone who ever saw the link, with no portal session required.
  assert.ok(media[0].url.startsWith('/api/twilio?resource=media'));
  assert.ok(!media[0].url.includes('api.twilio.com'));
});

test('sids are escaped into the media URL', () => {
  const url = mediaProxyUrl('SM&evil=1', 'ME 2');

  assert.ok(url.includes('messageSid=SM%26evil%3D1'));
  assert.ok(url.includes('mediaSid=ME%202'));
});
