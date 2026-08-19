import assert from 'node:assert/strict';
import test from 'node:test';

import { appointmentBelongsToClient, dealMatchesClient, phoneKey } from './clientLinks.ts';

const client = { id: 'c1', phone: '+19056917227', email: 'mighty.mouse@hotmail.com' };

test('the explicit link always wins', () => {
  assert.equal(
    appointmentBelongsToClient({ clientId: 'c1', phone: '', email: '' }, client),
    true
  );
});

test('an unlinked consultation matches on the phone number, however it was typed', () => {
  for (const phone of ['+19056917227', '19056917227', '9056917227', '905-691-7227', '(905) 691 7227']) {
    assert.equal(
      appointmentBelongsToClient({ clientId: null, phone, email: '' }, client),
      true,
      `${phone} did not match`
    );
  }
});

test('an unlinked consultation matches on the email, case and spacing aside', () => {
  assert.equal(
    appointmentBelongsToClient({ clientId: null, phone: '', email: '  MIGHTY.MOUSE@hotmail.com ' }, client),
    true
  );
});

test("a consultation already linked to someone else is never pulled onto this profile", () => {
  assert.equal(
    appointmentBelongsToClient({ clientId: 'c2', phone: '+19056917227', email: '' }, client),
    false
  );
});

test('a different person does not match', () => {
  assert.equal(
    appointmentBelongsToClient({ clientId: null, phone: '+16472274145', email: 'someone@else.com' }, client),
    false
  );
});

test('a too-short or empty phone never matches — it would match everything', () => {
  assert.equal(phoneKey('7227'), '');
  assert.equal(
    appointmentBelongsToClient({ clientId: null, phone: '7227', email: '' }, { id: 'c1', phone: '7227', email: '' }),
    false
  );
  assert.equal(
    appointmentBelongsToClient({ clientId: null, phone: '', email: '' }, { id: 'c1', phone: '', email: '' }),
    false
  );
});

test('deals match the same person the same way', () => {
  assert.equal(dealMatchesClient({ phone: '905 691 7227', email: '' }, client), true);
  assert.equal(dealMatchesClient({ phone: '', email: 'MIGHTY.MOUSE@hotmail.com' }, client), true);
  assert.equal(dealMatchesClient({ phone: '4165550100', email: 'other@x.com' }, client), false);
});
