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
      const [sources, programs, municipalities] = await Promise.all([
        prisma.grantSource.findMany({ orderBy: { name: 'asc' } }),
        prisma.grantProgram.findMany({ orderBy: [{ relevanceScore: 'desc' }, { firstSeenAt: 'desc' }] }),
        prisma.municipality.findMany({ orderBy: { name: 'asc' } }),
      ]);
      return { sources, programs, municipalities };
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
