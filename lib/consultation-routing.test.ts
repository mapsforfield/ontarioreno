import test from 'node:test';
import assert from 'node:assert/strict';
import { routeConsultation } from './consultation-routing.ts';
import {
  HAMILTON_PROGRAM,
  SIMCOE_PROGRAM,
  areaForMunicipality,
  questionsForStep,
} from './program-config.ts';
import { DEFAULT_NOTE_TEMPLATES, findNoteTemplate, parseNoteTemplates } from './note-templates.ts';

const OK = { ownership: 'yes', projectType: 'secondary_suite', timeline: 'asap', contribution: 'cash_equity' };
const base = {
  addressState: 'ADDRESS_VERIFIED' as const,
  area: 'HAMILTON' as const,
  program: HAMILTON_PROGRAM,
};

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
  const notOwner = routeConsultation({
    ...base, addressState: 'ADDRESS_INFERRED', answers: { ...OK, ownership: 'no' },
  });
  assert.equal(notOwner.outcome, 'DECLINE');

  const exploring = routeConsultation({
    ...base, addressState: 'ADDRESS_INFERRED', answers: { ...OK, timeline: 'exploring' },
  });
  assert.equal(exploring.outcome, 'NURTURE');

  const unsureOwnership = routeConsultation({
    ...base, addressState: 'ADDRESS_INFERRED', answers: { ...OK, ownership: 'unsure' },
  });
  assert.equal(unsureOwnership.outcome, 'MANUAL_REVIEW');
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
  assert.equal(routeConsultation({ ...base, answers: { ...OK, ownership: 'no' } }).outcome, 'DECLINE');
  assert.equal(
    routeConsultation({ ...base, addressState: 'ADDRESS_OUTSIDE_SERVICE_AREA', answers: OK }).outcome,
    'DECLINE'
  );
});

test('every uncertain answer goes to manual review, never approval or decline', () => {
  const uncertain = [
    { ...OK, ownership: 'unsure' },
    { ...OK, projectType: 'unsure' },
    { ...OK, ownership: '' },
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
  assert.match(text, /milestones/i, 'explains that payouts follow milestones');
  assert.match(text, /funded upfront/i, 'states the homeowner funds the work first');
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

test('pre-booking questions are exactly four — no seven-dropdown wall', () => {
  const keys = HAMILTON_PROGRAM.questions.map((q) => q.key);
  assert.deepEqual(keys, ['ownership', 'projectType', 'timeline', 'contribution']);
  // The zero-weight property questions moved out of the pre-booking path.
  const prepKeys = HAMILTON_PROGRAM.prepQuestions.map((q) => q.key);
  assert.deepEqual(prepKeys, ['basementStatus', 'separateEntrance', 'permitStatus']);
  for (const k of prepKeys) assert.equal(keys.includes(k), false, `${k} must not block booking`);
});

test('questions are grouped into three progressive steps', () => {
  assert.deepEqual(questionsForStep(HAMILTON_PROGRAM, 1).map((q) => q.key), ['ownership']);
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
