import { prisma } from './prisma.js';
import { SCHEMA_STATEMENTS } from './schema-ddl.generated.js';

// ─── Schema self-heal ─────────────────────────────────────────────────────────
// The production database is migrated lazily (it can't be reached from local dev),
// so the app reconciles its own schema from the SINGLE source of truth generated
// off prisma/schema.prisma. ensureSchema() applies every idempotent statement;
// withSchema() wraps a query so that a "missing column/table" error triggers a
// one-time reconcile and a transparent retry — making schema drift self-correct
// on first access instead of surfacing as a 500 / empty screen.

let ensured = false;
let inFlight: Promise<void> | null = null;

/** Apply all idempotent schema statements once per warm instance. */
export async function ensureSchema(): Promise<void> {
  if (ensured) return;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    for (const sql of SCHEMA_STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (err) {
        // Individual statement failures are non-fatal (e.g. a permission quirk);
        // log and keep going so one bad statement can't block the rest.
        console.error('[ensureSchema] statement failed (continuing):', sql.split('\n')[0], err);
      }
    }
    ensured = true;
    inFlight = null;
  })();
  return inFlight;
}

/** True for "relation/column does not exist" style errors (Prisma or raw PG). */
export function isSchemaError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null;
  // Prisma: P2021 table does not exist, P2022 column does not exist.
  if (e?.code === 'P2021' || e?.code === 'P2022') return true;
  const msg = String(e?.message ?? err ?? '');
  // Raw Postgres: 42P01 undefined_table, 42703 undefined_column.
  return /does not exist|42P01|42703|undefined column|undefined table/i.test(msg);
}

/**
 * Run a DB operation; if it fails because of schema drift (a missing table or
 * column), reconcile the schema once and retry exactly once. Any other error
 * propagates unchanged.
 */
export async function withSchema<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isSchemaError(err)) throw err;
    await ensureSchema();
    return await fn();
  }
}
