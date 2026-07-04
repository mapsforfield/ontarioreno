import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import { Resend } from 'resend';
import { prisma } from './prisma.js';
import { requireAdmin } from './auth.js';
import { ensureSchema, withSchema } from './schema.js';

// ─── Grant Radar ─────────────────────────────────────────────────────────────
// Admin-only opportunity-discovery system for Ontario homeowner renovation / ADU
// grant programs. Two jobs (run by the GitHub Actions worker, not Vercel):
//   • DISCOVERY (weekly): for each candidate Municipality, run Tavily searches to
//     find official pages, then have Claude CLASSIFY each page (money / future /
//     zoning / developer / news / noise). Money & future pages become watched
//     GrantSources; the rest are recorded and deactivated so we stop scanning them.
//   • MONITOR (daily): re-fetch active pages, and on content change re-extract the
//     structured program(s). New / materially-changed programs hit the review queue.
// Extraction/classification = Claude via raw fetch (no SDK). Nothing auto-publishes.

const EXTRACT_MODEL = process.env.GRANT_EXTRACT_MODEL ?? 'claude-haiku-4-5-20251001';
const MAX_PAGE_CHARS = 60_000;       // cap on raw text kept for hashing (local, free)
const LLM_INPUT_CHARS = 14_000;      // cap on what we actually send Claude (billed)
const CAD_KEYWORDS = /(adu|additional dwelling|additional residential|secondary suite|garden suite|laneway|basement|granny flat|coach house|second unit|housing accelerator)/i;
// A page with none of these has no funding signal at all — classify it as noise
// locally and skip the (billed) Claude call entirely.
const FUNDING_SIGNAL = /grant|loan|forgivable|rebate|incentive|subsid|fee waiver|community improvement|housing accelerator|\bADU\b|\bARU\b|additional residential|additional dwelling|secondary suite|garden suite|laneway|basement|coach house|second unit|granny flat|renovat/i;

// ─── Municipality registry (cities-first) ─────────────────────────────────────
// Ontario Housing Accelerator Fund recipients + large municipalities — the places
// most likely to run a homeowner ADU/reno grant. Discovery searches each of these.
type SeedMuni = { name: string; slug: string; domain: string; hafRecipient?: boolean; hafAmount?: string };
export const MUNICIPALITY_SEED: SeedMuni[] = [
  { name: 'Hamilton', slug: 'hamilton', domain: 'hamilton.ca', hafRecipient: true, hafAmount: '$93.5M' },
  { name: 'Toronto', slug: 'toronto', domain: 'toronto.ca', hafRecipient: true, hafAmount: '$471M' },
  { name: 'Ottawa', slug: 'ottawa', domain: 'ottawa.ca', hafRecipient: true, hafAmount: '$176M' },
  { name: 'London', slug: 'london', domain: 'london.ca', hafRecipient: true, hafAmount: '$74M' },
  { name: 'Kitchener', slug: 'kitchener', domain: 'kitchener.ca', hafRecipient: true, hafAmount: '$42M' },
  { name: 'Region of Waterloo', slug: 'waterloo-region', domain: 'regionofwaterloo.ca', hafRecipient: true },
  { name: 'Guelph', slug: 'guelph', domain: 'guelph.ca', hafRecipient: true },
  { name: 'Barrie', slug: 'barrie', domain: 'barrie.ca', hafRecipient: true },
  { name: 'Windsor', slug: 'windsor', domain: 'citywindsor.ca', hafRecipient: true },
  { name: 'Brampton', slug: 'brampton', domain: 'brampton.ca', hafRecipient: true },
  { name: 'Mississauga', slug: 'mississauga', domain: 'mississauga.ca', hafRecipient: true },
  { name: 'Kingston', slug: 'kingston', domain: 'cityofkingston.ca', hafRecipient: true },
  { name: 'St. Catharines', slug: 'st-catharines', domain: 'stcatharines.ca', hafRecipient: true },
  { name: 'Burlington', slug: 'burlington', domain: 'burlington.ca', hafRecipient: true },
  { name: 'Whitby', slug: 'whitby', domain: 'whitby.ca', hafRecipient: true },
  { name: 'Oshawa', slug: 'oshawa', domain: 'oshawa.ca', hafRecipient: true },
  { name: 'Vaughan', slug: 'vaughan', domain: 'vaughan.ca', hafRecipient: true },
  { name: 'Markham', slug: 'markham', domain: 'markham.ca', hafRecipient: true },
  { name: 'Richmond Hill', slug: 'richmond-hill', domain: 'richmondhill.ca', hafRecipient: true },
  { name: 'Milton', slug: 'milton', domain: 'milton.ca', hafRecipient: true },
  { name: 'Cambridge', slug: 'cambridge', domain: 'cambridge.ca', hafRecipient: true },
  { name: 'Pickering', slug: 'pickering', domain: 'pickering.ca', hafRecipient: true },
  { name: 'Ajax', slug: 'ajax', domain: 'ajax.ca', hafRecipient: true },
  { name: 'Peterborough', slug: 'peterborough', domain: 'peterborough.ca', hafRecipient: true },
  { name: 'Greater Sudbury', slug: 'sudbury', domain: 'greatersudbury.ca', hafRecipient: true },
];

// A handful of always-watch pages we already know carry homeowner money (or the
// federal HAF hub that tells us which cities got funded). Discovery fills the rest.
type SeedSource = { name: string; url: string; jurisdiction: string; category: string; slug?: string; hafLinked?: boolean };
export const SEED_SOURCES: SeedSource[] = [
  { name: 'Hamilton — ADU & Multi-Plex Housing Incentive (grant up to $40k)', url: 'https://www.hamilton.ca/build-invest-grow/housing-secretariat/housing-accelerator-fund/additional-dwelling-unit-and-multi', jurisdiction: 'Hamilton', category: 'ADU', slug: 'hamilton', hafLinked: true },
  { name: 'London — Additional Residential Units (forgivable loans up to $45k)', url: 'https://london.ca/living-london/building-renovating/additional-residential-units', jurisdiction: 'London', category: 'ADU', slug: 'london', hafLinked: true },
  { name: 'CMHC — Housing Accelerator Fund (which cities got funded)', url: 'https://www.cmhc-schl.gc.ca/professionals/project-funding-and-mortgage-financing/funding-programs/all-funding-programs/housing-accelerator-fund', jurisdiction: 'federal', category: 'general', hafLinked: true },
];

// The search queries run per municipality (scoped to its official domain).
const DISCOVERY_QUERIES = [
  'additional residential unit ARU grant incentive homeowner',
  'secondary suite basement apartment grant program',
  'housing accelerator fund homeowner incentive',
  'community improvement plan residential additional unit grant',
];

// ─── Seeding ──────────────────────────────────────────────────────────────────
export async function seedMunicipalities(): Promise<number> {
  await ensureSchema();
  let added = 0;
  for (const m of MUNICIPALITY_SEED) {
    const existing = await prisma.municipality.findUnique({ where: { slug: m.slug } });
    if (existing) {
      await prisma.municipality.update({
        where: { slug: m.slug },
        data: { name: m.name, domain: m.domain, hafRecipient: m.hafRecipient ?? false, hafAmount: m.hafAmount ?? '' },
      });
      continue;
    }
    await prisma.municipality.create({
      data: { name: m.name, slug: m.slug, domain: m.domain, hafRecipient: m.hafRecipient ?? false, hafAmount: m.hafAmount ?? '' },
    });
    added++;
  }
  return added;
}

/** Upsert the known-good seed pages (by unique URL). Does NOT prune discovered
 *  sources — discovery owns the rest of the list now. */
export async function seedSources(): Promise<number> {
  await ensureSchema();
  await seedMunicipalities();
  let added = 0;
  for (const s of SEED_SOURCES) {
    const muni = s.slug ? await prisma.municipality.findUnique({ where: { slug: s.slug } }) : null;
    const existing = await prisma.grantSource.findUnique({ where: { url: s.url } });
    if (existing) {
      await prisma.grantSource.update({
        where: { url: s.url },
        data: { name: s.name, jurisdiction: s.jurisdiction, category: s.category, hafLinked: s.hafLinked ?? false, municipalityId: muni?.id ?? existing.municipalityId, active: true },
      });
      continue;
    }
    await prisma.grantSource.create({
      data: { name: s.name, url: s.url, jurisdiction: s.jurisdiction, category: s.category, hafLinked: s.hafLinked ?? false, municipalityId: muni?.id ?? null, discoveredVia: 'seed' },
    });
    added++;
  }
  return added;
}

// ─── Fetch + hash ─────────────────────────────────────────────────────────────
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchPageText(url: string): Promise<string> {
  const resp = await fetch(url, {
    // Present as a normal browser — many municipal sites (IIS/.aspx, Cloudflare)
    // reject non-browser user-agents with 403/406.
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-CA,en;q=0.9',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(12_000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const text = htmlToText(await resp.text());
  return text.slice(0, MAX_PAGE_CHARS);
}

// Hash only the funding-relevant slice of a page, so cosmetic edits (footers,
// nav, news tickers) don't register as "changed".
function relevantSignature(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const relevant = sentences.filter((s) => /grant|loan|forgivable|rebate|incentive|\$|deadline|eligib|additional residential|additional dwelling|secondary suite|basement|ADU|ARU|apply|program/i.test(s));
  const joined = (relevant.length ? relevant.join(' ') : text).slice(0, MAX_PAGE_CHARS);
  return createHash('sha256').update(joined).digest('hex');
}

// Extract just the funding-relevant portion of a page to send to the LLM, so we
// don't pay to send nav/footer/boilerplate. Keeps each hit sentence plus one of
// context on either side; falls back to the page head if nothing matches.
function relevantExcerpt(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const keep = new Set<number>();
  sentences.forEach((s, i) => {
    if (FUNDING_SIGNAL.test(s) || /\$\s?\d/.test(s)) { keep.add(i - 1); keep.add(i); keep.add(i + 1); }
  });
  if (keep.size === 0) return text.slice(0, 2_000);
  const excerpt = [...keep].filter((i) => i >= 0 && i < sentences.length).sort((a, b) => a - b).map((i) => sentences[i]).join(' ');
  return excerpt.slice(0, LLM_INPUT_CHARS);
}

// ─── LLM classify + extract (one call) ────────────────────────────────────────
export type PageType = 'money' | 'future' | 'zoning' | 'developer' | 'news' | 'noise' | 'unknown';
export type ExtractedProgram = {
  name: string; city: string; jurisdiction: string; status: string;
  category: string; maxAmount: string; eligibility: string; deadline: string; summary: string;
};
export type Classification = { pageType: PageType; programs: ExtractedProgram[] };

const SYSTEM_PROMPT =
  'You analyze a Canadian (Ontario) government web page for a home-renovation lead-gen company. ' +
  'STEP 1 — classify the page into exactly one pageType:\n' +
  '- money: a LIVE incentive a HOMEOWNER can apply for now (grant, rebate, forgivable loan, fee waiver) for an ADU / additional residential unit / secondary suite / garden or laneway suite / basement apartment / home renovation.\n' +
  '- future: such an incentive that is proposed/planned/coming but not yet open.\n' +
  '- zoning: only zoning/permit/by-law rules for building units, with NO funding.\n' +
  '- developer: funding only for developers/non-profits/multi-residential builders, not individual homeowners.\n' +
  '- news: an announcement/news item with no program a homeowner can apply to.\n' +
  '- noise: unrelated to homeowner renovation incentives.\n' +
  'STEP 2 — ONLY if pageType is "money" or "future", extract the program(s); otherwise programs = [].\n' +
  'Return ONLY JSON (no prose, no code fences): {"pageType":"...","programs":[{"name","city","jurisdiction","status","category","maxAmount","eligibility","deadline","summary"}]}. ' +
  'status: active|upcoming|closed|unknown. category: ADU|basement|energy|accessibility|general. ' +
  'maxAmount/eligibility/deadline: short free-text ("" if unknown). summary <= 240 chars.';

async function callClaude(system: string, user: string, maxTokens = 2000): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({ model: EXTRACT_MODEL, max_tokens: maxTokens, system, messages: [{ role: 'user', content: user }] }),
  });
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
  const data = (await resp.json()) as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text ?? '';
}

export async function classifyAndExtract(pageText: string, ctx: { name: string; url: string; jurisdiction: string }): Promise<Classification> {
  // Cheap local pre-filter: no funding keyword anywhere → it's noise, don't pay
  // for a Claude call at all.
  if (!FUNDING_SIGNAL.test(pageText)) return { pageType: 'noise', programs: [] };
  // Only send Claude the funding-relevant slice (cuts input tokens ~3-5x).
  const excerpt = relevantExcerpt(pageText);
  const raw = await callClaude(SYSTEM_PROMPT, `Source: ${ctx.name} (${ctx.jurisdiction})\nURL: ${ctx.url}\n\nPAGE TEXT (funding-relevant excerpt):\n${excerpt}`);
  return parseClassification(raw);
}

function parseClassification(raw: string): Classification {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end === -1) return { pageType: 'unknown', programs: [] };
  try {
    const obj = JSON.parse(s.slice(start, end + 1)) as { pageType?: string; programs?: unknown };
    const pageType = normalizePageType(String(obj.pageType ?? 'unknown'));
    const programs = Array.isArray(obj.programs) ? (obj.programs as Record<string, unknown>[]).map(normalizeProgram).filter((p) => p.name) : [];
    return { pageType, programs: pageType === 'money' || pageType === 'future' ? programs : [] };
  } catch {
    return { pageType: 'unknown', programs: [] };
  }
}

function normalizePageType(v: string): PageType {
  const s = v.toLowerCase();
  const allowed: PageType[] = ['money', 'future', 'zoning', 'developer', 'news', 'noise'];
  return (allowed.find((a) => s.includes(a)) ?? 'unknown') as PageType;
}

function normalizeProgram(p: Record<string, unknown>): ExtractedProgram {
  return {
    name: String(p.name ?? '').trim(),
    city: String(p.city ?? '').trim(),
    jurisdiction: String(p.jurisdiction ?? '').trim(),
    status: normalizeStatus(String(p.status ?? 'unknown')),
    category: String(p.category ?? 'general').trim().toLowerCase(),
    maxAmount: String(p.maxAmount ?? '').trim(),
    eligibility: String(p.eligibility ?? '').trim(),
    deadline: String(p.deadline ?? '').trim(),
    summary: String(p.summary ?? '').trim().slice(0, 240),
  };
}

function normalizeStatus(s: string): string {
  const v = s.toLowerCase();
  if (['active', 'open', 'ongoing', 'accepting'].some((k) => v.includes(k))) return 'active';
  if (['upcoming', 'planned', 'proposed', 'soon', 'launching'].some((k) => v.includes(k))) return 'upcoming';
  if (['closed', 'ended', 'expired', 'paused', 'full'].some((k) => v.includes(k))) return 'closed';
  return 'unknown';
}

function scoreRelevance(p: ExtractedProgram, source: { hafLinked: boolean }): number {
  let score = 20;
  if (['adu', 'basement'].includes(p.category)) score += 35;
  else if (['accessibility', 'energy'].includes(p.category)) score += 10;
  if (p.status === 'active') score += 25;
  else if (p.status === 'upcoming') score += 15;
  else if (p.status === 'closed') score -= 20;
  if (source.hafLinked) score += 10;
  if (CAD_KEYWORDS.test(`${p.name} ${p.summary} ${p.eligibility}`)) score += 10;
  if (/\$\s?\d/.test(p.maxAmount)) score += 5;
  return Math.max(0, Math.min(100, score));
}

// Identity = source page + program category (stable across the LLM's name drift
// and across amount/deadline changes, which are treated as updatable fields).
function fingerprint(sourceId: string, category: string): string {
  return `${sourceId}:${(category || 'general').toLowerCase().replace(/[^a-z0-9]+/g, '')}`;
}

// Persist a page's classification + extracted programs. Returns what changed.
async function applyClassification(
  source: { id: string; url: string; hafLinked: boolean; jurisdiction: string },
  cls: Classification,
  digest: ScanResult['digest'],
): Promise<{ newPrograms: number; updatedPrograms: number }> {
  let newPrograms = 0, updatedPrograms = 0;
  // Money/future pages stay active & watched; everything else is recorded and
  // deactivated so we don't keep spending scans on zoning/noise pages.
  const keepActive = cls.pageType === 'money' || cls.pageType === 'future';
  await prisma.grantSource.update({ where: { id: source.id }, data: { pageType: cls.pageType, active: keepActive } });
  if (!keepActive) return { newPrograms, updatedPrograms };

  for (const p of cls.programs) {
    const fp = fingerprint(source.id, p.category);
    const score = scoreRelevance(p, { hafLinked: source.hafLinked });
    const existing = await prisma.grantProgram.findFirst({ where: { fingerprint: fp } });
    if (!existing) {
      await prisma.grantProgram.create({
        data: {
          sourceId: source.id, fingerprint: fp, name: p.name, city: p.city || source.jurisdiction,
          jurisdiction: p.jurisdiction || source.jurisdiction, status: p.status, category: p.category,
          maxAmount: p.maxAmount, eligibility: p.eligibility, deadline: p.deadline, summary: p.summary,
          sourceUrl: source.url, relevanceScore: score, reviewState: 'new',
        },
      });
      newPrograms++;
      digest.push({ program: p.name, city: p.city || source.jurisdiction, status: p.status, kind: 'new', url: source.url });
    } else {
      const materiallyChanged = existing.status !== p.status || existing.maxAmount !== p.maxAmount || existing.deadline !== p.deadline;
      await prisma.grantProgram.update({
        where: { id: existing.id },
        data: {
          name: p.name, status: p.status, maxAmount: p.maxAmount, deadline: p.deadline, eligibility: p.eligibility,
          summary: p.summary, relevanceScore: score, lastConfirmedAt: new Date(),
          ...(materiallyChanged ? { changedAt: new Date(), reviewState: existing.reviewState === 'dismissed' ? 'new' : existing.reviewState } : {}),
        },
      });
      if (materiallyChanged) {
        updatedPrograms++;
        digest.push({ program: p.name, city: p.city || source.jurisdiction, status: p.status, kind: 'changed', url: source.url });
      }
    }
  }
  return { newPrograms, updatedPrograms };
}

// ─── MONITOR job ──────────────────────────────────────────────────────────────
export type ScanResult = {
  checked: number; changed: number; newPrograms: number; updatedPrograms: number; errors: number;
  digest: Array<{ program: string; city: string; status: string; kind: 'new' | 'changed'; url: string }>;
};

export async function scanAllSources(opts: { force?: boolean; limit?: number } = {}): Promise<ScanResult> {
  await ensureSchema();
  const sources = await prisma.grantSource.findMany({
    where: { active: true },
    orderBy: { lastCheckedAt: { sort: 'asc', nulls: 'first' } },
    ...(opts.limit ? { take: opts.limit } : {}),
  });
  const result: ScanResult = { checked: 0, changed: 0, newPrograms: 0, updatedPrograms: 0, errors: 0, digest: [] };

  for (const source of sources) {
    result.checked++;
    try {
      const text = await fetchPageText(source.url);
      const sig = relevantSignature(text);
      const unchanged = sig === source.lastHash && !opts.force;
      await prisma.grantSource.update({ where: { id: source.id }, data: { lastCheckedAt: new Date(), lastHash: sig, lastError: '' } });
      if (unchanged) continue;
      result.changed++;
      const cls = await classifyAndExtract(text, { name: source.name, url: source.url, jurisdiction: source.jurisdiction });
      const { newPrograms, updatedPrograms } = await applyClassification(source, cls, result.digest);
      result.newPrograms += newPrograms;
      result.updatedPrograms += updatedPrograms;
    } catch (err) {
      result.errors++;
      await prisma.grantSource.update({
        where: { id: source.id },
        data: { lastCheckedAt: new Date(), lastError: String((err as Error).message ?? err).slice(0, 300) },
      }).catch(() => { /* best-effort */ });
    }
  }
  if (result.digest.length > 0) await sendDigest(result);
  return result;
}

// ─── DISCOVERY job (Tavily) ───────────────────────────────────────────────────
type TavilyResult = { url: string; title?: string };
async function tavilySearch(query: string, includeDomain: string): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY not configured');
  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', max_results: 5, include_domains: includeDomain ? [includeDomain] : undefined }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!resp.ok) throw new Error(`Tavily ${resp.status}: ${(await resp.text().catch(() => '')).slice(0, 200)}`);
  const data = (await resp.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}

export type DiscoveryResult = {
  cities: number; pagesFound: number; moneyPages: number; futurePages: number; errors: number;
  found: Array<{ city: string; url: string; pageType: PageType }>;
};

/** For each candidate municipality (oldest-discovered first), search its domain,
 *  classify each newly-found page, and record money/future pages as watched
 *  sources. Bounded by `limit` cities per run so a CI job stays quick. */
export async function runDiscovery(opts: { limit?: number } = {}): Promise<DiscoveryResult> {
  await ensureSchema();
  await seedMunicipalities();
  const munis = await prisma.municipality.findMany({
    where: { discoveryState: { in: ['candidate', 'watching', 'verified'] } },
    orderBy: { lastDiscoveryAt: { sort: 'asc', nulls: 'first' } },
    ...(opts.limit ? { take: opts.limit } : {}),
  });
  const out: DiscoveryResult = { cities: 0, pagesFound: 0, moneyPages: 0, futurePages: 0, errors: 0, found: [] };
  const digest: ScanResult['digest'] = [];

  for (const muni of munis) {
    out.cities++;
    let sawMoney = false, sawFuture = false;
    try {
      // Gather candidate URLs across all queries, deduped.
      const urls = new Set<string>();
      for (const q of DISCOVERY_QUERIES) {
        const results = await tavilySearch(`${muni.name} ${q}`, muni.domain);
        for (const r of results) if (r.url) urls.add(r.url.split('#')[0]);
      }
      // Classify only URLs we haven't already recorded.
      for (const url of [...urls].slice(0, 8)) {
        const existing = await prisma.grantSource.findUnique({ where: { url } });
        if (existing) { if (existing.pageType === 'money') sawMoney = true; if (existing.pageType === 'future') sawFuture = true; continue; }
        try {
          const text = await fetchPageText(url);
          const cls = await classifyAndExtract(text, { name: `${muni.name} — discovered`, url, jurisdiction: muni.name });
          const keepActive = cls.pageType === 'money' || cls.pageType === 'future';
          const source = await prisma.grantSource.create({
            data: {
              municipalityId: muni.id, name: `${muni.name} — ${cls.programs[0]?.name ?? cls.pageType}`.slice(0, 140),
              url, jurisdiction: muni.name, category: cls.programs[0]?.category ?? '', pageType: cls.pageType,
              discoveredVia: 'tavily', hafLinked: muni.hafRecipient, active: keepActive,
            },
          });
          out.pagesFound++;
          out.found.push({ city: muni.name, url, pageType: cls.pageType });
          if (cls.pageType === 'money') { sawMoney = true; out.moneyPages++; }
          if (cls.pageType === 'future') { sawFuture = true; out.futurePages++; }
          if (keepActive) {
            const applied = await applyClassification({ id: source.id, url, hafLinked: muni.hafRecipient, jurisdiction: muni.name }, cls, digest);
            void applied;
          }
        } catch { out.errors++; /* skip a bad page, keep going */ }
      }
    } catch { out.errors++; }
    const discoveryState = sawMoney ? 'verified' : sawFuture ? 'watching' : 'rejected';
    await prisma.municipality.update({ where: { id: muni.id }, data: { lastDiscoveryAt: new Date(), discoveryState } });
  }
  if (digest.length > 0) await sendDigest({ checked: out.cities, changed: 0, newPrograms: digest.filter((d) => d.kind === 'new').length, updatedPrograms: 0, errors: out.errors, digest });
  return out;
}

// ─── Digest email ─────────────────────────────────────────────────────────────
async function sendDigest(result: ScanResult): Promise<void> {
  if (!process.env.RESEND_API_KEY) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
  const to = process.env.GRANT_ALERT_EMAIL ?? 'info@ontarioreno.ca';
  const rows = result.digest
    .map((d) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${d.kind === 'new' ? '🆕' : '♻️'} <strong>${d.program}</strong></td><td style="padding:6px 10px;border-bottom:1px solid #eee">${d.city}</td><td style="padding:6px 10px;border-bottom:1px solid #eee">${d.status}</td><td style="padding:6px 10px;border-bottom:1px solid #eee"><a href="${d.url}">source</a></td></tr>`)
    .join('');
  const html = `<div style="font-family:system-ui,Arial,sans-serif;max-width:640px">
    <h2>Grant Radar — ${result.newPrograms} new, ${result.updatedPrograms} changed</h2>
    <p style="color:#555">Verify each source before acting.</p>
    <table style="border-collapse:collapse;width:100%"><tbody>${rows}</tbody></table>
    <p style="margin-top:16px"><a href="https://ontarioreno.ca/portal/grants" style="background:#1B3C6C;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Open Grant Radar</a></p>
  </div>`;
  const text = result.digest.map((d) => `- [${d.kind}] ${d.program} (${d.city}) — ${d.status} — ${d.url}`).join('\n');
  try {
    await resend.emails.send({ from, to, subject: `Grant Radar — ${result.newPrograms} new, ${result.updatedPrograms} changed`, html, text });
  } catch (err) {
    console.error('[grant-radar] digest email failed:', err);
  }
}

// ─── Landing-page generation (AI draft → review → publish) ────────────────────
type PageContent = {
  heroEyebrow: string; heroTitle: string; heroSubtitle: string; amountLabel: string; intro: string;
  sections: Array<{ heading: string; body: string }>; eligibility: string[];
  faqs: Array<{ q: string; a: string }>; ctaHeading: string; seoTitle: string; seoDescription: string;
};

const PAGE_SYSTEM =
  'You are a senior conversion copywriter for OntarioReno, an Ontario home-renovation company that helps ' +
  'HOMEOWNERS access government ADU / basement / renovation grants and connects them with vetted contractors. ' +
  'Write a landing page for ONE grant program, aimed at homeowners in that city. Voice: clear, warm, trustworthy, ' +
  'plain-English, benefit-led — never hypey, no guarantees, no invented facts. Use ONLY the program details given; ' +
  'where a detail is unknown, stay general and suggest confirming exact figures with the city. The page goal is to ' +
  'get the homeowner to book a FREE consultation with OntarioReno. Return ONLY JSON (no prose, no code fences) with keys: ' +
  'heroEyebrow (<=40 chars, "City • Grant"), heroTitle (<=75 chars, benefit + amount), heroSubtitle (<=160 chars), ' +
  'amountLabel (short e.g. "Up to $40,000"), intro (one short paragraph), sections (3-5 items {heading, body} covering: ' +
  'what the grant is, what it covers, how OntarioReno helps you qualify & build, why act now), eligibility (3-6 short ' +
  'bullet strings), faqs (4-6 {q,a}), ctaHeading (<=60 chars), seoTitle (<=60 chars), seoDescription (<=155 chars).';

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

function parsePageJson(raw: string): PageContent {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{'); const end = s.lastIndexOf('}');
  const obj = start !== -1 && end !== -1 ? JSON.parse(s.slice(start, end + 1)) : {};
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    heroEyebrow: str(obj.heroEyebrow), heroTitle: str(obj.heroTitle), heroSubtitle: str(obj.heroSubtitle),
    amountLabel: str(obj.amountLabel), intro: str(obj.intro),
    sections: arr(obj.sections).map((x: Record<string, unknown>) => ({ heading: str(x.heading), body: str(x.body) })).filter((x) => x.heading || x.body),
    eligibility: arr(obj.eligibility).map((x: unknown) => str(x)).filter(Boolean),
    faqs: arr(obj.faqs).map((x: Record<string, unknown>) => ({ q: str(x.q), a: str(x.a) })).filter((x) => x.q),
    ctaHeading: str(obj.ctaHeading), seoTitle: str(obj.seoTitle), seoDescription: str(obj.seoDescription),
  };
}

/** Generate a DRAFT landing page from a program (admin reviews before publishing). */
export async function generatePage(programId: string): Promise<{ id: string; slug: string }> {
  await ensureSchema();
  const p = await prisma.grantProgram.findUnique({ where: { id: programId } });
  if (!p) throw new Error('Program not found');
  const user =
    `PROGRAM DETAILS\nName: ${p.name}\nCity: ${p.city}\nJurisdiction: ${p.jurisdiction}\n` +
    `Amount: ${p.maxAmount || 'unknown'}\nStatus: ${p.status}\nDeadline: ${p.deadline || 'unknown'}\n` +
    `Category: ${p.category}\nEligibility: ${p.eligibility || 'unknown'}\nSummary: ${p.summary}\nOfficial source: ${p.sourceUrl}`;
  const content = parsePageJson(await callClaude(PAGE_SYSTEM, user, 2500));
  const base = slugify(`${p.city || p.jurisdiction}-${p.category || 'adu'}-grant`) || `grant-${Date.now()}`;
  let slug = base, n = 2;
  while (await prisma.grantLandingPage.findUnique({ where: { slug } })) slug = `${base}-${n++}`;
  const page = await prisma.grantLandingPage.create({
    data: {
      programId: p.id, slug, city: p.city || p.jurisdiction, status: 'draft',
      heroEyebrow: content.heroEyebrow, heroTitle: content.heroTitle, heroSubtitle: content.heroSubtitle,
      amountLabel: content.amountLabel || p.maxAmount, intro: content.intro,
      sections: content.sections, eligibility: content.eligibility, faqs: content.faqs,
      ctaHeading: content.ctaHeading, ctaText: 'Book a free consultation',
      seoTitle: content.seoTitle, seoDescription: content.seoDescription,
      programSnapshot: { status: p.status, maxAmount: p.maxAmount, deadline: p.deadline },
    },
  });
  return { id: page.id, slug: page.slug };
}

/** Public: fetch a PUBLISHED page by slug (unauthenticated, for the live site). */
export async function getPublishedPage(slug: string) {
  return withSchema(() => prisma.grantLandingPage.findFirst({ where: { slug, status: 'published' } }));
}

/** Public handler: GET /api/appointments?resource=grant-page&slug=… (no auth). */
export async function handlePublicGrantPage(req: VercelRequest, res: VercelResponse): Promise<void> {
  const slug = String(req.query['slug'] ?? '');
  const page = slug ? await getPublishedPage(slug) : null;
  if (!page) { res.status(404).json({ error: 'Not found.' }); return; }
  res.status(200).json(page);
}

// ─── Server-side HTML render (SEO) ────────────────────────────────────────────
// The public /grants/:slug URL is served as full HTML (content + meta + FAQ
// schema present on first byte) so it indexes/ranks like a real static page,
// not a client-fetched SPA. Rendered on the fly from the DB; the lead form is
// plain HTML + a tiny inline script, so the page works with zero JavaScript.

const GRANT_LEAD_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyi1JG7OXDwCghiVQb2PaOEME7ZByUa8Mxl3N7xbTCCaL07Bdrx3h01dA4YisDPV_Yw/exec';

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Safe JSON for a <script type="application/ld+json"> block.
function ldJson(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

type RenderPage = {
  slug: string; city: string; heroEyebrow: string; heroTitle: string; heroSubtitle: string;
  amountLabel: string; intro: string; ctaHeading: string; ctaText: string;
  seoTitle: string; seoDescription: string;
  sections: unknown; eligibility: unknown; faqs: unknown;
};

export function renderPageHtml(page: RenderPage): string {
  const sections = (Array.isArray(page.sections) ? page.sections : []) as Array<{ heading: string; body: string }>;
  const eligibility = (Array.isArray(page.eligibility) ? page.eligibility : []) as string[];
  const faqs = (Array.isArray(page.faqs) ? page.faqs : []) as Array<{ q: string; a: string }>;
  const title = page.seoTitle || page.heroTitle;
  const desc = page.seoDescription || page.heroSubtitle;
  const url = `https://ontarioreno.ca/grants/${page.slug}`;
  const cta = page.ctaText || 'Book a free consultation';

  const faqLd = faqs.length
    ? ldJson({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) })
    : '';
  const serviceLd = ldJson({
    '@context': 'https://schema.org', '@type': 'GovernmentService',
    name: page.heroTitle, serviceType: 'Home renovation / ADU grant assistance',
    areaServed: page.city || 'Ontario', provider: { '@type': 'Organization', name: 'OntarioReno', url: 'https://ontarioreno.ca' },
    description: desc,
  });

  // Internal links (SEO) — point at existing hub/topic pages.
  const internal = [
    ['/', 'Home'], ['/basements', 'Basement Apartments'], ['/legal-suites', 'Legal Suites'],
    ['/garden-suites-laneway-suites-ontario', 'Garden & Laneway Suites'], ['/costs', 'Renovation Costs'],
    ['/financing', 'Financing'], ['/cities', 'All Cities'],
  ];

  const sectionsHtml = sections.map((s) => `
      <div class="card">
        <h3>${esc(s.heading)}</h3>
        <p>${esc(s.body)}</p>
      </div>`).join('');
  const eligibilityHtml = eligibility.map((e) => `<li>${esc(e)}</li>`).join('');
  const faqsHtml = faqs.map((f) => `
      <details class="faq">
        <summary>${esc(f.q)}</summary>
        <p>${esc(f.a)}</p>
      </details>`).join('');
  const internalHtml = internal.map(([href, label]) => `<a href="${esc(href)}">${esc(label)}</a>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(url)}">
<meta name="robots" content="index,follow">
${faqLd ? `<script type="application/ld+json">${faqLd}</script>` : ''}
<script type="application/ld+json">${serviceLd}</script>
<style>
:root{--navy:#1B3C6C;--navy2:#2b5a96;--emerald:#059669;--slate:#475569;--ink:#0f172a}
*{box-sizing:border-box}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:var(--ink);background:#f8fafc;line-height:1.55}
a{color:var(--navy)}
.wrap{max-width:1080px;margin:0 auto;padding:0 20px}
header.site{background:#fff;border-bottom:1px solid #e2e8f0}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;height:64px}
header.site .logo{font-weight:800;font-size:20px;color:var(--navy);text-decoration:none;letter-spacing:-.02em}
header.site nav a{margin-left:18px;font-size:14px;font-weight:600;color:var(--slate);text-decoration:none}
.hero{background:#0f172a;color:#fff}
.hero .grid{display:grid;grid-template-columns:1fr;gap:32px;padding:56px 0}
@media(min-width:860px){.hero .grid{grid-template-columns:1.1fr .9fr;padding:72px 0}}
.eyebrow{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.1);padding:8px 14px;border-radius:999px;font-size:13px;font-weight:600;margin-bottom:18px}
.hero h1{font-size:34px;line-height:1.08;letter-spacing:-.03em;margin:0 0 16px}
@media(min-width:860px){.hero h1{font-size:46px}}
.amount{display:inline-block;background:rgba(16,185,129,.16);color:#6ee7b7;font-weight:800;font-size:20px;padding:8px 16px;border-radius:12px;margin-bottom:16px}
.hero p.sub{font-size:18px;color:#cbd5e1;max-width:34em;margin:0 0 24px}
.btn{display:inline-flex;align-items:center;gap:8px;background:var(--navy2);color:#fff;font-weight:700;padding:14px 26px;border-radius:12px;text-decoration:none;border:0;cursor:pointer;font-size:16px}
.btn:hover{background:#3163a3}
.trust{margin-top:18px;color:#94a3b8;font-size:14px}
section.block{padding:56px 0}
section.alt{background:#fff}
.lead{max-width:44em;margin:0 auto;text-align:center;font-size:20px;color:var(--slate)}
.h2{font-size:30px;letter-spacing:-.03em;text-align:center;margin:0 0 28px}
.cards{display:grid;grid-template-columns:1fr;gap:20px}
@media(min-width:760px){.cards{grid-template-columns:1fr 1fr}}
.card{background:#f8fafc;border:1px solid #eef2f7;border-radius:16px;padding:24px}
.card h3{margin:0 0 8px;font-size:19px;letter-spacing:-.02em}
.card p{margin:0;color:var(--slate)}
ul.elig{list-style:none;padding:0;max-width:44em;margin:0 auto;display:grid;gap:12px}
ul.elig li{background:#fff;border:1px solid #eef2f7;border-radius:12px;padding:14px 16px 14px 44px;position:relative}
ul.elig li:before{content:"✓";position:absolute;left:16px;color:var(--emerald);font-weight:800}
.faq{border-bottom:1px solid #e2e8f0;padding:14px 0;max-width:44em;margin:0 auto}
.faq summary{font-weight:700;cursor:pointer}
.faq p{color:var(--slate)}
.formcard{background:#fff;border-radius:18px;padding:26px;box-shadow:0 20px 40px rgba(15,23,42,.14)}
.formcard h3{margin:0 0 4px;font-size:19px}
.formcard p.small{margin:0 0 16px;color:#64748b;font-size:14px}
.formcard label{display:block;font-size:13px;font-weight:700;color:#334155;margin:12px 0 6px}
.formcard input{width:100%;padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;font-size:15px}
.formcard button{width:100%;margin-top:18px}
.hidden{display:none}
.cta{background:#0f172a;color:#fff;text-align:center}
.cta .h2{color:#fff}
.disc{color:#94a3b8;font-size:12px;max-width:40em;margin:18px auto 0}
footer.site{background:#0b1220;color:#94a3b8;padding:36px 0;font-size:14px}
footer.site .links{display:flex;flex-wrap:wrap;gap:16px;margin-bottom:16px}
footer.site a{color:#cbd5e1;text-decoration:none}
.ok{background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;border-radius:12px;padding:18px;text-align:center}
</style>
</head>
<body>
<header class="site"><div class="wrap">
  <a class="logo" href="/">OntarioReno</a>
  <nav>${internal.slice(0, 5).map(([h, l]) => `<a href="${esc(h)}">${esc(l)}</a>`).join('')}</nav>
</div></header>

<section class="hero"><div class="wrap"><div class="grid">
  <div>
    ${page.heroEyebrow ? `<div class="eyebrow">📍 ${esc(page.heroEyebrow)}</div>` : ''}
    <h1>${esc(page.heroTitle)}</h1>
    ${page.amountLabel ? `<div class="amount">${esc(page.amountLabel)}</div>` : ''}
    <p class="sub">${esc(page.heroSubtitle)}</p>
    <a class="btn" href="#apply">${esc(cta)} →</a>
    <div class="trust">🛡️ Free, no-obligation consultation with a local specialist</div>
  </div>
  <div id="apply">
    <form class="formcard" id="leadform">
      <h3>Check your eligibility — free</h3>
      <p class="small">A local specialist will call you back. No cost, no obligation.</p>
      <div id="fields">
        <label>Full name</label><input name="name" autocomplete="name" required>
        <label>Phone</label><input name="phone" inputmode="tel" autocomplete="tel">
        <label>Email</label><input name="email" inputmode="email" autocomplete="email">
        <label>Property address (optional)</label><input name="address" autocomplete="street-address">
        <input class="hidden" name="companyWebsite" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="btn" type="submit">${esc(cta)}</button>
      </div>
      <div id="thanks" class="ok hidden"><strong>You're on the list.</strong><br>We'll call you shortly to confirm your eligibility and next steps.</div>
    </form>
  </div>
</div></div></section>

${page.intro ? `<section class="block"><div class="wrap"><p class="lead">${esc(page.intro)}</p></div></section>` : ''}

${sections.length ? `<section class="block alt"><div class="wrap"><div class="cards">${sectionsHtml}</div></div></section>` : ''}

${eligibility.length ? `<section class="block"><div class="wrap"><h2 class="h2">Do you qualify?</h2><ul class="elig">${eligibilityHtml}</ul></div></section>` : ''}

${faqs.length ? `<section class="block alt"><div class="wrap"><h2 class="h2">Common questions</h2>${faqsHtml}</div></section>` : ''}

<section class="block cta"><div class="wrap">
  <h2 class="h2">${esc(page.ctaHeading || `Ready to explore your ${page.city} grant?`)}</h2>
  <p style="color:#cbd5e1">Book a free consultation — we'll confirm your eligibility and map out next steps.</p>
  <p><a class="btn" href="#apply">${esc(cta)} →</a></p>
  <p class="disc">Grant amounts and eligibility are set by the municipality and can change — we'll confirm the current details with you directly.</p>
</div></section>

<footer class="site"><div class="wrap">
  <div class="links">${internalHtml}</div>
  <div>© ${new Date().getFullYear()} OntarioReno — helping Ontario homeowners access renovation grants and vetted contractors.</div>
</div></footer>

<script>
(function(){
  var f=document.getElementById('leadform');
  if(!f)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(f.companyWebsite.value)return;
    var name=f.name.value.trim();
    if(!name||(!f.phone.value.trim()&&!f.email.value.trim())){alert('Please add your name and a phone or email.');return;}
    var payload={type:'grant',source:'grant-${esc(page.slug)}',name:name,phone:f.phone.value.trim(),email:f.email.value.trim(),address:f.address.value.trim(),city:${JSON.stringify(page.city)},projectType:'ADU / Grant',notes:'Grant landing page lead — ${esc(page.heroTitle)} (${esc(page.city)}). '+location.href,pageUrl:location.href};
    fetch(${JSON.stringify(GRANT_LEAD_ENDPOINT)},{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload)}).catch(function(){});
    document.getElementById('fields').classList.add('hidden');
    document.getElementById('thanks').classList.remove('hidden');
  });
})();
</script>
</body>
</html>`;
}

/** Public: GET /api/appointments?resource=grant-html&slug=… → full HTML page. */
export async function handleGrantHtml(req: VercelRequest, res: VercelResponse): Promise<void> {
  const slug = String(req.query['slug'] ?? '');
  const page = slug ? await getPublishedPage(slug) : null;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (!page) {
    res.status(404).send('<!DOCTYPE html><meta charset="utf-8"><title>Not found</title><p>This page isn’t available. <a href="https://ontarioreno.ca">Return to OntarioReno</a>.</p>');
    return;
  }
  // Short CDN cache: fast + crawler-friendly, refreshes soon after an edit.
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600');
  res.status(200).send(renderPageHtml(page as unknown as RenderPage));
}

// Flag a live page whose underlying program has materially changed since drafting.
function pageDrift(page: { programSnapshot: unknown }, program?: { status: string; maxAmount: string; deadline: string } | null): boolean {
  if (!program) return false;
  const snap = (page.programSnapshot ?? {}) as { status?: string; maxAmount?: string; deadline?: string };
  return snap.status !== program.status || snap.maxAmount !== program.maxAmount || snap.deadline !== program.deadline;
}

// ─── HTTP handlers (folded into the appointments function; Hobby 12-fn cap) ────
export async function handleGrantScanCron(req: VercelRequest, res: VercelResponse): Promise<void> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.authorization !== `Bearer ${cronSecret}`) { res.status(401).json({ error: 'Unauthorized.' }); return; }
  await seedSources();
  const limit = req.query['limit'] ? Math.max(Number(req.query['limit']) || 0, 1) : undefined;
  const result = await scanAllSources({ limit });
  res.status(200).json({ ok: true, ...result });
}

export async function handleGrantsApi(req: VercelRequest, res: VercelResponse): Promise<void> {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  if (req.method === 'GET') {
    const data = await withSchema(async () => {
      const [sources, programs, municipalities, pages] = await Promise.all([
        prisma.grantSource.findMany({ orderBy: { name: 'asc' } }),
        prisma.grantProgram.findMany({ orderBy: [{ relevanceScore: 'desc' }, { firstSeenAt: 'desc' }] }),
        prisma.municipality.findMany({ orderBy: { name: 'asc' } }),
        prisma.grantLandingPage.findMany({ orderBy: { updatedAt: 'desc' } }),
      ]);
      const byId = new Map(programs.map((p) => [p.id, p]));
      // Attach live drift flag (program changed since the page was drafted).
      const landingPages = pages.map((pg) => ({ ...pg, drift: pageDrift(pg, pg.programId ? byId.get(pg.programId) : null) }));
      return { sources, programs, municipalities, landingPages };
    });
    res.status(200).json(data);
    return;
  }

  if (req.method === 'POST') {
    const action = req.query['action'];
    if (action === 'seed') { const added = await seedSources(); res.status(200).json({ ok: true, added }); return; }
    if (action === 'scan') {
      await seedSources();
      const limit = Math.min(Math.max(Number(req.query['limit'] ?? 6) || 6, 1), 8);
      res.status(200).json({ ok: true, ...(await scanAllSources({ force: true, limit })) });
      return;
    }
    if (action === 'discover') {
      // Bounded manual discovery (few cities) so it can run within the Vercel
      // timeout; the GitHub Actions worker does the full weekly sweep.
      const limit = Math.min(Math.max(Number(req.query['limit'] ?? 2) || 2, 1), 4);
      res.status(200).json({ ok: true, ...(await runDiscovery({ limit })) });
      return;
    }
    if (action === 'generate-page') {
      const id = String(req.query['id'] ?? '');
      if (!id) { res.status(400).json({ error: 'program id required.' }); return; }
      res.status(200).json({ ok: true, ...(await generatePage(id)) });
      return;
    }
    if (action === 'save-page') {
      // Save admin edits and/or publish state. Body carries any subset of fields.
      const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {};
      const id = String(body.id ?? '');
      if (!id) { res.status(400).json({ error: 'page id required.' }); return; }
      const editable = ['slug', 'city', 'status', 'heroEyebrow', 'heroTitle', 'heroSubtitle', 'amountLabel', 'intro', 'sections', 'eligibility', 'faqs', 'ctaHeading', 'ctaText', 'seoTitle', 'seoDescription'] as const;
      const data: Record<string, unknown> = {};
      for (const k of editable) if (k in body) data[k] = body[k];
      if (data.status === 'published') { data.publishedAt = new Date(); data.needsReview = false; }
      const updated = await withSchema(() => prisma.grantLandingPage.update({ where: { id }, data }));
      res.status(200).json({ ok: true, page: updated });
      return;
    }
    if (action === 'delete-page') {
      const id = String(req.query['id'] ?? '');
      if (!id) { res.status(400).json({ error: 'page id required.' }); return; }
      await withSchema(() => prisma.grantLandingPage.delete({ where: { id } }));
      res.status(200).json({ ok: true });
      return;
    }
    if (action === 'reset') {
      await withSchema(async () => {
        await prisma.grantProgram.deleteMany({});
        await prisma.grantSource.deleteMany({});
        await prisma.municipality.deleteMany({});
      });
      await seedSources();
      res.status(200).json({ ok: true, reset: true, ...(await scanAllSources({ force: true, limit: 8 })) });
      return;
    }
    res.status(400).json({ error: 'Unknown action.' });
    return;
  }

  if (req.method === 'PATCH') {
    const id = String(req.query['id'] ?? '');
    const body = (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body) ?? {};
    const reviewState = String(body.reviewState ?? '');
    if (!id || !['new', 'reviewed', 'targeting', 'dismissed'].includes(reviewState)) { res.status(400).json({ error: 'id and valid reviewState required.' }); return; }
    res.status(200).json(await withSchema(() => prisma.grantProgram.update({ where: { id }, data: { reviewState } })));
    return;
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
