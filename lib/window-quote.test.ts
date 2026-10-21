import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isQuoteFileKey,
  normalizePostalCode,
  parseWindowQuote,
  quoteFileKey,
  windowQuoteAlert,
  windowQuoteNotes,
  windowQuoteSourceDetail,
  WINDOW_CONSENT_TEXT,
} from './window-quote.js';

const UUID = '3f1c2b9e-8d7a-4c6b-9e5f-1a2b3c4d5e6f';

const contact = {
  name: 'Pat Homeowner',
  phone: '(905) 555-0142',
  email: 'Pat@Example.com',
  postalCode: 'l1s2t6',
  consent: true,
};

const goodFile = { key: quoteFileKey(UUID, 'Quote March.pdf'), name: 'Quote March.pdf', size: 120_000, type: 'application/pdf' };

test('postal codes normalise, and non-Canadian ones are rejected', () => {
  assert.equal(normalizePostalCode('l1s2t6'), 'L1S 2T6');
  assert.equal(normalizePostalCode(' M5V-2T6 '), 'M5V 2T6');
  assert.equal(normalizePostalCode('90210'), '');
  // D, F, I, O, Q, U never start a Canadian postal code.
  assert.equal(normalizePostalCode('D1S 2T6'), '');
});

test('path A needs at least one file', () => {
  const r = parseWindowQuote({ ...contact, path: 'upload', files: [] });
  assert.equal(r.ok, false);
});

test('path A accepts a presign-issued key', () => {
  const r = parseWindowQuote({ ...contact, path: 'upload', files: [goodFile] });
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.email, 'pat@example.com');
    assert.equal(r.value.postalCode, 'L1S 2T6');
    assert.equal(r.value.files.length, 1);
  }
});

test('a key outside window-quotes/ can never be attached to a lead', () => {
  for (const key of [
    `finance/abc/${UUID}-dl.jpg`,
    `clients/x/${UUID}.mp4`,
    `window-quotes/${UUID}/../finance/x.pdf`,
    `window-quotes/not-a-uuid/quote.pdf`,
    `window-quotes/${UUID}/sub/quote.pdf`,
  ]) {
    assert.equal(isQuoteFileKey(key), false, key);
    const r = parseWindowQuote({ ...contact, path: 'upload', files: [{ ...goodFile, key }] });
    assert.equal(r.ok, false, key);
  }
});

test('wrong file type or oversize file is rejected', () => {
  assert.equal(parseWindowQuote({ ...contact, path: 'upload', files: [{ ...goodFile, type: 'text/html' }] }).ok, false);
  assert.equal(parseWindowQuote({ ...contact, path: 'upload', files: [{ ...goodFile, size: 11 * 1024 * 1024 }] }).ok, false);
});

test('path B needs all three sizing answers from the fixed lists', () => {
  const base = { ...contact, path: 'request', windows: '6-10', doors: '1', timeline: 'ASAP' };
  assert.ok(parseWindowQuote(base).ok);
  assert.equal(parseWindowQuote({ ...base, windows: '7' }).ok, false);
  assert.equal(parseWindowQuote({ ...base, doors: '' }).ok, false);
  assert.equal(parseWindowQuote({ ...base, timeline: 'tomorrow' }).ok, false);
});

test('consent must be an explicit true, never assumed', () => {
  for (const consent of [undefined, false, 'true', 1]) {
    assert.equal(parseWindowQuote({ ...contact, consent, path: 'request', windows: '1-5', doors: '0', timeline: 'ASAP' }).ok, false);
  }
});

test('phone and email are both required', () => {
  const base = { ...contact, path: 'request', windows: '1-5', doors: '0', timeline: 'ASAP' };
  assert.equal(parseWindowQuote({ ...base, phone: '555-0142' }).ok, false);
  assert.equal(parseWindowQuote({ ...base, email: 'not-an-email' }).ok, false);
});

test('sourceDetail carries the path and every tag, so a referral ref is searchable', () => {
  const r = parseWindowQuote({
    ...contact, path: 'upload', files: [goodFile],
    tracking: { utmSource: 'facebook', utmCampaign: 'beat-my-quote', ref: 'partner-ajax' },
  });
  assert.ok(r.ok);
  if (!r.ok) return;
  const detail = windowQuoteSourceDetail(r.value);
  assert.match(detail, /^Windows \(\/windows\) · Has a quote/);
  assert.match(detail, /utm_source=facebook/);
  assert.match(detail, /utm_campaign=beat-my-quote/);
  assert.match(detail, /ref=partner-ajax/);
});

test('notes record the consent wording and when it was given', () => {
  const r = parseWindowQuote({ ...contact, path: 'request', windows: '11-20', doors: '2', timeline: '1-3 months' });
  assert.ok(r.ok);
  if (!r.ok) return;
  const notes = windowQuoteNotes(r.value, '2026-10-20T15:00:00.000Z');
  assert.ok(notes.includes(WINDOW_CONSENT_TEXT));
  assert.ok(notes.includes('2026-10-20T15:00:00.000Z'));
  assert.match(notes, /Windows: 11-20/);
});

test('the alert links each file through the login-gated link, never a raw bucket URL', () => {
  const r = parseWindowQuote({ ...contact, path: 'upload', files: [goodFile, { ...goodFile, name: 'page2.jpg', type: 'image/jpeg' }] });
  assert.ok(r.ok);
  if (!r.ok) return;
  const alert = windowQuoteAlert(r.value, 'lead_1', (i) => `https://ontarioreno.ca/api/leads?quote_file=1&lead=lead_1&i=${i}`);
  assert.match(alert.subject, /^Window quote to beat: Pat Homeowner/);
  assert.match(alert.body, /i=0/);
  assert.match(alert.body, /i=1/);
  assert.doesNotMatch(alert.body, /r2\.cloudflarestorage\.com/);
});

test('no em dashes in anything the form shows or sends', () => {
  const r = parseWindowQuote({ ...contact, path: 'request', windows: '1-5', doors: '0', timeline: 'ASAP' });
  assert.ok(r.ok);
  if (!r.ok) return;
  const alert = windowQuoteAlert(r.value, 'lead_1', () => '');
  for (const text of [WINDOW_CONSENT_TEXT, alert.subject, alert.body]) assert.doesNotMatch(text, /—/);
});
