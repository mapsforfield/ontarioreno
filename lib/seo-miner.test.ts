import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregate,
  expectedCtr,
  lowCtrPages,
  pageTrends,
  renderReport,
  serviceDemand,
  strikingDistance,
  type PerfRow,
} from './seo-miner.js';

const U = 'https://ontarioreno.ca';
const row = (page: string, query: string, clicks: number, impressions: number, position: number, date = '2026-10-01'): PerfRow =>
  ({ date, page: U + page, query, clicks, impressions, position });

test('aggregate sums per page+query and weights position by impressions', () => {
  const [a] = aggregate([row('/x', 'q', 1, 100, 4, '2026-10-01'), row('/x', 'q', 1, 300, 8, '2026-10-02')]);
  assert.equal(a.clicks, 2);
  assert.equal(a.impressions, 400);
  assert.equal(a.position, 7); // (4*100 + 8*300) / 400, not the plain mean 6
  assert.equal(a.ctr, 0.005);
});

test('a page with zero impressions does not divide by zero', () => {
  const [a] = aggregate([row('/x', '', 0, 0, 0)]);
  assert.equal(a.position, 0);
  assert.equal(a.ctr, 0);
});

test('expected CTR falls with position and has a floor past page 1', () => {
  assert.ok(expectedCtr(1) > expectedCtr(3));
  assert.ok(expectedCtr(3) > expectedCtr(10));
  assert.equal(expectedCtr(25), 0.01);
  assert.equal(expectedCtr(0.4), expectedCtr(1)); // never indexes below position 1
});

test('the real Hamilton cost page case is flagged as a title problem', () => {
  // Search Console, Sep 7 – Oct 5 2026: 1,475 impressions, 8 clicks, position 6.8.
  const [gap] = lowCtrPages(aggregate([row('/basement-renovation-cost-hamilton', '', 8, 1475, 6.8)]));
  assert.equal(gap.page, U + '/basement-renovation-cost-hamilton');
  assert.ok(gap.missedClicks > 30);
});

test('low CTR ignores small samples, page-2 pages, and pages doing fine', () => {
  const aggs = aggregate([
    row('/tiny', '', 0, 40, 3),         // too few impressions to mean anything
    row('/page2', '', 1, 800, 14),      // not on page 1: a ranking job, not a title job
    row('/healthy', '', 60, 1000, 3),   // 6% at position 3 is above half of expected
    row('/named-only', 'q', 0, 900, 4), // query rows are never treated as page totals
  ]);
  assert.deepEqual(lowCtrPages(aggs), []);
});

test('striking distance keeps positions 8–20 with demand, biggest first', () => {
  const aggs = aggregate([
    row('/a', 'already top', 5, 500, 2),
    row('/a', 'page two big', 0, 300, 12),
    row('/a', 'page two small', 0, 5, 12),
    row('/a', 'bottom of page one', 1, 90, 8),
    row('/a', 'too deep', 0, 900, 35),
    row('/a', '', 0, 900, 12), // page totals are not search terms
  ]);
  assert.deepEqual(strikingDistance(aggs).map((a) => a.query), ['page two big', 'bottom of page one']);
});

test('service demand buckets real search terms and counts a term on two pages once', () => {
  const demand = serviceDemand(aggregate([
    row('/bathroom-renovations', 'bathroom renovation mississauga', 1, 50, 11),
    row('/', 'bathroom renovation mississauga', 0, 50, 15),
    row('/grants', 'adu grants ontario', 10, 194, 1.8),
    row('/basements', 'legal basement apartment brampton', 0, 30, 9),
  ]));
  const by = Object.fromEntries(demand.map((d) => [d.service, d]));
  assert.equal(by.Bathroom.queries, 1);
  assert.equal(by.Bathroom.impressions, 100);
  assert.equal(by.Bathroom.position, 13);
  assert.equal(by['Grants & financing'].clicks, 10);
  // "legal basement apartment" is both a basement search and a legal-suite
  // search, and "adu grants ontario" is both an ADU and a grants search.
  assert.equal(by.Basement.queries, 1);
  assert.equal(by['Legal suite / ADU'].queries, 2);
  assert.equal(by.Kitchen.impressions, 0);
});

test('flooring matches flooring searches but not "floor plan" style noise words alone', () => {
  const by = Object.fromEntries(serviceDemand(aggregate([
    row('/', 'vinyl plank flooring cost', 0, 20, 30),
    row('/', 'hardwood floors toronto', 0, 10, 40),
  ])).map((d) => [d.service, d]));
  assert.equal(by.Flooring.queries, 2);
});

test('trends compare page totals across windows and drop pages with no real traffic', () => {
  const t = pageTrends(
    aggregate([row('/grants', '', 120, 2000, 6), row('/new', '', 5, 100, 9), row('/quiet', '', 0, 10, 30)]),
    aggregate([row('/grants', '', 78, 1633, 7.1), row('/gone', '', 4, 200, 12)]),
  );
  assert.deepEqual(t.map((x) => x.page.replace(U, '')), ['/grants', '/new', '/gone']);
  assert.equal(t[0].prevClicks, 78);
  assert.equal(t[2].clicks, 0);
});

test('report renders every section, including the empty states', () => {
  const md = renderReport({ start: '2026-09-07', end: '2026-10-05', current: [], previous: [] });
  for (const h of ['# SEO miner', '## 1.', '## 2.', '## 3.', '## 4.']) assert.ok(md.includes(h), h);
  assert.ok(md.includes('Not enough history yet'));
});

test('report shows paths, not full URLs', () => {
  const md = renderReport({
    start: 'a', end: 'b',
    current: [row('/basement-renovation-cost-hamilton', '', 8, 1475, 6.8)],
    previous: [],
  });
  assert.ok(md.includes('| /basement-renovation-cost-hamilton |'));
  assert.ok(!md.includes('https://ontarioreno.ca/basement'));
});

test('report lists website leads by channel, Google search first-class', () => {
  const md = renderReport({ start: 'a', end: 'b', current: [], previous: [],
    leads: [{ channel: 'google_organic', leads: 4, booked: 3 }, { channel: 'meta', leads: 9, booked: 8 }] });
  assert.ok(md.includes('## 5. Website leads by channel'));
  assert.ok(md.includes('| **Google search (free)** | 4 | 3 |'));
  assert.ok(md.includes('| Facebook / Instagram | 9 | 8 |'));
});

test('report says plainly when no channel data exists yet', () => {
  const md = renderReport({ start: 'a', end: 'b', current: [], previous: [], leads: [] });
  assert.ok(md.includes('Recording started October 2026'));
});
