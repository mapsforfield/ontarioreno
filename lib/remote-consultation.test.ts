import test from 'node:test';
import assert from 'node:assert/strict';
import {
  REMOTE_CONSULTATION_CITIES,
  consultationDelivery,
  isRemoteConsultationCity,
} from './remote-consultation.ts';

test('the three cities the reps asked for are remote', () => {
  for (const city of ['Windsor', 'Niagara Falls', 'Thorold']) {
    assert.equal(isRemoteConsultationCity(city), true, `${city} must be a virtual consultation`);
  }
});

test('the drivable cities stay in-person', () => {
  // Hamilton and its amalgamated communities are the core service area; St.
  // Catharines is deliberately NOT on the list even though it is out by
  // Niagara, because nobody has asked for it to be.
  for (const city of ['Hamilton', 'Ancaster', 'Stoney Creek', 'Burlington', 'Barrie', 'St. Catharines']) {
    assert.equal(isRemoteConsultationCity(city), false, `${city} must stay an in-person visit`);
  }
});

test('matching survives the casing and spacing Places actually returns', () => {
  assert.equal(isRemoteConsultationCity('NIAGARA FALLS'), true);
  assert.equal(isRemoteConsultationCity('  niagara   falls  '), true);
  assert.equal(isRemoteConsultationCity('windsor'), true);
});

test('either name field can carry the match, and neither is required', () => {
  // Places fills `city` for most addresses and the administrative area for
  // some. Reading one field only put a real Niagara Falls lead back on the
  // in-person path when the other was blank.
  assert.equal(isRemoteConsultationCity('', 'Niagara Falls'), true);
  assert.equal(isRemoteConsultationCity('Niagara Falls', ''), true);
  assert.equal(isRemoteConsultationCity(null, undefined), false);
  assert.equal(isRemoteConsultationCity(), false);
});

test('a city name that merely contains a remote name is not remote', () => {
  // Substring matching would sweep in places nobody decided about.
  assert.equal(isRemoteConsultationCity('New Windsor'), false);
  assert.equal(isRemoteConsultationCity('Niagara-on-the-Lake'), false);
});

test('delivery mode is derived from the same answer', () => {
  assert.equal(consultationDelivery('Thorold'), 'remote');
  assert.equal(consultationDelivery('Hamilton'), 'in_person');
});

test('the list is stored normalised, so a new entry cannot silently never match', () => {
  for (const city of REMOTE_CONSULTATION_CITIES) {
    assert.equal(city, city.trim().toLowerCase().replace(/\s+/g, ' '), `"${city}" must be lower-case and single-spaced`);
    assert.equal(isRemoteConsultationCity(city), true);
  }
});
