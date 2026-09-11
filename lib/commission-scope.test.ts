import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canReadCommission, commissionScopeFor } from './commission-scope.ts';

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
