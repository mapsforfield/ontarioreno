// ─── Reading a free-text reply to a booked visit ──────────────────────────────
// One job: say what a homeowner's text about their EXISTING appointment most
// likely means — cancel, reschedule, running late, confirming, a question, a
// plain acknowledgement, or "can't tell". Sibling of lib/lead-classify.ts,
// which reads replies from leads who have not booked yet.
//
// It never writes to the homeowner and never changes the booking. Its answer
// becomes a label and a one-tap button for the rep (lib/sms-replies.ts →
// READ_REPLY_STATUS). Every failure — no key, timeout, refusal, a shape we did
// not ask for — comes back as `unclear`, which is exactly what happened to
// every free-text reply before this existed: a person reads it.

import Anthropic from '@anthropic-ai/sdk';
import { isTapback, type ReadIntent } from './sms-replies.js';

const INTENTS: ReadIntent[] = ['cancel', 'reschedule', 'running_late', 'confirm', 'question', 'acknowledged', 'unclear'];

const SYSTEM = `You read one SMS a homeowner sent in reply to texts about their booked in-home renovation consultation (a visit from a specialist), and report what they meant. You are a classifier: you never write to the homeowner and never decide what happens — a sales rep does, using your label.

Labels:
- cancel: they don't want the visit to happen ("please cancel", "cancel", "not interested anymore", "don't come", "I can't do it, cancel")
- reschedule: they want the visit at a different time or day, including "not ready yet, I'll let you know" and "can we do Friday instead"
- running_late: they will be late or ask the specialist to come a bit later the same day
- confirm: they are clearly saying the visit is still on ("yes see you then", "confirmed", "yes 6pm works")
- question: they ask something (price, how long, who is coming, parking) without asking to cancel or move
- acknowledged: a plain "ok", "thanks", "👍" or similar that doesn't say yes or no to anything
- unclear: anything else, mixed signals, or anything you are not sure about

Rules:
1. Typos count: "Cance", "cancle", "resched" mean what they obviously mean.
2. "I can't be home today" with no request to move is cancel; with "another day"/"reschedule" it is reschedule.
3. "Ok" and "thanks" are acknowledged, not confirm. Politeness is not agreement.
4. When torn between two labels, or not sure, choose unclear. A person reads every message regardless; a wrong label sends a rep the wrong way.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    intent: { type: 'string', enum: INTENTS },
  },
  required: ['intent'],
  additionalProperties: false,
};

export function parseReadIntent(text: string): ReadIntent {
  try {
    const obj = JSON.parse(text) as { intent?: unknown };
    return typeof obj.intent === 'string' && INTENTS.includes(obj.intent as ReadIntent)
      ? (obj.intent as ReadIntent)
      : 'unclear';
  } catch {
    return 'unclear';
  }
}

/**
 * Never throws. Fast by design: this runs inside Twilio's webhook, which gives
 * up after 15 seconds and also waits on the downstream forward, so the model
 * gets a hard 5-second budget and no retries.
 */
export async function classifyAppointmentReply(
  body: string,
  context: { customerName?: string; whenLabel?: string; lastOutbound?: string } = {},
  env: NodeJS.ProcessEnv = process.env,
  client?: Anthropic
): Promise<ReadIntent> {
  const text = (body ?? '').trim();
  if (!text) return 'unclear';
  if (isTapback(text)) return 'acknowledged';
  if (!client && !env.ANTHROPIC_API_KEY) return 'unclear';

  try {
    const anthropic = client ?? new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create(
      {
        model: 'claude-opus-5-5',
        max_tokens: 1024,
        // A short, well-specified judgement with a homeowner and a rep waiting
        // on it; the "unclear" escape hatch, not effort, keeps hard cases safe.
        output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
        system: SYSTEM,
        messages: [
          {
            role: 'user',
            content: [
              `Their visit: ${context.whenLabel || 'upcoming'}`,
              `Our last text to them: ${context.lastOutbound || '(a booking confirmation or reminder)'}`,
              '',
              'Their reply:',
              text,
            ].join('\n'),
          },
        ],
      },
      { timeout: 5_000, maxRetries: 0 }
    );
    if (response.stop_reason === 'refusal') return 'unclear';
    const out = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return parseReadIntent(out);
  } catch (err) {
    console.error('[sms-reply-classify] could not classify reply:', err);
    return 'unclear';
  }
}
