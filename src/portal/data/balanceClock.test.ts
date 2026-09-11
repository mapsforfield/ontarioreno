import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  addDays,
  balanceClock,
  balanceClockNeedsAttention,
  daysBetween,
  formatBalanceClock,
  pendingBalanceClocks,
  pendingBalanceClockTotal,
} from './balanceClock.ts';

const clockOf = (
  startedAt: string,
  { days = 45, settled = '' }: { days?: number; settled?: string } = {},
  today = '2026-09-11'
) =>
  balanceClock(
    {
      balanceClockStartedAt: startedAt,
      balanceClockDays: days,
      balanceSettledAt: settled,
    },
    today
  );

describe('calendar arithmetic', () => {
  it('adds days across a month boundary', () => {
    assert.equal(addDays('2026-08-27', 45), '2026-10-11');
  });

  it('does not shift a day across the DST change', () => {
    // Nov 1 2026 is the EDT→EST switch. A local-time Date would land on Oct 31.
    assert.equal(addDays('2026-10-25', 10), '2026-11-04');
    assert.equal(daysBetween('2026-10-25', '2026-11-04'), 10);
  });

  it('counts backwards when the target is in the past', () => {
    assert.equal(daysBetween('2026-09-11', '2026-09-04'), -7);
  });

  it('returns empty/zero rather than NaN for junk input', () => {
    assert.equal(addDays('', 45), '');
    assert.equal(addDays('not-a-date', 45), '');
    assert.equal(daysBetween('2026-09-11', ''), 0);
  });
});

describe('balanceClock', () => {
  it('is inactive when no clock has been started — the normal deal', () => {
    assert.equal(clockOf('').active, false);
    assert.equal(balanceClock(undefined, '2026-09-11').active, false);
    assert.equal(balanceClock({}, '2026-09-11').active, false);
  });

  // The live case this was built for.
  it('puts the Matthew Melo deal (paid Aug 27) due Oct 11', () => {
    const clock = clockOf('2026-08-27');
    assert.equal(clock.active, true);
    assert.equal(clock.dueOn, '2026-10-11');
    assert.equal(clock.daysRemaining, 30);
    assert.equal(clock.status, 'running');
  });

  it('turns due_soon inside the last week, and only then', () => {
    assert.equal(clockOf('2026-07-27', {}, '2026-09-05').status, 'due_soon'); // 5 days left
    assert.equal(clockOf('2026-07-27', {}, '2026-09-01').status, 'running'); // 9 days left
  });

  it('counts the boundary days exactly', () => {
    // 8 days out is still just running; 7 is the first due_soon day.
    assert.equal(clockOf(addDays('2026-09-11', 8 - 45)).daysRemaining, 8);
    assert.equal(clockOf(addDays('2026-09-11', 8 - 45)).status, 'running');
    assert.equal(clockOf(addDays('2026-09-11', 7 - 45)).status, 'due_soon');
  });

  it('reads day 45 itself as due, not overdue', () => {
    const clock = clockOf('2026-07-28'); // +45 = 2026-09-11, today
    assert.equal(clock.dueOn, '2026-09-11');
    assert.equal(clock.daysRemaining, 0);
    assert.equal(clock.status, 'due');
  });

  it('goes overdue the day after', () => {
    const clock = clockOf('2026-07-27');
    assert.equal(clock.dueOn, '2026-09-10');
    assert.equal(clock.daysRemaining, -1);
    assert.equal(clock.status, 'overdue');
  });

  it('stops at settled even when the due date has long passed', () => {
    const clock = clockOf('2026-01-01', { settled: '2026-02-10' });
    assert.equal(clock.status, 'settled');
    assert.ok(String(formatBalanceClock(clock)).includes('Settled'));
  });

  it('honours a non-45-day term', () => {
    assert.equal(clockOf('2026-09-01', { days: 30 }).dueOn, '2026-10-01');
  });
});

describe('balanceClockNeedsAttention', () => {
  it('stays quiet while the clock is still running', () => {
    assert.equal(balanceClockNeedsAttention(clockOf('2026-08-27')), false);
    assert.equal(balanceClockNeedsAttention(clockOf('2026-07-27', {}, '2026-09-05')), false);
  });

  it('raises on the due date and while overdue', () => {
    assert.equal(balanceClockNeedsAttention(clockOf('2026-07-28')), true);
    assert.equal(balanceClockNeedsAttention(clockOf('2026-07-27')), true);
  });

  it('never raises once settled, or with no clock at all', () => {
    assert.equal(balanceClockNeedsAttention(clockOf('2026-01-01', { settled: '2026-02-10' })), false);
    assert.equal(balanceClockNeedsAttention(clockOf('')), false);
  });
});

describe('formatBalanceClock', () => {
  it('says how long is left while running', () => {
    assert.equal(formatBalanceClock(clockOf('2026-08-27')), 'Balance due Oct 11, 2026 · 30d left');
  });

  it('says how late it is once overdue', () => {
    assert.ok(String(formatBalanceClock(clockOf('2026-07-27'))).includes('overdue'));
    assert.ok(String(formatBalanceClock(clockOf('2026-07-27'))).includes('1d ago'));
  });

  it('is blank when there is no clock', () => {
    assert.equal(formatBalanceClock(clockOf('')), '');
  });
});

// ─── The rep-exposure guard ──────────────────────────────────────────────────
// The admin's net is total commission minus the rep's 5%. Hand a rep that
// number and they can add their own cut and recover the total rate and the
// house's margin. The real figures below are the Matthew Melo deal.

const MELO_DEAL = {
  id: 'deal-melo',
  homeownerName: 'Matthew Melo',
  estimatedJobValue: 78535,
} as unknown as import('./types.ts').Deal;

const meloCommission = (fields: Record<string, unknown> = {}) =>
  ({
    id: 'comm-melo',
    dealId: 'deal-melo',
    repId: 'rep-steven',
    // 8.5% of $78,535 total, less the rep's 5% → the admin's net.
    adminTotalEstimatedCommission: 6675,
    repEstimatedCommission: 3927,
    adminNetCommission: 2748,
    adminNetPaidCommission: 0,
    balanceClockStartedAt: '2026-08-27',
    balanceClockDays: 45,
    balanceSettledAt: '',
    ...fields,
  }) as unknown as import('./types.ts').Commission;

describe('pendingBalanceClocks', () => {
  it('gives an admin the outstanding net', () => {
    const rows = pendingBalanceClocks([meloCommission()], [MELO_DEAL], '2026-09-11', {
      canSeeAmounts: true,
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].outstanding, 2748);
    assert.equal(pendingBalanceClockTotal(rows), 2748);
  });

  // The one that matters: $2,748 + a rep's own $3,927 = $6,675 = 8.5%.
  it('never hands a rep the admin net, in the row or the total', () => {
    const rows = pendingBalanceClocks([meloCommission()], [MELO_DEAL], '2026-09-11', {
      canSeeAmounts: false,
    });
    assert.equal(rows.length, 1, 'the rep still sees the deal and its countdown');
    assert.equal(rows[0].outstanding, null);
    assert.equal(pendingBalanceClockTotal(rows), 0);
  });

  it('still gives the rep the dates and the countdown', () => {
    const [row] = pendingBalanceClocks([meloCommission()], [MELO_DEAL], '2026-09-11', {
      canSeeAmounts: false,
    });
    assert.equal(row.clock.dueOn, '2026-10-11');
    assert.equal(row.clock.daysRemaining, 30);
  });

  it('drops a commission whose deal the viewer cannot see', () => {
    assert.equal(
      pendingBalanceClocks([meloCommission()], [], '2026-09-11', { canSeeAmounts: true }).length,
      0
    );
  });

  it('drops settled and unstarted clocks — neither is pending', () => {
    const rows = pendingBalanceClocks(
      [
        meloCommission({ id: 'a', balanceSettledAt: '2026-09-01' }),
        meloCommission({ id: 'b', balanceClockStartedAt: '' }),
      ],
      [MELO_DEAL],
      '2026-09-11',
      { canSeeAmounts: true }
    );
    assert.equal(rows.length, 0);
  });

  it('subtracts what has already been collected', () => {
    const [row] = pendingBalanceClocks(
      [meloCommission({ adminNetPaidCommission: 1000 })],
      [MELO_DEAL],
      '2026-09-11',
      { canSeeAmounts: true }
    );
    assert.equal(row.outstanding, 1748);
  });

  it('sorts soonest due first', () => {
    const rows = pendingBalanceClocks(
      [
        meloCommission({ id: 'later', balanceClockStartedAt: '2026-09-01' }),
        meloCommission({ id: 'sooner', balanceClockStartedAt: '2026-08-01' }),
      ],
      [MELO_DEAL],
      '2026-09-11',
      { canSeeAmounts: true }
    );
    assert.deepEqual(
      rows.map((r) => r.commission.id),
      ['sooner', 'later']
    );
  });
});
