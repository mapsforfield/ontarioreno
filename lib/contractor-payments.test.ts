import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toContractorPayment } from './contractor-payments.ts';

// Nithin Ahuja: $55,420 commissionable at 8.5% → $4,711 total, half paid.
const nithin = {
  deal: { id: 'd1', homeownerName: 'Nithin Ahuja', projectType: 'Basement renovation', city: 'Mississauga', estimatedJobValue: 58000 },
  commission: {
    adminTotalCommissionRate: 0.085,
    adminTotalEstimatedCommission: 4711,
    repEstimatedCommission: 2771,
    repPaidCommission: 1385.5,
    adminNetCommission: 1940,
    adminNetPaidCommission: 970,
    customPayout: false,
    balanceClockStartedAt: '2026-11-02',
    balanceClockDays: 45,
    balanceSettledAt: '',
  },
};

describe('toContractorPayment', () => {
  it('shows the total, what was paid and what is left', () => {
    const row = toContractorPayment(nithin);
    assert.equal(row.totalCommission, 4711);
    assert.equal(row.paid, 2355.5);
    assert.equal(row.remaining, 2355.5);
    assert.equal(row.commissionRate, 0.085);
  });

  // The whole point of the shape: PJ sees the total, never how it divides.
  it('never carries the rep / house split', () => {
    const row = toContractorPayment(nithin) as Record<string, unknown>;
    const json = JSON.stringify(row);
    for (const key of ['repEstimatedCommission', 'repPaidCommission', 'adminNetCommission', 'adminNetPaidCommission', 'repId']) {
      assert.equal(key in row, false, key);
    }
    assert.equal(json.includes('2771'), false);
    assert.equal(json.includes('1940'), false);
  });

  it('reads a settled balance as paid in full', () => {
    const row = toContractorPayment({ ...nithin, commission: { ...nithin.commission, balanceSettledAt: '2026-12-17' } });
    assert.equal(row.remaining, 0);
  });

  it('has no rate on a custom one-off amount', () => {
    assert.equal(toContractorPayment({ ...nithin, commission: { ...nithin.commission, customPayout: true } }).commissionRate, null);
  });
});
