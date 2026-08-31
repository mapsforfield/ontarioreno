import test from 'node:test';
import assert from 'node:assert/strict';
import { programBySlug } from './program-config.ts';
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
