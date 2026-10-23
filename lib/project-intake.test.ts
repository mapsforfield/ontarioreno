import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  consultationAnswers,
  detailOptionsFor,
  parseProjectFiles,
  PROJECT_CHOICES,
  programForChoice,
  projectFilesNote,
  timelineForProgram,
} from './project-intake.js';
import { consultationUrlForProject, PROJECT_TYPES_NO_LINK } from './project-review.js';
import { routeConsultation } from './consultation-routing.js';
import { programBySlug, WINDOWS_DOORS_PROGRAM, FINANCING_PROGRAMS } from './program-config.js';

const UUID = '0b6f1c1e-9a1b-4c2d-8e3f-1a2b3c4d5e6f';

test('every /match tile is either a booking program or a deliberate call-back', () => {
  for (const choice of PROJECT_CHOICES) {
    const program = programForChoice(choice.label);
    if (choice.slug) {
      assert.ok(program, `${choice.label} points at ${choice.slug}, which is missing or closed`);
      assert.equal(consultationUrlForProject(choice.label), `https://ontarioreno.ca/consultation/${choice.slug}`);
    } else {
      assert.equal(program, null);
      assert.ok(PROJECT_TYPES_NO_LINK.includes(choice.label), `${choice.label} has no program and no call-back rule`);
    }
  }
});

test('Windows & doors is a tile and books under its own program', () => {
  assert.equal(programForChoice('Windows & doors'), WINDOWS_DOORS_PROGRAM);
  assert.equal(programBySlug('windows-doors'), WINDOWS_DOORS_PROGRAM);
});

test('every detail option is a project type the program will put on the calendar', () => {
  for (const choice of PROJECT_CHOICES.filter((c) => c.slug)) {
    const program = programForChoice(choice.label)!;
    const options = detailOptionsFor(choice.label);
    assert.equal(options.length, choice.detailValues?.length, `${choice.label} lists a value its program does not offer`);
    for (const option of options) {
      assert.notEqual(option.value, 'unsure', `${choice.label} offers 'unsure', which loses the calendar`);
      const routing = routeConsultation({
        addressState: 'ADDRESS_VERIFIED',
        area: program.schedulingArea,
        program,
        answers: consultationAnswers(program, { projectType: option.value, timeline: 'exploring' }),
      });
      assert.equal(routing.outcome, 'DIRECT_CALENDAR', `${choice.label} → ${option.value} routed ${routing.outcome}`);
    }
  }
});

test('no budget or payment answer is sent from /match', () => {
  for (const choice of PROJECT_CHOICES.filter((c) => c.slug)) {
    const program = programForChoice(choice.label)!;
    const answers = consultationAnswers(program, { projectType: choice.detailValues![0], timeline: 'asap' });
    assert.equal('contribution' in answers, false, `${choice.label} sent a contribution answer`);
    for (const key of Object.keys(answers)) {
      assert.ok(program.questions.some((q) => q.key === key), `${key} is not a ${program.slug} question`);
    }
  }
});

test('timelines translate into the program vocabulary, never invented', () => {
  const kitchen = programBySlug('kitchen')!;
  const garden = programBySlug('garden-suite')!;
  assert.equal(timelineForProgram(kitchen, 'asap'), 'asap');
  // Kitchen folded "3+ months" into "exploring" on purpose.
  assert.equal(timelineForProgram(kitchen, '3_plus_months'), 'exploring');
  assert.equal(timelineForProgram(garden, '3_plus_months'), '3_plus_months');
  assert.equal(timelineForProgram(kitchen, 'next_decade'), '');
  assert.equal(timelineForProgram(WINDOWS_DOORS_PROGRAM, 'asap'), '');
});

test('the windows program promises no money', () => {
  const p = WINDOWS_DOORS_PROGRAM;
  assert.equal(FINANCING_PROGRAMS.includes(p), false);
  const copy = [
    p.displayAmountLabel,
    ...p.fundingHighlights,
    ...p.programTerms,
    p.prepFinancingNote ?? '',
    p.whyFreeText,
    p.fundingGuidance.lead,
    p.fundingGuidance.highlight,
    ...p.questions.map((q) => `${q.label} ${q.help ?? ''}`),
    ...p.prepQuestions.map((q) => `${q.label} ${q.help ?? ''}`),
  ].join(' ');
  assert.doesNotMatch(copy, /\$|financ|a month|monthly|rate|grant/i);
  assert.equal(p.consultationMode, 'in_person');
  assert.equal(p.bookingFlow, 'calendar_early');
});

test('uploaded documents are accepted only as the presign flow issued them', () => {
  const good = { key: `window-quotes/${UUID}/plans.pdf`, name: 'plans.pdf', size: 1000, type: 'application/pdf' };
  assert.deepEqual(parseProjectFiles([good]), { ok: true, files: [good] });
  assert.equal(parseProjectFiles([]).ok, false);
  assert.equal(parseProjectFiles([{ ...good, key: 'finance/statement.pdf' }]).ok, false);
  assert.equal(parseProjectFiles([{ ...good, type: 'application/zip' }]).ok, false);
  assert.equal(parseProjectFiles([{ ...good, size: 50 * 1024 * 1024 }]).ok, false);
  const many = Array.from({ length: 9 }, () => good);
  const parsed = parseProjectFiles(many);
  assert.ok(parsed.ok && parsed.files.length === 5);
});

test('the lead note names the documents for the rep', () => {
  const note = projectFilesNote(
    [{ key: `window-quotes/${UUID}/a.pdf`, name: 'permit.pdf', size: 1, type: 'application/pdf' }],
    ['Permit documents']
  );
  assert.match(note, /permit\.pdf/);
  assert.match(note, /Permit documents/);
});
