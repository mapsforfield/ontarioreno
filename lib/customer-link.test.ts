import test from 'node:test';
import assert from 'node:assert/strict';

// The module reads CUSTOMER_LINK_SECRET lazily, so set it before importing.
process.env.CUSTOMER_LINK_SECRET = 'test-secret-for-customer-links';

const {
  signCustomerLinkToken,
  verifyCustomerLinkToken,
  buildCustomerActionUrls,
  isCustomerLinkConfigured,
  isCustomerLinkAction,
  CUSTOMER_LINK_PARAM,
} = await import('./customer-link.ts');

const APPT = 'clx0000000000000000000001';
const OTHER = 'clx0000000000000000000002';
const NOW = 1_700_000_000_000; // fixed instant so expiry tests are deterministic

// ─────────────────────────────────────────────────────────────────────────────
// The eight authorization cases. verifyCustomerLinkToken is the single gate for
// BOTH rendering the mutation UI and performing the mutation, so each case here
// is simultaneously "must not render controls" and "must not mutate".
// Preview testing found a forged token (`?t=123.abc`) rendering the full
// reschedule form because the client had gated on the mere presence of `t`.
// ─────────────────────────────────────────────────────────────────────────────

test('CASE 1 — missing token is rejected', () => {
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', undefined, NOW), { ok: false, reason: 'missing' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', '', NOW), { ok: false, reason: 'missing' });
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'cancel', null, NOW), { ok: false, reason: 'missing' });
});

test('CASE 2 — malformed token is rejected', () => {
  for (const bad of ['no-separator', '.abc', '123.', 'notanumber.abc', '..', 'abc.def.ghi']) {
    const result = verifyCustomerLinkToken(APPT, 'reschedule', bad, NOW);
    assert.equal(result.ok, false, `expected ${bad} to be rejected`);
  }
  // The exact shape reported by the failing preview test.
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', '123.abc', NOW), { ok: false, reason: 'invalid' });
});

test('CASE 3 — forged signature is rejected', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  const sep = token.indexOf('.');
  const mac = token.slice(sep + 1);
  const flipped = (mac[0] === 'A' ? 'B' : 'A') + mac.slice(1);
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', `${token.slice(0, sep)}.${flipped}`, NOW), {
    ok: false,
    reason: 'invalid',
  });
  // A token signed under a different secret is equally forged.
  const saved = process.env.CUSTOMER_LINK_SECRET;
  process.env.CUSTOMER_LINK_SECRET = 'a-completely-different-secret';
  try {
    assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', token, NOW), { ok: false, reason: 'invalid' });
  } finally {
    process.env.CUSTOMER_LINK_SECRET = saved;
  }
});

test('CASE 4 — expired token is rejected', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', token, NOW + 3601 * 1000), {
    ok: false,
    reason: 'expired',
  });
  // Still valid one second before expiry — the boundary is not off by one.
  assert.equal(verifyCustomerLinkToken(APPT, 'reschedule', token, NOW + 3599 * 1000).ok, true);
});

test('CASE 5 — token for another appointment is rejected', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  assert.deepEqual(verifyCustomerLinkToken(OTHER, 'reschedule', token, NOW), { ok: false, reason: 'invalid' });
});

test('CASE 6 — a cancel token cannot be used on reschedule', () => {
  const cancelToken = signCustomerLinkToken(APPT, 'cancel', 3600, NOW);
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', cancelToken, NOW), { ok: false, reason: 'invalid' });
});

test('CASE 7 — a reschedule token cannot be used on cancel', () => {
  const rescheduleToken = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'cancel', rescheduleToken, NOW), { ok: false, reason: 'invalid' });
});

test('CASE 8 — a valid matching token is accepted for its own action', () => {
  const reschedule = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  const cancel = signCustomerLinkToken(APPT, 'cancel', 3600, NOW);
  assert.equal(verifyCustomerLinkToken(APPT, 'reschedule', reschedule, NOW).ok, true);
  assert.equal(verifyCustomerLinkToken(APPT, 'cancel', cancel, NOW).ok, true);
});

// ─── Supporting properties ────────────────────────────────────────────────────

test('the two action tokens are different values', () => {
  const reschedule = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  const cancel = signCustomerLinkToken(APPT, 'cancel', 3600, NOW);
  assert.notEqual(reschedule, cancel, 'sharing one token across actions would allow purpose confusion');
});

test('the expiry cannot be extended by editing the URL', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  const mac = token.slice(token.indexOf('.') + 1);
  const tampered = `${Math.floor(NOW / 1000) + 999_999}.${mac}`;
  // exp is inside the signed payload, so a rewritten exp fails the MAC — and
  // must report 'invalid', never 'expired'.
  assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', tampered, NOW), { ok: false, reason: 'invalid' });
});

test('an unknown or missing action is never authorized', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  for (const bogus of ['delete', 'RESCHEDULE', '', undefined, null, 1]) {
    assert.deepEqual(verifyCustomerLinkToken(APPT, bogus, token, NOW), { ok: false, reason: 'invalid' });
  }
  assert.equal(isCustomerLinkAction('reschedule'), true);
  assert.equal(isCustomerLinkAction('cancel'), true);
  assert.equal(isCustomerLinkAction('delete'), false);
});

test('a truncated signature is rejected rather than throwing', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  const sep = token.indexOf('.');
  assert.deepEqual(
    verifyCustomerLinkToken(APPT, 'reschedule', `${token.slice(0, sep)}.${token.slice(sep + 1, sep + 5)}`, NOW),
    { ok: false, reason: 'invalid' }
  );
});

test('a non-string token cannot impersonate a signature', () => {
  for (const bogus of [{ toString: () => 'x' }, 12345, null, [], true]) {
    assert.equal(verifyCustomerLinkToken(APPT, 'reschedule', bogus, NOW).ok, false);
  }
});

test('an empty appointment id is never authorized', () => {
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  assert.deepEqual(verifyCustomerLinkToken('', 'reschedule', token, NOW), { ok: false, reason: 'invalid' });
});

test('built URLs carry action-specific tokens that verify only for their own action', () => {
  const urls = buildCustomerActionUrls('https://example.test/', APPT, 3600, NOW);
  assert.match(urls.rescheduleUrl, /\/portal\/consultation\/.+\/reschedule\?t=/);
  assert.match(urls.cancelUrl, /\/portal\/consultation\/.+\/cancel\?t=/);
  assert.ok(!urls.rescheduleUrl.includes('.test//'), 'trailing slash on origin must not double up');

  const rt = new URL(urls.rescheduleUrl).searchParams.get(CUSTOMER_LINK_PARAM);
  const ct = new URL(urls.cancelUrl).searchParams.get(CUSTOMER_LINK_PARAM);
  assert.notEqual(rt, ct);
  assert.equal(verifyCustomerLinkToken(APPT, 'reschedule', rt, NOW).ok, true);
  assert.equal(verifyCustomerLinkToken(APPT, 'cancel', ct, NOW).ok, true);
  // Cross-use must fail.
  assert.equal(verifyCustomerLinkToken(APPT, 'cancel', rt, NOW).ok, false);
  assert.equal(verifyCustomerLinkToken(APPT, 'reschedule', ct, NOW).ok, false);
});

test('signing rejects an empty appointment id, bad action, or non-positive ttl', () => {
  assert.throws(() => signCustomerLinkToken('', 'reschedule', 3600, NOW));
  assert.throws(() => signCustomerLinkToken(APPT, 'delete' as never, 3600, NOW));
  assert.throws(() => signCustomerLinkToken(APPT, 'reschedule', 0, NOW));
  assert.throws(() => signCustomerLinkToken(APPT, 'reschedule', -1, NOW));
});

test('verification fails closed when the secret is absent', () => {
  const saved = process.env.CUSTOMER_LINK_SECRET;
  const token = signCustomerLinkToken(APPT, 'reschedule', 3600, NOW);
  delete process.env.CUSTOMER_LINK_SECRET;
  try {
    assert.equal(isCustomerLinkConfigured(), false);
    assert.deepEqual(verifyCustomerLinkToken(APPT, 'reschedule', token, NOW), {
      ok: false,
      reason: 'not_configured',
    });
    assert.throws(() => signCustomerLinkToken(APPT, 'reschedule', 3600, NOW));
  } finally {
    process.env.CUSTOMER_LINK_SECRET = saved;
  }
});
