import { createHash } from 'node:crypto';

/**
 * Meta Conversions API — server-side conversion reporting.
 *
 * The browser pixel already reports Lead and Schedule. This sends the same two
 * events from the server, where the contact details are the ones the homeowner
 * actually submitted rather than whatever the page could scrape, and where an
 * ad blocker cannot intervene.
 *
 * The two copies are reconciled by `eventId`: the browser and the server send
 * the same id for one action, and Meta keeps a single conversion. Without that
 * every lead is counted twice, so the id is threaded from the client through
 * the request body rather than generated here.
 *
 * Personal data is SHA-256 hashed before it leaves this process — Meta never
 * receives a raw email or phone number, and neither does any log line here.
 */

const API_VERSION = 'v21.0';

/** Everything Meta matches on. Absent fields are simply omitted. */
export type MetaUserData = {
  email?: string;
  phone?: string;
  /** The form collects one field; split before calling. */
  firstName?: string;
  lastName?: string;
  city?: string;
  /** Province name or code — normalised to a two-letter code. */
  state?: string;
  country?: string;
  clientIp?: string;
  clientUserAgent?: string;
  /** `_fbp` cookie, sent as-is. */
  fbp?: string;
  /** `_fbc` cookie, sent as-is. */
  fbc?: string;
};

export type MetaEvent = {
  eventName: 'Lead' | 'Schedule';
  /** Must match the browser pixel's eventID for this same action. */
  eventId: string;
  /** The page the homeowner acted on. */
  eventSourceUrl?: string;
  userData: MetaUserData;
  customData?: Record<string, unknown>;
};

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Meta requires lowercase, trimmed, punctuation-free values before hashing. */
const hashText = (value: string | undefined) => {
  const normalised = (value ?? '').trim().toLowerCase();
  return normalised ? sha256(normalised) : undefined;
};

const hashEmail = (value: string | undefined) => hashText(value);

/**
 * E.164 without the leading `+`. A bare ten-digit number is Canadian here, so
 * it gets country code 1 — sending it unprefixed simply fails to match.
 */
const hashPhone = (value: string | undefined) => {
  const digits = (value ?? '').replace(/\D/g, '');
  if (!digits) return undefined;
  const withCountry = digits.length === 10 ? `1${digits}` : digits;
  return sha256(withCountry);
};

/** Meta wants city names with no spaces or punctuation. */
const hashCity = (value: string | undefined) => {
  const normalised = (value ?? '').trim().toLowerCase().replace(/[^a-z]/g, '');
  return normalised ? sha256(normalised) : undefined;
};

const PROVINCE_CODES: Record<string, string> = {
  ontario: 'on',
  quebec: 'qc',
  'british columbia': 'bc',
  alberta: 'ab',
  manitoba: 'mb',
  saskatchewan: 'sk',
  'nova scotia': 'ns',
  'new brunswick': 'nb',
  'newfoundland and labrador': 'nl',
  'prince edward island': 'pe',
};

/** Two-letter code, hashed. Meta will not match a spelled-out province. */
const hashState = (value: string | undefined) => {
  const raw = (value ?? '').trim().toLowerCase();
  if (!raw) return undefined;
  const code = PROVINCE_CODES[raw] ?? raw.replace(/[^a-z]/g, '');
  return code.length === 2 ? sha256(code) : undefined;
};

/** Splits the single `name` field. Compound surnames land wholly in lastName. */
export function splitName(full: string): { firstName?: string; lastName?: string } {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { firstName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function buildUserData(u: MetaUserData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const put = (key: string, value: string | undefined) => {
    if (value) out[key] = value;
  };
  // Hashed identifiers.
  put('em', hashEmail(u.email));
  put('ph', hashPhone(u.phone));
  put('fn', hashText(u.firstName));
  put('ln', hashText(u.lastName));
  put('ct', hashCity(u.city));
  put('st', hashState(u.state));
  put('country', hashText(u.country));
  // Sent in the clear by Meta's spec — hashing these breaks matching.
  put('client_ip_address', u.clientIp && u.clientIp !== 'unknown' ? u.clientIp : undefined);
  put('client_user_agent', u.clientUserAgent);
  put('fbp', u.fbp);
  put('fbc', u.fbc);
  return out;
}

/**
 * Posts one event. Never throws and never rejects: a lead is already committed
 * by the time this runs, and an advertising side effect must not be able to
 * turn a captured submission into a failed request.
 */
export async function sendMetaEvent(event: MetaEvent): Promise<void> {
  // The id is public — it ships in index.html — so it is defaulted rather than
  // made a required deployment variable. Only the token is a secret.
  const pixelId = process.env['META_PIXEL_ID'] || '1336538964865204';
  const token = process.env['META_CAPI_TOKEN'];
  // Unset is the normal state in development and on preview builds: without a
  // token this is a no-op and the browser pixel remains the only reporter.
  if (!token) return;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        action_source: 'website',
        ...(event.eventSourceUrl ? { event_source_url: event.eventSourceUrl } : {}),
        user_data: buildUserData(event.userData),
        ...(event.customData ? { custom_data: event.customData } : {}),
      },
    ],
  };
  // Routes events to the Test Events tab instead of production reporting.
  const testCode = process.env['META_TEST_EVENT_CODE'];
  if (testCode) payload['test_event_code'] = testCode;

  try {
    const r = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    if (!r.ok) {
      // Body first — Meta explains the rejected field, which is the only way to
      // tell a bad token from a malformed hash.
      const detail = await r.text().catch(() => '');
      console.error(`[meta-capi] ${event.eventName} rejected (${r.status}): ${detail.slice(0, 500)}`);
    }
  } catch (err) {
    console.error(`[meta-capi] ${event.eventName} could not be sent:`, err);
  }
}
