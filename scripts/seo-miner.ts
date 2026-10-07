/**
 * SEO miner worker — runs nightly on GitHub Actions (.github/workflows/seo-miner.yml),
 * alongside Grant Radar. Pulls Google Search Console data into SearchPerformance
 * and prints a ranked to-do list (lib/seo-miner.ts).
 *
 * Usage:
 *   npx tsx scripts/seo-miner.ts sync [days]   pull the last N days (default 7) and upsert
 *   npx tsx scripts/seo-miner.ts backfill      pull all 16 months Search Console keeps
 *   npx tsx scripts/seo-miner.ts report [days] compare the latest N days (default 28) to the N before
 *
 * Required env: DATABASE_URL, GSC_SERVICE_ACCOUNT_JSON (read-only service account key)
 *
 * READ-ONLY toward Google and toward the public site: this writes to one table
 * of its own and sends nothing to anyone. The report goes to the job log and,
 * on GitHub Actions, the run's summary page.
 *
 * Sync re-pulls the last 7 days every night on purpose: Search Console's most
 * recent ~3 days are preliminary and get revised, and the upsert replaces them.
 */
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

neonConfig.webSocketConstructor = ws;

const DAY = 86_400_000;
const isoDay = (t: number) => new Date(t).toISOString().slice(0, 10);

async function main(): Promise<void> {
  const mode = (process.argv[2] ?? 'sync').toLowerCase();
  const arg = process.argv[3] ? Number(process.argv[3]) : undefined;

  const { prisma } = await import('../lib/prisma.js');
  const { ensureSchema } = await import('../lib/schema.js');
  await ensureSchema();

  if (mode === 'sync' || mode === 'backfill') {
    const { querySearchAnalytics } = await import('../lib/search-console.js');
    const days = mode === 'backfill' ? 486 : (arg ?? 7);
    const end = Date.now();
    // Chunks of 30 days keep each request well inside the API's row paging.
    let written = 0;
    for (let chunkEnd = end; chunkEnd > end - days * DAY; chunkEnd -= 30 * DAY) {
      const chunkStart = Math.max(end - days * DAY, chunkEnd - 29 * DAY);
      const range = { startDate: isoDay(chunkStart), endDate: isoDay(chunkEnd) };
      const [pages, queries] = await Promise.all([
        querySearchAnalytics(process.env.GSC_SERVICE_ACCOUNT_JSON, { ...range, dimensions: ['date', 'page'] }),
        querySearchAnalytics(process.env.GSC_SERVICE_ACCOUNT_JSON, { ...range, dimensions: ['date', 'page', 'query'] }),
      ]);
      const rows = [
        ...pages.map((r) => ({ date: r.keys[0], page: r.keys[1], query: '', ...r })),
        ...queries.map((r) => ({ date: r.keys[0], page: r.keys[1], query: r.keys[2], ...r })),
      ];
      written += await upsert(prisma, rows);
      console.log(`[seo-miner:${mode}] ${range.startDate}..${range.endDate}: ${pages.length} page-days, ${queries.length} query rows`);
    }
    console.log(`[seo-miner:${mode}] upserted ${written} rows`);
  } else if (mode === 'report') {
    const days = arg ?? 28;
    const { renderReport } = await import('../lib/seo-miner.js');
    const latest = await prisma.searchPerformance.findFirst({ orderBy: { date: 'desc' }, select: { date: true } });
    if (!latest) {
      console.log('[seo-miner:report] no data yet — run sync or backfill first');
      return;
    }
    // Windows end at the newest day we hold, not today: Search Console lags
    // 2–3 days, and ending on empty days would read as a traffic drop.
    const endT = Date.parse(latest.date);
    const curStart = isoDay(endT - (days - 1) * DAY);
    const prevStart = isoDay(endT - (2 * days - 1) * DAY);
    const prevEnd = isoDay(endT - days * DAY);
    const select = { date: true, page: true, query: true, clicks: true, impressions: true, position: true };
    const [current, previous] = await Promise.all([
      prisma.searchPerformance.findMany({ where: { date: { gte: curStart, lte: latest.date } }, select }),
      prisma.searchPerformance.findMany({ where: { date: { gte: prevStart, lte: prevEnd } }, select }),
    ]);
    // Website leads in the same window, by where the visit started (Lead.trafficChannel).
    const leads = await prisma.$queryRawUnsafe<{ channel: string; leads: number; booked: number }[]>(
      `SELECT "trafficChannel" AS channel, COUNT(*)::int AS leads,
              SUM(CASE WHEN "appointmentId" IS NOT NULL THEN 1 ELSE 0 END)::int AS booked
         FROM "Lead"
        WHERE "deletedAt" IS NULL AND source IN ('consultation_flow', 'website_intake')
          AND "trafficChannel" <> '' AND "submittedAt" >= $1::date
        GROUP BY 1 ORDER BY 2 DESC`,
      curStart,
    );
    const md = renderReport({ start: curStart, end: latest.date, current, previous, leads });
    console.log(md);
    if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n');
  } else {
    throw new Error(`Unknown mode "${mode}" — expected "sync", "backfill", or "report".`);
  }
}

type Row = { date: string; page: string; query: string; clicks: number; impressions: number; position: number };

/** Bulk upsert on (date, page, query). Raw SQL: one statement per 500 rows instead of one round trip per row. */
async function upsert(prisma: { $executeRawUnsafe: (sql: string, ...values: unknown[]) => Promise<number> }, rows: Row[]): Promise<number> {
  let n = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const values: unknown[] = [];
    const tuples = batch.map((r, j) => {
      values.push(randomUUID(), r.date, r.page, r.query, Math.round(r.clicks), Math.round(r.impressions), r.position);
      const b = j * 7;
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, CURRENT_TIMESTAMP)`;
    });
    n += await prisma.$executeRawUnsafe(
      `INSERT INTO "SearchPerformance" ("id", "date", "page", "query", "clicks", "impressions", "position", "updatedAt")
       VALUES ${tuples.join(', ')}
       ON CONFLICT ("date", "page", "query") DO UPDATE SET
         "clicks" = EXCLUDED."clicks", "impressions" = EXCLUDED."impressions",
         "position" = EXCLUDED."position", "updatedAt" = CURRENT_TIMESTAMP`,
      ...values,
    );
  }
  return n;
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error('[seo-miner] worker failed:', err); process.exit(1); });
