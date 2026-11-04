import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

/**
 * Reps must never be able to derive the total rate or the house's margin. The
 * server already withholds those fields; this keeps the rep half of the
 * Commission Center from ever reaching for them, so a change to the server
 * cannot quietly turn into a number on a rep's screen.
 */
const source = readFileSync('src/portal/pages/PortalCommissions.tsx', 'utf8');
const repView = source.slice(source.indexOf('const repRows = visibleCommissions'));
const repHelpers = source.slice(
  source.indexOf('// ─── Rep layout pieces'),
  source.indexOf('export default function PortalCommissions')
);

describe('rep Commission Center', () => {
  it('finds both halves of the rep view', () => {
    assert.ok(repView.includes('renderRepRow'));
    assert.ok(repHelpers.includes('repSectionFor'));
  });

  for (const forbidden of [
    'adminTotalCommissionRate',
    'adminTotalEstimatedCommission',
    'adminNetCommission',
    'adminNetPaidCommission',
    'overallPaymentStatus',
    'sectionFor(',
    'formatRate',
    'defaultCommissionRate',
    'pendingBalanceClocks',
  ]) {
    it(`never touches ${forbidden}`, () => {
      const code = (repView + repHelpers).replaceAll('repSectionFor(', '').replace(/\/\/.*$/gm, '');
      assert.equal(code.includes(forbidden), false);
    });
  }

  it('never offers an editor', () => {
    assert.equal(repView.includes('updateCommission'), false);
    assert.equal(repView.includes('updateDeal'), false);
    assert.equal(repView.includes('CommitNumberInput'), false);
  });
});
