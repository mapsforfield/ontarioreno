// ─── What we say back to a lead who replies to the opener ─────────────────────
// Pure string builders, no clock and no database, so every message a real
// homeowner could receive is readable in one file and assertable in a test.
//
// THE RULE THAT MAKES THIS SAFE: the model never writes to a homeowner. It
// classifies an inbound text (see lib/lead-classify.ts) and the state machine
// picks one of the templates below. Michael wrote this copy; a classifier that
// picks the wrong one sends the wrong TRUE sentence, which is recoverable. A
// model composing its own sentence could invent a price, a slot or a promise,
// which is not.
//
// So: adding a new thing we might say means adding a template here. It must
// never mean letting the model speak freely.

import { callSlotLabel, callSlotPair } from './call-slots.js';

/** A bookable time, already checked against the real calendar. */
export type OfferedSlot = {
  /** YYYY-MM-DD */
  date: string;
  /** HH:MM, 24h */
  time: string;
};

export type ReplyContext = {
  /** First name only. Empty is tolerated — every template reads without it. */
  name: string;
  /** Real open slots, in the order they should be offered. */
  slots: OfferedSlot[];
  /** For the booked confirmation only. */
  booked?: { date: string; time: string; address: string };
  /**
   * Call conversations only. The Ontario wall clock ("YYYY-MM-DDTHH:MM") the
   * homeowner will read the text at, so times can say "tonight at 6pm" rather
   * than a date. Absent, call templates fall back to the dated label.
   */
  now?: string;
  /** Who signs the text. Call templates name the caller; default Mark. */
  sender?: string;
  /** "your basement", "your bathroom renovation". Default "your basement". */
  about?: string;
  /** The consultation booking page for this lead. Default the basement page. */
  bookingUrl?: string;
};

/** Where call_booking_link points when the caller did not say. */
export const DEFAULT_BOOKING_URL = 'https://ontarioreno.ca/consultation/basement';

/**
 * Every template we are willing to send. The classifier chooses one of these
 * ids and nothing else — an id it cannot produce is a message we cannot send.
 */
export type ReplyTemplateId =
  | 'picked_weekdays'
  | 'picked_weekends'
  | 'ask_address'
  | 'answer_price'
  | 'answer_duration'
  | 'who_is_this'
  | 'wants_call'
  | 'other_project'
  | 'further_out'
  | 'booked_confirmation'
  | 'address_unclear'
  | 'slot_taken'
  // ── Call conversations ──
  // The opener offers two times for a short PHONE call, not a site visit, so
  // nothing here may promise a visit or ask for an address.
  | 'call_answer_price'
  | 'call_answer_duration'
  | 'call_other_project'
  | 'call_who_is_this'
  | 'call_booked'
  | 'call_slot_taken'
  // "Not now" in a call thread: close politely and hand to a person.
  | 'call_later_close'
  // "Can't talk, I can text": the consultation booking link, then a person.
  | 'call_booking_link';

/** How many real slots each template needs before it can be sent. */
export const SLOTS_REQUIRED: Record<ReplyTemplateId, number> = {
  picked_weekdays: 2,
  picked_weekends: 2,
  ask_address: 0,
  answer_price: 2,
  answer_duration: 2,
  who_is_this: 0,
  wants_call: 0,
  other_project: 2,
  further_out: 0,
  booked_confirmation: 0,
  address_unclear: 0,
  // Two remaining alternatives after the one they wanted was taken.
  slot_taken: 2,
  // Call threads ask for THEIR time (Nov 22 2026), so these need no slots.
  call_answer_price: 0,
  call_answer_duration: 0,
  call_other_project: 0,
  call_who_is_this: 0,
  // The one they picked.
  call_booked: 1,
  call_slot_taken: 0,
  call_later_close: 0,
  call_booking_link: 0,
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * "Tue Sep 2, 10am".
 *
 * The date is spelled out rather than left as a bare weekday because the
 * booking horizon is fourteen days: "Tuesday" on its own is two different
 * Tuesdays, and a homeowner who picks the wrong one has been misled by us.
 */
export function slotLabel(slot: OfferedSlot): string {
  const [y, m, d] = slot.date.split('-').map(Number);
  const [hh, mm] = slot.time.split(':').map(Number);
  if (!y || !m || !d || Number.isNaN(hh)) return '';
  const weekday = DAYS[new Date(y, m - 1, d).getDay()];
  const suffix = hh >= 12 ? 'pm' : 'am';
  const hour = hh % 12 || 12;
  const clock = mm ? `${hour}:${String(mm).padStart(2, '0')}${suffix}` : `${hour}${suffix}`;
  return `${weekday} ${MONTHS[m - 1]} ${d}, ${clock}`;
}

/** "Tue Sep 2, 10am or Wed Sep 3, 2pm" — the two-slot offer every template shares. */
function twoSlots(slots: OfferedSlot[]): { first: string; second: string } {
  return { first: slotLabel(slots[0]), second: slotLabel(slots[1]) };
}

/** "tomorrow at 10am or 6pm" when we know when it will be read, dated otherwise. */
function callPair(ctx: ReplyContext): string {
  if (ctx.now) return callSlotPair(ctx.slots[0], ctx.slots[1], ctx.now);
  const { first, second } = twoSlots(ctx.slots);
  return `${first} or ${second}`;
}

/**
 * Render one template.
 *
 * Throws when the context cannot support the template — a missing slot would
 * otherwise render as "I've got  or " and go to a real person. The caller is
 * the state machine, which checks SLOTS_REQUIRED first, so a throw here means
 * a bug rather than an ordinary branch.
 */
export function renderReply(id: ReplyTemplateId, ctx: ReplyContext): string {
  const need = SLOTS_REQUIRED[id];
  if (ctx.slots.length < need) {
    throw new Error(`template ${id} needs ${need} slots, got ${ctx.slots.length}`);
  }
  const name = ctx.name.trim().split(/\s+/)[0] ?? '';

  switch (id) {
    case 'picked_weekdays': {
      const { first, second } = twoSlots(ctx.slots);
      return `Perfect. I've got ${first} or ${second} open. Which one works better for you?`;
    }
    case 'picked_weekends': {
      const { first, second } = twoSlots(ctx.slots);
      return `Great, weekends work for us. I've got ${first} or ${second}. Which suits you?`;
    }
    case 'ask_address':
      return `Got it, ${slotLabel(ctx.slots[0] ?? { date: '', time: '' })} it is. What's the address so I can get it booked in?`
        // A slot we could not label would read "Got it,  it is." — fall back to
        // the sentence that is true without one.
        .replace('Got it,  it is.', 'Got it.');
    case 'answer_price': {
      const { first, second } = twoSlots(ctx.slots);
      return `It depends on the size and layout, that's what the visit is for, and there's no cost for it. Are you free ${first} or ${second}?`;
    }
    case 'answer_duration': {
      const { first, second } = twoSlots(ctx.slots);
      return `About 30-45 minutes. We look at the space, talk through what you want, and you get a real number. No cost for the consultation. Would ${first} or ${second} work?`;
    }
    case 'who_is_this':
      return `Sorry, should have said. Michael from OntarioReno. You filled in a form about finishing your basement, so I'm following up. Still something you're looking into?`;
    case 'wants_call':
      return `Sure, what's a good time to reach you?`;
    case 'other_project': {
      const { first, second } = twoSlots(ctx.slots);
      return `We do those too. Same deal, we come take a look and give you a number, no cost. Would ${first} or ${second} work for you?`;
    }
    case 'further_out':
      return `No problem, it doesn't have to be this week. I can book you into next week too, or further out if that's easier. Roughly when were you thinking?`;
    case 'booked_confirmation': {
      const b = ctx.booked;
      if (!b) throw new Error('booked_confirmation needs a booked appointment');
      const when = slotLabel({ date: b.date, time: b.time });
      const greeting = name ? `${name}, you're` : `You're`;
      return `${greeting} booked for ${when} at ${b.address}. See you then. If anything changes just text me back.`;
    }
    case 'address_unclear':
      return `Just want to make sure I've got the right place. What's the street number and street name?`;
    case 'slot_taken': {
      const { first, second } = twoSlots(ctx.slots);
      return `Sorry, someone grabbed that one while we were talking. I've still got ${first} or ${second}. Either work?`;
    }
    case 'call_answer_price':
      return `It depends on the size and layout, which is what the quick call is for. No cost, no pressure. What time works today or tomorrow?`;
    case 'call_answer_duration':
      return `Just 5 minutes. I'll ask a few questions about the space and what you have in mind. What time works today or tomorrow?`;
    case 'call_other_project':
      return `We do those too. Happy to talk it through on a quick call. What time works today or tomorrow?`;
    case 'call_who_is_this': {
      const sender = (ctx.sender ?? '').trim() || 'Mark';
      const about = (ctx.about ?? '').trim() || 'your basement';
      void about;
      return `Sorry, should have said. It's ${sender} from OntarioReno. You requested info on our basement ad. What time works today or tomorrow for a quick 5-min call?`;
    }
    case 'call_booked': {
      const when = ctx.now ? callSlotLabel(ctx.slots[0], ctx.now) : slotLabel(ctx.slots[0]);
      const greeting = name ? `Perfect, ${name}.` : 'Perfect.';
      return `${greeting} I'll call you ${when} from this number. Talk then.`;
    }
    case 'call_slot_taken':
      return `Sorry, that time just filled up. What other time works today or tomorrow?`;
    case 'call_later_close':
      // They said when ("in the new year", "spring"). Asking again, or offering
      // next week, reads as not listening. "then" fits whatever they said.
      return `No problem${name ? `, ${name}` : ''}. I'll check back with you then. Thanks!`;
    case 'call_booking_link': {
      // Sabah's own wording from the Messages page (Nov 22 2026). The one call
      // template that names the consultation: the form books it, not us.
      const url = (ctx.bookingUrl ?? '').trim() || DEFAULT_BOOKING_URL;
      return `No problem${name ? `, ${name}` : ''}. You can book a free in-home consultation for any day and time that suits you here: ${url}`;
    }
  }
}

/**
 * Every id, for tests and for the classifier's enum. Deliberately a literal
 * list rather than Object.keys, so adding a template is a decision made twice.
 */
export const ALL_TEMPLATE_IDS: ReplyTemplateId[] = [
  'picked_weekdays',
  'picked_weekends',
  'ask_address',
  'answer_price',
  'answer_duration',
  'who_is_this',
  'wants_call',
  'other_project',
  'further_out',
  'booked_confirmation',
  'address_unclear',
  'slot_taken',
  'call_answer_price',
  'call_answer_duration',
  'call_other_project',
  'call_who_is_this',
  'call_booked',
  'call_slot_taken',
  'call_later_close',
  'call_booking_link',
];
