// ─── Does our automatic reply actually answer what they said? ─────────────────
// The last gate before a call-mode reply is texted to a homeowner.
//
// WHY IT EXISTS. The classifier can label a message correctly and the template
// for that label can still be the wrong thing to say. Colin (Nov 21) wrote "I
// will get back at you in the new year"; the label was right ("later") and we
// still texted back "Roughly when were you thinking?". Replaying 169 real
// replies found more of the same: "I'm free anytime today, please call me"
// answered with "what's a good time to reach you?".
//
// WHAT IT MAY DO: say no. It reads their message beside the reply we are about
// to send and answers one question. It never writes, edits or picks a reply.
// "No", "not sure", an error, a timeout or a refusal all mean the same thing:
// the reply is not sent and the thread goes to a person. A blocked good reply
// costs the caller one tap; a sent bad reply costs the lead's trust.

import Anthropic from '@anthropic-ai/sdk';

export type FitCheckInput = {
  /** What they just texted, verbatim. */
  theirMessage: string;
  /** What we said to them before that, so "6pm" or "yes" has context. */
  ourPreviousMessage: string;
  /** The reply we are about to send. */
  proposedReply: string;
};

const SYSTEM = `You check one automatic text message before it is sent to a homeowner who enquired about renovating their home. You do not write or improve messages. You only decide whether the proposed reply makes sense as a response to what the homeowner just said.

Answer fits=false if ANY of these are true:
- The reply asks for something they already gave (a time, a day, a timeframe, who we are).
- The reply ignores a question, condition or concern they raised (for example credit, budget, a specific date, a different project, being away).
- The reply assumes they said or asked something they did not (for example "Fair question" when they asked nothing).
- They asked to be called or said when they are free, and the reply asks them for a time or offers different times.
- They want to call us, and the reply does not help them do that.
- The reply would read as robotic or as not listening to a reasonable person who wrote their message.

Answer fits=true only if a reasonable homeowner reading their own message and then this reply would feel it is a sensible, natural answer.

When unsure, answer fits=false. A person will reply instead, which is cheap. Sending a reply that does not fit costs the business the customer's trust.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    fits: { type: 'boolean', description: 'true only if the reply is a sensible answer to their message' },
    reason: { type: 'string', description: 'one short sentence' },
  },
  required: ['fits', 'reason'],
  additionalProperties: false,
};

export type FitVerdict = { fits: boolean; reason: string };

const BLOCK = (reason: string): FitVerdict => ({ fits: false, reason });

/** Parse the model's JSON. Anything unexpected blocks the reply. */
export function parseFitVerdict(text: string): FitVerdict {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return BLOCK('unparseable verdict');
  }
  if (!parsed || typeof parsed !== 'object') return BLOCK('empty verdict');
  const o = parsed as Record<string, unknown>;
  // Must be asserted true. A missing or non-boolean flag is not a yes.
  if (o.fits !== true) return BLOCK(typeof o.reason === 'string' ? o.reason : 'not confirmed');
  return { fits: true, reason: typeof o.reason === 'string' ? o.reason : '' };
}

/**
 * Never throws. No key, an API error, a timeout, a refusal or a malformed
 * answer all come back as fits=false.
 */
export async function checkReplyFits(
  input: FitCheckInput,
  env: NodeJS.ProcessEnv = process.env,
  client?: Anthropic
): Promise<FitVerdict> {
  if (!input.theirMessage.trim() || !input.proposedReply.trim()) return BLOCK('nothing to compare');
  if (!client && !env.ANTHROPIC_API_KEY) return BLOCK('no API key');
  try {
    const anthropic = client ?? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create(
      {
        model: 'claude-opus-5-5',
        max_tokens: 1024,
        // A short, well-specified judgement with a person waiting on the
        // other end. The default-to-false rule, not effort, keeps it safe.
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              'What we texted them before:',
              input.ourPreviousMessage || '(nothing)',
              '',
              'What they just texted:',
              input.theirMessage,
              '',
              'The reply we are about to send:',
              input.proposedReply,
            ].join('\n'),
          },
        ],
      },
      { timeout: 20_000, maxRetries: 1 }
    );
    if (response.stop_reason === 'refusal') return BLOCK('refusal');
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return parseFitVerdict(text);
  } catch (err) {
    console.error('[reply-fit-check] could not check reply:', err);
    return BLOCK('check failed');
  }
}
