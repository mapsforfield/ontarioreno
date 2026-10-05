import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BASEMENT_FINANCING_PROGRAM,
  LONDON_ARU_LOAN_PROGRAM as london,
  PROGRAMS,
  areaForMunicipality,
  programBySlug,
  programForArea,
  questionsForStep,
} from './program-config.ts';
import { leadIsRemote } from './lead-availability.ts';
import { isRemoteConsultationCity } from './remote-consultation.ts';
import { routeConsultation } from './consultation-routing.ts';

// ─── London ARU Loan ─────────────────────────────────────────────────────────
// The first consultation is a phone call, and only THIS program's bookings are
// calls. London leads from any other program stay in-person — the user chose
// that scope deliberately.

test('the London ARU program is live, phone-only and gated on London', () => {
  assert.equal(london.enabled, true);
  assert.equal(london.consultationMode, 'phone');
  assert.equal(london.geography, 'municipality');
  assert.equal(london.schedulingArea, 'LONDON');
  assert.equal(programBySlug('london-aru'), london);
  assert.equal(programForArea('LONDON'), london);
  for (const name of ['London', 'london', 'Lambeth', 'Byron']) {
    assert.equal(areaForMunicipality(name), 'LONDON', `${name} must map to London`);
  }
});

test('a London ARU booking is remote wherever the property is', () => {
  // The bug this prevents: copy saying "a specialist will call" while the
  // scheduler anchors the rep's travel radius on London.
  assert.equal(leadIsRemote({ city: 'London', programKey: london.key }), true);
  assert.equal(leadIsRemote({ city: '', resolvedMunicipality: '', programKey: london.key }), true);
});

test('London leads on other programs stay in-person', () => {
  // "Only the ARU ad" — London is NOT on the remote-city list.
  assert.equal(isRemoteConsultationCity('London'), false);
  assert.equal(leadIsRemote({ city: 'London', programKey: BASEMENT_FINANCING_PROGRAM.key }), false);
  assert.equal(leadIsRemote({ city: 'London' }), false);
});

test('only the London ARU program is phone-only', () => {
  const phone = PROGRAMS.filter((p) => p.consultationMode === 'phone').map((p) => p.key);
  assert.deepEqual(phone, [london.key]);
});

test('a London address books the call directly', () => {
  const routing = routeConsultation({
    addressState: 'ADDRESS_VERIFIED',
    area: 'LONDON',
    program: london,
    answers: { projectType: 'secondary_suite' },
  });
  assert.equal(routing.outcome, 'DIRECT_CALENDAR');
});

test('an address outside London becomes a call-back, never a booking', () => {
  const routing = routeConsultation({
    addressState: 'ADDRESS_UNVERIFIED',
    area: null,
    program: london,
    answers: { projectType: 'secondary_suite' },
  });
  assert.equal(routing.outcome, 'MANUAL_REVIEW');
});

test('every offered unit type is eligible', () => {
  const offered = london.questions.find((q) => q.key === 'projectType')!.options.map((o) => o.value);
  for (const value of offered) {
    assert.ok(london.eligibleProjectTypes.includes(value), `${value} would route to manual review`);
  }
  assert.equal(offered.includes('unsure'), false, 'unsure would pull the calendar after a time is picked');
});

test('the City conditions are asked after booking', () => {
  const keys = london.prepQuestions.map((q) => q.key);
  for (const key of ['ownerOccupied', 'workStarted', 'mortgageShare', 'contribution']) {
    assert.ok(keys.includes(key), `the rep needs the ${key} answer before the call`);
  }
  for (const q of london.prepQuestions) assert.ok(q.options.length > 0, `${q.key} has no options`);
  // One question before the calendar, on step 1; the address is on the last screen.
  assert.equal(questionsForStep(london, 1).length, 1);
  assert.equal(london.addressPlacement, 'final');
  assert.equal(london.bookingFlow, 'calendar_early');
});

test('the copy never calls the loan a grant or forgivable', () => {
  // The City's forgivable ARU Construction Grant is CLOSED. The open program is
  // a repayable loan, and a homeowner told otherwise was misled before the call.
  const copy = [
    london.displayAmountLabel,
    ...london.fundingHighlights,
    ...london.programTerms,
    london.prepFinancingNote ?? '',
    london.whyFreeText,
    london.fundingGuidance.lead,
    london.fundingGuidance.highlight,
    london.appointmentProjectTypeLabel,
    london.pageTitle ?? '',
  ].join(' ');
  assert.doesNotMatch(copy, /forgiv/i);
  assert.doesNotMatch(copy.replace(/not a grant/gi, ''), /\bgrant\b/i);
  assert.match(copy, /repayable/i);
  assert.match(copy, /\$45,000/);
});
