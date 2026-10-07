import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bookingHrefFor } from '../src/lib/bookingRoutes.js';
import { programBySlug } from './program-config.js';

test('service pages open their own calendar flow', () => {
  assert.equal(bookingHrefFor('/basement-renovation-ajax'), '/consultation/basement');
  assert.equal(bookingHrefFor('/basement-renovation-cost-hamilton'), '/consultation/basement');
  assert.equal(bookingHrefFor('/legal-basement-brampton'), '/consultation/basement');
  assert.equal(bookingHrefFor('/basement-permit-whitby'), '/consultation/basement');
  assert.equal(bookingHrefFor('/legal-suites'), '/consultation/basement');
  assert.equal(bookingHrefFor('/basements'), '/consultation/basement');
  assert.equal(bookingHrefFor('/bathroom-renovations'), '/consultation/bathroom');
  assert.equal(bookingHrefFor('/kitchen-renovations'), '/consultation/kitchen');
  assert.equal(bookingHrefFor('/garden-suite-cost-ontario'), '/consultation/garden-suite');
  assert.equal(bookingHrefFor('/laneway-suite-permits-ontario'), '/consultation/garden-suite');
});

test('general pages and grant pages keep the project review', () => {
  for (const p of ['/', '/costs', '/financing', '/grants', '/grants/ajax-adu-grant', '/hamilton-grant-guide',
    '/hamilton-basement-grant', '/burlington-aru-incentive-program', '/barrie-secondary-suite-funding',
    '/barrie-aru-permit-rebate', '/st-catharines-adu-grant', '/contractor-partners', '/cities']) {
    assert.equal(bookingHrefFor(p), '/match', p);
  }
});

test('every flow it can send someone to exists and is switched on', () => {
  for (const slug of ['basement', 'bathroom', 'kitchen', 'garden-suite']) {
    const program = programBySlug(slug);
    assert.ok(program, `no program for /consultation/${slug}`);
    assert.equal(program.enabled, true, `/consultation/${slug} is disabled`);
  }
});

test('every page button pointing at a calendar flow points at an enabled one', () => {
  const dir = new URL('../src/pages/', import.meta.url);
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.tsx'))) {
    const src = fs.readFileSync(new URL(f, dir), 'utf8');
    for (const m of src.matchAll(/["'`]\/consultation\/([a-z-]+)["'`?]/g)) {
      const program = programBySlug(m[1]);
      assert.ok(program?.enabled, `${f} links to /consultation/${m[1]}, which is not an enabled flow`);
    }
  }
});
