import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildOwnershipIndex, isOwnAppointment, isOwnClient } from './contractor-visibility.ts';

const index = buildOwnershipIndex('galaxy', [
  { id: 'melo-deal', clientId: 'melo', assignedContractorId: 'galaxy' },
  { id: 'robin-deal', clientId: 'robin', assignedContractorId: 'reno-chefs' },
  { id: 'open-deal', clientId: 'newbie', assignedContractorId: null },
]);

describe('isOwnAppointment', () => {
  it('own when attributed to Galaxy, or its deal or client is Galaxy’s', () => {
    assert.equal(isOwnAppointment({ contractorId: 'galaxy' }, index), true);
    assert.equal(isOwnAppointment({ dealId: 'melo-deal' }, index), true);
    assert.equal(isOwnAppointment({ clientId: 'melo' }, index), true);
  });

  it('never own when another contractor has it', () => {
    assert.equal(isOwnAppointment({ dealId: 'robin-deal' }, index), false);
    assert.equal(isOwnAppointment({ clientId: 'robin' }, index), false);
    // Explicit attribution to someone else beats a Galaxy client match.
    assert.equal(isOwnAppointment({ contractorId: 'reno-chefs', clientId: 'melo' }, index), false);
    assert.equal(isOwnAppointment({ dealId: 'robin-deal', clientId: 'melo' }, index), false);
  });

  it('not own when unassigned or unknown', () => {
    assert.equal(isOwnAppointment({ dealId: 'open-deal', clientId: 'newbie' }, index), false);
    assert.equal(isOwnAppointment({}, index), false);
    assert.equal(isOwnAppointment({ contractorId: 'galaxy' }, null), false);
  });
});

describe('isOwnClient', () => {
  it('only clients with a Galaxy deal', () => {
    assert.equal(isOwnClient('melo', index), true);
    assert.equal(isOwnClient('robin', index), false);
    assert.equal(isOwnClient('newbie', index), false);
  });
});
