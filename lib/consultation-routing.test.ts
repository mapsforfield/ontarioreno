import test from 'node:test';
import assert from 'node:assert/strict';
import { routeConsultation } from './consultation-routing.ts';
import { HAMILTON_PROGRAM, SIMCOE_PROGRAM, areaForMunicipality } from './program-config.ts';

const OK = { ownership: 'yes', projectType: 'secondary_suite', timeline: 'asap' };
const base = {
  addressState: 'ADDRESS_VERIFIED' as const,
  area: 'HAMILTON' as const,
  program: HAMILTON_PROGRAM,
};

test('a fully qualified Hamilton homeowner reaches the calendar', () => {
  const r = routeConsultation({ ...base, answers: OK });
  assert.equal(r.outcome, 'DIRECT_CALENDAR');
});

test('an exploratory timeline nurtures rather than books', () => {
  const r = routeConsultation({ ...base, answers: { ...OK, timeline: 'exploring' } });
  assert.equal(r.outcome, 'NURTURE');
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
