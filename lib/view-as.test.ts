import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  canViewAs,
  isReadOnlyMethod,
  requestedViewAsId,
  VIEW_AS_HEADER,
} from './view-as.ts';

const admin = { id: 'user-admin', role: 'admin' };
const steven = { id: 'user-steven', role: 'rep', active: true };
const otherAdmin = { id: 'user-admin-2', role: 'admin', active: true };

const req = (headers: Record<string, string | string[]> = {}) =>
  ({ headers }) as unknown as Parameters<typeof requestedViewAsId>[0];

describe('requestedViewAsId', () => {
  it('reads the header for an admin', () => {
    assert.equal(
      requestedViewAsId(req({ [VIEW_AS_HEADER]: 'user-steven' }), admin),
      'user-steven'
    );
  });

  // The rule that makes this mechanism safe to ship.
  it('ignores the header entirely for a rep', () => {
    assert.equal(
      requestedViewAsId(req({ [VIEW_AS_HEADER]: 'user-admin' }), { role: 'rep' }),
      null
    );
  });

  it('ignores it for a contractor, and with no session at all', () => {
    assert.equal(
      requestedViewAsId(req({ [VIEW_AS_HEADER]: 'user-admin' }), { role: 'contractor' }),
      null
    );
    assert.equal(requestedViewAsId(req({ [VIEW_AS_HEADER]: 'user-admin' }), null), null);
  });

  it('treats a blank or missing header as not viewing', () => {
    assert.equal(requestedViewAsId(req({}), admin), null);
    assert.equal(requestedViewAsId(req({ [VIEW_AS_HEADER]: '   ' }), admin), null);
  });

  it('takes the first value if the header is repeated', () => {
    assert.equal(
      requestedViewAsId(req({ [VIEW_AS_HEADER]: ['user-steven', 'user-other'] }), admin),
      'user-steven'
    );
  });
});

describe('canViewAs', () => {
  it('lets an admin view as an active rep', () => {
    assert.equal(canViewAs(admin, steven), true);
  });

  it('refuses a non-admin outright', () => {
    assert.equal(canViewAs({ id: 'r', role: 'rep' }, steven), false);
  });

  it('refuses another admin — it would grant nothing and invite misuse', () => {
    assert.equal(canViewAs(admin, otherAdmin), false);
  });

  it('refuses a contractor account', () => {
    assert.equal(
      canViewAs(admin, { id: 'c', role: 'contractor', active: true }),
      false
    );
  });

  it('refuses a deactivated rep', () => {
    assert.equal(canViewAs(admin, { ...steven, active: false }), false);
  });

  it('refuses yourself, and a target that does not exist', () => {
    assert.equal(canViewAs(admin, { id: admin.id, role: 'admin', active: true }), false);
    assert.equal(canViewAs(admin, null), false);
  });

  // Belt and braces: nothing about the target can turn a rep into an admin.
  it('never produces access the caller did not already have', () => {
    for (const role of ['rep', 'contractor', 'admin', '', 'superadmin']) {
      assert.equal(
        canViewAs({ id: 'r', role: 'rep' }, { id: 't', role, active: true }),
        false,
        `a rep must never be able to view as a ${role || '(blank role)'}`
      );
    }
  });
});

describe('isReadOnlyMethod', () => {
  it('allows reads', () => {
    for (const method of ['GET', 'get', 'HEAD', 'OPTIONS', undefined]) {
      assert.equal(isReadOnlyMethod(method), true, `${method} should be read-only`);
    }
  });

  it('blocks every write verb', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'post']) {
      assert.equal(isReadOnlyMethod(method), false, `${method} must be blocked`);
    }
  });
});
