import test from 'node:test';
import assert from 'node:assert/strict';

import { isDealInPeriod, periodLabel } from './deal-period.ts';

const NOW = new Date(2026, 9, 16, 13, 0); // Oct 16 2026, local
const at = (y: number, m: number, d: number) => new Date(y, m, d, 12).toISOString();

test('an open lead created in August stays out of October even if edited today', () => {
  const deal = { status: 'negotiating', createdAt: at(2026, 7, 20), updatedAt: at(2026, 9, 16) };
  assert.equal(isDealInPeriod(deal, 'month', NOW), false);
  assert.equal(isDealInPeriod(deal, 'quarter', NOW), false);
  assert.equal(isDealInPeriod(deal, 'year', NOW), true);
});

test('a deal won this month counts this month even though it came in earlier', () => {
  const deal = { status: 'won', wonAt: at(2026, 9, 3), createdAt: at(2026, 6, 1), updatedAt: at(2026, 9, 3) };
  assert.equal(isDealInPeriod(deal, 'month', NOW), true);
  assert.equal(isDealInPeriod(deal, 'last_month', NOW), false);
});

test('last month is the previous calendar month, across a year boundary too', () => {
  const deal = { status: 'quoted', createdAt: at(2025, 11, 30), updatedAt: at(2025, 11, 30) };
  assert.equal(isDealInPeriod(deal, 'last_month', new Date(2026, 0, 5)), true);
  assert.equal(periodLabel('last_month', new Date(2026, 0, 5)), 'December 2025');
});

test('historical imports only appear under all time', () => {
  const deal = { status: 'won', isHistorical: true, createdAt: at(2026, 9, 1), updatedAt: at(2026, 9, 1) };
  assert.equal(isDealInPeriod(deal, 'month', NOW), false);
  assert.equal(isDealInPeriod(deal, 'all', NOW), true);
});

test('labels', () => {
  assert.equal(periodLabel('month', NOW), 'October 2026');
  assert.equal(periodLabel('quarter', NOW), 'Q4 2026');
  assert.equal(periodLabel('year', NOW), '2026');
  assert.equal(periodLabel('all', NOW), 'All time');
});
