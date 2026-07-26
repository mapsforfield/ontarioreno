// ─── Database URL selection by deployment environment ─────────────────────────
// Preview deployments must use the isolated Preview database and MUST NOT be
// able to reach production. The unprefixed Neon variables (POSTGRES_PRISMA_URL,
// DATABASE_URL, …) are still scoped to BOTH Production and Preview, so a naive
// `preview ?? production` fallback would silently hand a Preview deployment the
// production database — exactly the failure this module exists to prevent.
//
// Rule: when VERCEL_ENV === 'preview', ONLY PREVIEW_DATABASE_* is consulted. If
// none is set we throw. There is deliberately no fallback path: a Preview build
// that cannot find its own database fails closed rather than quietly writing to
// production. Production and local development are unchanged.

/** Prefix Vercel applies to the isolated Preview database's variables. */
export const PREVIEW_PREFIX = 'PREVIEW_DATABASE_';

/**
 * Candidate suffixes, in precedence order, mirroring the unprefixed ordering
 * used by the runtime client and the build-time schema apply. Several are
 * accepted because the integration's exact suffix depends on how the variables
 * were created; the first non-empty match wins.
 */
const POOLED_SUFFIXES = [
  'POSTGRES_PRISMA_URL',
  'DATABASE_URL',
  'POSTGRES_URL',
  'URL',
];

/** Unprefixed precedence for Production and local development. */
const PRODUCTION_KEYS = ['POSTGRES_PRISMA_URL', 'DATABASE_URL', 'POSTGRES_URL'];

export class PreviewDatabaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PreviewDatabaseConfigError';
  }
}

/** True when running on a Vercel Preview deployment. */
export function isPreviewEnv(env = process.env) {
  return env.VERCEL_ENV === 'preview';
}

/**
 * True only for a genuine Postgres connection URL.
 *
 * Vercel returns encrypted environment variables to the CLI as the two-character
 * literal `""`. That is non-empty, so an emptiness check alone lets it through
 * and the failure surfaces much later as an opaque "Invalid URL" from the
 * database driver. Validating the scheme here turns that into an immediate,
 * named error.
 */
export function isPostgresUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'postgres:' && parsed.protocol !== 'postgresql:') return false;
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/** Preview: strict — the value must be a real Postgres URL. */
function firstValidEntry(env, keys) {
  for (const key of keys) {
    if (isPostgresUrl(env[key])) return { key, url: env[key].trim() };
  }
  return null;
}

/**
 * Production / local: unchanged from before this module existed — non-empty only.
 * Deliberately NOT scheme-validated, so an unusual but working production URL
 * (e.g. a Prisma Accelerate `prisma://` endpoint) cannot be rejected here.
 */
function firstNonEmptyEntry(env, keys) {
  for (const key of keys) {
    const value = env[key];
    if (typeof value === 'string' && value.trim() !== '') return { key, url: value };
  }
  return null;
}

/** Names (never values) of the PREVIEW_DATABASE_* variables that are set. */
function presentPreviewKeys(env) {
  return Object.keys(env)
    .filter((k) => k.startsWith(PREVIEW_PREFIX))
    .filter((k) => typeof env[k] === 'string' && env[k].trim() !== '')
    .sort();
}

/**
 * The database URL for the current environment.
 *
 * Preview: a PREVIEW_DATABASE_* value, or throws. Never falls back.
 * Production / local: the existing unprefixed precedence, unchanged. Returns ''
 * when nothing is configured, preserving the current "skip" behaviour locally.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {string}
 */
export function resolveDatabaseUrl(env = process.env) {
  return resolveDatabaseSource(env).url;
}

/**
 * Same resolution as resolveDatabaseUrl, but also reports WHICH variable the URL
 * came from. Callers that must prove they are not pointed at production (e.g.
 * the Preview seed script) assert on the key name rather than the value.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ key: string, url: string }}
 */
export function resolveDatabaseSource(env = process.env) {
  if (isPreviewEnv(env)) {
    // 1. Known pooled names, in precedence order.
    const previewKeys = POOLED_SUFFIXES.map((s) => `${PREVIEW_PREFIX}${s}`);
    const known = firstValidEntry(env, previewKeys);
    if (known) return known;

    // 2. Any other PREVIEW_DATABASE_* that is a real Postgres URL, so an
    //    unanticipated suffix still works. Pooled preferred; unpooled last.
    const others = Object.keys(env)
      .filter((k) => k.startsWith(PREVIEW_PREFIX) && !previewKeys.includes(k))
      .filter((k) => isPostgresUrl(env[k]))
      .sort((a, b) => Number(isUnpooledKey(a)) - Number(isUnpooledKey(b)) || a.localeCompare(b));
    if (others.length) return { key: others[0], url: env[others[0]].trim() };

    // 3. Fail closed, naming keys only — never a value.
    const present = presentPreviewKeys(env);
    const invalid = present.filter((k) => !isPostgresUrl(env[k]));
    throw new PreviewDatabaseConfigError(
      `VERCEL_ENV is "preview" but no valid Postgres URL was found in any ${PREVIEW_PREFIX}* variable. ` +
        `Looked for: ${previewKeys.join(', ')}. ` +
        (present.length
          ? `Set but not a usable postgres:// URL: ${invalid.join(', ') || '(none)'}. ` +
            `Note: Vercel returns ENCRYPTED variables to the CLI as the literal "" — ` +
            `those values cannot be read outside the deployment runtime. `
          : `No ${PREVIEW_PREFIX}* variables are set at all. `) +
        `Refusing to fall back to the production database.`
    );
  }

  return firstNonEmptyEntry(env, PRODUCTION_KEYS) ?? { key: '', url: '' };
}

function isUnpooledKey(key) {
  return /UNPOOLED|NON_POOLING|NO_SSL/.test(key);
}

/** Short label for logs — which source the URL came from. Never logs a value. */
export function describeDatabaseSource(env = process.env) {
  return isPreviewEnv(env) ? `preview (${PREVIEW_PREFIX}*)` : 'production/local (unprefixed)';
}
