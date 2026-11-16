import test from 'node:test';
import assert from 'node:assert/strict';

import {
  appointmentWantsDeal,
  dealDataFromAppointment,
  ensureDealForAppointment,
  matchOpenDeal,
  type AppointmentForDeal,
} from './deal-from-appointment.ts';

const appt = (over: Partial<AppointmentForDeal> = {}): AppointmentForDeal => ({
  id: 'apt-1',
  dealId: null,
  deletedAt: null,
  status: 'scheduled',
  appointmentType: 'home_visit',
  customerName: 'Akbar',
  phone: '(905) 555-1234',
  email: 'Akbar@Example.com',
  address: '1 Main St',
  city: 'Oshawa',
  postalCode: 'L1H 1A1',
  projectType: 'Basement Renovation Consultation',
  assignedRepId: 'rep-keven',
  contractorId: null,
  appointmentDate: '2026-11-20',
  ...over,
});

test('a booked home visit wants a deal', () => {
  assert.equal(appointmentWantsDeal(appt()), true);
  assert.equal(appointmentWantsDeal(appt({ appointmentType: 'video_consultation' })), true);
  assert.equal(appointmentWantsDeal(appt({ appointmentType: 'phone_consultation' })), true);
});

test('already linked, events, cancelled and deleted consultations do not', () => {
  assert.equal(appointmentWantsDeal(appt({ dealId: 'deal-9' })), false);
  assert.equal(appointmentWantsDeal(appt({ appointmentType: 'showroom_visit' })), false);
  assert.equal(appointmentWantsDeal(appt({ appointmentType: 'supplier_meeting' })), false);
  assert.equal(appointmentWantsDeal(appt({ status: 'cancelled' })), false);
  assert.equal(appointmentWantsDeal(appt({ deletedAt: new Date() })), false);
});

test('new deal lands in Appointment booked with the consultation details', () => {
  const d = dealDataFromAppointment(appt({ recommendedContractorId: 'c-lps', estimatedProjectValue: 75000 }));
  assert.equal(d.status, 'appointment_booked');
  assert.equal(d.homeownerName, 'Akbar');
  assert.equal(d.assignedRepId, 'rep-keven');
  assert.equal(d.assignedContractorId, 'c-lps');
  assert.equal(d.estimatedJobValue, 75000);
  assert.equal(d.nextFollowUpDate, '2026-11-20');
});

test('matches the homeowner\'s open deal by email, then phone digits', () => {
  const open = [
    { id: 'd-phone', email: '', phone: '905-555-1234', status: 'quoted' },
    { id: 'd-email', email: 'akbar@example.com', phone: '', status: 'new_lead' },
  ];
  assert.equal(matchOpenDeal(appt(), open)?.id, 'd-email');
  assert.equal(matchOpenDeal(appt({ email: '' }), open)?.id, 'd-phone');
  assert.equal(matchOpenDeal(appt({ email: '', phone: '+1 905 555 1234' }), open)?.id, 'd-phone');
});

test("a visit with no email or phone matches the same rep's deal by exact name only", () => {
  const open = [
    { id: 'd-stanley', email: 'x@y.com', phone: '6470000000', status: 'negotiating', homeownerName: 'Stanley', assignedRepId: 'rep-keven' },
    { id: 'd-other-rep', email: '', phone: '', status: 'quoted', homeownerName: 'Raj', assignedRepId: 'rep-steven' },
  ];
  const bare = { email: '', phone: '' };
  assert.equal(matchOpenDeal(appt({ ...bare, customerName: ' stanley ' }), open)?.id, 'd-stanley');
  // Different rep: no match.
  assert.equal(matchOpenDeal(appt({ ...bare, customerName: 'Raj' }), open), null);
  // Has a phone that matches nothing: name is NOT used.
  assert.equal(matchOpenDeal(appt({ email: '', phone: '4160000000', customerName: 'Stanley' }), open), null);
  // Two same-name deals on one rep: ambiguous, no match.
  const twins = [...open, { ...open[0], id: 'd-stanley-2' }];
  assert.equal(matchOpenDeal(appt({ ...bare, customerName: 'Stanley' }), twins), null);
});

test('won and lost deals are history, never a match', () => {
  const closed = [
    { id: 'd-won', email: 'akbar@example.com', phone: '', status: 'won' },
    { id: 'd-lost', email: '', phone: '9055551234', status: 'lost' },
  ];
  assert.equal(matchOpenDeal(appt(), closed), null);
});

// ── ensureDealForAppointment against a tiny fake client ──

function fakeDb(appointment: AppointmentForDeal | null, deals: Array<Record<string, unknown>> = []) {
  const calls: Record<string, unknown[]> = { dealCreate: [], dealUpdate: [], aptUpdate: [], commission: [], activity: [] };
  return {
    calls,
    db: {
      appointment: {
        findUnique: async () => appointment,
        update: async (a: unknown) => { calls.aptUpdate.push(a); return {}; },
      },
      deal: {
        findMany: async () => deals,
        create: async ({ data }: { data: Record<string, unknown> }) => { calls.dealCreate.push(data); return { id: 'deal-new', ...data }; },
        update: async (a: unknown) => { calls.dealUpdate.push(a); return {}; },
      },
      commission: { upsert: async (a: unknown) => { calls.commission.push(a); return {}; } },
      contractor: { findUnique: async () => null },
      user: { findUnique: async () => ({ id: 'rep-keven', name: 'Keven', role: 'rep' }) },
      activity: { create: async (a: unknown) => { calls.activity.push(a); return {}; } },
    },
  };
}

test('creates the deal, its commission row, and links the consultation', async () => {
  const { db, calls } = fakeDb(appt());
  const r = await ensureDealForAppointment(db, 'apt-1', { defaultTotalRate: 0.085 });
  assert.deepEqual(r, { outcome: 'created', dealId: 'deal-new' });
  assert.equal(calls.dealCreate.length, 1);
  assert.equal(calls.commission.length, 1);
  assert.deepEqual(calls.aptUpdate[0], { where: { id: 'apt-1' }, data: { dealId: 'deal-new' } });
  // Activity actor is the real rep — the live DB has a foreign key on it.
  assert.equal((calls.activity[0] as { data: { actorUserId: string } }).data.actorUserId, 'rep-keven');
});

test('links to an existing open deal instead of duplicating, and lifts new_lead', async () => {
  const { db, calls } = fakeDb(appt(), [
    { id: 'd-existing', email: 'akbar@example.com', phone: '', status: 'new_lead', homeownerName: 'Akbar' },
  ]);
  const r = await ensureDealForAppointment(db, 'apt-1', { defaultTotalRate: 0.085 });
  assert.deepEqual(r, { outcome: 'linked', dealId: 'd-existing' });
  assert.equal(calls.dealCreate.length, 0);
  assert.deepEqual(calls.dealUpdate[0], { where: { id: 'd-existing' }, data: { status: 'appointment_booked' } });
});

test('a deal already at negotiating is linked but not moved backwards', async () => {
  const { db, calls } = fakeDb(appt(), [
    { id: 'd-neg', email: 'akbar@example.com', phone: '', status: 'negotiating', homeownerName: 'Akbar' },
  ]);
  await ensureDealForAppointment(db, 'apt-1', { defaultTotalRate: 0.085 });
  assert.equal(calls.dealUpdate.length, 0);
});

test('an already-linked consultation is left alone', async () => {
  const { db, calls } = fakeDb(appt({ dealId: 'deal-9' }));
  const r = await ensureDealForAppointment(db, 'apt-1', { defaultTotalRate: 0.085 });
  assert.equal(r.outcome, 'skipped');
  assert.equal(calls.dealCreate.length + calls.aptUpdate.length, 0);
});
