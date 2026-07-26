// Applies the generated schema DDL to the database at deploy/build time, so new
// columns exist BEFORE any request reads them. Runs in the Vercel build env
// (where the DB is reachable). It is best-effort about CONNECTIVITY — if the DB
// can't be reached (e.g. local dev, or a transient blip), it skips and lets the
// runtime self-heal (lib/schema.ts withSchema) reconcile instead. It is STRICT
// about DDL correctness — a real failed statement fails the build.
import { neon } from '@neondatabase/serverless';
import { SCHEMA_STATEMENTS } from '../lib/schema-ddl.generated.js';
import { resolveDatabaseUrl, describeDatabaseSource, isPreviewEnv } from '../lib/db-url.js';

// On a Preview deployment this resolves ONLY from PREVIEW_DATABASE_* and throws
// if none is set — a Preview build must never apply DDL to production, and the
// unprefixed variables are still scoped to Preview, so silence is not an option.
let url;
try {
  url = resolveDatabaseUrl();
} catch (err) {
  console.error(`[apply-schema] ${err?.message ?? err}`);
  process.exit(1);
}

console.log(`[apply-schema] database source: ${describeDatabaseSource()}`);

if (!url) {
  if (isPreviewEnv()) {
    // Unreachable in practice (resolveDatabaseUrl throws first), but makes the
    // fail-closed guarantee explicit rather than incidental.
    console.error('[apply-schema] Preview deployment without a Preview database URL — refusing to continue.');
    process.exit(1);
  }
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
