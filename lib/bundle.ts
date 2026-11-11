import type { VercelRequest, VercelResponse } from '@vercel/node';

// ─── Bundled GETs: several portal datasets in ONE function invocation ─────────
//
// Why this exists: on November 11, 2026 Vercel paused the whole site for going
// over the Hobby plan's 4 hours/month of Fluid Active CPU. Usage was flat —
// ~8 minutes a day — and most of it was the portal's full load, which fired 19
// separate GETs per load (and per realtime refresh, per open tab). Every one of
// those is its own invocation paying its own auth check, request overhead and,
// 40% of the time, a cold start.
//
// A bundle runs the SAME handler once per part, in-process, with that part's
// query, and returns every part's status + body together. Nothing about what a
// part returns changes: same handler, same auth, same role scoping, same
// view-as headers (the original request's headers are reused untouched). If a
// part fails, its own status comes back and the client treats that part
// exactly like a failed standalone fetch.
//
// Parts are a fixed whitelist per route — a bundle can never be asked to run an
// arbitrary query, and only GETs are ever bundled.

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

/** Query overrides for one part, applied on top of the original query. */
export type BundleParts = Record<string, Record<string, string>>;

export interface BundlePartResult {
  status: number;
  body: unknown;
}

/** A minimal VercelResponse that records what the handler sent. */
function captureResponse(): { res: VercelResponse; result: () => BundlePartResult } {
  let status = 200;
  let body: unknown = null;
  const headers: Record<string, unknown> = {};
  const res = {
    get statusCode() { return status; },
    set statusCode(code: number) { status = code; },
    headersSent: false,
    status(code: number) { status = code; return res; },
    json(payload: unknown) { body = payload; return res; },
    send(payload: unknown) { body = payload; return res; },
    end(payload?: unknown) { if (payload !== undefined) body = payload; return res; },
    setHeader(name: string, value: unknown) { headers[name.toLowerCase()] = value; return res; },
    getHeader(name: string) { return headers[name.toLowerCase()]; },
    removeHeader(name: string) { delete headers[name.toLowerCase()]; return res; },
  };
  return { res: res as unknown as VercelResponse, result: () => ({ status, body }) };
}

/** A request identical to `req` except for its query. */
function withQuery(req: VercelRequest, query: Record<string, string | string[]>): VercelRequest {
  const clone = Object.create(req) as VercelRequest;
  Object.defineProperty(clone, 'query', { value: query, enumerable: true });
  return clone;
}

/**
 * Run `handler` once per part and answer with every part's result:
 * `{ parts: { [key]: { status, body } } }`.
 *
 * `stripKeys` are removed from the original query first (the flag that asked
 * for the bundle), so a part can never re-enter the bundle branch.
 */
export async function serveBundle(
  req: VercelRequest,
  res: VercelResponse,
  handler: Handler,
  parts: BundleParts,
  stripKeys: string[],
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const base: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(req.query ?? {})) {
    if (!stripKeys.includes(k) && v !== undefined) base[k] = v as string | string[];
  }

  const entries = await Promise.all(
    Object.entries(parts).map(async ([key, overrides]) => {
      const { res: partRes, result } = captureResponse();
      try {
        await handler(withQuery(req, { ...base, ...overrides }), partRes);
        return [key, result()] as const;
      } catch (err) {
        console.error(`[bundle] part ${key} threw`, err);
        return [key, { status: 500, body: { error: 'Internal error.' } }] as const;
      }
    }),
  );

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ parts: Object.fromEntries(entries) });
}

// The whitelists, kept here so the client and the tests read the same names.
export const DEALS_BUNDLE: BundleParts = {
  deals: {},
  tracker: { _resource: 'tracker' },
  agreements: { _resource: 'agreements' },
  deal_documents: { _resource: 'deal_documents' },
  contract_presets: { _resource: 'contract_presets' },
};

export const APPOINTMENTS_BUNDLE: BundleParts = {
  appointments: {},
  clients: { _resource: 'clients' },
  households: { _resource: 'households' },
  days_off: { _resource: 'days_off' },
};

export const CONTRACTORS_BUNDLE: BundleParts = {
  contractors: {},
  finance_partners: { _resource: 'finance_partners' },
};

export const AUTH_BUNDLE: BundleParts = {
  activities: { action: 'activities' },
  tasks: { action: 'tasks' },
  rep_access: { action: 'rep-access' },
  note_templates: { action: 'note-templates' },
  scheduling_settings: { action: 'scheduling-settings' },
};
