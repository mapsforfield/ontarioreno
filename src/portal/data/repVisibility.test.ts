/**
 * The two exceptions to "a rep sees their own consultations".
 *
 * Both come from real incidents, and both tests are written as those
 * incidents: a transferred client whose history did not come with them, and
 * two reps who kept phoning each other mid-visit.
 *
 * The negative cases matter as much as the positive ones. This module widens
 * access, so a test suite that only proves it opens things would happily pass
 * while it opened everything.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canSeeAppointment,
  hasVisibilityPartners,
  homeownerKeys,
  responsibleHomeownerKeys,
  visibilityContext,
  visibilityPartnerIds,
  visibleAppointmentsFor,
} from './repVisibility';

const KEVEN = { id: 'rep-keven', name: 'Keven', email: 'keven@ontarioreno.ca', role: 'rep' as const };
const STEVEN = { id: 'rep-steven', name: 'Steven', email: 'steven@ontarioreno.ca', role: 'rep' as const };
const DAVID = { id: 'rep-david', name: 'David', email: 'david@ontarioreno.ca', role: 'rep' as const };
const SABAH = { id: 'admin-sabah', name: 'Sabah', email: 'sabah@ontarioreno.ca', role: 'admin' as const };
const USERS = [KEVEN, STEVEN, DAVID, SABAH];

// Each row gets a DISTINCT homeowner unless a test deliberately overrides it.
// A shared fixture email is not a neutral default here: two rows carrying the
// same address are by definition the same homeowner, so a lazy fixture would
// have quietly proved the opposite of what these tests claim.
let seq = 0;
const appt = (over: Record<string, unknown> = {}) => {
  seq += 1;
  return {
    id: `a${seq}`,
    assignedRepId: KEVEN.id,
    clientId: null as string | null,
    phone: `+1416555${String(1000 + seq)}`,
    email: `homeowner${seq}@example.com`,
    ...over,
  };
};

/** The one homeowner two rows are meant to share: Steven's transferred client. */
const OPUTU = { phone: '+14372189554', email: 'oputu@example.com' };

const ctx = (
  user: { id: string; name: string; email: string },
  appointments: ReturnType<typeof appt>[],
  deals: Array<Record<string, unknown>> = []
) => visibilityContext(user, USERS, appointments, deals as never);

// ─── 1. The transfer: Steven's actual bug ───────────────────────────────────

test("a rep sees the history of a homeowner transferred to them", () => {
  // Keven ran the first consultation. The client then moved to Steven, which
  // moved the DEAL — the old consultation is still assigned to Keven.
  const oldConsult = appt({ id: 'old', assignedRepId: KEVEN.id, ...OPUTU });
  const stevensDeal = { assignedRepId: STEVEN.id, phone: OPUTU.phone, email: null, clientId: null };

  const context = ctx(STEVEN, [oldConsult], [stevensDeal]);

  assert.equal(
    canSeeAppointment(STEVEN, oldConsult, context),
    true,
    'Steven was handed the customer but not the customer\'s history',
  );
});

test('a transferred consultation brings the rest of that homeowner with it', () => {
  // Here the consultation itself was transferred, and an older one was not.
  const transferred = appt({ id: 'new', assignedRepId: STEVEN.id, ...OPUTU });
  const older = appt({ id: 'old', assignedRepId: KEVEN.id, ...OPUTU });

  const visible = visibleAppointmentsFor(STEVEN, [transferred, older], [], USERS);

  assert.deepEqual(visible.map((a) => a.id).sort(), ['new', 'old']);
});

test('an unrelated homeowner stays invisible', () => {
  const mine = appt({ id: 'mine', assignedRepId: STEVEN.id });
  const someoneElses = appt({ id: 'theirs', assignedRepId: DAVID.id });

  const visible = visibleAppointmentsFor(STEVEN, [mine, someoneElses], [], USERS);

  assert.deepEqual(visible.map((a) => a.id), ['mine']);
});

test('homeowners are matched on client id, phone or email — not on name', () => {
  const keys = homeownerKeys({ clientId: 'c1', phone: '(437) 218-9554', email: ' Oputu@Example.com ' });

  // Formatting varies wildly across bookings, imports and hand entry, so the
  // digits and the lowercased address are the only parts that compare.
  assert.ok(keys.includes('client:c1'));
  assert.ok(keys.includes('phone:4372189554'));
  assert.ok(keys.includes('email:oputu@example.com'));
  assert.equal(keys.length, 3);
});

test('a row with no usable identifier matches nobody', () => {
  // Otherwise an empty key would collide with every other empty key and quietly
  // hand every rep every contactless row.
  assert.deepEqual(homeownerKeys({ clientId: null, phone: '', email: '' }), []);

  const blank = appt({ id: 'blank', assignedRepId: KEVEN.id, phone: '', email: '', clientId: null });
  const visible = visibleAppointmentsFor(DAVID, [blank], [{ assignedRepId: DAVID.id, phone: '', email: '', clientId: null }], USERS);

  assert.deepEqual(visible, []);
});

test('responsibility comes from deals as well as consultations', () => {
  // A transfer may move either one; whichever arrives must bring the history.
  const keys = responsibleHomeownerKeys(
    STEVEN.id,
    [appt({ assignedRepId: STEVEN.id, phone: '+14161112222', email: null })],
    [{ assignedRepId: STEVEN.id, phone: null, email: 'deal@example.com', clientId: null }],
  );

  assert.ok(keys.has('phone:4161112222'));
  assert.ok(keys.has('email:deal@example.com'));
});

test("another rep's rows do not make you responsible", () => {
  const keys = responsibleHomeownerKeys(
    STEVEN.id,
    [appt({ assignedRepId: KEVEN.id, phone: '+14169998888' })],
    [],
  );

  assert.equal(keys.has('phone:4169998888'), false);
});

// ─── 2. The named pair ──────────────────────────────────────────────────────

test('Keven and Steven can see each other', () => {
  assert.deepEqual(visibilityPartnerIds(KEVEN, USERS), [STEVEN.id]);
  assert.deepEqual(visibilityPartnerIds(STEVEN, USERS), [KEVEN.id]);
});

test('the pairing does not leak to anyone else', () => {
  // The explicit requirement: a rep added later gets nothing by default.
  assert.deepEqual(visibilityPartnerIds(DAVID, USERS), []);
  assert.equal(hasVisibilityPartners(DAVID, USERS), false);

  const kevensAppt = appt({ id: 'k', assignedRepId: KEVEN.id });
  assert.deepEqual(visibleAppointmentsFor(DAVID, [kevensAppt], [], USERS), []);
});

test("a partner's consultation is visible", () => {
  const kevens = appt({ id: 'k', assignedRepId: KEVEN.id });
  const context = ctx(STEVEN, [kevens]);

  assert.equal(canSeeAppointment(STEVEN, kevens, context), true);
});

test('a group can be written with emails instead of names', () => {
  // Names get edited; emails are the stabler identifier. Both forms must work
  // so the live list can be tightened to emails later without any behaviour
  // change — the group is injected here rather than relying on who happens to
  // be paired in production.
  const byEmail = [['KEVEN@ontarioreno.ca', 'Steven@OntarioReno.CA']];

  assert.deepEqual(visibilityPartnerIds(KEVEN, USERS, byEmail), [STEVEN.id]);
  assert.deepEqual(visibilityPartnerIds(STEVEN, USERS, byEmail), [KEVEN.id]);
  assert.deepEqual(visibilityPartnerIds(DAVID, USERS, byEmail), []);
});

test('renaming a rep breaks a name-based pairing, which is why emails are safer', () => {
  // Recorded rather than lamented: if someone edits a display name, the
  // pairing silently stops. Whoever hits that should find this test explaining
  // it, and the fix is to write the group with emails.
  const renamed = { ...STEVEN, name: 'Steve R.' };

  assert.deepEqual(visibilityPartnerIds(KEVEN, [KEVEN, renamed, DAVID]), []);
  assert.deepEqual(
    visibilityPartnerIds(KEVEN, [KEVEN, renamed, DAVID], [[KEVEN.email, STEVEN.email]]),
    [STEVEN.id],
  );
});

test('nobody is their own partner', () => {
  assert.equal(visibilityPartnerIds(KEVEN, USERS).includes(KEVEN.id), false);
});

// ─── The boundary that must not move ────────────────────────────────────────

test('an admin still sees everything', () => {
  const rows = [appt({ id: 'a', assignedRepId: KEVEN.id }), appt({ id: 'b', assignedRepId: DAVID.id })];

  assert.deepEqual(visibleAppointmentsFor(SABAH, rows, [], USERS).map((a) => a.id), ['a', 'b']);
});

test('an unrelated rep sees only their own, which is still the default', () => {
  const mine = appt({ id: 'mine', assignedRepId: DAVID.id });
  const kevens = appt({ id: 'k', assignedRepId: KEVEN.id });
  const stevens = appt({ id: 's', assignedRepId: STEVEN.id });

  const visible = visibleAppointmentsFor(DAVID, [mine, kevens, stevens], [], USERS);

  assert.deepEqual(visible.map((a) => a.id), ['mine']);
});
