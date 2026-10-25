/**
 * Which booking flow a page's "book" button should open.
 *
 * Measured Oct 2026 (Lead table, ~4 months): the /match project-review form
 * turned 13 of 131 submissions into a booking; the /consultation/<service>
 * flows, which end on a live calendar, booked about 120 of 140. Most of the
 * site's buttons pointed at /match. A visitor reading about basements now goes
 * straight to the basement calendar.
 *
 * /match is NOT retired. It stays the destination for pages where the visitor
 * has not picked a service yet (costs, financing, grants), which is what a
 * general project review is for.
 *
 * The homepage was on that list until Oct 2026. It now opens /book, which asks
 * the one question /match existed to answer — which project? — and drops the
 * visitor straight into that calendar. /book still offers /match to anyone
 * who is not sure yet.
 *
 * Grant pages deliberately fall through to /match: they are about a specific
 * program's eligibility, and the service flows do not ask about grants.
 */
const RULES: { test: RegExp; slug: string }[] = [
  { test: /grant|incentive-program|funding|rebate/, slug: '' },
  { test: /bathroom/, slug: 'bathroom' },
  { test: /kitchen/, slug: 'kitchen' },
  { test: /garden-suite|laneway/, slug: 'garden-suite' },
  { test: /basement|legal-suites|secondary-suite|aru-eligibility|adu-(cost|permits)|permit/, slug: 'basement' },
];

/**
 * The service picker: /book, and the same tiles on the homepage.
 *
 * Every slug must be an enabled /consultation flow — lib/booking-routes.test.ts
 * fails otherwise. Legal suites book through the basement flow, as every
 * legal-suite page's header button already does.
 */
export const SERVICE_PICKER_HREF = '/book';

export const BOOKING_SERVICES = [
  { slug: 'basement', label: 'Basement or legal suite' },
  { slug: 'kitchen', label: 'Kitchen' },
  { slug: 'bathroom', label: 'Bathroom' },
  { slug: 'garden-suite', label: 'Garden suite' },
] as const;

/** The booking URL for a page, or '/match' when the page is not about one service. */
export function bookingHrefFor(pathname: string): string {
  const p = pathname.toLowerCase();
  if (p === '/' || p === '') return SERVICE_PICKER_HREF;
  for (const r of RULES) {
    if (r.test.test(p)) return r.slug ? `/consultation/${r.slug}` : '/match';
  }
  return '/match';
}
