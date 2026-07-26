import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveDatabaseUrl,
  isPreviewEnv,
  PreviewDatabaseConfigError,
  PREVIEW_PREFIX,
} from './db-url.js';

// ─── Preview must never reach production ──────────────────────────────────────
// The unprefixed Neon variables (POSTGRES_PRISMA_URL, DATABASE_URL, …) remain
// scoped to BOTH Production and Preview. So on every Preview deployment the
// production URL is sitting right there in the environment. These tests pin the
// rule that it is never selected, and that a missing Preview variable fails
// closed rather than falling back.

const PROD = 'postgres://prod-user@prod-host/prod-db?sslmode=require';
const PREVIEW = 'postgres://preview-user@preview-host/preview-db?sslmode=require';

/** Every unprefixed production variable set — the ambient danger in Preview. */
const productionVars = {
  POSTGRES_PRISMA_URL: PROD,
  DATABASE_URL: PROD,
  POSTGRES_URL: PROD,
};

test('preview resolves from the prefixed variable', () => {
  const url = resolveDatabaseUrl({
    VERCEL_ENV: 'preview',
    [`${PREVIEW_PREFIX}POSTGRES_PRISMA_URL`]: PREVIEW,
  } as never);
  assert.equal(url, PREVIEW);
});

test('preview accepts any supported prefixed suffix', () => {
  for (const suffix of ['POSTGRES_PRISMA_URL', 'DATABASE_URL', 'POSTGRES_URL', 'URL']) {
    const url = resolveDatabaseUrl({
      VERCEL_ENV: 'preview',
      [`${PREVIEW_PREFIX}${suffix}`]: PREVIEW,
    } as never);
    assert.equal(url, PREVIEW, `expected ${PREVIEW_PREFIX}${suffix} to be accepted`);
  }
});

test('preview prefers the prefixed variable even when production vars are present', () => {
  const url = resolveDatabaseUrl({
    VERCEL_ENV: 'preview',
    ...productionVars,
    [`${PREVIEW_PREFIX}POSTGRES_PRISMA_URL`]: PREVIEW,
  } as never);
  assert.equal(url, PREVIEW);
  assert.notEqual(url, PROD);
});

test('FAIL CLOSED: preview with no prefixed variable throws instead of using production', () => {
  assert.throws(
    () => resolveDatabaseUrl({ VERCEL_ENV: 'preview', ...productionVars } as never),
    PreviewDatabaseConfigError,
    'a Preview deployment missing its own database URL must not fall back to production'
  );
});

test('FAIL CLOSED: an empty prefixed variable is not a usable value', () => {
  assert.throws(
    () =>
      resolveDatabaseUrl({
        VERCEL_ENV: 'preview',
        ...productionVars,
        [`${PREVIEW_PREFIX}POSTGRES_PRISMA_URL`]: '',
        [`${PREVIEW_PREFIX}DATABASE_URL`]: '   ',
      } as never),
    PreviewDatabaseConfigError
  );
});

test('FAIL CLOSED: an unrelated PREVIEW_DATABASE_* variable does not satisfy the requirement', () => {
  assert.throws(
    () =>
      resolveDatabaseUrl({
        VERCEL_ENV: 'preview',
        ...productionVars,
        [`${PREVIEW_PREFIX}PGHOST`]: 'preview-host',
      } as never),
    PreviewDatabaseConfigError
  );
});

test('preview never returns the production URL under any combination', () => {
  const combos: Array<Record<string, string>> = [
    { VERCEL_ENV: 'preview', ...productionVars },
    { VERCEL_ENV: 'preview', ...productionVars, [`${PREVIEW_PREFIX}PGHOST`]: 'h' },
    { VERCEL_ENV: 'preview', ...productionVars, [`${PREVIEW_PREFIX}DATABASE_URL`]: '' },
  ];
  for (const env of combos) {
    let returned: string | null = null;
    try {
      returned = resolveDatabaseUrl(env as never);
    } catch {
      // Throwing is the correct outcome.
    }
    assert.notEqual(returned, PROD, 'production URL must never be returned in preview');
  }
});

test('the failure message never leaks a connection string', () => {
  try {
    resolveDatabaseUrl({
      VERCEL_ENV: 'preview',
      ...productionVars,
      [`${PREVIEW_PREFIX}PGHOST`]: 'preview-host',
    } as never);
    assert.fail('expected a throw');
  } catch (err) {
    const message = (err as Error).message;
    assert.ok(!message.includes(PROD), 'must not include the production URL');
    assert.ok(!message.includes(PREVIEW), 'must not include a preview URL');
    // It should name the variable it DID find, to make misconfiguration obvious.
    assert.ok(message.includes(`${PREVIEW_PREFIX}PGHOST`));
  }
});

// ─── Production and local development are unchanged ───────────────────────────

test('production uses the unprefixed precedence', () => {
  assert.equal(
    resolveDatabaseUrl({ VERCEL_ENV: 'production', ...productionVars } as never),
    PROD
  );
  assert.equal(
    resolveDatabaseUrl({ VERCEL_ENV: 'production', DATABASE_URL: PROD } as never),
    PROD
  );
  assert.equal(
    resolveDatabaseUrl({ VERCEL_ENV: 'production', POSTGRES_URL: PROD } as never),
    PROD
  );
});

test('production ignores PREVIEW_DATABASE_* entirely', () => {
  const url = resolveDatabaseUrl({
    VERCEL_ENV: 'production',
    ...productionVars,
    [`${PREVIEW_PREFIX}POSTGRES_PRISMA_URL`]: PREVIEW,
  } as never);
  assert.equal(url, PROD);
  assert.notEqual(url, PREVIEW);
});

test('local development (no VERCEL_ENV) keeps the existing behaviour', () => {
  assert.equal(resolveDatabaseUrl({ DATABASE_URL: PROD } as never), PROD);
  // Nothing configured returns '' so apply-schema still skips rather than fails.
  assert.equal(resolveDatabaseUrl({} as never), '');
});

test('only "preview" counts as a preview environment', () => {
  assert.equal(isPreviewEnv({ VERCEL_ENV: 'preview' } as never), true);
  for (const value of ['production', 'development', 'Preview', 'PREVIEW', '', undefined]) {
    assert.equal(isPreviewEnv({ VERCEL_ENV: value } as never), false, `VERCEL_ENV=${value}`);
  }
});
