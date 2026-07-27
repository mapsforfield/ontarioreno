// ─── Database selection by deployment environment ─────────────────────────────
// The public booking flow writes real Appointment rows. The unprefixed Neon
// variables (POSTGRES_PRISMA_URL, DATABASE_URL) are scoped to BOTH Production and
// Preview, so without this a Preview deployment would book into the PRODUCTION
// database. When VERCEL_ENV === 'preview' only PREVIEW_DATABASE_* is consulted,
// and if none is usable we throw rather than fall back.

export const PREVIEW_PREFIX = 'PREVIEW_DATABASE_';

const PREVIEW_SUFFIXES = ['POSTGRES_PRISMA_URL', 'DATABASE_URL', 'POSTGRES_URL', 'URL'];
const PRODUCTION_KEYS = ['POSTGRES_PRISMA_URL', 'DATABASE_URL', 'POSTGRES_URL'];

export class PreviewDatabaseConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PreviewDatabaseConfigError';
  }
}

export function isPreviewEnv(env = process.env) {
  return env.VERCEL_ENV === 'preview';
}

/**
 * Vercel hands ENCRYPTED variables to the CLI as the literal two characters `""`.
 * That is non-empty, so presence checks alone let it through and the failure then
 * surfaces as an opaque driver "Invalid URL". Require a real Postgres URL.
 */
export function isPostgresUrl(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const u = new URL(trimmed);
    return (u.protocol === 'postgres:' || u.protocol === 'postgresql:') && Boolean(u.hostname);
  } catch {
    return false;
  }
}

const isUnpooled = (key) => /UNPOOLED|NON_POOLING|NO_SSL/.test(key);

export function resolveDatabaseSource(env = process.env) {
  if (isPreviewEnv(env)) {
    const preferred = PREVIEW_SUFFIXES.map((s) => `${PREVIEW_PREFIX}${s}`);
    for (const key of preferred) {
      if (isPostgresUrl(env[key])) return { key, url: env[key].trim() };
    }
    // Any other PREVIEW_DATABASE_* holding a real URL, pooled preferred.
    const others = Object.keys(env)
      .filter((k) => k.startsWith(PREVIEW_PREFIX) && !preferred.includes(k) && isPostgresUrl(env[k]))
      .sort((a, b) => Number(isUnpooled(a)) - Number(isUnpooled(b)) || a.localeCompare(b));
    if (others.length) return { key: others[0], url: env[others[0]].trim() };

    const present = Object.keys(env).filter((k) => k.startsWith(PREVIEW_PREFIX)).sort();
    throw new PreviewDatabaseConfigError(
      `VERCEL_ENV is "preview" but no valid Postgres URL was found in any ${PREVIEW_PREFIX}* variable. ` +
        `Looked for: ${preferred.join(', ')}. ` +
        (present.length
          ? `${PREVIEW_PREFIX}* variables that are set: ${present.join(', ')} (none usable). ` +
            `Note: Vercel returns ENCRYPTED variables to the CLI as the literal "". `
          : `No ${PREVIEW_PREFIX}* variables are set. `) +
        `Refusing to fall back to the production database.`
    );
  }

  // Production / local: unchanged, non-empty only — never scheme-validated, so an
  // unusual but working production endpoint cannot be rejected here.
  for (const key of PRODUCTION_KEYS) {
    const v = env[key];
    if (typeof v === 'string' && v.trim() !== '') return { key, url: v };
  }
  return { key: '', url: '' };
}

export function resolveDatabaseUrl(env = process.env) {
  return resolveDatabaseSource(env).url;
}

export function describeDatabaseSource(env = process.env) {
  return isPreviewEnv(env) ? `preview (${PREVIEW_PREFIX}*)` : 'production/local (unprefixed)';
}
