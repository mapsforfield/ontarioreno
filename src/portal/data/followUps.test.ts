import assert from 'node:assert/strict';
import test from 'node:test';

import { followUpSilenced, lostDealIds } from './followUps.ts';
import type { Appointment, Deal } from './types.ts';

const deal = (id: string, status: Deal['status']) => ({ id, status }) as Deal;

type FollowUpFields = Pick<Appointment, 'dealId' | 'consultationStage' | 'nextStep'>;

const appointment = (fields: Partial<FollowUpFields> = {}): FollowUpFields => ({
  dealId: null,
  consultationStage: 'consultation_completed',
  nextStep: 'follow_up_required',
  ...fields,
});

test('a follow-up on a lost deal goes quiet', () => {
  const lost = lostDealIds([deal('d1', 'lost')]);
  assert.equal(followUpSilenced(appointment({ dealId: 'd1' }), lost), true);
});

test('a follow-up on an open deal still asks to be chased', () => {
  const lost = lostDealIds([deal('d1', 'negotiating')]);
  assert.equal(followUpSilenced(appointment({ dealId: 'd1' }), lost), false);
});

test('winning a deal does not silence its follow-up — a won job still owes calls', () => {
  const lost = lostDealIds([deal('d1', 'won')]);
  assert.equal(followUpSilenced(appointment({ dealId: 'd1' }), lost), false);
});

test('a consultation with no deal row is silenced by its own lost outcome', () => {
  const lost = lostDealIds([]);
  assert.equal(followUpSilenced(appointment({ consultationStage: 'lost' }), lost), true);
  assert.equal(followUpSilenced(appointment({ nextStep: 'lost' }), lost), true);
});

test('an unlinked consultation that is still live keeps its follow-up', () => {
  assert.equal(followUpSilenced(appointment(), lostDealIds([])), false);
});

test('reopening a deal out of lost brings the follow-up back', () => {
  const apt = appointment({ dealId: 'd1' });
  assert.equal(followUpSilenced(apt, lostDealIds([deal('d1', 'lost')])), true);
  assert.equal(followUpSilenced(apt, lostDealIds([deal('d1', 'quoted')])), false);
});
