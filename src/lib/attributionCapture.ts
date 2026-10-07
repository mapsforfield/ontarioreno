/**
 * Records where this visit started, once, so the lead form can say so later.
 *
 * The homeowner usually lands on a guide page (from Google, say), reads, then
 * clicks through to a booking form several pages later — by which point
 * document.referrer only names our own site. So the FIRST page of the visit is
 * captured here, at app start, and every lead form sends it along. Classified
 * into a channel server-side: lib/traffic-attribution.ts.
 *
 * sessionStorage: first touch per tab session, nothing kept once the tab
 * closes, and no cookie. Wrapped in try/catch because storage can be blocked,
 * in which case the lead simply records no attribution.
 */
const KEY = 'or_attribution';

export type CapturedAttribution = { referrerHost: string; landingPage: string };

export function captureAttribution(): void {
  try {
    if (sessionStorage.getItem(KEY)) return;
    let referrerHost = '';
    try {
      referrerHost = document.referrer ? new URL(document.referrer).hostname : '';
    } catch {
      /* malformed referrer — leave blank */
    }
    const value: CapturedAttribution = {
      referrerHost,
      landingPage: (window.location.pathname + window.location.search).slice(0, 300),
    };
    sessionStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* storage blocked */
  }
}

export function readAttribution(): CapturedAttribution | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as CapturedAttribution) : null;
  } catch {
    return null;
  }
}
