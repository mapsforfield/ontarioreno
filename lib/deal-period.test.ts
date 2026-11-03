import test from 'node:test';
import assert from 'node:assert/strict';

import { describe, it } from 'node:test';
import { dayPeriod, isDealInPeriod, periodBounds, periodDay, periodLabel } from './deal-period.ts';

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

test('today is the current local calendar day only', () => {
  const lead = { status: 'new', createdAt: new Date(2026, 9, 16, 0, 5).toISOString(), updatedAt: at(2026, 9, 16) };
  const yesterday = { status: 'new', createdAt: new Date(2026, 9, 15, 23, 55).toISOString(), updatedAt: at(2026, 9, 16) };
  assert.equal(isDealInPeriod(lead, 'today', NOW), true);
  assert.equal(isDealInPeriod(yesterday, 'today', NOW), false);
  assert.equal(periodLabel('today', NOW), 'Today · October 16');
});

test('labels', () => {
  assert.equal(periodLabel('month', NOW), 'October 2026');
  assert.equal(periodLabel('quarter', NOW), 'Q4 2026');
  assert.equal(periodLabel('year', NOW), '2026');
  assert.equal(periodLabel('all', NOW), 'All time');
});

describe('a picked day', () => {
  const now = new Date(2026, 10, 3, 10);
  it('covers exactly that calendar day', () => {
    const [start, end] = periodBounds(dayPeriod('2026-11-02'), now)!;
    assert.equal(start.getTime(), new Date(2026, 10, 2).getTime());
    assert.equal(end.getTime(), new Date(2026, 10, 3).getTime());
  });
  it('places deals by the same dates as the other periods', () => {
    const lead = { status: 'new_lead', createdAt: new Date(2026, 10, 2, 21).toISOString(), updatedAt: now.toISOString() };
    assert.equal(isDealInPeriod(lead, dayPeriod('2026-11-02'), now), true);
    assert.equal(isDealInPeriod(lead, dayPeriod('2026-11-03'), now), false);
  });
  it('labels yesterday as yesterday', () => {
    assert.match(periodLabel(dayPeriod('2026-11-02'), now), /^Yesterday · /);
    assert.doesNotMatch(periodLabel(dayPeriod('2026-10-30'), now), /Yesterday/);
  });
  it('reads back the day', () => {
    assert.equal(periodDay(dayPeriod('2026-11-02')), '2026-11-02');
    assert.equal(periodDay('month'), null);
  });
});
