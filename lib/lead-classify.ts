// ─── Reading what a homeowner just texted back ────────────────────────────────
// The ONLY place a model touches this feature, and it does exactly one job:
// turn a free-text SMS into one of the intents in lib/lead-conversation.ts.
//
// It does not write to the homeowner. It does not choose to book anything. It
// does not decide a lead is dead. Every sentence a homeowner receives was
// written by Michael and lives in lib/lead-reply-templates.ts; this function
// only says which of his sentences fits.
//
// That split is the safety property. A misclassification sends the wrong TRUE
// sentence, which a person can see and correct. A model composing its own reply
// could invent a price, a time we do not have, or a promise we cannot keep —
// to a real prospect, in our name.
//
// The escape hatch is `confident`. Every route out of "not sure" ends at a
// person, so the prompt below is written to make saying so comfortable rather
// than to squeeze out a guess.

import Anthropic from '@anthropic-ai/sdk';
import type { Classification, ConversationPhase, ReplyIntent } from './lead-conversation.js';
import { slotLabel, type OfferedSlot } from './lead-reply-templates.js';

export type ClassifyInput = {
  /** What they just sent, verbatim. */
  body: string;
  /** Where the conversation is, so "the first one" has a referent. */
  phase: ConversationPhase;
  /** The times we last offered, in the order we offered them. */
  offeredSlots: OfferedSlot[];
  /** What we last said to them, so a reply like "yes" can be resolved. */
  lastOutbound: string;
};

const VALID_INTENTS: ReplyIntent[] = [
  'prefers_weekdays',
  'prefers_weekends',
  'picked_slot',
  'gave_address',
  'asked_price',
  'asked_duration',
  'asked_who_is_this',
  'not_interested',
  'wants_call',
  'different_project',
  'later_timeframe',
  'unclear',
];

/**
 * What a failed classification looks like.
 *
 * Not a thrown error: an API outage, a rate limit or a malformed response must
 * degrade to "a person reads it", never to silence and never to a guess. The
 * caller cannot tell these apart from a genuine "I don't know", which is the
 * point — both mean the same thing downstream.
 */
function cannotTell(body: string): Classification {
  return { intent: 'unclear', confident: false, rawBody: body };
}

const SYSTEM = `You read one SMS from a homeowner who enquired about finishing their basement, and report what they meant. You are a classifier. You never write messages to the homeowner and never decide what happens next — other code does that from your answer.

Return one intent:

- prefers_weekdays: weekdays suit them better
- prefers_weekends: weekends suit them better
- picked_slot: they chose one of the specific times we offered
- gave_address: they gave the property address
- asked_price: they asked what it costs
- asked_duration: they asked how long the visit takes
- asked_who_is_this: they don't know who is texting them
- not_interested: they don't want to proceed
- wants_call: they'd rather be phoned than text
- different_project: they asked about work other than a basement
- later_timeframe: interested, but not for a while
- unclear: anything else, or anything you are not sure about

Rules that matter more than coverage:

1. Set confident to false whenever you are less than certain. A person reads every unconfident message, which is cheap. Acting on a wrong guess sends a real prospect the wrong text in our name, which is not. When torn between a specific intent and unclear, choose unclear.
2. Only use picked_slot when you can say WHICH offered time they meant, as a 0-based index into the list you were given. "Tuesday" when both offered times are Tuesdays is not a pick. "The first one", "the 10am", and "Sep 2 works" are.
3. Only use gave_address when actual address text is present, and copy it exactly as they typed it into addressText. Do not correct, complete, expand or reformat it. "It's the blue house" is not an address.
4. A message can do two things ("weekends, and how much roughly?"). Report the one that decides what we should say back — here, asked_price, because answering it also re-offers times.
5. Politeness is not agreement. "Ok", "thanks", "sounds good" and "sure" answer nothing on their own. If the message does not actually answer what we asked, that is unclear.
6. Not interested must be explicit. Hesitation, silence about the times, or asking a hard question is not a no.`;

/**
 * Schema the model's answer must satisfy. Anything else is treated as unclear.
 *
 * Deliberately the plainest schema that expresses the answer: no union types,
 * no nullable members. The two optional fields are simply omitted when they do
 * not apply, and parseClassification reads a missing field as absent. A schema
 * the API rejects would 400 every request, and because every failure here
 * degrades to "a person reads it", that would look like the feature quietly
 * doing nothing rather than like a bug.
 */
const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: VALID_INTENTS },
    confident: {
      type: 'boolean',
      description: 'false whenever you are less than certain',
    },
    pickedSlotIndex: {
      type: 'integer',
      description: 'only for picked_slot: 0-based index into the offered times. Omit otherwise.',
    },
    addressText: {
      type: 'string',
      description: 'only for gave_address: the address exactly as they typed it. Omit otherwise.',
    },
  },
  required: ['intent', 'confident'],
  additionalProperties: false,
};

function userPrompt(input: ClassifyInput): string {
  const offered = input.offeredSlots.length
    ? input.offeredSlots.map((s, i) => `  ${i}: ${slotLabel(s)}`).join('\n')
    : '  (none offered yet)';
  return [
    `Conversation state: ${input.phase}`,
    '',
    'Times we offered, by index:',
    offered,
    '',
    'What we last said to them:',
    input.lastOutbound || '(the opening message)',
    '',
    'What they just replied:',
    input.body,
  ].join('\n');
}

/**
 * Classify one inbound reply.
 *
 * Never throws. Every failure — no API key, a rate limit, a timeout, a response
 * that does not fit the schema — comes back as an unconfident `unclear`, which
 * the state machine routes to a person.
 */
export async function classifyLeadReply(
  input: ClassifyInput,
  env: NodeJS.ProcessEnv = process.env,
  client?: Anthropic
): Promise<Classification> {
  const body = input.body ?? '';
  if (!body.trim()) return cannotTell(body);

  // No key configured is not an outage and not a bug — it is how the feature
  // stays off in a preview deployment. Same destination either way: a person.
  if (!client && !env.ANTHROPIC_API_KEY) return cannotTell(body);

  try {
    const anthropic = client ?? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create(
      {
        model: 'claude-opus-5',
        // A classification, not an essay. Enough room for the object and the
        // adaptive thinking that precedes it.
        max_tokens: 1024,
        // Medium rather than high: this is a short, well-specified judgement,
        // and a homeowner is waiting on the other end of it. The `confident`
        // flag, not the effort level, is what keeps a hard case safe.
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        system: SYSTEM,
        messages: [{ role: 'user', content: userPrompt(input) }],
      },
      // A homeowner is mid-conversation. Better to hand a slow reply to a
      // person than to leave them waiting on a retry chain.
      { timeout: 20_000, maxRetries: 1 }
    );

    if (response.stop_reason === 'refusal') return cannotTell(body);

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return parseClassification(text, body);
  } catch (err) {
    console.error('[lead-classify] could not classify reply:', err);
    return cannotTell(body);
  }
}

/**
 * Turn the model's JSON into a Classification, refusing anything unexpected.
 *
 * Exported for tests, and because this is where a schema drift or a
 * hallucinated intent has to die rather than reach the state machine.
 */
export function parseClassification(text: string, rawBody: string): Classification {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return cannotTell(rawBody);
  }
  if (!parsed || typeof parsed !== 'object') return cannotTell(rawBody);
  const obj = parsed as Record<string, unknown>;

  // An intent we do not recognise is not a near-miss to be salvaged. It means
  // the model answered a question we did not ask.
  const intent = obj.intent;
  if (typeof intent !== 'string' || !VALID_INTENTS.includes(intent as ReplyIntent)) {
    return cannotTell(rawBody);
  }
  // Confidence must be asserted, never inferred. A missing flag is not a yes.
  if (obj.confident !== true && obj.confident !== false) return cannotTell(rawBody);

  const index = obj.pickedSlotIndex;
  const address = obj.addressText;
  return {
    intent: intent as ReplyIntent,
    confident: obj.confident,
    pickedSlotIndex: Number.isInteger(index) ? (index as number) : null,
    addressText: typeof address === 'string' ? address : null,
    rawBody,
  };
}

/**
 * Guard the index against the slots we actually offered.
 *
 * Separate from parseClassification because the model is not the authority on
 * how many slots exist — an index of 2 against two offered times must not
 * become an appointment at `undefined`.
 */
export function resolvePickedSlot(
  c: Classification,
  offered: OfferedSlot[]
): OfferedSlot | null {
  const i = c.pickedSlotIndex;
  if (typeof i !== 'number' || !Number.isInteger(i)) return null;
  if (i < 0 || i >= offered.length) return null;
  return offered[i];
}
