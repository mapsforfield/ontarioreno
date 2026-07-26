// Build-step wrapper for the Preview seed.
//
// The Preview database credentials are Encrypted Vercel variables: they are
// decrypted only inside a deployment, never readable by the CLI or a laptop.
// The build environment is therefore the one place the seed can legitimately
// run — the same environment in which apply-schema already reaches that database.
//
// This wrapper only decides WHETHER to run. Every safety check that matters
// (VERCEL_ENV, PREVIEW_DATABASE_* provenance, password presence) lives in
// scripts/seed-preview.ts and runs again there, so this file cannot weaken them.
//
// Any environment that is not a Vercel Preview is a silent no-op, so Production,
// Development and local builds are completely unaffected.
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

if (process.env.VERCEL_ENV !== 'preview') {
  console.log(
    `[seed-preview-build] VERCEL_ENV=${process.env.VERCEL_ENV ?? '(unset)'} — not a Preview deployment, skipping seed.`
  );
  process.exit(0);
}

console.log('[seed-preview-build] Preview deployment detected — running the synthetic seed.');

// `--import tsx` lets Node execute the TypeScript seed directly. tsx is a
// devDependency and is present during a Vercel build.
const result = spawnSync(
  process.execPath,
  ['--import', 'tsx', join(here, 'seed-preview.ts')],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error(`[seed-preview-build] failed to launch the seed: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(`[seed-preview-build] seed exited with code ${result.status} — failing the build.`);
  process.exit(result.status ?? 1);
}

console.log('[seed-preview-build] seed completed.');
