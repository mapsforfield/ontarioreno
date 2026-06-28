// Applies the generated schema DDL to the database at deploy/build time, so new
// columns exist BEFORE any request reads them. Runs in the Vercel build env
// (where the DB is reachable). It is best-effort about CONNECTIVITY — if the DB
// can't be reached (e.g. local dev, or a transient blip), it skips and lets the
// runtime self-heal (lib/schema.ts withSchema) reconcile instead. It is STRICT
// about DDL correctness — a real failed statement fails the build.
import { neon } from '@neondatabase/serverless';
import { SCHEMA_STATEMENTS } from '../lib/schema-ddl.generated.js';

const url =
  process.env.POSTGRES_PRISMA_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  '';

if (!url) {
  console.warn('[apply-schema] No database URL in env — skipping (runtime self-heal will reconcile).');
  process.exit(0);
}

const sql = neon(url);

// Connectivity probe — distinguishes "can't reach DB" (skip) from "DDL error" (fail).
try {
  await sql.query('SELECT 1');
} catch (err) {
  console.warn('[apply-schema] database not reachable from this environment — skipping (runtime self-heal will reconcile):', err?.message ?? err);
  process.exit(0);
}

let failed = 0;
for (const stmt of SCHEMA_STATEMENTS) {
  try {
    await sql.query(stmt);
  } catch (err) {
    failed++;
    console.error('[apply-schema] FAILED:', stmt.split('\n')[0], '—', err?.message ?? err);
  }
}

console.log(`[apply-schema] reconciled schema: ${SCHEMA_STATEMENTS.length - failed}/${SCHEMA_STATEMENTS.length} statements applied`);
if (failed > 0) {
  console.error(`[apply-schema] ${failed} statement(s) failed — blocking the build.`);
  process.exit(1);
}
