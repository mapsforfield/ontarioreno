import { createHmac, timingSafeEqual } from 'node:crypto';

// ─── Signed customer action links ─────────────────────────────────────────────
// Customer reschedule/cancel links used to authorize on the appointment id alone,
// which meant anyone who knew (or guessed) a cuid could mutate a real booking.
// Links are now signed with a secret that never reaches the browser, so
// possessing the emailed link — not knowing an id — is what grants authority.
//
// Token layout: `<expEpochSeconds>.<base64url(HMAC-SHA256(secret, "<id>.<action>.<exp>"))>`
// The expiry AND the action are inside the signed payload, so neither can be
// changed by editing the URL: a cancel token cannot authorize a reschedule, and
// an expiry cannot be extended. Stateless by design: no table, no lookup.

/** Query-string parameter carrying the signed token on customer action links. */
export const CUSTOMER_LINK_PARAM = 't';

/**
 * What a token authorizes. Bound into the signature, so a token minted for one
 * action is rejected outright on the other.
 */
export type CustomerLinkAction = 'reschedule' | 'cancel';

const ACTIONS: readonly CustomerLinkAction[] = ['reschedule', 'cancel'];

export function isCustomerLinkAction(value: unknown): value is CustomerLinkAction {
  return typeof value === 'string' && (ACTIONS as readonly string[]).includes(value);
}

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

function mac(
  secret: string,
  appointmentId: string,
  action: CustomerLinkAction,
  exp: number
): string {
  return base64url(
    createHmac('sha256', secret).update(`${appointmentId}.${action}.${exp}`).digest()
  );
}

/**
 * Mint a signed token authorizing ONE action on ONE appointment. Throws when the
 * secret is missing — callers must surface that as a server error rather than
 * emit an unsigned link.
 */
export function signCustomerLinkToken(
  appointmentId: string,
  action: CustomerLinkAction,
  ttlSeconds: number = DEFAULT_CUSTOMER_LINK_TTL_SECONDS,
  nowMs: number = Date.now()
): string {
  const secret = getSecret();
  if (!secret) throw new Error('CUSTOMER_LINK_SECRET is not configured.');
  if (!appointmentId) throw new Error('appointmentId is required to sign a customer link.');
  if (!isCustomerLinkAction(action)) throw new Error('action must be "reschedule" or "cancel".');
  if (!Number.isFinite(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error('ttlSeconds must be a positive number.');
  }
  const exp = Math.floor(nowMs / 1000) + Math.floor(ttlSeconds);
  return `${exp}.${mac(secret, appointmentId, action, exp)}`;
}

/**
 * Verify a token against the appointment AND the action it claims to authorize.
 *
 * The signature is checked BEFORE the expiry so a forged token can never be
 * reported as merely 'expired' — that distinction would tell an attacker their
 * guess had a well-formed shape.
 *
 * This is the single authority for "may this customer act". It gates rendering
 * of the mutation UI as well as the mutation itself — the client cannot verify
 * anything, because the secret is server-side only.
 */
export function verifyCustomerLinkToken(
  appointmentId: string,
  action: unknown,
  token: unknown,
  nowMs: number = Date.now()
): CustomerLinkResult {
  const secret = getSecret();
  if (!secret) return { ok: false, reason: 'not_configured' };
  if (!appointmentId) return { ok: false, reason: 'invalid' };
  if (!isCustomerLinkAction(action)) return { ok: false, reason: 'invalid' };
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
  const expected = mac(secret, appointmentId, action, exp);
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
  action: CustomerLinkAction,
  appointmentId: string,
  token: string
): string {
  return `/portal/consultation/${encodeURIComponent(appointmentId)}/${action}?${CUSTOMER_LINK_PARAM}=${encodeURIComponent(token)}`;
}

/**
 * Both signed customer action URLs for an appointment.
 *
 * Each action gets its OWN token. Sharing one token across both would let a
 * cancel link authorize a reschedule (and vice versa) — the tokens are bound to
 * their action so the two links cannot be interchanged.
 */
export function buildCustomerActionUrls(
  origin: string,
  appointmentId: string,
  ttlSeconds: number = DEFAULT_CUSTOMER_LINK_TTL_SECONDS,
  nowMs: number = Date.now()
): { rescheduleUrl: string; cancelUrl: string; expiresAt: number } {
  const base = origin.replace(/\/+$/, '');
  const rescheduleToken = signCustomerLinkToken(appointmentId, 'reschedule', ttlSeconds, nowMs);
  const cancelToken = signCustomerLinkToken(appointmentId, 'cancel', ttlSeconds, nowMs);
  return {
    rescheduleUrl: `${base}${customerActionPath('reschedule', appointmentId, rescheduleToken)}`,
    cancelUrl: `${base}${customerActionPath('cancel', appointmentId, cancelToken)}`,
    expiresAt: Math.floor(nowMs / 1000) + Math.floor(ttlSeconds),
  };
}
