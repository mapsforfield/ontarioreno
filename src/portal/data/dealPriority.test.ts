import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { addDaysIso, getDealAttention, sortDeals } from './dealPriority';
import type { Deal } from './types';

const TODAY = '2026-11-04';
const NOW = Date.parse('2026-11-04T15:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

function deal(overrides: Partial<Deal> = {}): Deal {
  return {
    id: 'd1',
    homeownerName: 'Test Owner',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    projectType: '',
    estimatedJobValue: 0,
    financingRequired: false,
    assignedRepId: 'r1',
    assignedContractorId: null,
    status: 'quoted',
    notes: '',
    nextFollowUpDate: '',
    activity: [],
    createdAt: daysAgo(1),
    updatedAt: daysAgo(0),
    ...overrides,
  };
}

describe('getDealAttention', () => {
  it('flags an overdue follow-up and says by how much', () => {
    const result = getDealAttention(deal({ nextFollowUpDate: '2026-11-01' }), TODAY, NOW);
    assert.equal(result?.level, 'urgent');
    assert.equal(result?.reason, 'Follow-up 3 days overdue');
  });

  it('uses the singular for one day', () => {
    const result = getDealAttention(deal({ nextFollowUpDate: '2026-11-03' }), TODAY, NOW);
    assert.equal(result?.reason, 'Follow-up 1 day overdue');
  });

  it('flags a follow-up due today', () => {
    const result = getDealAttention(deal({ nextFollowUpDate: TODAY }), TODAY, NOW);
    assert.equal(result?.reason, 'Follow-up due today');
  });

  it('leaves a quiet deal alone when a future follow-up is booked', () => {
    const quiet = deal({ nextFollowUpDate: '2026-11-10', updatedAt: daysAgo(45) });
    assert.equal(getDealAttention(quiet, TODAY, NOW), null);
  });

  it('flags stalled deals at the same 14 and 30 day lines as the board', () => {
    assert.equal(getDealAttention(deal({ updatedAt: daysAgo(13) }), TODAY, NOW), null);
    assert.equal(getDealAttention(deal({ updatedAt: daysAgo(14) }), TODAY, NOW)?.level, 'soon');
    assert.equal(getDealAttention(deal({ updatedAt: daysAgo(30) }), TODAY, NOW)?.level, 'urgent');
  });

  it('flags a new lead after two days', () => {
    const lead = deal({ status: 'new_lead', updatedAt: daysAgo(2) });
    assert.equal(getDealAttention(lead, TODAY, NOW)?.reason, 'New lead waiting 2 days');
  });

  it('never flags closed or pre-portal deals', () => {
    const stale = { updatedAt: daysAgo(90), nextFollowUpDate: '2026-01-01' };
    assert.equal(getDealAttention(deal({ ...stale, status: 'won' }), TODAY, NOW), null);
    assert.equal(getDealAttention(deal({ ...stale, status: 'lost' }), TODAY, NOW), null);
    assert.equal(getDealAttention(deal({ ...stale, isHistorical: true }), TODAY, NOW), null);
  });
});

describe('sortDeals', () => {
  const overdue = deal({ id: 'overdue', homeownerName: 'Zed', nextFollowUpDate: '2026-11-01', estimatedJobValue: 10 });
  const stalled = deal({ id: 'stalled', homeownerName: 'Amy', updatedAt: daysAgo(20), estimatedJobValue: 30 });
  const fine = deal({ id: 'fine', homeownerName: 'Mia', createdAt: daysAgo(0), estimatedJobValue: 20 });
  const ids = (list: Deal[]) => list.map((d) => d.id);

  it('puts the most urgent first', () => {
    assert.deepEqual(ids(sortDeals([fine, stalled, overdue], 'attention', TODAY, NOW)), ['overdue', 'stalled', 'fine']);
  });

  it('sorts by value, name and newest', () => {
    assert.deepEqual(ids(sortDeals([overdue, stalled, fine], 'value', TODAY, NOW)), ['stalled', 'fine', 'overdue']);
    assert.deepEqual(ids(sortDeals([overdue, stalled, fine], 'name', TODAY, NOW)), ['stalled', 'fine', 'overdue']);
    assert.equal(sortDeals([overdue, stalled, fine], 'newest', TODAY, NOW)[0].id, 'fine');
  });

  it('does not reorder the list it was given', () => {
    const input = [fine, overdue];
    sortDeals(input, 'attention', TODAY, NOW);
    assert.deepEqual(ids(input), ['fine', 'overdue']);
  });
});

describe('addDaysIso', () => {
  it('crosses month ends', () => {
    assert.equal(addDaysIso('2026-10-31', 1), '2026-11-01');
  });

  it('crosses the November clock change', () => {
    assert.equal(addDaysIso('2026-10-31', 7), '2026-11-07');
  });
});
