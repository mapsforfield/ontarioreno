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
 * has not picked a service yet (home, costs, financing, grants), which is what
 * a general project review is for.
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

/** The booking URL for a page, or '/match' when the page is not about one service. */
export function bookingHrefFor(pathname: string): string {
  const p = pathname.toLowerCase();
  for (const r of RULES) {
    if (r.test.test(p)) return r.slug ? `/consultation/${r.slug}` : '/match';
  }
  return '/match';
}
