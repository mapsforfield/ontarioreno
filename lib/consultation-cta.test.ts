/**
 * The renovation guide pages must keep a route to a booking.
 *
 * These four pages are where organic search lands. They are long, they answer
 * the question the visitor arrived with, and a reader who reaches the end of a
 * cost guide convinced is the best-qualified visitor the site gets. For a long
 * time the only thing on offer at that moment was `/match` — a project review,
 * not an appointment — so that intent had nowhere to go.
 *
 * The failures this file catches:
 *   • A guide page loses its consultation CTA in an edit or a merge, and the
 *     page silently stops converting. Nobody notices, because the page still
 *     looks complete.
 *   • A page points at the WRONG flow — the kitchen guide sending someone to
 *     the bathroom form is a lead that arrives mislabelled and a rep who
 *     prepares for the wrong room.
 *   • The project-review path is quietly dropped while adding a booking one.
 *     Both are meant to stay live on every page that had one.
 *   • A CTA points at a program that has been disabled, which is the same
 *     mistake the closed-Hamilton pages were built to stop repeating.
 *
 * Deliberately removing one? Update the expectation here in the same commit, so
 * the removal is a visible line in the diff rather than a silent regression.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { programBySlug } from './program-config.ts';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => readFileSync(join(repoRoot, rel), 'utf8');

/**
 * Guide page → the consultation flow it belongs to.
 *
 * Two pages map to `basement` on purpose: a legal secondary suite IS a basement
 * build, and it is priced on the same visit under the same financing.
 */
const GUIDE_PAGES: { page: string; slug: string }[] = [
  { page: 'src/pages/Basements.tsx', slug: 'basement' },
  { page: 'src/pages/LegalSuites.tsx', slug: 'basement' },
  { page: 'src/pages/KitchenRenovations.tsx', slug: 'kitchen' },
  { page: 'src/pages/BathroomRenovations.tsx', slug: 'bathroom' },
  { page: 'src/pages/GardenSuitesLanewaySuitesOntario.tsx', slug: 'garden-suite' },
];

const SHARED_CTA = 'src/components/BookConsultationCta.tsx';

test('every guide page still routes a reader to a consultation', () => {
  for (const { page, slug } of GUIDE_PAGES) {
    const source = read(page);
    // Either a direct link or the shared component carrying the slug counts —
    // the point is that SOME booking route survives, not how it is spelled.
    const direct = source.includes(`to="/consultation/${slug}"`);
    const viaComponent = new RegExp(`slug="${slug}"`).test(source);
    assert.ok(
      direct || viaComponent,
      `${page} no longer offers the ${slug} consultation. Organic traffic reaches the end of this guide with nowhere to book.`,
    );
  }
});

test('no guide page points at another project’s form', () => {
  // The kitchen guide sending someone to the bathroom form produces a lead that
  // arrives mislabelled and a rep who preps for the wrong room.
  for (const { page, slug } of GUIDE_PAGES) {
    const source = read(page);
    const linked = new Set(
      [...source.matchAll(/to=\{?`?\/consultation\/([a-z-]+)/g)].map((m) => m[1])
    );
    for (const other of [...source.matchAll(/slug="([a-z-]+)"/g)].map((m) => m[1])) {
      linked.add(other);
    }
    linked.delete(slug);
    assert.deepEqual(
      [...linked],
      [],
      `${page} links to a consultation flow that is not ${slug}.`,
    );
  }
});

test('every guide page keeps its project-review path too', () => {
  // The booking was ADDED alongside `/match`, never in place of it. A page that
  // has silently lost one of the two is a funnel change nobody agreed to.
  for (const { page } of GUIDE_PAGES) {
    assert.ok(
      read(page).includes('to="/match"'),
      `${page} dropped the project-review CTA. The booking path was meant to be additive.`,
    );
  }
});

test('every guide page CTA points at a program that is actually enabled', () => {
  // The same rule the closed-Hamilton pages taught: never walk a homeowner to a
  // form for something that is not accepting bookings.
  for (const { page, slug } of GUIDE_PAGES) {
    const program = programBySlug(slug);
    assert.ok(program, `${page} points at /consultation/${slug}, which is not a program.`);
    assert.equal(
      program!.enabled,
      true,
      `${page} sends its traffic to /consultation/${slug}, which is disabled.`,
    );
  }
});

test('the shared CTA component exists and offers a real booking link', () => {
  const source = read(SHARED_CTA);
  assert.ok(source.trim().length > 0, `${SHARED_CTA} is missing or empty.`);
  assert.match(
    source,
    /to=\{`\/consultation\/\$\{slug\}`\}/,
    'The shared CTA no longer builds a /consultation/<slug> link.',
  );
  // Every slug the component accepts has to be a real, live program.
  const accepted = [...source.matchAll(/'(basement|bathroom|kitchen|garden-suite)'/g)].map((m) => m[1]);
  assert.ok(accepted.length > 0, 'The ConsultationSlug union lost its values.');
  for (const slug of new Set(accepted)) {
    assert.equal(programBySlug(slug)?.enabled, true, `${slug} is not a live program.`);
  }
});
