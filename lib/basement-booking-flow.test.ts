import test from 'node:test';
import assert from 'node:assert/strict';
import { programBySlug, resolveProgramGeography } from './program-config.ts';
import { routeConsultation } from './consultation-routing.ts';

// ─── The calendar-early basement flow ─────────────────────────────────────────
//
// Three things make this flow what it is, and each of them is a line somebody
// could reasonably "tidy up" later without knowing what it was for.

const basement = programBySlug('basement')!;
const hamilton = programBySlug('hamilton')!;

test('nothing but the project type is asked before the booking', () => {
  assert.equal(basement.bookingFlow, 'calendar_early');
  // The calendar is the landing screen and the project type is the single
  // question between it and the contact fields — it has to be asked before the
  // lead is written, because routing decides on it. Anything else added to
  // `questions` is another screen standing between a chosen time and a held
  // one; put it in prepQuestions instead, which is asked after the booking.
  assert.deepEqual(
    basement.questions.map((q) => q.key),
    ['projectType']
  );
});

test('the permit and payment questions still exist — after the booking', () => {
  const prep = basement.prepQuestions.map((q) => q.key);
  assert.ok(prep.includes('hasPermit'), 'the rep still wants the permit answer');
  assert.ok(prep.includes('contribution'), 'the rep still wants the payment answer');
});

test('the financing figure is never on a screen before the booking', () => {
  // displayAmountLabel is rendered by the prep block on the confirmation screen
  // and nowhere earlier. If a question ever carries it into the set asked
  // before the booking, this catches it.
  const preBookingText = basement.questions
    .flatMap((q) => [q.label, q.help ?? '', ...q.options.map((o) => o.label)])
    .join(' ');
  assert.ok(!preBookingText.includes('$'), 'a money figure reached a pre-booking screen');
});

test('an address we could not resolve does not throw away a chosen time', () => {
  // The homeowner picked a slot two screens before we ever saw an address, so
  // ADDRESS_UNVERIFIED may tag and flag this lead but must not take the
  // calendar away from it.
  const routed = routeConsultation({
    addressState: 'ADDRESS_UNVERIFIED',
    area: basement.schedulingArea,
    program: basement,
    answers: { projectType: 'basement_finish' },
  });
  assert.equal(routed.outcome, 'DIRECT_CALENDAR');
  assert.ok(
    routed.reasons.includes('ADDRESS_UNVERIFIED'),
    'the rep must still be told the address was never confirmed'
  );
});

test('every other program still treats an unverified address as doubt', () => {
  // booksWithoutVerifiedAddress is opt-in, per program. A grant flow asks for
  // the address first and is gated on the municipality it resolves to — the
  // relaxation above must never reach it.
  const routed = routeConsultation({
    addressState: 'ADDRESS_UNVERIFIED',
    area: hamilton.schedulingArea,
    program: hamilton,
    answers: { projectType: 'garden_suite', timeline: 'asap', contribution: 'cash_equity' },
  });
  assert.equal(routed.outcome, 'MANUAL_REVIEW');
  assert.ok(routed.reasons.includes('ADDRESS_UNVERIFIED'));
});

// ─── The addresses two real homeowners actually typed ─────────────────────────
//
// Both reached the calendar, chose a time, typed an address in their own words
// and were sent to a queue instead of a booking. Their leads recorded
// MANUAL_REVIEW / MUNICIPALITY_UNRECOGNISED against an INCOMPLETE_ADDRESS. The
// two cases below are those records, kept as tests so the gap cannot reopen.

test('an unparseable address still reaches the calendar on the basement flow', () => {
  // Bibi Alavi's lead recorded TYPED_TEXT_AMBIGUOUS; Kamil's INCOMPLETE_ADDRESS.
  for (const cause of ['INCOMPLETE_ADDRESS', 'TYPED_TEXT_AMBIGUOUS', 'TYPED_TEXT_NO_MATCH'] as const) {
    const geo = resolveProgramGeography(basement, {
      area: null,
      addressState: 'ADDRESS_UNVERIFIED',
      cause,
    });
    assert.equal(geo.area, 'ONTARIO', `${cause} lost the scheduling area`);
    // Not trusted — only not fatal. The state is unchanged, so the lead still
    // carries ADDRESS_UNVERIFIED and is still flagged for a rep.
    assert.equal(geo.addressState, 'ADDRESS_UNVERIFIED');

    const routed = routeConsultation({
      addressState: geo.addressState,
      area: geo.area,
      program: basement,
      answers: { projectType: 'basement_finish' },
    });
    assert.equal(routed.outcome, 'DIRECT_CALENDAR', `${cause} still blocked the booking`);
  }
});

test('an address outside Ontario is still declined, however badly it was typed', () => {
  // Checked before any of the rescue above. Widening the rule must never turn a
  // decline into a booking for a property nobody can drive to.
  const geo = resolveProgramGeography(basement, {
    area: null,
    addressState: 'ADDRESS_OUTSIDE_SERVICE_AREA',
    cause: 'INCOMPLETE_ADDRESS',
  });
  assert.equal(geo.area, null);
  assert.equal(
    routeConsultation({
      addressState: geo.addressState,
      area: geo.area,
      program: basement,
      answers: { projectType: 'basement_finish' },
    }).outcome,
    'DECLINE'
  );
});

test('a grant flow still queues an address it could not read', () => {
  // hamilton is municipality-gated: there the address IS the eligibility test,
  // so an unreadable one is real doubt and must keep going to a person.
  const geo = resolveProgramGeography(hamilton, {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
    cause: 'INCOMPLETE_ADDRESS',
  });
  assert.equal(geo.area, null);
  assert.equal(
    routeConsultation({
      addressState: geo.addressState,
      area: geo.area,
      program: hamilton,
      answers: { projectType: 'garden_suite', timeline: 'asap' },
    }).outcome,
    'MANUAL_REVIEW'
  );
});
