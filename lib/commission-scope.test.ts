import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ADMIN_LEDGER_FIELDS,
  canReadCommission,
  commissionScopeFor,
  stripAdminLedger,
} from './commission-scope.ts';

const admin = { id: 'user-admin', role: 'admin' };
const steven = { id: 'user-steven', role: 'rep' };
const other = { id: 'user-other', role: 'rep' };

describe('commissionScopeFor', () => {
  it('leaves an admin unrestricted', () => {
    assert.deepEqual(commissionScopeFor(admin), {});
  });

  // The point of the file: the admin's net must not leave the server for a rep.
  it('pins a rep to their own rows', () => {
    assert.deepEqual(commissionScopeFor(steven), { repId: 'user-steven' });
  });

  it('treats any non-admin role as a rep, not as an admin', () => {
    assert.deepEqual(commissionScopeFor({ id: 'u', role: 'contractor' }), { repId: 'u' });
    assert.deepEqual(commissionScopeFor({ id: 'u', role: '' }), { repId: 'u' });
    assert.deepEqual(commissionScopeFor({ id: 'u', role: 'Admin' }), { repId: 'u' });
  });
});

describe('canReadCommission', () => {
  const meloCommission = { repId: 'user-steven' };

  it('lets an admin read anyone’s row', () => {
    assert.equal(canReadCommission(admin, meloCommission), true);
  });

  it('lets a rep read their own row', () => {
    assert.equal(canReadCommission(steven, meloCommission), true);
  });

  it('refuses a rep another rep’s row', () => {
    assert.equal(canReadCommission(other, meloCommission), false);
  });
});

describe('stripAdminLedger', () => {
  // The real Matthew Melo figures: 8.5% of $78,535, less the rep's 5%.
  const melo = {
    id: 'comm-melo',
    dealId: 'deal-melo',
    repId: 'user-steven',
    repCommissionRate: 0.05,
    repEstimatedCommission: 3927,
    repPaidCommission: 0,
    payoutStatus: 'pending',
    adminTotalCommissionRate: 0.085,
    adminTotalEstimatedCommission: 6675,
    adminNetCommission: 2748,
    adminNetPaidCommission: 0,
    balanceClockStartedAt: '2026-08-27',
  };

  it('leaves an admin’s copy untouched', () => {
    assert.deepEqual(stripAdminLedger(admin, melo), melo);
  });

  it('removes every admin-ledger field for a rep', () => {
    const safe = stripAdminLedger(steven, melo) as Record<string, unknown>;
    for (const field of ADMIN_LEDGER_FIELDS) {
      assert.equal(field in safe, false, `${field} must not reach a rep`);
    }
  });

  // The rate is confidential outright; the rest each give it back.
  it('leaves nothing a rep could derive 8.5% from', () => {
    const safe = stripAdminLedger(steven, melo) as unknown as Record<string, unknown>;
    const job = 78535;
    for (const [key, value] of Object.entries(safe)) {
      if (typeof value !== 'number' || value === 0) continue;
      assert.notEqual(value, 0.085, `${key} is the rate itself`);
      assert.notEqual(Math.round(value), 6675, `${key} is the total commission`);
      assert.notEqual(Math.round(value), 2748, `${key} is the house's net`);
      // Nothing left may be a percentage of the job that isn't the rep's own 5%.
      const asRate = value < 1 ? value : value / job;
      assert.ok(
        Math.abs(asRate - 0.05) < 0.001 || Math.abs(asRate) > 0.06 || asRate < 0.0001,
        `${key} (${value}) reads as a rate of ${asRate} against the job value`
      );
    }
  });

  it('keeps everything the rep is entitled to', () => {
    const safe = stripAdminLedger(steven, melo) as Record<string, unknown>;
    assert.equal(safe.repEstimatedCommission, 3927);
    assert.equal(safe.repPaidCommission, 0);
    assert.equal(safe.repCommissionRate, 0.05);
    assert.equal(safe.payoutStatus, 'pending');
    // The balance clock still works for them — dates are not money.
    assert.equal(safe.balanceClockStartedAt, '2026-08-27');
  });

  it('does not mutate the row it was handed', () => {
    stripAdminLedger(steven, melo);
    assert.equal(melo.adminTotalCommissionRate, 0.085);
  });

  it('treats an unrecognised role as a rep', () => {
    const safe = stripAdminLedger({ role: 'superadmin' }, melo) as Record<string, unknown>;
    assert.equal('adminTotalCommissionRate' in safe, false);
  });
});
