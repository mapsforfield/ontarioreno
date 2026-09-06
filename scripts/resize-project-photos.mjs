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

const ROOTS = ['public/Bathroom', 'public/Kitchen'];

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
      // Never upscale — a 900px source has nothing to give a 1600px variant.
      if (meta.width <= width) continue;

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
console.log(`Largest variant is ~${(savedBytes / made / 1024).toFixed(0)}KB smaller than its source on average.`);
