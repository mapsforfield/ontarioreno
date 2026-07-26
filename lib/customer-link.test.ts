import test from 'node:test';
import assert from 'node:assert/strict';

// The module reads CUSTOMER_LINK_SECRET lazily, so set it before importing.
process.env.CUSTOMER_LINK_SECRET = 'test-secret-for-customer-links';

const {
  signCustomerLinkToken,
  verifyCustomerLinkToken,
  buildCustomerActionUrls,
  isCustomerLinkConfigured,
  CUSTOMER_LINK_PARAM,
} = await import('./customer-link.ts');

const APPT = 'clx0000000000000000000001';
const OTHER = 'clx0000000000000000000002';
const NOW = 1_700_000_000_000; // fixed instant so expiry tests are deterministic

test('a freshly signed token verifies for its own appointment', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const result = verifyCustomerLinkToken(APPT, token, NOW);
  assert.equal(result.ok, true);
});

test('a token is not valid for a different appointment', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const result = verifyCustomerLinkToken(OTHER, token, NOW);
  assert.deepEqual(result, { ok: false, reason: 'invalid' });
});

test('a token is rejected once expired', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const result = verifyCustomerLinkToken(APPT, token, NOW + 3601 * 1000);
  assert.deepEqual(result, { ok: false, reason: 'expired' });
});

test('a token is still valid one second before expiry', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const result = verifyCustomerLinkToken(APPT, token, NOW + 3599 * 1000);
  assert.equal(result.ok, true);
});

test('the expiry cannot be extended by editing the URL', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const mac = token.slice(token.indexOf('.') + 1);
  const farFuture = Math.floor(NOW / 1000) + 999_999;
  const tampered = `${farFuture}.${mac}`;
  // The exp is inside the signed payload, so a rewritten exp fails the MAC —
  // and must report 'invalid', never 'expired'.
  assert.deepEqual(verifyCustomerLinkToken(APPT, tampered, NOW), {
    ok: false,
    reason: 'invalid',
  });
});

test('a tampered signature is rejected', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const sep = token.indexOf('.');
  const mac = token.slice(sep + 1);
  const flipped = (mac[0] === 'A' ? 'B' : 'A') + mac.slice(1);
  const tampered = `${token.slice(0, sep)}.${flipped}`;
  assert.deepEqual(verifyCustomerLinkToken(APPT, tampered, NOW), {
    ok: false,
    reason: 'invalid',
  });
});

test('a truncated signature is rejected rather than throwing', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  const sep = token.indexOf('.');
  const truncated = `${token.slice(0, sep)}.${token.slice(sep + 1, sep + 5)}`;
  assert.deepEqual(verifyCustomerLinkToken(APPT, truncated, NOW), {
    ok: false,
    reason: 'invalid',
  });
});

test('missing and malformed tokens are distinguished', () => {
  assert.deepEqual(verifyCustomerLinkToken(APPT, undefined, NOW), { ok: false, reason: 'missing' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, '', NOW), { ok: false, reason: 'missing' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'no-separator', NOW), { ok: false, reason: 'malformed' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, '.abc', NOW), { ok: false, reason: 'malformed' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, '123.', NOW), { ok: false, reason: 'malformed' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'notanumber.abc', NOW), { ok: false, reason: 'malformed' });
});

test('a non-string token cannot impersonate a signature', () => {
  assert.equal(verifyCustomerLinkToken(APPT, { toString: () => 'x' }, NOW).ok, false);
  assert.equal(verifyCustomerLinkToken(APPT, 12345, NOW).ok, false);
  assert.equal(verifyCustomerLinkToken(APPT, null, NOW).ok, false);
});

test('an empty appointment id is never authorized', () => {
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  assert.deepEqual(verifyCustomerLinkToken('', token, NOW), { ok: false, reason: 'invalid' });
});

test('built URLs carry the token and point at both actions', () => {
  const urls = buildCustomerActionUrls('https://example.test/', APPT, 3600, NOW);
  assert.match(urls.rescheduleUrl, /\/portal\/consultation\/.+\/reschedule\?t=/);
  assert.match(urls.cancelUrl, /\/portal\/consultation\/.+\/cancel\?t=/);
  // No double slash from the trailing slash on the supplied origin.
  assert.ok(!urls.rescheduleUrl.includes('.test//'));

  const token = new URL(urls.rescheduleUrl).searchParams.get(CUSTOMER_LINK_PARAM);
  assert.equal(verifyCustomerLinkToken(APPT, token, NOW).ok, true);
});

test('both action URLs share one token', () => {
  const urls = buildCustomerActionUrls('https://example.test', APPT, 3600, NOW);
  const a = new URL(urls.rescheduleUrl).searchParams.get(CUSTOMER_LINK_PARAM);
  const b = new URL(urls.cancelUrl).searchParams.get(CUSTOMER_LINK_PARAM);
  assert.equal(a, b);
});

test('signing rejects an empty appointment id or non-positive ttl', () => {
  assert.throws(() => signCustomerLinkToken('', 3600, NOW));
  assert.throws(() => signCustomerLinkToken(APPT, 0, NOW));
  assert.throws(() => signCustomerLinkToken(APPT, -1, NOW));
});

test('verification fails closed when the secret is absent', async () => {
  const saved = process.env.CUSTOMER_LINK_SECRET;
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  delete process.env.CUSTOMER_LINK_SECRET;
  try {
    assert.equal(isCustomerLinkConfigured(), false);
    assert.deepEqual(verifyCustomerLinkToken(APPT, token, NOW), {
      ok: false,
      reason: 'not_configured',
    });
    assert.throws(() => signCustomerLinkToken(APPT, 3600, NOW));
  } finally {
    process.env.CUSTOMER_LINK_SECRET = saved;
  }
});

test('a token signed under a different secret is rejected', () => {
  const saved = process.env.CUSTOMER_LINK_SECRET;
  const token = signCustomerLinkToken(APPT, 3600, NOW);
  process.env.CUSTOMER_LINK_SECRET = 'a-completely-different-secret';
  try {
    assert.deepEqual(verifyCustomerLinkToken(APPT, token, NOW), {
      ok: false,
      reason: 'invalid',
    });
  } finally {
    process.env.CUSTOMER_LINK_SECRET = saved;
  }
});
