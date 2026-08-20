import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emailLeadAlert,
  planSubmissionNotifications,
  type SubmissionContext,
} from './notifications.ts';
import {
  describeCause,
  isProviderDegradation,
  type AddressResolutionCause,
} from './address-resolution.ts';

const sub = (over: Partial<SubmissionContext> = {}): SubmissionContext => ({
  leadId: 'lead-1',
  name: 'Jane',
  phone: '9055550199',
  email: 'jane@example.test',
  propertyAddress: '123 Main St W, Hamilton',
  municipality: 'Hamilton',
  outcome: 'MANUAL_REVIEW',
  reasons: ['ADDRESS_UNVERIFIED', 'MUNICIPALITY_UNRECOGNISED'],
  projectScope: 'Garage conversion',
  fundingPlan: 'Need financing',
  timeline: 'Within a month',
  ownership: 'Yes',
  programLabel: 'Hamilton',
  addressState: 'ADDRESS_UNVERIFIED',
  addressCause: 'INCOMPLETE_ADDRESS',
  addressCauseDetail: describeCause('INCOMPLETE_ADDRESS'),
  providerDegraded: false,
  teamInbox: 'info@ontarioreno.ca',
  ...over,
});

// ─── The bug: non-booking outcomes were silent ────────────────────────────────

for (const outcome of ['DIRECT_CALENDAR', 'MANUAL_REVIEW', 'NURTURE', 'DECLINE']) {
  test(`every outcome is announced — ${outcome}`, () => {
    const planned = planSubmissionNotifications(sub({ outcome }));
    const alert = planned.find((p) => p.kind === 'lead_alert');
    assert.ok(alert, `${outcome} produced no lead_alert`);
    assert.equal(alert.recipient, 'info@ontarioreno.ca');
    assert.equal(alert.channel, 'email');
  });
}

test('the alert is keyed to the lead, never to an appointment', () => {
  const [alert] = planSubmissionNotifications(sub());
  assert.equal(alert.idempotencyKey, 'lead-1:email:lead_alert:info@ontarioreno.ca');
  assert.ok(!alert.idempotencyKey.includes('appt'));
});

test('a resubmitted lead cannot double-alert', () => {
  const a = planSubmissionNotifications(sub())[0];
  const b = planSubmissionNotifications(sub())[0];
  assert.equal(a.idempotencyKey, b.idempotencyKey);
});

test('lead alerts never expire — a late lead is still worth hearing about', () => {
  for (const p of planSubmissionNotifications(sub())) assert.equal(p.expiresAt, '');
});

test('no team inbox configured plans nothing rather than sending to nowhere', () => {
  assert.equal(planSubmissionNotifications(sub({ teamInbox: '' })).length, 0);
});

// ─── Alert content ────────────────────────────────────────────────────────────

test('the body carries the outcome, the reason codes and the lead id', () => {
  const { body, subject } = emailLeadAlert(sub());
  assert.match(body, /MANUAL_REVIEW/);
  assert.match(body, /ADDRESS_UNVERIFIED, MUNICIPALITY_UNRECOGNISED/);
  assert.match(body, /lead-1/);
  assert.match(subject, /NEEDS REVIEW/);
  assert.match(subject, /Jane/);
});

test('an offered calendar is not reported as a booking', () => {
  const { body } = emailLeadAlert(sub({ outcome: 'DIRECT_CALENDAR' }));
  assert.match(body, /offered the calendar/);
});

test('a lead with no resolved address still produces a usable subject', () => {
  const { subject } = emailLeadAlert(
    sub({ municipality: '', propertyAddress: '', addressCause: 'PROVIDER_ERROR' })
  );
  assert.match(subject, /address unverified/);
});

// ─── Provider degradation, told apart from a bad address ──────────────────────

const DEGRADED: AddressResolutionCause[] = [
  'PROVIDER_NOT_CONFIGURED',
  'PROVIDER_QUOTA_EXHAUSTED',
  'PROVIDER_ERROR',
];
const NOT_DEGRADED: AddressResolutionCause[] = [
  'RESOLVED',
  'OUTSIDE_ONTARIO',
  'INCOMPLETE_ADDRESS',
  'MUNICIPALITY_UNMAPPED',
  'NO_PLACE_SELECTED',
];

for (const cause of DEGRADED) {
  test(`${cause} is our failure`, () => assert.equal(isProviderDegradation(cause), true));
}
for (const cause of NOT_DEGRADED) {
  test(`${cause} is not our failure`, () => assert.equal(isProviderDegradation(cause), false));
}

test('every cause has a human explanation', () => {
  for (const cause of [...DEGRADED, ...NOT_DEGRADED]) {
    assert.ok(describeCause(cause).length > 20, `${cause} has no useful description`);
  }
});

test('a bad address alerts once; a broken provider alerts twice', () => {
  const bad = planSubmissionNotifications(sub({ providerDegraded: false }));
  assert.equal(bad.filter((p) => p.kind === 'address_provider_alert').length, 0);

  const broken = planSubmissionNotifications(
    sub({ providerDegraded: true, addressCause: 'PROVIDER_QUOTA_EXHAUSTED' })
  );
  assert.equal(broken.length, 2);
  assert.ok(broken.find((p) => p.kind === 'address_provider_alert'));
});

test('the lead alert says the manual review was not the address’s fault', () => {
  const { body } = emailLeadAlert(sub({ providerDegraded: true, addressCause: 'PROVIDER_ERROR' }));
  assert.match(body, /OUR address provider failed/);
});

test('the provider alert is keyed per cause per day, not per lead', () => {
  const day = new Date('2026-07-31T12:00:00Z');
  const first = planSubmissionNotifications(
    sub({ leadId: 'lead-1', providerDegraded: true, addressCause: 'PROVIDER_ERROR' }),
    day
  ).find((p) => p.kind === 'address_provider_alert')!;
  const second = planSubmissionNotifications(
    sub({ leadId: 'lead-2', providerDegraded: true, addressCause: 'PROVIDER_ERROR' }),
    day
  ).find((p) => p.kind === 'address_provider_alert')!;
  // Same key → the unique constraint collapses the second, so a dead API key
  // cannot bury the inbox in one identical alert per submission.
  assert.equal(first.idempotencyKey, second.idempotencyKey);
  assert.match(first.idempotencyKey, /2026-07-31/);

  // But their lead alerts remain distinct — every lead is still announced.
  assert.notEqual(
    planSubmissionNotifications(sub({ leadId: 'lead-1' }), day)[0].idempotencyKey,
    planSubmissionNotifications(sub({ leadId: 'lead-2' }), day)[0].idempotencyKey
  );
});

test('a still-broken provider re-alerts the next day', () => {
  const key = (d: string) =>
    planSubmissionNotifications(
      sub({ providerDegraded: true, addressCause: 'PROVIDER_ERROR' }),
      new Date(d)
    ).find((p) => p.kind === 'address_provider_alert')!.idempotencyKey;
  assert.notEqual(key('2026-07-31T12:00:00Z'), key('2026-08-01T12:00:00Z'));
});

test('different causes alert separately on the same day', () => {
  const day = new Date('2026-07-31T12:00:00Z');
  const key = (addressCause: string) =>
    planSubmissionNotifications(sub({ providerDegraded: true, addressCause }), day).find(
      (p) => p.kind === 'address_provider_alert'
    )!.idempotencyKey;
  assert.notEqual(key('PROVIDER_ERROR'), key('PROVIDER_QUOTA_EXHAUSTED'));
});
