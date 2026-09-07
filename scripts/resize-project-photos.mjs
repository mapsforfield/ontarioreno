/**
 * One-off: build display-sized variants of the project photographs.
 *
 * WHY THIS EXISTS. The originals in public/Bathroom are 2877–6000px wide. The
 * page shows them at roughly 660px (lead) and 320px (supporting), so the
 * browser was downscaling by up to 9x at paint time with a fast filter. On
 * photographs of TILE that is the worst case there is: grout lines and mosaic
 * are high-frequency repeating detail, and a cheap downscale aliases them into
 * a shimmer that reads as "the image looks slightly wrong" without ever looking
 * obviously broken. Resampling once, offline, with a proper Lanczos filter
 * removes it — and cuts about 10MB off the page while it is at it.
 *
 * The originals are NOT touched or deleted. Variants are written alongside them
 * with a width suffix, so re-running this is safe and the source files stay
 * available for any future crop.
 *
 * Run:  npx sharp is not a dependency of this project — install it just for
 *       the run and drop it again:
 *
 *   npm install --no-save sharp
 *   node scripts/resize-project-photos.mjs
 *   npm prune
 */
import { readdir, stat } from 'node:fs/promises';
import { join, dirname, basename, extname } from 'node:path';
import sharp from 'sharp';

const ROOTS = [
  'public/Bathroom',
  'public/Kitchen',
  'public/Basement',
  'public/Legal Basements',
];

/** Display widths. 1600 covers the lead frame on a 2x desktop; 800 the thumbs. */
const WIDTHS = [800, 1600];

/** Skip anything we generated on a previous run. */
const VARIANT = /-(\d+)w\.webp$/;

/** Already-built variants are left alone, so re-running is cheap and safe. */
const { existsSync } = await import('node:fs');

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

let made = 0;
let savedBytes = 0;

for (const root of ROOTS) {
  for await (const file of walk(root)) {
    if (!/\.(webp|jpe?g|png)$/i.test(file)) continue;
    if (VARIANT.test(file)) continue;

    const meta = await sharp(file).metadata();
    const stem = basename(file, extname(file));

    for (const width of WIDTHS) {
      /*
       * ALWAYS WRITE BOTH VARIANTS, even when the source is no wider than the
       * target.
       *
       * This used to `continue` when meta.width <= width, on the reasoning that
       * a 1600px source has nothing to give a 1600px variant. True of the
       * pixels, and wrong about the contract: the data files build their `src`
       * and `srcSet` from the naming convention, so a missing -1600w.webp is a
       * 404 and a broken image on the page. It bit exactly that way on the
       * basement photographs, which are all 1600px wide — the thumbnails
       * resolved to -800w and looked fine while every lead frame failed.
       *
       * `withoutEnlargement` still prevents actual upscaling: the file is
       * written at the source width and simply re-encoded. Cheap, and the
       * convention holds for every photograph regardless of what came out of
       * the camera.
       */
      const out = join(dirname(file), `${stem}-${width}w.webp`);
      if (existsSync(out)) continue;

      await sharp(file)
        .resize({ width, kernel: 'lanczos3', withoutEnlargement: true })
        .webp({ quality: 82, effort: 5 })
        .toFile(out);

      const before = (await stat(file)).size;
      const after = (await stat(out)).size;
      savedBytes += before - after;
      made += 1;
      console.log(
        `${out}  ${width}w  ${(after / 1024).toFixed(0)}KB  (source ${meta.width}px, ${(before / 1024).toFixed(0)}KB)`,
      );
    }
  }
}

console.log(`\n${made} variants written.`);
if (made > 0) {
  console.log(`Saved ~${(savedBytes / made / 1024).toFixed(0)}KB per variant on average.`);
}

/*
 * Verify the naming contract the data files depend on.
 *
 * `src` and `srcSet` in src/data/projects/*.ts are built from the convention
 * `<stem>-800w.webp` / `<stem>-1600w.webp`. If one is missing it is a 404, and
 * it fails ASYMMETRICALLY: thumbnails resolve to the 800w and look perfect
 * while every lead frame breaks. That is exactly how it shipped to review once.
 * So the script refuses to exit clean unless both exist for every source.
 */
let missing = 0;
for (const root of ROOTS) {
  for await (const file of walk(root)) {
    if (!/\.(webp|jpe?g|png)$/i.test(file) || VARIANT.test(file)) continue;
    const stem = basename(file, extname(file));
    for (const width of WIDTHS) {
      const expected = join(dirname(file), `${stem}-${width}w.webp`);
      if (!existsSync(expected)) {
        console.error(`MISSING: ${expected}`);
        missing += 1;
      }
    }
  }
}

if (missing > 0) {
  console.error(`\n${missing} expected variants are missing.`);
  process.exit(1);
}
console.log('Verified: every source has both variants.');
