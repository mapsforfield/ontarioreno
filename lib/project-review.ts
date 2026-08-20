// ─── Project Review intake ────────────────────────────────────────────────────
// The /match form ("Start Project Review") is the site's main front door. It has
// always POSTed straight to a Google Apps Script, which emails "New Lead Just
// Came In" — so those homeowners existed only in an inbox: no database row, and
// nothing that could text them back.
//
// This is the pure half of fixing that: which consultation form a given answer
// deserves, and what the text says. No fetch, no Prisma, no env.

/**
 * Project type → the booking form that actually fits it.
 *
 * Keyed on the exact option labels in src/pages/Match.tsx. They are the
 * homeowner's own words on screen, so they are what the lead arrives carrying;
 * matching on anything looser would silently send the wrong form the first time
 * someone reworded an option.
 *
 * Two of the seven options are deliberately absent — see PROJECT_TYPES_NO_LINK.
 */
const CONSULTATION_SLUG_BY_PROJECT: Record<string, string> = {
  'Basement renovation': 'basement',
  'Legal basement / secondary suite': 'basement',
  'Garden suite': 'garden-suite',
  'Kitchen renovation': 'kitchen',
  'Bathroom renovation': 'bathroom',
};

/**
 * The options that get no text.
 *
 * "Full home renovation" and "Not sure yet" have no consultation form, and the
 * nearest one is not close enough: a homeowner who has not decided what they
 * are building, dropped onto a basement booking page, learns that we were not
 * listening. Both are the cases that need a human on the phone anyway, and the
 * form already promises them a call.
 *
 * Kept as a named list rather than a fall-through so that adding a form later
 * is a one-line change with an obvious place to make it.
 */
export const PROJECT_TYPES_NO_LINK = ['Full home renovation', 'Not sure yet'];

export const CONSULTATION_BASE_URL = 'https://ontarioreno.ca/consultation';

/** The booking URL for a project type, or null when a person should call. */
export function consultationUrlForProject(projectType: string): string | null {
  const slug = CONSULTATION_SLUG_BY_PROJECT[(projectType ?? '').trim()];
  return slug ? `${CONSULTATION_BASE_URL}/${slug}` : null;
}

/** Plain-language name for the work, used in the text itself. */
const PROJECT_LABEL: Record<string, string> = {
  'Basement renovation': 'basement renovation',
  'Legal basement / secondary suite': 'legal basement suite',
  'Garden suite': 'garden suite',
  'Kitchen renovation': 'kitchen renovation',
  'Bathroom renovation': 'bathroom renovation',
};

export type ProjectReviewContext = {
  name: string;
  projectType: string;
  bookingUrl: string;
};

/**
 * The text a Project Review submission earns.
 *
 * Their own action first, then who we are, then the link — the same order
 * smsLeadWelcome uses, and for the same reason: "why am I getting this" is the
 * question that decides whether a text from an unknown number gets read at all,
 * and naming ourselves before answering it is what gets a message deleted.
 *
 * Says reviewed, because it was — they filled in a qualification form and every
 * answer routed to this. Promises a booking, not a price: no amount, no
 * timeline and no grant is mentioned here, because nothing on this path has
 * checked any of them.
 */
export function smsProjectReview(c: ProjectReviewContext): string {
  const first = (c.name ?? '').trim().split(/\s+/)[0] ?? '';
  const greeting = first ? `Hi ${first},` : 'Hi,';
  const label = PROJECT_LABEL[(c.projectType ?? '').trim()] ?? 'renovation';
  return (
    `${greeting} we've reviewed your ${label} request — this is OntarioReno. ` +
    `You can now book your free in-home consultation directly here: ${c.bookingUrl} ` +
    `Reply STOP to opt out.`
  );
}

/**
 * Everything the intake needs to decide, in one call.
 *
 * Returns `send: false` with a reason rather than throwing, because none of
 * these are errors — a lead with no phone number is a lead somebody calls, and
 * an unmapped project type is a deliberate choice, not a gap.
 */
export function planProjectReviewSms(c: {
  name: string;
  phone: string;
  projectType: string;
}): { send: false; reason: string } | { send: true; body: string; bookingUrl: string } {
  if (!(c.phone ?? '').trim()) return { send: false, reason: 'no_phone' };
  const bookingUrl = consultationUrlForProject(c.projectType);
  if (!bookingUrl) return { send: false, reason: 'no_form_for_project_type' };
  return {
    send: true,
    bookingUrl,
    body: smsProjectReview({ name: c.name, projectType: c.projectType, bookingUrl }),
  };
}
