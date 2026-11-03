import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_TOTAL_COMMISSION_RATE, reconcileLedger } from './commission-ledger.ts';

// Matthew Melo (Mississauga): $61,020 job. The row on the server had the rate
// at 8.5% and the total still at 10% ($6,102) — the bug this file exists for.
const melo = { estimatedJobValue: 61020, financeFeePercent: null };
const staleRow = {
  adminTotalCommissionRate: 0.085,
  adminTotalEstimatedCommission: 6102,
  repEstimatedCommission: 3051,
  repPaidCommission: 1525.5,
  adminNetPaidCommission: 1067.85,
  customPayout: false,
};

describe('reconcileLedger', () => {
  it('defaults to 8.5%', () => {
    assert.equal(DEFAULT_TOTAL_COMMISSION_RATE, 0.085);
  });

  it('re-derives the total and net from the stored rate on any update', () => {
    const out = reconcileLedger(staleRow, { balanceClockStartedAt: '2026-10-05' }, melo);
    assert.equal(out.adminTotalEstimatedCommission, 5187);
    assert.equal(out.repEstimatedCommission, 3051);
    assert.equal(out.adminNetCommission, 2136);
    assert.equal(out.repPaidCommission, 1525.5);
    assert.equal(out.payoutStatus, 'partial');
  });

  it('follows a rate change', () => {
    const out = reconcileLedger(staleRow, { adminTotalCommissionRate: 0.1 }, melo);
    assert.equal(out.adminTotalEstimatedCommission, 6102);
    assert.equal(out.adminNetCommission, 3051);
  });

  it('respects a total typed in on the same update', () => {
    const out = reconcileLedger(staleRow, { adminTotalEstimatedCommission: 5000 }, melo);
    assert.equal(out.adminTotalEstimatedCommission, 5000);
    assert.equal(out.adminNetCommission, 1949);
  });

  it('leaves a custom payout as entered', () => {
    const custom = { ...staleRow, customPayout: true, adminTotalEstimatedCommission: 4000, repEstimatedCommission: 1500 };
    const out = reconcileLedger(custom, { repPaidCommission: 9999 }, melo);
    assert.equal(out.adminTotalEstimatedCommission, 4000);
    assert.equal(out.repEstimatedCommission, 1500);
    assert.equal(out.repPaidCommission, 1500);
    assert.equal(out.payoutStatus, 'paid');
  });

  it('applies the finance fee', () => {
    const out = reconcileLedger(staleRow, {}, { estimatedJobValue: 100000, financeFeePercent: 2 });
    assert.equal(out.repEstimatedCommission, 4900);
    assert.equal(out.adminTotalEstimatedCommission, 8330);
  });
});
