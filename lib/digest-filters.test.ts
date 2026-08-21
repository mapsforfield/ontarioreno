import test from 'node:test';
import assert from 'node:assert/strict';
import {
  followUpDigestWhere,
  openPipelineWhere,
  recapAppointmentsWhere,
  wonDealsWhere,
  OPEN_DEAL_STATUSES,
} from './digest-filters.js';

// The bug these exist for: a rep put a deal in the trash and kept getting
// "follow-up overdue" mail about it every morning. The digest query filtered
// status and isHistorical but never deletedAt, while the open-pipeline query
// three lines below it did — so the rule was right in one place and missing in
// the two beside it. Binning the deal was the one action available to him, and
// it did nothing.

test('every daily email excludes trashed rows', () => {
  // Asserted as a group on purpose. The original defect was one query out of
  // three missing this, and a per-query test would have passed on the other two.
  const filters = [
    ['follow-up digest', followUpDigestWhere('2026-08-21')],
    ['won deals', wonDealsWhere(new Date('2026-08-20'))],
    ['open pipeline', openPipelineWhere()],
    ['recap appointments', recapAppointmentsWhere('2026-08-20', '2026-08-21')],
  ] as const;

  for (const [name, where] of filters) {
    assert.equal(
      (where as { deletedAt?: unknown }).deletedAt,
      null,
      `${name} would email about deals in the trash bin`
    );
  }
});

test('a finished deal is never chased', () => {
  const statuses = followUpDigestWhere('2026-08-21').status.in;
  // Both endings. 'lost' is the one the rep complained about; 'won' would be
  // worse — chasing someone who has already signed.
  assert.equal(statuses.includes('lost' as never), false);
  assert.equal(statuses.includes('won' as never), false);
  assert.deepEqual(statuses, [...OPEN_DEAL_STATUSES]);
});

test('the digest covers overdue as well as due today', () => {
  // `lte` not `equals`: a follow-up missed on Friday must still surface on
  // Monday rather than being skipped for being late.
  const where = followUpDigestWhere('2026-08-21');
  assert.deepEqual(where.nextFollowUpDate, { lte: '2026-08-21', gt: '' });
});

test('deals with no follow-up date set are not chased', () => {
  // `gt: ''` — nextFollowUpDate defaults to an empty string, and an empty
  // string sorts below any real date, so without this every deal in the
  // pipeline would be "overdue" forever.
  assert.equal(followUpDigestWhere('2026-08-21').nextFollowUpDate.gt, '');
});

test('imported pre-portal deals stay out of the digest', () => {
  // They carry follow-up dates from a previous life.
  assert.equal(followUpDigestWhere('2026-08-21').isHistorical, false);
  assert.equal(wonDealsWhere(new Date()).isHistorical, false);
  assert.equal(openPipelineWhere().isHistorical, false);
});
