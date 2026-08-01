// Meta Pixel helpers.
//
// The base pixel is loaded in index.html and fires one PageView on hard load.
// This is a single-page app, so every later navigation is invisible to it —
// hence trackPageView, called from ScrollToTop on each route change.
//
// Everything is a no-op when fbq is absent (ad blockers, local dev, SSR-less
// prerender), so callers never need to guard.

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

type Params = Record<string, unknown>;

/**
 * Standard Meta event (Lead, Schedule, ViewContent, …).
 *
 * Pass `eventId` for anything the server also reports through the Conversions
 * API, using the same id on both sides — that is what tells Meta the two
 * copies are one conversion rather than two.
 */
export function trackEvent(event: string, params?: Params, eventId?: string) {
  window.fbq?.('track', event, params, eventId ? { eventID: eventId } : undefined);
}

/** Id shared by the browser and server copies of a single conversion. */
export function newEventId(): string {
  return crypto.randomUUID();
}

/** Event not in Meta's standard list — reported separately in Ads Manager. */
export function trackCustom(event: string, params?: Params) {
  window.fbq?.('trackCustom', event, params);
}

export function trackPageView() {
  window.fbq?.('track', 'PageView');
}
