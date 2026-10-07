/**
 * Where a website lead came from — Google search, Meta, an SMS link, direct.
 *
 * Before this, attribution came only from tags on the link (?src=, utm_*,
 * fbclid). A homeowner who found us on Google search arrives with no tag, so
 * they were indistinguishable from someone who typed the address, and there was
 * no way to know how many bookings organic search produced.
 *
 * The browser records two things on the first page of a visit (see
 * src/lib/attributionCapture.ts): the referring site's hostname and the landing
 * page with its query string. This file turns those into one channel. Pure, so
 * every rule is pinned by lib/traffic-attribution.test.ts, and shared by the
 * API (which stores it) and the SEO miner (which reports it).
 */

export type TrafficChannel =
  | 'google_organic'
  | 'google_ads'
  | 'other_search'
  | 'meta'
  | 'sms'
  | 'email'
  | 'referral'
  | 'direct';

export type AttributionInput = {
  /** Hostname only, e.g. "www.google.com". '' when the browser sent none. */
  referrerHost?: string;
  /** Path + query of the first page of the visit, e.g. "/basement-renovation-ajax?gclid=x". */
  landingPage?: string;
  /** The lead's existing tag (?src= / utm), if the form sent one. */
  sourceDetail?: string;
};

const OWN_HOSTS = /(^|\.)ontarioreno\.ca$/i;

export function trafficChannel({ referrerHost = '', landingPage = '', sourceDetail = '' }: AttributionInput): TrafficChannel {
  const query = new URLSearchParams(landingPage.includes('?') ? landingPage.slice(landingPage.indexOf('?') + 1) : '');
  const get = (k: string) => (query.get(k) ?? '').toLowerCase();
  const utmSource = get('utm_source');
  const utmMedium = get('utm_medium');
  const tag = `${get('src')} ${sourceDetail}`.toLowerCase();
  const host = referrerHost.toLowerCase();

  // Paid and tagged traffic first: a tag is an explicit statement, and an ad
  // click from Google also carries a google.com referrer that must not be
  // mistaken for organic.
  if (query.has('gclid') || query.has('gbraid') || query.has('wbraid')) return 'google_ads';
  if (utmSource === 'google' && /^(cpc|ppc|paid)/.test(utmMedium)) return 'google_ads';
  if (query.has('fbclid') || /^(facebook|instagram|meta|fb|ig)$/.test(utmSource) || /\b(meta|fb|ig)\b|^fb-|\bfb-/.test(tag)) return 'meta';
  if (utmMedium === 'sms' || /\bsms\b/.test(tag)) return 'sms';
  if (utmMedium === 'email' || /\bemail\b/.test(tag)) return 'email';

  if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google_organic';
  if (/(^|\.)(bing\.com|duckduckgo\.com|search\.yahoo\.com|yahoo\.com|ecosia\.org|search\.brave\.com)$/.test(host)) return 'other_search';
  if (/(^|\.)(facebook\.com|instagram\.com|fb\.com|messenger\.com)$/.test(host)) return 'meta';
  if (!host || OWN_HOSTS.test(host)) return 'direct';
  return 'referral';
}

/**
 * The three Lead columns, from whatever the browser sent. Never trusts the
 * payload's shape: a missing or malformed `attribution` stores as unknown
 * rather than failing the submission.
 */
export function attributionFields(raw: unknown, sourceDetail = ''): { referrerHost: string; landingPage: string; trafficChannel: TrafficChannel | '' } {
  const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const referrerHost = String(a.referrerHost ?? '').trim().toLowerCase().slice(0, 120);
  const landingPage = String(a.landingPage ?? '').trim().slice(0, 300);
  // No capture at all (old cached page, storage blocked): unknown, not "direct".
  if (!landingPage) return { referrerHost: '', landingPage: '', trafficChannel: '' };
  return { referrerHost, landingPage, trafficChannel: trafficChannel({ referrerHost, landingPage, sourceDetail }) };
}
