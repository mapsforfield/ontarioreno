import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  consultationUrlForProject,
  planProjectReviewSms,
  smsProjectReview,
  PROJECT_TYPES_NO_LINK,
} from './project-review.js';

// The seven options a homeowner can actually pick, copied from the labels in
// src/pages/Match.tsx. If someone rewords an option there and not here, these
// tests are what notices — a silently unmapped type stops texting anyone.
const MATCH_FORM_OPTIONS = [
  'Basement renovation',
  'Legal basement / secondary suite',
  'Garden suite',
  'Kitchen renovation',
  'Bathroom renovation',
  'Full home renovation',
  'Not sure yet',
];

test('each project type lands on the form that fits it', () => {
  assert.equal(consultationUrlForProject('Basement renovation'), 'https://ontarioreno.ca/consultation/basement');
  assert.equal(consultationUrlForProject('Legal basement / secondary suite'), 'https://ontarioreno.ca/consultation/basement');
  assert.equal(consultationUrlForProject('Garden suite'), 'https://ontarioreno.ca/consultation/garden-suite');
  assert.equal(consultationUrlForProject('Kitchen renovation'), 'https://ontarioreno.ca/consultation/kitchen');
  assert.equal(consultationUrlForProject('Bathroom renovation'), 'https://ontarioreno.ca/consultation/bathroom');
});

test('every option on the form is accounted for, one way or the other', () => {
  // The failure this prevents: a new option added to the form quietly getting
  // no text and nobody noticing, because "no link" and "not handled" look
  // identical from the outside.
  for (const option of MATCH_FORM_OPTIONS) {
    const mapped = consultationUrlForProject(option) !== null;
    const deliberate = PROJECT_TYPES_NO_LINK.includes(option);
    assert.notEqual(mapped, deliberate, `${option} must be either mapped or deliberately excluded, not both or neither`);
  }
});

test('the two that need a phone call get no link', () => {
  assert.equal(consultationUrlForProject('Full home renovation'), null);
  assert.equal(consultationUrlForProject('Not sure yet'), null);
});

test('an unrecognised project type never guesses a form', () => {
  // Better silence than a homeowner landing on the wrong booking page.
  assert.equal(consultationUrlForProject('Roof replacement'), null);
  assert.equal(consultationUrlForProject(''), null);
  assert.equal(consultationUrlForProject('basement renovation'), null); // case matters
});

test('the text says reviewed, names the work, and promises nothing else', () => {
  const body = smsProjectReview({
    name: 'Nav Khanjrank',
    projectType: 'Legal basement / secondary suite',
    bookingUrl: 'https://ontarioreno.ca/consultation/basement',
  });
  assert.match(body, /^Hi Nav,/);              // first name only
  assert.match(body, /reviewed your legal basement suite request/);
  assert.match(body, /this is OntarioReno/);
  assert.match(body, /https:\/\/ontarioreno\.ca\/consultation\/basement/);
  assert.match(body, /Reply STOP to opt out/);
  // Never states money, a deadline or a grant — nothing on this path checked any
  // of them, and a number we cannot stand behind is the one thing that loses the
  // homeowner's trust before we have met them.
  assert.doesNotMatch(body, /\$|grant|approved|qualif/i);
});

test('no name still produces a sendable text', () => {
  const body = smsProjectReview({
    name: '',
    projectType: 'Kitchen renovation',
    bookingUrl: 'https://ontarioreno.ca/consultation/kitchen',
  });
  assert.match(body, /^Hi, we've reviewed/);
});

test('planning: a lead with no phone is not a failure', () => {
  const plan = planProjectReviewSms({ name: 'Nav', phone: '', projectType: 'Kitchen renovation' });
  assert.deepEqual(plan, { send: false, reason: 'no_phone' });
});

test('planning: an unmapped project type is a deliberate skip', () => {
  const plan = planProjectReviewSms({ name: 'Nav', phone: '4374341291', projectType: 'Not sure yet' });
  assert.deepEqual(plan, { send: false, reason: 'no_form_for_project_type' });
});

test('planning: a mapped type produces the link and the body together', () => {
  const plan = planProjectReviewSms({
    name: 'Nav',
    phone: '4374341291',
    projectType: 'Legal basement / secondary suite',
  });
  assert.equal(plan.send, true);
  if (plan.send) {
    assert.equal(plan.bookingUrl, 'https://ontarioreno.ca/consultation/basement');
    assert.match(plan.body, /consultation\/basement/);
  }
});
