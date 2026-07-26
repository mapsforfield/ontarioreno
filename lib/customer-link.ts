import { createHmac, timingSafeEqual } from 'node:crypto';

// ─── Signed customer action links ─────────────────────────────────────────────
// Customer reschedule/cancel links used to authorize on the appointment id alone,
// which meant anyone who knew (or guessed) a cuid could mutate a real booking.
// Links are now signed with a secret that never reaches the browser, so
// possessing the emailed link — not knowing an id — is what grants authority.
//
// Token layout: `<expEpochSeconds>.<base64url(HMAC-SHA256(secret, "<id>.<exp>"))>`
// The expiry is inside the signed payload, so it cannot be extended by editing
// the URL. Stateless by design: no table, no schema change, no lookup.

/** Query-string parameter carrying the signed token on customer action links. */
export const CUSTOMER_LINK_PARAM = 't';

/**
 * Default lifetime of a customer action link (90 days).
 * Consultations are routinely booked weeks out and confirmation emails are sent
 * at booking time, so the token must comfortably outlive the appointment itself.
 */
export const DEFAULT_CUSTOMER_LINK_TTL_SECONDS = 60 * 60 * 24 * 90;

export type CustomerLinkFailure =
  /** CUSTOMER_LINK_SECRET is not set — fail closed, never fall back to unsigned. */
  | 'not_configured'
  | 'missing'
  | 'malformed'
  | 'expired'
  | 'invalid';

export type CustomerLinkResult =
  | { ok: true; expiresAt: number }
  | { ok: false; reason: CustomerLinkFailure };

function getSecret(): string | null {
  const secret = process.env.CUSTOMER_LINK_SECRET;
  return typeof secret === 'string' && secret.length > 0 ? secret : null;
}

/** True when link signing is available. Callers must fail closed when false. */
export function isCustomerLinkConfigured(): boolean {
  return getSecret() !== null;
}

function base64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function mac(secret: string, appointmentId: string, exp: number): string {
  return base64url(
    createHmac('sha256', secret).update(`${appointmentId}.${exp}`).digest()
  );
}

/**
 * Mint a signed token for one appointment. Throws when the secret is missing —
 * callers must surface that as a server error rather than emit an unsigned link.
 */
export function signCustomerLinkToken(
  appointmentId: string,
  ttlSeconds: number = DEFAULT_CUSTOMER_LINK_TTL_SECONDS,
  nowMs: number = Date.now()
): string {
  const secret = getSecret();
  if (!secret) throw new Error('CUSTOMER_LINK_SECRET is not configured.');
  if (!appointmentId) throw new Error('appointmentId is required to sign a customer link.');
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be a positive number.');
  }
  const exp = Math.floor(nowMs / 1000) + Math.floor(ttlSeconds);
  return `${exp}.${mac(secret, appointmentId, exp)}`;
}

/**
 * Verify a token against the appointment it claims to authorize.
 *
 * The signature is checked BEFORE the expiry so a forged token can never be
 * reported as merely 'expired' — that distinction would tell an attacker their
 * guess had a well-formed shape.
 */
export function verifyCustomerLinkToken(
  appointmentId: string,
  token: unknown,
  nowMs: number = Date.now()
): CustomerLinkResult {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: 'not_configured' };
  if (!appointmentId) return { ok: false, reason: 'invalid' };
  if (typeof token !== 'string' || token.length === 0) {
    return { ok: false, reason: 'missing' };
  }

  const sep = token.indexOf('.');
  if (sep <= 0 || sep === token.length - 1) return { ok: false, reason: 'malformed' };
  const expRaw = token.slice(0, sep);
  const provided = token.slice(sep + 1);
  // Bounded digits: keeps Number() away from precision loss and rejects padding.
  if (!/^\d{1,15}$/.test(expRaw)) return { ok: false, reason: 'malformed' };

  const exp = Number(expRaw);
  const expected = mac(secret, appointmentId, exp);
  const expectedBuf = Buffer.from(expected, 'utf8');
  const providedBuf = Buffer.from(provided, 'utf8');
  // timingSafeEqual throws on length mismatch; the expected MAC is fixed-length
  // base64url, so comparing lengths first leaks nothing useful.
  if (expectedBuf.length !== providedBuf.length) return { ok: false, reason: 'invalid' };
  if (!timingSafeEqual(expectedBuf, providedBuf)) return { ok: false, reason: 'invalid' };

  if (Math.floor(nowMs / 1000) >= exp) return { ok: false, reason: 'expired' };
  return { ok: true, expiresAt: exp };
}

/** Path (no origin) for a signed customer action link. */
export function customerActionPath(
  action: 'reschedule' | 'cancel',
  appointmentId: string,
  token: string
): string {
  return `/portal/consultation/${encodeURIComponent(appointmentId)}/${action}?${CUSTOMER_LINK_PARAM}=${encodeURIComponent(token)}`;
}

/** Both signed customer action URLs for an appointment, sharing one token. */
export function buildCustomerActionUrls(
  origin: string,
  appointmentId: string,
  ttlSeconds: number = DEFAULT_CUSTOMER_LINK_TTL_SECONDS,
  nowMs: number = Date.now()
): { rescheduleUrl: string; cancelUrl: string; expiresAt: number } {
  const token = signCustomerLinkToken(appointmentId, ttlSeconds, nowMs);
  const base = origin.replace(/\/+$/, '');
  return {
    rescheduleUrl: `${base}${customerActionPath('reschedule', appointmentId, token)}`,
    cancelUrl: `${base}${customerActionPath('cancel', appointmentId, token)}`,
    expiresAt: Math.floor(nowMs / 1000) + Math.floor(ttlSeconds),
  };
}
