import test from 'node:test';
import assert from 'node:assert/strict';
import { routeConsultation } from './consultation-routing.ts';
import {
  BASEMENT_FINANCING_PROGRAM,
  BATHROOM_FINANCING_PROGRAM,
  DEFAULT_NURTURE_TIMELINES,
  FINANCING_PROGRAMS,
  GARDEN_SUITE_FINANCING_PROGRAM,
  HAMILTON_PROGRAM,
  KITCHEN_FINANCING_PROGRAM,
  type ProgramConfig,
  SIMCOE_PROGRAM,
  areaForMunicipality,
  programBySlug,
  questionsForStep,
  resolveProgramGeography,
} from './program-config.ts';
import { DEFAULT_NOTE_TEMPLATES, findNoteTemplate, parseNoteTemplates } from './note-templates.ts';

const OK = { projectType: 'secondary_suite', timeline: 'asap', contribution: 'cash_equity' };

/**
 * Every customer-facing string a program shows during the funding step, as one
 * blob. Used by the claim tests below, which care about what a homeowner reads
 * rather than which field it happens to live in — a false promise is just as
 * false in a highlight as in a guidance paragraph.
 */
const program_copy = (program: ProgramConfig) =>
  [
    program.displayAmountLabel,
    ...program.fundingHighlights,
    ...program.programTerms,
    program.fundingGuidance.lead,
    program.fundingGuidance.leadEmphasis,
    program.fundingGuidance.highlight,
    program.fundingGuidance.closing,
    ...program.questions.map((q) => q.help ?? ''),
  ].join(' ');
/**
 * A LIVE program, used by every routing test below.
 *
 * Hamilton itself is disabled now that its intake has closed, and these tests
 * are about the routing rules rather than about which programs happen to be
 * accepting bookings this month — pointing them at the real Hamilton config
 * would make all of them assert PROGRAM_NOT_ENABLED and stop covering the rules
 * entirely. The content assertions further down still read HAMILTON_PROGRAM
 * directly, because those ARE about Hamilton.
 */
const LIVE_PROGRAM = { ...HAMILTON_PROGRAM, enabled: true, closure: undefined };

const base = {
  addressState: 'ADDRESS_VERIFIED' as const,
  area: 'HAMILTON' as const,
  program: LIVE_PROGRAM,
};

test('Hamilton is closed, so its flow cannot reach the calendar', () => {
  // The whole point of the change: a perfect Hamilton lead must NOT be offered a
  // visit for a grant that no longer accepts applications. If Hamilton reopens,
  // this test is the one to delete, in the same commit as the flag.
  assert.equal(HAMILTON_PROGRAM.enabled, false);
  assert.ok(HAMILTON_PROGRAM.closure, 'a disabled program that closed must say why');
  const r = routeConsultation({ ...base, program: HAMILTON_PROGRAM, answers: OK });
  assert.equal(r.outcome, 'MANUAL_REVIEW');
  assert.ok(r.reasons.includes('PROGRAM_NOT_ENABLED'));
});

test('a fully qualified Hamilton homeowner reaches the calendar', () => {
  const r = routeConsultation({ ...base, answers: OK });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
});

test('an address resolved from typed text still reaches the calendar', () => {
  // The regression this exists to prevent, taken from a real submission: a
  // Stoney Creek homeowner who owned the property, wanted a secondary suite,
  // was ready to start and was paying cash — routed to manual review purely
  // because she typed her address instead of tapping the dropdown suggestion.
  //
  // Once the server has matched that text to exactly one real address, the
  // result is the same address a tap would have produced. It must book.
  const r = routeConsultation({
    ...base,
    addressState: 'ADDRESS_INFERRED',
    area: areaForMunicipality('Stoney Creek'),
    answers: OK,
  });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.ok(!r.reasons.includes('ADDRESS_UNVERIFIED'));
  assert.ok(!r.reasons.includes('MUNICIPALITY_UNRECOGNISED'));
});

test('an inferred address does not rescue an otherwise unqualified lead', () => {
  // Softening the address must not soften anything else: the address is one
  // input, and every other guard has to keep firing exactly as before.
  const exploring = routeConsultation({
    ...base, addressState: 'ADDRESS_INFERRED', answers: { ...OK, timeline: 'exploring' },
  });
  assert.equal(exploring.outcome, 'NURTURE');

  const unsureProject = routeConsultation({
    ...base, addressState: 'ADDRESS_INFERRED', answers: { ...OK, projectType: 'unsure' },
  });
  assert.equal(unsureProject.outcome, 'MANUAL_REVIEW');
});

test('a typed address that stayed unresolved still goes to a person', () => {
  // Ambiguous or unmatched text never becomes INFERRED, so this is the floor
  // the change is built on: nothing uncertain gained a route to the calendar.
  const r = routeConsultation({ ...base, addressState: 'ADDRESS_UNVERIFIED', area: null, answers: OK });
  assert.equal(r.outcome, 'MANUAL_REVIEW');
});

test('"Just exploring" NEVER reaches the calendar, whatever else is perfect', () => {
  // A passive browser must not hold a 45-minute live consultation slot. This has
  // to hold even when every other answer is ideal.
  const r = routeConsultation({ ...base, answers: { ...OK, timeline: 'exploring' } });
  assert.equal(r.outcome, 'NURTURE');
  assert.notEqual(r.outcome, 'DIRECT_CALENDAR');
  assert.deepEqual(r.reasons, ['EXPLORATORY_TIMELINE']);

  // Also with financing selected — still no slot.
  const withFinancing = routeConsultation({
    ...base,
    answers: { ...OK, timeline: 'exploring', contribution: 'need_financing' },
  });
  assert.equal(withFinancing.outcome, 'NURTURE');
});

test('exploratory leads are offered a guide instead of a slot', () => {
  assert.ok(HAMILTON_PROGRAM.guideUrl, 'a guide must exist for the nurture path');
  assert.ok(HAMILTON_PROGRAM.guideLabel);
});

test('funding wording separates upfront cost from grant payout', () => {
  const [, upfront, payout] = HAMILTON_PROGRAM.fundingHighlights;
  assert.match(upfront, /Upfront Funding/);
  assert.match(upfront, /finance/i, 'must say the homeowner funds construction first');
  assert.match(payout, /Grant Payout/);
  assert.match(payout, /\$8,000/, 'first advance amount stated');
  assert.match(payout, /two advances/i);
});

test('the funding question offers the three approved options', () => {
  const q = HAMILTON_PROGRAM.questions.find((x) => x.key === 'contribution');
  assert.ok(q);
  assert.match(q!.label, /How do you plan to fund the upfront project costs\?/);
  assert.deepEqual(q!.options.map((o) => o.value), ['cash_equity', 'need_financing', 'unsure']);
});

test('the permit terms say we handle permitting', () => {
  const permitTerm = HAMILTON_PROGRAM.programTerms.find((t) => /building permit is required/.test(t));
  assert.ok(permitTerm);
  assert.match(permitTerm!, /We handle the building permit process for you/);
});

test('the appointment reads as a readable label, not a raw form value', () => {
  assert.equal(HAMILTON_PROGRAM.appointmentProjectTypeLabel, 'ADU Grant Consultation');
  // The raw enum values stay in the answer set for the rep's brief.
  const projectType = HAMILTON_PROGRAM.questions.find((q) => q.key === 'projectType')!;
  assert.ok(projectType.options.some((o) => o.value === 'secondary_suite'));
});

test('the Hamilton note template is applied automatically, from the shared source', () => {
  assert.equal(HAMILTON_PROGRAM.noteTemplateId, 'hamilton-grant');
  const template = findNoteTemplate(DEFAULT_NOTE_TEMPLATES, HAMILTON_PROGRAM.noteTemplateId);
  assert.ok(template, 'the referenced template must exist');
  assert.equal(template!.label, 'Hamilton Grant');
  assert.match(template!.body, /Pre-qualified through OntarioReno/);
});

test('note templates survive an absent or corrupt setting', () => {
  assert.deepEqual(parseNoteTemplates(null), DEFAULT_NOTE_TEMPLATES);
  assert.deepEqual(parseNoteTemplates('not json'), DEFAULT_NOTE_TEMPLATES);
  assert.deepEqual(parseNoteTemplates('{"not":"an array"}'), DEFAULT_NOTE_TEMPLATES);
  // An admin edit is honoured over the default.
  const edited = [{ id: 'hamilton-grant', label: 'Hamilton Grant', body: 'Edited copy.' }];
  assert.equal(parseNoteTemplates(JSON.stringify(edited))[0].body, 'Edited copy.');
});

test('consultation mode is configured, so the meeting type is never ambiguous', () => {
  assert.equal(HAMILTON_PROGRAM.consultationMode, 'in_person');
  assert.ok(['in_person', 'phone'].includes(SIMCOE_PROGRAM.consultationMode));
});

test('DECLINE is reachable only from certainty', () => {
  // Ownership was the other way in here — it was removed from every flow, so a
  // resolved address outside the service area is now the only certain decline.
  assert.equal(
    routeConsultation({ ...base, addressState: 'ADDRESS_OUTSIDE_SERVICE_AREA', answers: OK }).outcome,
    'DECLINE'
  );
});

test('every uncertain answer goes to manual review, never approval or decline', () => {
  const uncertain = [
    { ...OK, projectType: 'unsure' },
    { ...OK, projectType: '' },
  ];
  for (const answers of uncertain) {
    const r = routeConsultation({ ...base, answers });
    assert.equal(r.outcome, 'MANUAL_REVIEW', `expected review for ${JSON.stringify(answers)}`);
  }
});

test('an unverified address goes to manual review', () => {
  const r = routeConsultation({ ...base, addressState: 'ADDRESS_UNVERIFIED', answers: OK });
  assert.equal(r.outcome, 'MANUAL_REVIEW');
  assert.ok(r.reasons.includes('ADDRESS_UNVERIFIED'));
});

test('an unrecognised municipality goes to manual review, not decline', () => {
  const r = routeConsultation({
    addressState: 'ADDRESS_UNVERIFIED',
    area: null,
    program: null,
    answers: OK,
  });
  assert.equal(r.outcome, 'MANUAL_REVIEW');
  assert.ok(r.reasons.includes('MUNICIPALITY_UNRECOGNISED'));
});

test('a Simcoe address is reviewed, never declined, while the program is disabled', () => {
  const r = routeConsultation({
    addressState: 'ADDRESS_VERIFIED',
    area: 'SIMCOE',
    program: SIMCOE_PROGRAM,
    answers: OK,
  });
  assert.equal(r.outcome, 'MANUAL_REVIEW');
  assert.ok(r.reasons.includes('PROGRAM_NOT_ENABLED'));
  assert.notEqual(r.outcome, 'DECLINE');
});

test('a project type outside the program is reviewed — eligibility is not ours to judge', () => {
  const r = routeConsultation({ ...base, answers: { ...OK, projectType: 'pool_house' } });
  assert.equal(r.outcome, 'MANUAL_REVIEW');
  assert.ok(r.reasons.includes('PROJECT_TYPE_NOT_LISTED'));
});

test('wanting financing books anyway — it is a note, not a barrier', () => {
  const r = routeConsultation({ ...base, answers: { ...OK, contribution: 'need_financing' } });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.ok(r.reasons.includes('WANTS_FINANCING'), 'flagged for the specialist');
});

test('an uncertain funding answer books — it asks for the conversation', () => {
  // Whether a homeowner can fund the build is a lender's call, not theirs, so
  // "not sure" is a request for guidance, never a reason to withhold the slot.
  const r = routeConsultation({ ...base, answers: { ...OK, contribution: 'unsure' } });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.ok(r.reasons.includes('NEEDS_FUNDING_GUIDANCE'), 'flagged for the consultant');
});

test('no funding answer can ever send a lead to manual review', () => {
  const q = HAMILTON_PROGRAM.questions.find((x) => x.key === 'contribution');
  for (const opt of q!.options) {
    const r = routeConsultation({ ...base, answers: { ...OK, contribution: opt.value } });
    assert.equal(r.outcome, 'DIRECT_CALENDAR', `${opt.value} must reach the calendar`);
  }
});

test('the funding guidance screen states the milestone payout, never the advance', () => {
  const g = HAMILTON_PROGRAM.fundingGuidance;
  assert.ok(g.heading, 'a live program needs a heading');
  assert.ok(g.lead && g.highlight && g.closing, 'a live program needs the full screen');
  const text = [g.lead, g.leadEmphasis, ...g.milestones, g.highlight, g.closing].join(' ');
  assert.match(text, /after the work is finished/i, 'states the grant arrives after the work');
  assert.match(text, /grant approved/i, 'shows approval coming before the build');
  assert.match(text, /open loan/i, 'names the route without dwelling on it');
  // The first advance is capped at $8,000 against a $50–60k scope. Naming any
  // early money here invites the homeowner to conclude they need no financing,
  // and leaves the consultant walking it back in their kitchen.
  assert.doesNotMatch(text, /\$|\d+%|advance/i, 'no amounts, percentages or advances');
});

test('the fast-track case reaches the calendar with a single reason', () => {
  const r = routeConsultation({ ...base, answers: OK });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.deepEqual(r.reasons, ['ELIGIBLE_FOR_BOOKING']);
});

test('pre-booking questions are exactly three — no seven-dropdown wall', () => {
  const keys = HAMILTON_PROGRAM.questions.map((q) => q.key);
  // Was four. Ownership was removed from every flow: it lengthened the first
  // step for everyone to catch the rare renter, and "It's complicated" queued
  // qualified homeowners for saying something true.
  assert.deepEqual(keys, ['projectType', 'timeline', 'contribution']);
  assert.equal(keys.includes('ownership'), false, 'ownership is retired, not hidden');
  // The zero-weight property questions moved out of the pre-booking path.
  const prepKeys = HAMILTON_PROGRAM.prepQuestions.map((q) => q.key);
  assert.deepEqual(prepKeys, ['basementStatus', 'separateEntrance', 'permitStatus']);
  for (const k of prepKeys) assert.equal(keys.includes(k), false, `${k} must not block booking`);
});

test('questions are grouped into progressive steps', () => {
  // Step 1 carries no QUESTION any more — it is the address screen. The flow
  // renders addressField there unconditionally, so it is not a blank screen.
  assert.deepEqual(questionsForStep(HAMILTON_PROGRAM, 1).map((q) => q.key), []);
  assert.deepEqual(questionsForStep(HAMILTON_PROGRAM, 2).map((q) => q.key), ['projectType', 'timeline']);
  assert.deepEqual(questionsForStep(HAMILTON_PROGRAM, 3).map((q) => q.key), ['contribution']);
});

test('funding is summarised in three lines, with full terms kept separate', () => {
  assert.equal(HAMILTON_PROGRAM.fundingHighlights.length, 3);
  assert.equal(HAMILTON_PROGRAM.programTerms.length, 6);
});

test('property answers carry ZERO routing weight', () => {
  // Worst-case structural answers must not change a qualified homeowner's path.
  const r = routeConsultation({
    ...base,
    answers: { ...OK, basementStatus: 'finished', separateEntrance: 'no', permitStatus: 'unsure' },
  });
  assert.equal(r.outcome, 'DIRECT_CALENDAR', 'structure/zoning answers must not affect routing');
});

test('Hamilton amalgamated communities all map to HAMILTON', () => {
  for (const m of ['Hamilton', 'Ancaster', 'Dundas', 'Flamborough', 'Glanbrook', 'Stoney Creek', 'Waterdown', 'Binbrook']) {
    assert.equal(areaForMunicipality(m), 'HAMILTON', `${m} must map to HAMILTON`);
  }
  assert.equal(areaForMunicipality('  stoney   creek '), 'HAMILTON', 'normalisation');
});

test('Simcoe municipalities are deliberately unmapped until confirmed', () => {
  assert.equal(areaForMunicipality('Barrie'), null);
  assert.equal(areaForMunicipality('Toronto'), null);
  assert.equal(areaForMunicipality(''), null);
});

// ─── Ontario-wide programs ───────────────────────────────────────────────────
// A municipality-gated program is the City's money, so the address decides. An
// Ontario-wide program (financing) has no municipal boundary, and before this
// existed every one of its leads died the same way: a complete Toronto address
// maps to no SchedulingArea, so it arrived UNVERIFIED with area null, routing
// called it MUNICIPALITY_UNRECOGNISED, and slot generation offered no calendar.
// Every lead would have reached a queue instead of a booking.

const ONTARIO_WIDE = { geography: 'ontario_wide' as const };
const MUNICIPAL = { geography: 'municipality' as const };

test('a municipality-gated program is not touched by geography resolution', () => {
  const input = {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED' as const,
    cause: 'MUNICIPALITY_UNMAPPED' as const,
  };
  assert.deepEqual(resolveProgramGeography(MUNICIPAL, input), {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
  });
});

test('an unmapped Ontario municipality schedules under an Ontario-wide program', () => {
  const r = resolveProgramGeography(ONTARIO_WIDE, {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
    cause: 'MUNICIPALITY_UNMAPPED',
  });
  assert.equal(r.area, 'ONTARIO');
  assert.equal(r.addressState, 'ADDRESS_VERIFIED', 'the only defect was the unmapped municipality');
});

test('an Ontario-wide program still declines an address outside Ontario', () => {
  const r = resolveProgramGeography(ONTARIO_WIDE, {
    area: null,
    addressState: 'ADDRESS_OUTSIDE_SERVICE_AREA',
    cause: 'OUTSIDE_ONTARIO',
  });
  assert.equal(r.area, null);
  assert.equal(r.addressState, 'ADDRESS_OUTSIDE_SERVICE_AREA', 'a decline stays a decline');
});

test('an Ontario-wide program does not rescue doubt about the ADDRESS itself', () => {
  // Geography cannot fix an address we could not confirm. These must keep going
  // to a person exactly as they do for a municipality-gated program.
  for (const cause of ['INCOMPLETE_ADDRESS', 'TYPED_TEXT_AMBIGUOUS', 'PROVIDER_ERROR'] as const) {
    const r = resolveProgramGeography(ONTARIO_WIDE, {
      area: null,
      addressState: 'ADDRESS_UNVERIFIED',
      cause,
    });
    assert.equal(r.area, null, `${cause} must not get an area`);
    assert.equal(r.addressState, 'ADDRESS_UNVERIFIED', `${cause} must stay unverified`);
  }
});

test('an inferred address keeps its weaker provenance under an Ontario-wide program', () => {
  const r = resolveProgramGeography(ONTARIO_WIDE, {
    area: null,
    addressState: 'ADDRESS_INFERRED',
    cause: 'RESOLVED_FROM_TYPED_TEXT',
  });
  assert.equal(r.area, 'ONTARIO', 'inferred is schedulable, so it gets the area');
  assert.equal(r.addressState, 'ADDRESS_INFERRED', 'but is never upgraded to verified');
});

test('an Ontario-wide lead outside every mapped municipality reaches the calendar', () => {
  // The end-to-end point of the change, expressed as routing sees it: a Toronto
  // homeowner answering an Ontario-wide offer books, rather than queueing.
  const program = { ...LIVE_PROGRAM, geography: 'ontario_wide' as const, schedulingArea: 'ONTARIO' as const };
  const geo = resolveProgramGeography(program, {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
    cause: 'MUNICIPALITY_UNMAPPED',
  });
  const r = routeConsultation({
    addressState: geo.addressState,
    area: geo.area,
    program,
    answers: OK,
  });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
});

// ─── Basement financing ──────────────────────────────────────────────────────

test('the basement program is Ontario-wide and live', () => {
  assert.equal(BASEMENT_FINANCING_PROGRAM.geography, 'ontario_wide');
  assert.equal(BASEMENT_FINANCING_PROGRAM.schedulingArea, 'ONTARIO');
  assert.equal(BASEMENT_FINANCING_PROGRAM.enabled, true);
  assert.equal(BASEMENT_FINANCING_PROGRAM.consultationMode, 'in_person');
});

test('a Toronto basement lead books rather than queueing', () => {
  // Toronto maps to no SchedulingArea and never will — that is the point.
  assert.equal(areaForMunicipality('Toronto'), null);
  const geo = resolveProgramGeography(BASEMENT_FINANCING_PROGRAM, {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
    cause: 'MUNICIPALITY_UNMAPPED',
  });
  const r = routeConsultation({
    addressState: geo.addressState,
    area: geo.area,
    program: BASEMENT_FINANCING_PROGRAM,
    answers: { projectType: 'basement_finish', timeline: 'asap', contribution: 'need_financing' },
  });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.ok(r.reasons.includes('WANTS_FINANCING'));
});

test('every basement project type the form offers is an eligible one', () => {
  // A project type the flow can collect but the program does not list would tag
  // PROJECT_TYPE_NOT_LISTED on a lead that answered exactly as asked.
  const offered = BASEMENT_FINANCING_PROGRAM.questions
    .find((q) => q.key === 'projectType')!
    .options.map((o) => o.value)
    .filter((v) => v !== 'unsure');
  for (const value of offered) {
    assert.ok(
      BASEMENT_FINANCING_PROGRAM.eligibleProjectTypes.includes(value),
      `${value} is offered but not eligible`
    );
  }
});

test('the basement terms never promise a rate or a payment', () => {
  // $399 is a starting point in an ad, not a price. Approval and the real
  // numbers are the lender's, and the terms must read that way or the first
  // consultation starts by walking a number back.
  const terms = BASEMENT_FINANCING_PROGRAM.programTerms.join(' ');
  assert.match(terms, /subject to credit approval/i);
  assert.match(terms, /confirmed in writing before you sign/i);
  // The credit qualifier moved OFF the headline and into the first highlight
  // immediately beneath it — same screen, one line down, still ahead of any
  // question. What must never happen is the figure appearing with the
  // qualifier nowhere near it, which is what this now checks.
  assert.match(
    [
      BASEMENT_FINANCING_PROGRAM.displayAmountLabel,
      BASEMENT_FINANCING_PROGRAM.fundingHighlights[0] ?? '',
    ].join(' '),
    /on approved credit/i,
    'the monthly figure must be qualified where it is shown'
  );
  assert.equal(
    BASEMENT_FINANCING_PROGRAM.fundingGuidance.highlight.includes('%'),
    false,
    'the funding screen must not quote a rate'
  );
});

test('the basement terms stay short and quote no interest rate', () => {
  // Deliberate: this screen decides whether to BOOK, not whether to sign. The
  // rate table and the construction-draw mechanics are true and belong in the
  // agreement the consultant walks through in person. A decimal percentage here
  // is an interest rate that escaped the contract -- the 40/60 release split is
  // a whole number and stays allowed.
  const terms = BASEMENT_FINANCING_PROGRAM.programTerms;
  assert.ok(terms.length <= 5, `terms grew back to ${terms.length} lines`);
  assert.doesNotMatch(terms.join(' '), /\d+\.\d+\s*%/, 'no interest rate on the public flow');
});

test('the basement program books an exploratory lead and tags it', () => {
  // Deliberate override of the nurture rule: there is no application window to
  // be early for, and reps close these in person. The tag is what keeps it
  // honest -- the consultant sees the timeline, and the decision stays
  // measurable afterwards instead of vanishing into the booked pile.
  for (const timeline of ['exploring', '3_plus_months']) {
    const r = routeConsultation({
      addressState: 'ADDRESS_VERIFIED',
      area: 'ONTARIO',
      program: BASEMENT_FINANCING_PROGRAM,
      answers: { projectType: 'basement_finish', timeline, contribution: 'cash_equity' },
    });
    assert.equal(r.outcome, 'DIRECT_CALENDAR', `${timeline} must reach the calendar`);
    assert.ok(
      r.reasons.includes(timeline === 'exploring' ? 'EXPLORATORY_TIMELINE' : 'TIMELINE_BEYOND_BOOKING_WINDOW'),
      `${timeline} must still be tagged for the rep`
    );
  }
});

test('opting out of nurture is per-program, not global', () => {
  // The grant keeps its scarce in-person slots near the decision. If this ever
  // starts booking, the basement change has leaked into every program.
  assert.deepEqual(BASEMENT_FINANCING_PROGRAM.nurtureTimelines, []);
  assert.deepEqual(HAMILTON_PROGRAM.nurtureTimelines, DEFAULT_NURTURE_TIMELINES);
  const r = routeConsultation({
    ...base,
    answers: { ...OK, timeline: 'exploring' },
  });
  assert.equal(r.outcome, 'NURTURE');
});

// ─── Bathroom financing ──────────────────────────────────────────────────────

test('the bathroom program is Ontario-wide and live', () => {
  assert.equal(BATHROOM_FINANCING_PROGRAM.geography, 'ontario_wide');
  assert.equal(BATHROOM_FINANCING_PROGRAM.schedulingArea, 'ONTARIO');
  assert.equal(BATHROOM_FINANCING_PROGRAM.enabled, true);
  assert.equal(BATHROOM_FINANCING_PROGRAM.consultationMode, 'in_person');
  assert.equal(programBySlug('bathroom'), BATHROOM_FINANCING_PROGRAM);
});

test('the two Ontario-wide programs stay distinct records', () => {
  // They share a lender and a scheduling area, so the only things keeping a
  // bathroom lead out of the basement pile are the key and the slug. A copied
  // config that forgot to change one would route silently and be found in the
  // rep's brief weeks later.
  assert.notEqual(BATHROOM_FINANCING_PROGRAM.key, BASEMENT_FINANCING_PROGRAM.key);
  assert.notEqual(BATHROOM_FINANCING_PROGRAM.slug, BASEMENT_FINANCING_PROGRAM.slug);
  assert.notEqual(
    BATHROOM_FINANCING_PROGRAM.appointmentProjectTypeLabel,
    BASEMENT_FINANCING_PROGRAM.appointmentProjectTypeLabel
  );
});

test('a Toronto bathroom lead books rather than queueing', () => {
  const geo = resolveProgramGeography(BATHROOM_FINANCING_PROGRAM, {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
    cause: 'MUNICIPALITY_UNMAPPED',
  });
  const r = routeConsultation({
    addressState: geo.addressState,
    area: geo.area,
    program: BATHROOM_FINANCING_PROGRAM,
    answers: { projectType: 'bathroom_gut', timeline: 'asap', contribution: 'need_financing' },
  });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.ok(r.reasons.includes('WANTS_FINANCING'));
});

test('every bathroom project type the form offers is an eligible one', () => {
  const offered = BATHROOM_FINANCING_PROGRAM.questions
    .find((q) => q.key === 'projectType')!
    .options.map((o) => o.value)
    .filter((v) => v !== 'unsure');
  for (const value of offered) {
    assert.ok(
      BATHROOM_FINANCING_PROGRAM.eligibleProjectTypes.includes(value),
      `${value} is offered but not eligible`
    );
  }
});

test('the bathroom terms never promise a rate or a payment', () => {
  // Same rule as the basement offer. $99 is an entry point, not a price — at
  // the rate the basement's $399 comes from it is about a $10,000 project,
  // where a typical Ontario bathroom is $15,000–$40,000. So the headline has to
  // keep BOTH qualifiers: "from about" (it is a floor) and "on approved credit"
  // (it is the lender's call). Dropping either turns a starting point into a
  // quote, and the consultant is the one who has to walk it back.
  const terms = BATHROOM_FINANCING_PROGRAM.programTerms;
  assert.match(terms.join(' '), /subject to credit approval/i);
  assert.match(terms.join(' '), /confirmed in writing before you sign/i);
  assert.ok(terms.length <= 5, `terms grew to ${terms.length} lines`);
  assert.doesNotMatch(terms.join(' '), /\d+\.\d+\s*%/, 'no interest rate on the public flow');
  const headline = BATHROOM_FINANCING_PROGRAM.displayAmountLabel;
  assert.match(headline, /from about/i, 'the monthly figure must read as a starting point');
  assert.match(headline, /on approved credit/i);
  assert.equal(
    BATHROOM_FINANCING_PROGRAM.fundingGuidance.highlight.includes('%'),
    false,
    'the funding screen must not quote a rate'
  );
});

test('the bathroom program books an exploratory lead and tags it', () => {
  assert.deepEqual(BATHROOM_FINANCING_PROGRAM.nurtureTimelines, []);
  for (const timeline of ['exploring', '3_plus_months']) {
    const r = routeConsultation({
      addressState: 'ADDRESS_VERIFIED',
      area: 'ONTARIO',
      program: BATHROOM_FINANCING_PROGRAM,
      answers: { projectType: 'bathroom_refresh', timeline, contribution: 'cash_equity' },
    });
    assert.equal(r.outcome, 'DIRECT_CALENDAR', `${timeline} must reach the calendar`);
  }
});

/**
 * A step the flow renders must have something on it, and the screen carrying
 * the address must stay a screen of its own.
 *
 * The original rule was "every step has a question", which held while every
 * flow opened with the ownership question. With ownership retired, some steps
 * carry no question at all — but they are not blank, because the flow drops
 * empty steps entirely (see activeSteps in ConsultationFlow) and because the
 * address and contact fields are built into a screen rather than being
 * questions. So this mirrors what the flow will actually render.
 *
 * The failure it still catches is the one that mattered: a screen shown to a
 * homeowner between an ad click and the calendar with nothing on it.
 */
function assertNoBlankScreens(program: ProgramConfig) {
  const addressLast = program.addressPlacement === 'final';
  const rendered = ([1, 2, 3] as const).filter(
    (s) =>
      questionsForStep(program, s).length > 0 ||
      (!addressLast && s === 1) ||
      (addressLast && s === 3)
  );
  assert.ok(rendered.length > 0, `${program.slug} renders no screens at all`);
  for (const step of rendered) {
    const hasQuestions = questionsForStep(program, step).length > 0;
    const isAddressScreen = !addressLast && step === 1;
    const isMergedFinal = addressLast && step === 3;
    assert.ok(
      hasQuestions || isAddressScreen || isMergedFinal,
      `${program.slug} step ${step} would render blank`
    );
  }
}

test('the bathroom flow never renders a blank screen', () => {
  assertNoBlankScreens(BATHROOM_FINANCING_PROGRAM);
});

test('the bathroom prep questions ask about a bathroom', () => {
  // The basement set asks about separate entrances and building permits, which
  // tell a rep nothing before a bathroom visit. Copying it over was the easy
  // mistake here.
  const keys = BATHROOM_FINANCING_PROGRAM.prepQuestions.map((q) => q.key);
  assert.ok(keys.includes('layoutChange'), 'the layout question drives the whole quote');
  assert.deepEqual(
    keys.filter((k) => ['separateEntrance', 'permitStatus', 'basementStatus'].includes(k)),
    []
  );
});

// ─── Kitchen financing ───────────────────────────────────────────────────────

test('the kitchen program is Ontario-wide and live', () => {
  assert.equal(KITCHEN_FINANCING_PROGRAM.geography, 'ontario_wide');
  assert.equal(KITCHEN_FINANCING_PROGRAM.schedulingArea, 'ONTARIO');
  assert.equal(KITCHEN_FINANCING_PROGRAM.enabled, true);
  assert.equal(KITCHEN_FINANCING_PROGRAM.consultationMode, 'in_person');
  assert.equal(programBySlug('kitchen'), KITCHEN_FINANCING_PROGRAM);
});

test('a Toronto kitchen lead books rather than queueing', () => {
  const geo = resolveProgramGeography(KITCHEN_FINANCING_PROGRAM, {
    area: null,
    addressState: 'ADDRESS_UNVERIFIED',
    cause: 'MUNICIPALITY_UNMAPPED',
  });
  const r = routeConsultation({
    addressState: geo.addressState,
    area: geo.area,
    program: KITCHEN_FINANCING_PROGRAM,
    answers: { projectType: 'full_remodel', timeline: 'asap', contribution: 'need_financing' },
  });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
  assert.ok(r.reasons.includes('WANTS_FINANCING'));
});

test('the kitchen prep questions ask about a kitchen', () => {
  // Copying the basement or bathroom set over was the easy mistake here. What
  // moves a kitchen quote is cabinetry, moved services and appliances.
  const keys = KITCHEN_FINANCING_PROGRAM.prepQuestions.map((q) => q.key);
  assert.ok(keys.includes('cabinetPlan'));
  assert.ok(keys.includes('applianceScope'));
  assert.deepEqual(
    keys.filter((k) => ['separateEntrance', 'permitStatus', 'basementStatus', 'bathroomType'].includes(k)),
    []
  );
});

// ─── Rules that must hold for EVERY financing offer ──────────────────────────
//
// Asserted across the set rather than one program at a time. Each of these was
// written for a single offer first and generalised when the next one landed —
// the point is that a fourth offer added later cannot quietly skip them.

test('every financing offer is a distinct, live, bookable record', () => {
  const keys = new Set<string>();
  const slugs = new Set<string>();
  const labels = new Set<string>();
  for (const program of FINANCING_PROGRAMS) {
    assert.equal(program.enabled, true, `${program.slug} is not live`);
    assert.equal(program.geography, 'ontario_wide', `${program.slug} is not Ontario-wide`);
    assert.equal(program.schedulingArea, 'ONTARIO', `${program.slug} is not in the ONTARIO bucket`);
    assert.equal(program.consultationMode, 'in_person', `${program.slug} is not an in-person visit`);
    assert.equal(programBySlug(program.slug), program, `${program.slug} is not reachable by slug`);
    keys.add(program.key);
    slugs.add(program.slug);
    labels.add(program.appointmentProjectTypeLabel);
  }
  // The only things keeping one offer's leads out of another's pile.
  assert.equal(keys.size, FINANCING_PROGRAMS.length, 'two offers share a program key');
  assert.equal(slugs.size, FINANCING_PROGRAMS.length, 'two offers share a slug');
  assert.equal(labels.size, FINANCING_PROGRAMS.length, 'two offers share an appointment label');
});

test('every timeline a financing offer asks about reaches the calendar', () => {
  // Derived from each program's OWN options rather than a hardcoded list. The
  // kitchen form folds "3+ months" into "Just planning / Exploring", so a fixed
  // list would either miss its real answers or assert one it never offers.
  // Whatever a program puts in front of a homeowner is what has to book.
  for (const program of FINANCING_PROGRAMS) {
    assert.deepEqual(program.nurtureTimelines, [], `${program.slug} started nurturing`);
    const projectType = program.eligibleProjectTypes[0]!;
    const question = program.questions.find((q) => q.key === 'timeline');
    // The basement offer stopped asking about timing: it never nurtured on the
    // answer, so the question sat in front of the contact form unable to change
    // anything. A program that asks nothing must still book — asserted with the
    // empty answer the flow would actually send.
    if (!question) {
      const r = routeConsultation({
        addressState: 'ADDRESS_VERIFIED',
        area: 'ONTARIO',
        program,
        answers: { projectType, timeline: '', contribution: 'cash_equity' },
      });
      assert.equal(r.outcome, 'DIRECT_CALENDAR', `${program.slug} must book without a timeline`);
      continue;
    }
    const timelines = question.options.map((o) => o.value);
    assert.ok(timelines.length >= 3, `${program.slug} asks about too few timelines`);
    for (const timeline of timelines) {
      const r = routeConsultation({
        addressState: 'ADDRESS_VERIFIED',
        area: 'ONTARIO',
        program,
        answers: { projectType, timeline, contribution: 'cash_equity' },
      });
      assert.equal(r.outcome, 'DIRECT_CALENDAR', `${program.slug}/${timeline} must reach the calendar`);
    }
  }
});

test('the shared timeline question is untouched by the kitchen form', () => {
  // Kitchen has its own shorter timeline question. If it were ever pointed back
  // at the shared TIMELINE — or the shared one edited to match — four other
  // live flows would lose an option nobody asked to change.
  // BASEMENT_FINANCING_PROGRAM was deliberately removed from this list when it
  // stopped asking about timing — a visible line in the diff rather than a
  // question quietly disappearing. The programs below still ask it and still
  // share one object.
  for (const program of [HAMILTON_PROGRAM, SIMCOE_PROGRAM, BATHROOM_FINANCING_PROGRAM]) {
    const values = program.questions.find((q) => q.key === 'timeline')!.options.map((o) => o.value);
    assert.deepEqual(
      values,
      ['asap', '1_3_months', '3_plus_months', 'exploring'],
      `${program.slug} lost a timeline option`
    );
  }
});

test('the kitchen form asks three project types and three timelines', () => {
  // Explicitly requested shape. Pinned because "simplify the form" is the kind
  // of change that grows an option back one release later.
  const projectTypes = KITCHEN_FINANCING_PROGRAM.questions.find((q) => q.key === 'projectType')!;
  assert.deepEqual(
    projectTypes.options.map((o) => o.value),
    ['full_remodel', 'cabinets_countertops', 'unsure']
  );
  const timelines = KITCHEN_FINANCING_PROGRAM.questions.find((q) => q.key === 'timeline')!;
  assert.deepEqual(
    timelines.options.map((o) => o.value),
    ['asap', '1_3_months', 'exploring']
  );
  // The values stay in the shared vocabulary so routing and the rep's brief
  // read a kitchen timeline exactly as they read any other program's.
  assert.equal(
    timelines.options.some((o) => o.value === '3_plus_months'),
    false,
    'the two low-intent answers are deliberately folded into one'
  );
});

test('no financing offer renders a blank screen', () => {
  for (const program of FINANCING_PROGRAMS) assertNoBlankScreens(program);
});

test('every offered project type is an eligible one, on every offer', () => {
  // A project type the flow can collect but the program does not list would tag
  // PROJECT_TYPE_NOT_LISTED on a lead that answered exactly as asked.
  for (const program of FINANCING_PROGRAMS) {
    const offered = program.questions
      .find((q) => q.key === 'projectType')!
      .options.map((o) => o.value)
      .filter((v) => v !== 'unsure');
    for (const value of offered) {
      assert.ok(
        program.eligibleProjectTypes.includes(value),
        `${program.slug}: ${value} is offered but not eligible`
      );
    }
  }
});

test('no financing offer promises a rate, and every monthly figure is a floor', () => {
  // The headline figures ($399 / $99 / $199) are entry points, not prices, and
  // each sits well below what a typical project of that kind costs. Both
  // qualifiers have to survive: "from about" says it is a floor, "on approved
  // credit" says the lender decides. Drop either and a consultant is walking a
  // number back in someone's kitchen.
  for (const program of FINANCING_PROGRAMS) {
    const terms = program.programTerms;
    assert.ok(terms.length <= 5, `${program.slug} terms grew to ${terms.length} lines`);
    assert.match(terms.join(' '), /subject to credit approval/i, `${program.slug}`);
    assert.match(terms.join(' '), /confirmed in writing before you sign/i, `${program.slug}`);
    assert.doesNotMatch(terms.join(' '), /\d+\.\d+\s*%/, `${program.slug} quotes an interest rate`);
    assert.equal(
      program.fundingGuidance.highlight.includes('%'),
      false,
      `${program.slug} funding screen quotes a rate`
    );
    // An empty label means the program renders no amount banner at all, which
    // is a valid choice — there is no claim to qualify.
    //
    // The qualifier may sit on the headline itself or in the first highlight
    // directly under it: both render on the same screen, above every question.
    // What is guarded is that a monthly figure is never shown without it.
    if (program.displayAmountLabel) {
      assert.match(
        [program.displayAmountLabel, program.fundingHighlights[0] ?? ''].join(' '),
        /on approved credit/i,
        `${program.slug} headline`
      );
    }
    // A MONTHLY figure is a floor and must say so. A CAP is the opposite kind
    // of number — an upper limit, where "from about" would be actively
    // misleading — so the rule keys on whether the headline quotes a payment.
    // "from" is what carries this: it says the number is where the range
    // starts, not what the job costs. "about" was dropped from the basement
    // headline as hedging on top of a hedge — the floor framing is the part
    // that must survive, and a bare "$399 a month" would still fail here.
    if (/a month/i.test(program.displayAmountLabel)) {
      assert.match(
        program.displayAmountLabel,
        /\bfrom\b/i,
        `${program.slug} states a monthly payment without framing it as a starting point`
      );
    }
  }
});

// ─── Garden suite: the capped offer ──────────────────────────────────────────
//
// The other three finance the whole build, so "no upfront cost, financed in
// full" is literally true for them. Garden suite is capped at $100,000 against
// a project this site's own cost page puts at $250,000–$400,000+. Every
// reassuring line the other three use is false here, and the failure mode is
// expensive: a homeowner takes a 45-minute visit believing the loan covers it
// and meets a $200,000 gap at their kitchen table.

test('the garden suite program is live and reachable', () => {
  assert.equal(GARDEN_SUITE_FINANCING_PROGRAM.slug, 'garden-suite');
  assert.equal(programBySlug('garden-suite'), GARDEN_SUITE_FINANCING_PROGRAM);
  assert.equal(GARDEN_SUITE_FINANCING_PROGRAM.enabled, true);
  assert.equal(GARDEN_SUITE_FINANCING_PROGRAM.consultationMode, 'in_person');
});

test('the garden suite funding step is stripped back to the question', () => {
  // Step 3 used to open with a green amount banner and three bullets leading
  // with what a garden suite costs. Correct, but it put the largest and most
  // discouraging number in the flow above a question the reader had not
  // answered yet. Both are gone; the component renders neither when empty, so
  // these two assertions ARE the removal.
  const program = GARDEN_SUITE_FINANCING_PROGRAM;
  assert.equal(program.displayAmountLabel, '', 'the green amount banner must stay removed');
  assert.deepEqual(program.fundingHighlights, [], 'the three bullets must stay removed');
  assert.equal(program.fundingStepHeading, 'Project Funding');
});

test('the garden suite funding step still states the cap, in the two places left', () => {
  // With the banner and bullets gone, the qualifier survives in exactly two
  // places: the question's own subtext, and the terms accordion. If either
  // loses it, the step asks how someone will fund a garden suite while saying
  // nothing at all about what we lend.
  const program = GARDEN_SUITE_FINANCING_PROGRAM;
  const help = program.questions.find((q) => q.key === 'contribution')!.help!;
  assert.match(help, /\$100,000/, 'the funding question subtext must state the cap');
  assert.match(help, /optional/i, 'the subtext must say the financing is optional, not the plan');
  assert.match(help, /gap/i, 'the subtext must frame it as covering a gap');
  assert.match(program.programTerms.join(' '), /capped at \$100,000/i);
  assert.match(
    program.programTerms.join(' '),
    /above the \$100,000 financing cap is arranged by the homeowner/i,
    'the accordion must keep the condition even though the cost figure is gone'
  );
});

test('the garden suite funding step never quotes a typical project cost', () => {
  // The explicit ask: no "$250,000" anywhere on step 3. Checked across every
  // string the step renders rather than the one field it used to live in, so
  // reintroducing it in a highlight or the banner fails here too.
  const program = GARDEN_SUITE_FINANCING_PROGRAM;
  const stepThree = [
    program.displayAmountLabel,
    ...program.fundingHighlights,
    ...program.programTerms,
    ...program.questions.filter((q) => q.step === 3).flatMap((q) => [q.label, q.help ?? '']),
  ].join(' ');
  assert.doesNotMatch(stepThree, /\$2[0-9]{2},[0-9]{3}/, 'step 3 quotes a typical project cost again');
});

test('the garden suite flow never claims the build is covered', () => {
  // The exact sentences that are true on the other three and false here. This
  // is the test that catches a well-meaning copy-paste from the basement offer.
  const copy = [
    program_copy(GARDEN_SUITE_FINANCING_PROGRAM),
  ].join(' ');
  for (const claim of [
    /no upfront cost/i,
    /financed in full/i,
    /covers the full cost/i,
    /nothing to pay before/i,
    /nothing upfront/i,
  ]) {
    assert.doesNotMatch(
      copy,
      claim,
      `the garden suite flow claims ${claim} — it finances up to $100,000 of a $250,000+ build`
    );
  }
});

test('the other three offers still say the build IS covered', () => {
  // The mirror of the test above: garden suite's caveats must not leak back
  // into the three programs where "financed in full" is simply true.
  for (const program of FINANCING_PROGRAMS.filter((p) => p.slug !== 'garden-suite')) {
    assert.match(
      program_copy(program),
      /no upfront cost|covers the full cost|financed in full/i,
      `${program.slug} stopped saying the build is financed in full`
    );
  }
});

test('the address and contact screen is never merged onto a question screen', () => {
  // The regression this exists for: removing the last step's only question made
  // the flow drop that step, so address + name + phone slid up beside the
  // funding question. One deletion in program-config, two unrelated screens
  // fused, and nothing failed.
  for (const program of FINANCING_PROGRAMS) {
    if (program.addressPlacement !== 'final') continue;
    const stepsBeforeFinal = ([1, 2] as const).filter(
      (s) => questionsForStep(program, s).length > 0
    );
    assert.ok(
      stepsBeforeFinal.length > 0,
      `${program.slug} has no question screen before its contact screen`
    );
  }
});
