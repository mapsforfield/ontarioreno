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

test('the City conditions are asked BEFORE booking, after the unit type', () => {
  // The owner chose qualified calls over volume for this program.
  const keys = london.questions.map((q) => q.key);
  assert.deepEqual(keys, ['projectType', 'ownerOccupied', 'workStarted', 'mortgageShare', 'contribution']);
  for (const q of london.questions) assert.ok(q.options.length > 0, `${q.key} has no options`);
  assert.equal(london.prepQuestions.length, 0, 'nothing left to ask after booking');
  assert.equal(london.addressPlacement, 'final');
  assert.equal(london.bookingFlow, 'calendar_early');
});

const qualified = {
  projectType: 'secondary_suite',
  ownerOccupied: 'yes',
  workStarted: 'no',
  mortgageShare: 'over_75',
  contribution: 'need_financing',
};

test('a qualified London homeowner books, whatever they owe or how they fund it', () => {
  for (const mortgageShare of ['paid_off', 'under_50', '50_75', 'over_75', 'unsure']) {
    for (const contribution of ['cash_equity', 'need_financing', 'unsure']) {
      const routing = routeConsultation({
        addressState: 'ADDRESS_VERIFIED',
        area: 'LONDON',
        program: london,
        answers: { ...qualified, mortgageShare, contribution },
      });
      assert.equal(routing.outcome, 'DIRECT_CALENDAR', `${mortgageShare}/${contribution} must book`);
    }
  }
});

test('a rental, or work already started, is declined — never booked', () => {
  for (const failing of [{ ownerOccupied: 'no' }, { workStarted: 'yes' }]) {
    const routing = routeConsultation({
      addressState: 'ADDRESS_VERIFIED',
      area: 'LONDON',
      program: london,
      answers: { ...qualified, ...failing },
    });
    assert.equal(routing.outcome, 'DECLINE');
    assert.deepEqual(routing.reasons, ['PROGRAM_CONDITION_NOT_MET']);
  }
  assert.ok(london.declineMessage, 'a declined homeowner must be told why');
});

test('a skipped answer is never a decline', () => {
  const routing = routeConsultation({
    addressState: 'ADDRESS_VERIFIED',
    area: 'LONDON',
    program: london,
    answers: { projectType: 'garden_suite' },
  });
  assert.equal(routing.outcome, 'DIRECT_CALENDAR');
});

test('no other program declines on an answer', () => {
  for (const program of PROGRAMS.filter((p) => p !== london)) {
    assert.equal(program.disqualifyingAnswers, undefined, `${program.slug} gained a decline rule`);
  }
});

test('the copy never calls the loan a grant or forgivable', () => {
  // The City's forgivable ARU Construction Grant is CLOSED. The open program is
  // a repayable loan, and a homeowner told otherwise was misled before the call.
  const copy = [
    london.displayAmountLabel,
    ...london.fundingHighlights,
    ...london.programTerms,
    london.prepFinancingNote ?? '',
    london.declineMessage ?? '',
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

test('the equity question keeps the values earlier leads were stored under', () => {
  // Reworded from "owed" to "yours"; the stored meaning must not move, or a
  // lead captured last week reads backwards in the rep's brief.
  const q = london.questions.find((x) => x.key === 'mortgageShare')!;
  const share = Object.fromEntries(q.options.map((o) => [o.value, o.ownedShare]));
  assert.ok(share.under_50! > 0.5, 'under_50 owed means more than half is yours');
  assert.ok(share['50_75']! >= 0.25 && share['50_75']! <= 0.5);
  assert.ok(share.over_75! < 0.25);
  assert.equal(share.paid_off, 1);
  assert.equal(share.unsure, undefined, 'no bar for "not sure"');
});
