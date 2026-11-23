// ─── The Twilio message dashboard, moved off the office desktop ──────────────
//
// This is the serverless half of the SMS dashboard that used to run as a local
// Express app (`twilio-local-dashboard/server.js`) on one machine, reachable
// only at 127.0.0.1:3000. Same endpoints, same response shapes — the browser
// half is `public/portal-twilio-dashboard.html`, framed by /portal/messages.
//
// A lib module rather than api/twilio/index.ts, and routed through
// api/appointments, because the project is at Vercel's 12-function cap — the
// same reason the inbound-SMS webhook lives there. Its own function built fine
// and then failed at "Deploying outputs" as the 13th. The public URL is
// /api/twilio via the rewrite in vercel.json.
//
// The dashboard's own selector is `twilioResource`, NOT `resource`: the rewrite
// spends `resource=twilio` to get here, so a second `resource` in the query
// would collide with it.
//
// Two deliberate differences from the local version:
//
//   1. Every request requires an ADMIN portal session. The local app had no
//      auth because localhost was the auth; on ontarioreno.ca that is the only
//      thing between the public internet and the account's whole SMS log.
//   2. History paging is capped (MAX_PAGES). The local app walked every page of
//      the log because it had all day; a serverless function does not, and a
//      number with years of traffic would time out mid-walk and return nothing
//      at all rather than the recent messages that actually matter.
//
// It talks to Twilio over plain REST, like lib/twilio-thread-sync.ts does, so
// the `twilio` SDK stays out of the deployed bundle.
//
// This ADDS a hand-typed read/send surface. It does not replace Conversations
// (/portal/conversations), the outbox, or any templated send path — those still
// own every automated message.

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from './auth.js';
import { prisma } from './prisma.js';
import {
  contactNamesByPhone,
  conversationQueryUrls,
  mergeMessagesBySid,
  normalizeMedia,
  normalizeMessage,
  type DashboardMessage,
} from './twilio-dashboard.js';

const MAX_PAGES = 5; // 5 x 1000 messages per direction
const PAGE_SIZE = 1000;
const MESSAGE_CACHE_MS = 60 * 1000;

// Warm-instance caches. A cold start just re-fetches; nothing here is
// authoritative. It only keeps the dashboard from re-walking the whole Twilio
// log on every poll (the page refreshes itself every 10 seconds).
const messageCache = new Map<string, { timestamp: number; messages: DashboardMessage[] }>();
const mediaCache = new Map<string, DashboardMessage['media']>();

// Lead names change rarely (a new Meta lead every so often), and the page asks
// once on load and once per line switch, so five minutes is plenty fresh.
const CONTACT_NAMES_CACHE_MS = 5 * 60 * 1000;
let contactNamesCache: { timestamp: number; names: Record<string, string> } | null = null;

/**
 * Lead names by phone, so the conversation list can say "Colin Hart" instead
 * of only "+1 (416) 555-0123", and search can find a lead by name.
 *
 * Read-only and admin-only like everything else here. Oldest first so the
 * newest lead wins a shared number (see contactNamesByPhone).
 */
async function fetchContactNames(): Promise<Record<string, string>> {
  if (contactNamesCache && Date.now() - contactNamesCache.timestamp < CONTACT_NAMES_CACHE_MS) {
    return contactNamesCache.names;
  }
  const leads = await prisma.lead.findMany({
    where: { phone: { not: '' } },
    select: { name: true, phone: true },
    orderBy: { submittedAt: 'asc' },
  });
  const names = contactNamesByPhone(leads);
  contactNamesCache = { timestamp: Date.now(), names };
  return names;
}

function credentials() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return {
    accountSid,
    auth: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
  };
}

function base(accountSid: string) {
  return `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}`;
}

async function twilioGet<T>(url: string, auth: string): Promise<T | null> {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) return null;
  return (await r.json().catch(() => null)) as T | null;
}

/** One direction of the log. `recentOnly` stops after the first page. */
async function listDirection(
  params: Record<string, string>,
  recentOnly: boolean
): Promise<DashboardMessage[]> {
  const creds = credentials();
  if (!creds) return [];

  const out: DashboardMessage[] = [];
  let url =
    `${base(creds.accountSid)}/Messages.json?` +
    new URLSearchParams({ ...params, PageSize: String(recentOnly ? 100 : PAGE_SIZE) });

  for (let page = 0; page < (recentOnly ? 1 : MAX_PAGES); page += 1) {
    const payload = await twilioGet<{
      messages?: Array<Record<string, unknown>>;
      next_page_uri?: string | null;
    }>(url, creds.auth);
    if (!payload) break;
    out.push(...(payload.messages ?? []).map(normalizeMessage));
    if (!payload.next_page_uri) break;
    url = `https://api.twilio.com${payload.next_page_uri}`;
  }

  return out;
}

// Twilio filters on an exact To/From pair and has no "either direction" query,
// so both halves are fetched and merged — same as the local dashboard did.
async function fetchMessagesForNumber(
  activeNumber: string,
  recentOnly = false
): Promise<DashboardMessage[]> {
  const [sent, received] = await Promise.all([
    listDirection({ From: activeNumber }, recentOnly),
    listDirection({ To: activeNumber }, recentOnly),
  ]);
  return mergeMessagesBySid([...sent, ...received]);
}

/**
 * One conversation, asked of Twilio directly.
 *
 * Opening a thread used to filter the FULL message log for the number, which
 * meant that on any instance without a warm cache — the normal case on
 * serverless, where instances come and go and several run at once — clicking a
 * conversation walked up to 5 pages x 1000 messages x 2 directions before it
 * could pick out the dozen messages actually in that thread. It worked at a few
 * hundred messages and degraded as the log grew; at ~4,000 it started timing
 * out, and a timed-out thread is one that never opens.
 *
 * Twilio can filter on an exact To/From pair, so ask for the pair. Two small
 * requests, no full walk, and no dependence on a cache that may not exist —
 * which also means a message that arrived seconds ago is in the response,
 * rather than missing until some cached list expires.
 *
 * `limit` is per direction. 200 is far past what a rep scrolls while still
 * being one page from Twilio.
 */
async function fetchConversation(
  ourNumber: string,
  contact: string,
  limit = 200
): Promise<DashboardMessage[]> {
  const creds = credentials();
  if (!creds) return [];

  const read = async (url: string): Promise<DashboardMessage[]> => {
    const payload = await twilioGet<{ messages?: Array<Record<string, unknown>> }>(
      url,
      creds.auth
    );
    return (payload?.messages ?? []).map(normalizeMessage);
  };

  const [outbound, inbound] = await Promise.all(
    conversationQueryUrls(base(creds.accountSid), ourNumber, contact, limit).map(read)
  );

  // Oldest first — the order the thread renders in.
  return mergeMessagesBySid([...outbound, ...inbound]).sort(
    (a, b) => new Date(a.dateSent ?? 0).getTime() - new Date(b.dateSent ?? 0).getTime()
  );
}

function cachedMessages(activeNumber: string, maxAgeMs = MESSAGE_CACHE_MS) {
  const hit = messageCache.get(activeNumber);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > maxAgeMs) return null;
  return hit.messages;
}

/**
 * Attach media links, at most MEDIA_LOOKUP_CONCURRENCY lookups at a time.
 *
 * This used to be an unbounded Promise.all: a thread where twenty homeowners
 * had sent photos opened twenty simultaneous Twilio requests, which is how you
 * get rate-limited on the one request path a rep is waiting on. Six at a time
 * is quick and stays well inside Twilio's limits.
 */
const MEDIA_LOOKUP_CONCURRENCY = 6;

async function enrichWithMedia(messages: DashboardMessage[]): Promise<DashboardMessage[]> {
  const creds = credentials();
  if (!creds) return messages;

  const out: DashboardMessage[] = [];
  for (let i = 0; i < messages.length; i += MEDIA_LOOKUP_CONCURRENCY) {
    const batch = await Promise.all(
      messages.slice(i, i + MEDIA_LOOKUP_CONCURRENCY).map(async (m) => {
        if (!m.numMedia) return m;
        const cached = mediaCache.get(m.sid);
        if (cached) return { ...m, media: cached };

        const payload = await twilioGet<{ media_list?: Array<Record<string, unknown>> }>(
          `${base(creds.accountSid)}/Messages/${m.sid}/Media.json?PageSize=10`,
          creds.auth
        );
        const media = normalizeMedia(m.sid, payload?.media_list ?? []);
        mediaCache.set(m.sid, media);
        return { ...m, media };
      })
    );
    out.push(...batch);
  }

  return out;
}

// ─── Call bridge: call a lead from Quo, showing the Twilio number ───────────
//
// Quo can only place calls as a number inside Quo, and leads know the Twilio
// number from the texts. So the call starts in Twilio instead:
//
//   1. `call` (admin): Twilio rings the agent's phone (Quo) from the Twilio
//      number and asks them to press 1.
//   2. `bridge-connect` (Twilio's callback, no session): on "1", Twilio dials
//      the lead with callerId = the Twilio number and joins the two legs.
//
// The press-1 step is there so Quo voicemail or a missed call never dials the
// lead into a dead line. The callback carries an HMAC of from|to signed with
// the Twilio auth token, so nobody can use it to dial arbitrary numbers.
const CALL_BRIDGE_AGENT_NUMBER = process.env.CALL_BRIDGE_AGENT_NUMBER || '+16479885484';
const E164 = /^\+[1-9]\d{7,14}$/;

function bridgeToken(from: string, to: string) {
  return createHmac('sha256', process.env.TWILIO_AUTH_TOKEN ?? '')
    .update(`${from}|${to}`)
    .digest('hex');
}

function xmlEscape(s: string) {
  return s.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function sendTwiml(res: VercelResponse, xml: string) {
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`);
}

function handleBridgeConnect(req: VercelRequest, res: VercelResponse) {
  const from = String(req.query.from ?? '');
  const to = String(req.query.to ?? '');
  const t = String(req.query.t ?? '');
  const expected = bridgeToken(from, to);
  const valid =
    E164.test(from) &&
    E164.test(to) &&
    t.length === expected.length &&
    timingSafeEqual(Buffer.from(t), Buffer.from(expected));
  if (!valid) return sendTwiml(res, '<Hangup/>');

  const body = (req.body ?? {}) as Record<string, unknown>;
  const digits = String(body.Digits ?? req.query.Digits ?? '');
  if (digits !== '1') return sendTwiml(res, '<Say>Call cancelled.</Say><Hangup/>');

  return sendTwiml(
    res,
    `<Dial callerId="${xmlEscape(from)}" answerOnBridge="true" timeout="30">` +
      `<Number>${xmlEscape(to)}</Number></Dial>`
  );
}

export async function handleTwilioDashboard(req: VercelRequest, res: VercelResponse) {
  // Twilio's own callback during a bridged call. No portal session exists on
  // that request; the HMAC in the URL is the auth.
  if (String(req.query.twilioResource ?? '') === 'bridge-connect') {
    return handleBridgeConnect(req, res);
  }

  const user = await requireAdmin(req, res);
  if (!user) return;

  const creds = credentials();
  if (!creds) {
    res.status(500).json({ error: 'Twilio is not configured on this environment.' });
    return;
  }

  const resource = String(req.query.twilioResource ?? '');

  // The dashboard polls; never let a proxy hand it a stale thread.
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    if (req.method === 'POST' && resource === 'call') {
      const { from, to, name } = (req.body ?? {}) as { from?: string; to?: string; name?: string };
      if (!from || !to || !E164.test(from) || !E164.test(to)) {
        res.status(400).json({ error: 'from and to must be phone numbers like +14165550123' });
        return;
      }

      const host = String(req.headers['x-forwarded-host'] ?? req.headers.host ?? '');
      const action =
        `https://${host}/api/twilio?` +
        new URLSearchParams({ twilioResource: 'bridge-connect', from, to, t: bridgeToken(from, to) });
      const who = String(name ?? '').replace(/[^\p{L}\p{N} .'-]/gu, '').slice(0, 40).trim() || 'your lead';
      const twiml =
        `<Response><Gather numDigits="1" timeout="10" method="POST" action="${xmlEscape(action)}">` +
        `<Say>Call to ${xmlEscape(who)}. Press 1 to connect.</Say></Gather>` +
        `<Say>No answer. Goodbye.</Say></Response>`;

      const r = await fetch(`${base(creds.accountSid)}/Calls.json`, {
        method: 'POST',
        headers: { Authorization: creds.auth, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ From: from, To: CALL_BRIDGE_AGENT_NUMBER, Twiml: twiml, Timeout: '25' }),
      });
      const payload = (await r.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!r.ok) {
        res.status(500).json({ error: payload.message ?? 'Failed to start call' });
        return;
      }
      res.json({ success: true, sid: payload.sid, agent: CALL_BRIDGE_AGENT_NUMBER });
      return;
    }

    if (req.method === 'POST' && resource === 'send') {
      const { from, to, body } = (req.body ?? {}) as {
        from?: string;
        to?: string;
        body?: string;
      };
      if (!from || !to || !body) {
        res.status(400).json({ error: 'from, to, and body are required' });
        return;
      }

      const r = await fetch(`${base(creds.accountSid)}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: creds.auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ From: from, To: to, Body: body }),
      });
      const payload = (await r.json().catch(() => ({}))) as {
        sid?: string;
        status?: string;
        message?: string;
      };
      if (!r.ok) {
        res.status(500).json({ error: payload.message ?? 'Failed to send message' });
        return;
      }

      // The text is in Twilio's log now; the cached copy is one message behind.
      messageCache.delete(from);
      res.json({ success: true, sid: payload.sid, status: payload.status });
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    if (resource === 'phone-numbers') {
      const payload = await twilioGet<{
        incoming_phone_numbers?: Array<Record<string, unknown>>;
      }>(`${base(creds.accountSid)}/IncomingPhoneNumbers.json?PageSize=100`, creds.auth);
      res.json(
        (payload?.incoming_phone_numbers ?? []).map((n) => ({
          sid: String(n.sid ?? ''),
          phoneNumber: String(n.phone_number ?? ''),
          friendlyName: String(n.friendly_name || n.phone_number || ''),
        }))
      );
      return;
    }

    if (resource === 'contacts') {
      // Names are a nicety on top of the list. If the database is unreachable
      // the page still works on numbers alone, so answer empty, not 500.
      const names = await fetchContactNames().catch((error) => {
        console.error('Twilio dashboard contact names failed:', (error as Error).message);
        return {} as Record<string, string>;
      });
      res.json({ names });
      return;
    }

    if (resource === 'messages') {
      const activeNumber = String(req.query.activeNumber ?? '');
      if (!activeNumber) {
        res.status(400).json({ error: 'activeNumber is required' });
        return;
      }
      const incremental = req.query.incremental === '1';

      let messages: DashboardMessage[];
      if (incremental) {
        const recent = await fetchMessagesForNumber(activeNumber, true);
        const cached = cachedMessages(activeNumber, Number.MAX_SAFE_INTEGER) ?? [];
        messageCache.set(activeNumber, {
          timestamp: Date.now(),
          messages: mergeMessagesBySid([...cached, ...recent]),
        });
        messages = recent;
      } else {
        messages = cachedMessages(activeNumber) ?? (await fetchMessagesForNumber(activeNumber));
        messageCache.set(activeNumber, { timestamp: Date.now(), messages });
      }

      res.json({ incremental, total: messages.length, messages });
      return;
    }

    if (resource === 'thread') {
      const activeNumber = String(req.query.activeNumber ?? '');
      const contact = String(req.query.contact ?? '');
      if (!activeNumber || !contact) {
        res.status(400).json({ error: 'activeNumber and contact are required' });
        return;
      }

      const thread = await fetchConversation(activeNumber, contact);
      const enriched = await enrichWithMedia(thread);
      res.json({ contact, total: enriched.length, messages: enriched });
      return;
    }

    if (resource === 'media') {
      const messageSid = String(req.query.messageSid ?? '');
      const mediaSid = String(req.query.mediaSid ?? '');
      if (!messageSid || !mediaSid) {
        res.status(400).send('messageSid and mediaSid are required');
        return;
      }

      // The bytes live on api.twilio.com behind the same basic auth, so they
      // are proxied rather than linked: an <img src> cannot carry the header,
      // and handing the browser a raw Twilio media URL would put the
      // attachment somewhere anyone with the link could read it.
      const meta = await twilioGet<{ uri?: string; content_type?: string }>(
        `${base(creds.accountSid)}/Messages/${messageSid}/Media/${mediaSid}.json`,
        creds.auth
      );
      if (!meta?.uri) {
        res.status(404).send('Media not found');
        return;
      }

      const r = await fetch(`https://api.twilio.com${meta.uri.replace('.json', '')}`, {
        headers: { Authorization: creds.auth },
      });
      if (!r.ok) {
        res.status(r.status).send('Failed to fetch media');
        return;
      }

      res.setHeader('Content-Type', meta.content_type || 'application/octet-stream');
      res.send(Buffer.from(await r.arrayBuffer()));
      return;
    }

    res.status(404).json({ error: 'Unknown resource' });
  } catch (error) {
    console.error('Twilio dashboard error:', (error as Error).message);
    res.status(500).json({ error: 'Twilio request failed' });
  }
}
