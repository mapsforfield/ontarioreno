/**
 * SEO miner — turns stored Search Console rows into a short, ranked to-do list.
 *
 * Pure functions only: no database, no network. scripts/seo-miner.ts loads the
 * rows and prints the report. Kept pure so every rule here is pinned by
 * lib/seo-miner.test.ts.
 *
 * Every list answers "what single change is most likely to bring more visits?",
 * and every threshold below exists to keep small numbers from looking like
 * findings. A page shown 6 times with 0 clicks is noise, not a CTR problem.
 */

export type PerfRow = {
  date: string;
  page: string;
  /** '' = the page's full daily total (see SearchPerformance in schema.prisma). */
  query: string;
  clicks: number;
  impressions: number;
  position: number;
};

export type Agg = { page: string; query: string; clicks: number; impressions: number; position: number; ctr: number };

/** Sum rows per (page, query); position is impression-weighted, as Google computes it. */
export function aggregate(rows: PerfRow[]): Agg[] {
  const map = new Map<string, { page: string; query: string; clicks: number; impressions: number; posWeight: number }>();
  for (const r of rows) {
    const k = `${r.page}\u0000${r.query}`;
    const a = map.get(k) ?? { page: r.page, query: r.query, clicks: 0, impressions: 0, posWeight: 0 };
    a.clicks += r.clicks;
    a.impressions += r.impressions;
    a.posWeight += r.position * r.impressions;
    map.set(k, a);
  }
  return [...map.values()].map((a) => ({
    page: a.page,
    query: a.query,
    clicks: a.clicks,
    impressions: a.impressions,
    position: a.impressions ? a.posWeight / a.impressions : 0,
    ctr: a.impressions ? a.clicks / a.impressions : 0,
  }));
}

/**
 * Rough organic click-through rate by position. Deliberately conservative: a
 * page is only flagged when it gets HALF of this, so the exact curve matters
 * less than the gap.
 */
export function expectedCtr(position: number): number {
  const curve = [0.28, 0.15, 0.1, 0.07, 0.05, 0.04, 0.03, 0.025, 0.02, 0.018];
  const i = Math.max(1, Math.round(position)) - 1;
  return i < curve.length ? curve[i] : 0.01;
}

/**
 * Search terms sitting just off page one (positions 8–20 — the bottom of page 1
 * through page 2) with real demand. Moving these is usually a content or
 * internal-link job on a page that already ranks, which is far cheaper than
 * ranking a new page from nothing.
 */
export function strikingDistance(aggs: Agg[], { minImpressions = 20, limit = 20 } = {}): Agg[] {
  return aggs
    .filter((a) => a.query !== '' && a.position >= 8 && a.position <= 20 && a.impressions >= minImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

export type CtrGap = Agg & { expected: number; missedClicks: number };

/**
 * Pages that already rank on page one but get far fewer clicks than that
 * position normally earns. The fix is the title and description: what the
 * searcher reads before choosing a result. Ranked by clicks left on the table.
 */
export function lowCtrPages(aggs: Agg[], { minImpressions = 100, limit = 15 } = {}): CtrGap[] {
  return aggs
    .filter((a) => a.query === '' && a.impressions >= minImpressions && a.position <= 10)
    .map((a) => {
      const expected = expectedCtr(a.position);
      return { ...a, expected, missedClicks: Math.round(a.impressions * (expected - a.ctr)) };
    })
    .filter((a) => a.ctr < a.expected / 2)
    .sort((a, b) => b.missedClicks - a.missedClicks)
    .slice(0, limit);
}

/** The services OntarioReno sells, and the words people use when searching for them. */
export const SERVICES: { service: string; pattern: RegExp }[] = [
  { service: 'Bathroom', pattern: /\b(bath ?rooms?|showers?|ensuites?|washrooms?)\b/i },
  { service: 'Kitchen', pattern: /\bkitchens?\b/i },
  { service: 'Basement', pattern: /\bbasements?\b/i },
  { service: 'Flooring', pattern: /\b(floor(ing|s)?|hardwood|laminate|vinyl plank|tiles?)\b/i },
  { service: 'Legal suite / ADU', pattern: /\b(adus?|additional dwelling|secondary suites?|legal suites?|in-?law suites?|granny flats?|basement apartments?)\b/i },
  { service: 'Garden / laneway suite', pattern: /\b(garden suites?|laneway|coach house)\b/i },
  { service: 'Grants & financing', pattern: /\b(grants?|rebates?|incentives?|loans?|financing|heloc|funding)\b/i },
];

export type ServiceDemand = { service: string; clicks: number; impressions: number; position: number; queries: number; topQueries: Agg[] };

/**
 * Where search demand is, per service, from the named search terms. Shows which
 * services Google already associates with the site and which it barely does —
 * the second list is where new pages earn the most.
 *
 * A term can match more than one service ("basement bathroom") and counts in
 * each; these are demand signals, not a traffic total.
 */
export function serviceDemand(aggs: Agg[]): ServiceDemand[] {
  // Collapse to one row per query first: the same term on two pages is one demand.
  const byQuery = new Map<string, Agg>();
  for (const a of aggs) {
    if (a.query === '') continue;
    const q = byQuery.get(a.query);
    if (!q) { byQuery.set(a.query, { ...a }); continue; }
    const impressions = q.impressions + a.impressions;
    q.position = impressions ? (q.position * q.impressions + a.position * a.impressions) / impressions : 0;
    q.clicks += a.clicks;
    q.impressions = impressions;
    q.ctr = q.impressions ? q.clicks / q.impressions : 0;
  }
  return SERVICES.map(({ service, pattern }) => {
    const hits = [...byQuery.values()].filter((q) => pattern.test(q.query));
    const impressions = hits.reduce((s, q) => s + q.impressions, 0);
    return {
      service,
      clicks: hits.reduce((s, q) => s + q.clicks, 0),
      impressions,
      position: impressions ? hits.reduce((s, q) => s + q.position * q.impressions, 0) / impressions : 0,
      queries: hits.length,
      topQueries: hits.sort((a, b) => b.impressions - a.impressions).slice(0, 5),
    };
  }).sort((a, b) => b.impressions - a.impressions);
}

export type Trend = { page: string; clicks: number; prevClicks: number; impressions: number; prevImpressions: number; position: number; prevPosition: number };

/** Page totals, this window vs the one before it, biggest click change first. */
export function pageTrends(current: Agg[], previous: Agg[], { limit = 15 } = {}): Trend[] {
  const prev = new Map(previous.filter((a) => a.query === '').map((a) => [a.page, a]));
  const pages = new Set([...current.filter((a) => a.query === '').map((a) => a.page), ...prev.keys()]);
  const cur = new Map(current.filter((a) => a.query === '').map((a) => [a.page, a]));
  return [...pages]
    .map((page) => {
      const c = cur.get(page);
      const p = prev.get(page);
      return {
        page,
        clicks: c?.clicks ?? 0,
        prevClicks: p?.clicks ?? 0,
        impressions: c?.impressions ?? 0,
        prevImpressions: p?.impressions ?? 0,
        position: c?.position ?? 0,
        prevPosition: p?.position ?? 0,
      };
    })
    .filter((t) => t.impressions + t.prevImpressions >= 50)
    .sort((a, b) => Math.abs(b.clicks - b.prevClicks) - Math.abs(a.clicks - a.prevClicks) || b.impressions - a.impressions)
    .slice(0, limit);
}

// ─── Report ──────────────────────────────────────────────────────────────────

const path = (url: string) => url.replace(/^https?:\/\/(www\.)?ontarioreno\.ca/, '') || '/';
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const pos = (n: number) => (n ? n.toFixed(1) : '—');

export type ChannelLeads = { channel: string; leads: number; booked: number };

const CHANNEL_LABELS: Record<string, string> = {
  google_organic: '**Google search (free)**',
  google_ads: 'Google Ads',
  other_search: 'Other search engines',
  meta: 'Facebook / Instagram',
  sms: 'SMS links',
  email: 'Email links',
  referral: 'Other websites',
  direct: 'Direct / typed in',
};

/** The whole report as Markdown — printed to the log and to the GitHub job summary. */
export function renderReport(input: { start: string; end: string; current: PerfRow[]; previous: PerfRow[]; leads?: ChannelLeads[] }): string {
  const cur = aggregate(input.current);
  const prev = aggregate(input.previous);
  const totals = (aggs: Agg[]) => {
    const pages = aggs.filter((a) => a.query === '');
    const impressions = pages.reduce((s, a) => s + a.impressions, 0);
    return {
      clicks: pages.reduce((s, a) => s + a.clicks, 0),
      impressions,
      position: impressions ? pages.reduce((s, a) => s + a.position * a.impressions, 0) / impressions : 0,
    };
  };
  const t = totals(cur);
  const p = totals(prev);
  const out: string[] = [];

  out.push(`# SEO miner — ${input.start} to ${input.end}`, '');
  out.push('| | This period | Previous period |', '|---|---|---|');
  out.push(`| Clicks | **${t.clicks}** | ${p.clicks} |`);
  out.push(`| Impressions | **${t.impressions}** | ${p.impressions} |`);
  out.push(`| Avg position | **${pos(t.position)}** | ${pos(p.position)} |`, '');

  out.push('## 1. Fix the title — ranks on page 1, few clicks', '');
  const gaps = lowCtrPages(cur);
  if (!gaps.length) out.push('_None above the threshold (100+ impressions, position ≤ 10, under half the expected CTR)._', '');
  else {
    out.push('| Page | Impressions | Position | CTR | Expected | Clicks missed |', '|---|---|---|---|---|---|');
    for (const g of gaps) out.push(`| ${path(g.page)} | ${g.impressions} | ${pos(g.position)} | ${pct(g.ctr)} | ${pct(g.expected)} | ~${g.missedClicks} |`);
    out.push('');
  }

  out.push('## 2. Push onto page 1 — search terms at positions 8–20', '');
  const near = strikingDistance(cur);
  if (!near.length) out.push('_None yet (20+ impressions at positions 8–20)._', '');
  else {
    out.push('| Search term | Page | Impressions | Position |', '|---|---|---|---|');
    for (const a of near) out.push(`| ${a.query} | ${path(a.page)} | ${a.impressions} | ${pos(a.position)} |`);
    out.push('');
  }

  out.push('## 3. Demand by service', '');
  out.push('| Service | Impressions | Clicks | Avg position | Search terms | Top terms |', '|---|---|---|---|---|---|');
  for (const s of serviceDemand(cur)) {
    out.push(`| ${s.service} | ${s.impressions} | ${s.clicks} | ${pos(s.position)} | ${s.queries} | ${s.topQueries.map((q) => q.query).join(', ') || '—'} |`);
  }
  out.push('');

  out.push('## 4. Biggest movers vs previous period', '');
  const trends = pageTrends(cur, prev);
  if (!trends.length) out.push('_Not enough history yet._', '');
  else {
    out.push('| Page | Clicks | Impressions | Position |', '|---|---|---|---|');
    for (const m of trends) out.push(`| ${path(m.page)} | ${m.prevClicks} → **${m.clicks}** | ${m.prevImpressions} → ${m.impressions} | ${pos(m.prevPosition)} → ${pos(m.position)} |`);
    out.push('');
  }

  // Where website leads came from (Lead.trafficChannel, lib/traffic-attribution.ts).
  // The line that answers "is free search actually producing bookings?"
  out.push('## 5. Website leads by channel', '');
  if (!input.leads) out.push('_Not loaded._', '');
  else if (!input.leads.length) out.push('_No website leads with a recorded channel in this period yet. Recording started October 2026._', '');
  else {
    out.push('| Channel | Leads | Booked |', '|---|---|---|');
    for (const l of input.leads) out.push(`| ${CHANNEL_LABELS[l.channel] ?? l.channel} | ${l.leads} | ${l.booked} |`);
    out.push('');
  }
  return out.join('\n');
}
