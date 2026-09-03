// ─── Shaping Twilio's REST payloads for the messages dashboard ──────────────
//
// The dashboard UI (public/portal-twilio-dashboard.html) was written against
// the `twilio` Node SDK, which hands back camelCase objects. api/twilio talks
// to the REST API directly instead — no SDK in the deployed bundle — and REST
// answers in snake_case with a different date format.
//
// That translation is the whole reason this file exists separately from the
// handler. A wrong field name here does not throw: `m.dateSent` on a raw REST
// row is simply `undefined`, so every bubble renders blank, every timestamp
// reads "Invalid Date", and the thread still looks like it loaded. Silent, and
// only visible to whoever opens the page. So the mapping lives here, where
// lib/twilio-dashboard.test.ts pins it against real REST payload shapes.

/** One message, in the shape the dashboard UI expects. */
export type DashboardMessage = {
  sid: string;
  from: string;
  to: string;
  body: string;
  direction: string;
  status: string;
  dateSent: string | null;
  numMedia: number;
  media: Array<{ sid: string; contentType: string; url: string }>;
};

/**
 * A raw REST message row into the SDK-shaped object the UI reads.
 *
 * `date_sent` is null on a queued message that has not gone out yet, so
 * `date_created` is the fallback — without it a just-sent text sorts to the
 * epoch and jumps to the bottom of the thread.
 */
export function normalizeMessage(m: Record<string, unknown>): DashboardMessage {
  return {
    sid: String(m.sid ?? ''),
    from: String(m.from ?? ''),
    to: String(m.to ?? ''),
    body: String(m.body ?? ''),
    direction: String(m.direction ?? ''),
    status: String(m.status ?? ''),
    dateSent: (m.date_sent as string) || (m.date_created as string) || null,
    numMedia: Number(m.num_media ?? 0),
    media: [],
  };
}

/** Newest first — the order the sidebar's conversation list is built from. */
export function sortMessagesNewestFirst(messages: DashboardMessage[]): DashboardMessage[] {
  return [...messages].sort(
    (a, b) => new Date(b.dateSent ?? 0).getTime() - new Date(a.dateSent ?? 0).getTime()
  );
}

/**
 * De-duplicate by SID, newest first.
 *
 * Twilio has no "either direction" query, so a thread is two filtered calls
 * (From=us and To=us) that are then merged. A message we sent to our own
 * number would otherwise appear twice.
 */
export function mergeMessagesBySid(messages: DashboardMessage[]): DashboardMessage[] {
  const merged = new Map<string, DashboardMessage>();
  for (const m of messages) merged.set(m.sid, m);
  return sortMessagesNewestFirst([...merged.values()]);
}

/**
 * Which contact a message belongs to, from the perspective of our number.
 *
 * Mirrors the identical function in the dashboard's own script. Both must
 * agree or the server would filter a thread differently than the UI groups it.
 */
export function conversationKey(m: DashboardMessage, activeNumber: string): string {
  return m.from === activeNumber ? m.to : m.from;
}

/**
 * Where the browser fetches an attachment.
 *
 * Deliberately our own endpoint, not Twilio's. The bytes sit behind the
 * account's basic auth: an `<img src>` cannot carry that header, and Twilio's
 * alternative — a public media URL — would leave a homeowner's photo readable
 * by anyone who ever saw the link.
 */
export function mediaProxyUrl(messageSid: string, mediaSid: string): string {
  return (
    `/api/twilio?resource=media&messageSid=${encodeURIComponent(messageSid)}` +
    `&mediaSid=${encodeURIComponent(mediaSid)}`
  );
}

/** A raw REST media row into the shape the UI renders. */
export function normalizeMedia(
  messageSid: string,
  items: Array<Record<string, unknown>>
): DashboardMessage['media'] {
  return items.map((item) => {
    const sid = String(item.sid ?? '');
    return {
      sid,
      contentType: String(item.content_type ?? ''),
      url: mediaProxyUrl(messageSid, sid),
    };
  });
}
