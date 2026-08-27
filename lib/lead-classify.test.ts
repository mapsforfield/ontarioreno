// The model's answer is untrusted input. Everything here is about what happens
// when it says something we did not ask for, and the answer is always the same:
// an unconfident `unclear`, which the state machine routes to a person.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyLeadReply, parseClassification, resolvePickedSlot } from './lead-classify.js';
import type { Classification } from './lead-conversation.js';
import type { OfferedSlot } from './lead-reply-templates.js';

const SLOTS: OfferedSlot[] = [
  { date: '2026-09-01', time: '10:00' },
  { date: '2026-09-02', time: '14:00' },
];

const unsure = (c: Classification) => c.intent === 'unclear' && c.confident === false;

test('a well-formed answer comes through intact', () => {
  const c = parseClassification(
    JSON.stringify({ intent: 'picked_slot', confident: true, pickedSlotIndex: 1 }),
    'the wednesday one'
  );
  assert.equal(c.intent, 'picked_slot');
  assert.equal(c.confident, true);
  assert.equal(c.pickedSlotIndex, 1);
  assert.equal(c.rawBody, 'the wednesday one', 'their own words are always carried through');
});

test('an intent we do not recognise is not salvaged', () => {
  // A near-miss is not a near-hit. An unknown intent means the model answered a
  // question we did not ask, and guessing which of ours it resembles is exactly
  // the improvisation this design exists to prevent.
  for (const intent of ['booking_confirmed', 'PICKED_SLOT', 'picked slot', '', 'yes']) {
    const c = parseClassification(JSON.stringify({ intent, confident: true }), 'body');
    assert.ok(unsure(c), `${JSON.stringify(intent)} was accepted`);
  }
});

test('confidence must be stated, never inferred', () => {
  // A missing flag is not a yes. This is the difference between "the model was
  // sure" and "the model forgot to say".
  for (const confident of [undefined, null, 'true', 1, 'yes']) {
    const c = parseClassification(
      JSON.stringify({ intent: 'prefers_weekdays', confident }),
      'weekdays'
    );
    assert.ok(unsure(c), `confident=${JSON.stringify(confident)} was accepted`);
  }
});

test('an unparseable or empty response is a person, not a crash', () => {
  for (const text of ['', 'null', 'not json at all', '{"intent":', '[]', '"a string"', '42']) {
    const c = parseClassification(text, 'body');
    assert.ok(unsure(c), `${JSON.stringify(text)} did not degrade safely`);
  }
});

test('a non-integer slot index is dropped rather than rounded', () => {
  // 1.5 is not a slot. Rounding it picks a real appointment time on the
  // strength of a number the model did not mean.
  for (const index of [1.5, '1', null, 'first', {}]) {
    const c = parseClassification(
      JSON.stringify({ intent: 'picked_slot', confident: true, pickedSlotIndex: index }),
      'body'
    );
    assert.equal(c.pickedSlotIndex, null, `index ${JSON.stringify(index)} survived`);
  }
});

test('an address that is not a string never reaches the booking path', () => {
  for (const address of [42, null, {}, ['42 King St']]) {
    const c = parseClassification(
      JSON.stringify({ intent: 'gave_address', confident: true, addressText: address }),
      'body'
    );
    assert.equal(c.addressText, null);
  }
});

// ─── Index bounds are ours to enforce, not the model's ────────────────────────

test('an index past the end of what we offered is refused', () => {
  // The model is not the authority on how many slots exist. Index 2 against two
  // offered times would otherwise become an appointment at `undefined`.
  const base = { intent: 'picked_slot' as const, confident: true, rawBody: 'that one' };
  assert.equal(resolvePickedSlot({ ...base, pickedSlotIndex: 2 }, SLOTS), null);
  assert.equal(resolvePickedSlot({ ...base, pickedSlotIndex: -1 }, SLOTS), null);
  assert.equal(resolvePickedSlot({ ...base, pickedSlotIndex: null }, SLOTS), null);
  assert.equal(resolvePickedSlot({ ...base, pickedSlotIndex: 99 }, SLOTS), null);
});

test('an index inside what we offered resolves to that exact slot', () => {
  const base = { intent: 'picked_slot' as const, confident: true, rawBody: 'that one' };
  assert.deepEqual(resolvePickedSlot({ ...base, pickedSlotIndex: 0 }, SLOTS), SLOTS[0]);
  assert.deepEqual(resolvePickedSlot({ ...base, pickedSlotIndex: 1 }, SLOTS), SLOTS[1]);
});

test('no slots offered means no slot can be picked', () => {
  const base = { intent: 'picked_slot' as const, confident: true, rawBody: 'the first' };
  assert.equal(resolvePickedSlot({ ...base, pickedSlotIndex: 0 }, []), null);
});

// ─── The live call degrades to a person, never to silence ─────────────────────

test('an empty text is not sent to the model at all', async () => {
  for (const body of ['', '   ', '\n']) {
    const c = await classifyLeadReply(
      { body, phase: 'opened', offeredSlots: [], lastOutbound: '' },
      { ANTHROPIC_API_KEY: 'test-key' } as NodeJS.ProcessEnv
    );
    assert.ok(unsure(c));
  }
});

test('no API key configured is a person reading it, not a failure', async () => {
  // This is how the feature stays off in a preview deployment. It must not
  // throw and it must not send anything.
  const c = await classifyLeadReply(
    { body: 'weekends work', phase: 'opened', offeredSlots: SLOTS, lastOutbound: 'hi' },
    {} as NodeJS.ProcessEnv
  );
  assert.ok(unsure(c));
});

test('an API outage lands on a person rather than throwing', async () => {
  const exploding = {
    messages: {
      create: async () => {
        throw new Error('503 upstream unavailable');
      },
    },
  };
  const c = await classifyLeadReply(
    { body: 'weekends work', phase: 'opened', offeredSlots: SLOTS, lastOutbound: 'hi' },
    { ANTHROPIC_API_KEY: 'k' } as NodeJS.ProcessEnv,
    exploding as never
  );
  assert.ok(unsure(c));
});

test('a refusal is a person, not an empty reply', async () => {
  const refusing = {
    messages: {
      create: async () => ({ stop_reason: 'refusal', content: [] }),
    },
  };
  const c = await classifyLeadReply(
    { body: 'weekends work', phase: 'opened', offeredSlots: SLOTS, lastOutbound: 'hi' },
    { ANTHROPIC_API_KEY: 'k' } as NodeJS.ProcessEnv,
    refusing as never
  );
  assert.ok(unsure(c));
});

test('a good live answer is returned with their words attached', async () => {
  const answering = {
    messages: {
      create: async () => ({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: JSON.stringify({ intent: 'prefers_weekends', confident: true }) }],
      }),
    },
  };
  const c = await classifyLeadReply(
    { body: 'weekends are better for us', phase: 'opened', offeredSlots: SLOTS, lastOutbound: 'hi' },
    { ANTHROPIC_API_KEY: 'k' } as NodeJS.ProcessEnv,
    answering as never
  );
  assert.equal(c.intent, 'prefers_weekends');
  assert.equal(c.confident, true);
  assert.equal(c.rawBody, 'weekends are better for us');
});
