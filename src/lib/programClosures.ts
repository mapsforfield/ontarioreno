// Closure facts for hand-built city pages, kept in ONE place.
//
// These pages predate the grant scanner and render from hardcoded copy, so
// unlike a scanned program there is no database row to flip when a city closes
// its intake. Until they are folded into the scanner's watch list, this file is
// the single source of truth — change it here and every page that references
// the program updates together, instead of one page going stale because someone
// missed it.
//
// Verified against the official page before being added. Delete an entry when a
// program reopens.

export type ProgramClosure = {
  program: string;
  /**
   * The same program in a few words, for the headline of the closure notice.
   *
   * The full legal name runs to four lines on a phone, which pushed the live
   * offer below the fold behind a wall of grey text. The full name still
   * appears in the detail the reader can open.
   */
  shortName: string;
  city: string;
  reason: string;
  sourceUrl: string;
  confirmedOn: string;
};

/**
 * Hamilton's ADU & Multi-Plex Housing Incentive Program — the $40,000 basement /
 * secondary suite grant. The official page reads: "has reached its allocated
 * funding capacity, and the application portal is now closed to new
 * submissions."
 */
export const HAMILTON_ADU_CLOSURE: ProgramClosure = {
  program: "Hamilton's $40,000 ADU & Multi-Plex Housing Incentive Program",
  shortName: "Hamilton's $40,000 ADU grant",
  city: "Hamilton",
  reason:
    "The City of Hamilton has confirmed the program reached its allocated funding capacity, and the application portal is now closed to new submissions.",
  sourceUrl:
    "https://www.hamilton.ca/build-invest-grow/housing-secretariat/housing-accelerator-fund/additional-dwelling-unit-and-multi",
  confirmedOn: "August 6, 2026",
};

/**
 * St. Catharines' ADU grant — the HAF-funded cash grant pool, confirmed
 * depleted on the same sweep that caught Hamilton.
 *
 * It has been marked closed in CURATED_PAGES and in the nav since August 6,
 * but no page ever rendered a notice for it, so a reader who landed on a
 * St. Catharines page directly was still told it was fundable.
 */
export const ST_CATHARINES_ADU_CLOSURE: ProgramClosure = {
  program: "St. Catharines' ADU Grant (Housing Accelerator Fund)",
  shortName: "St. Catharines' ADU grant",
  city: "St. Catharines",
  reason:
    "The Housing Accelerator Fund allocation behind the cash grant has been fully committed, and the city is no longer accepting new grant applications.",
  sourceUrl: "https://www.stcatharines.ca/en/additional-dwelling-units.aspx",
  confirmedOn: "August 6, 2026",
};

/**
 * The cities whose grants are closed, for CLIENT-side pages.
 *
 * `CURATED_PAGES` in `lib/grants.ts` is the real source of truth, but it lives
 * server-side beside Prisma and cannot be imported into the React bundle. So
 * this list is hand-maintained in the same way `grantSections` in Navbar.tsx
 * is — and, like the nav, it is only safe because `lib/grant-integrity.test.ts`
 * fails the build when it disagrees with the hub.
 *
 * Anything on the marketing side that names a city's grant reads this. Adding
 * a fourth uncompared copy of "is this open?" is what put a closed $40,000
 * grant on the homepage for three weeks.
 */
export const CLOSED_GRANT_CITIES = ["Hamilton", "St. Catharines"] as const;

export const isGrantCityClosed = (city: string): boolean =>
  (CLOSED_GRANT_CITIES as readonly string[]).includes(city);

/**
 * Where a closed program's traffic goes now.
 *
 * These visitors arrived wanting a finished basement, not paperwork — sending
 * them to browse a grants index asked them to start their search over, and most
 * did not. The basement financing consultation is a live offer that answers the
 * same want: the build is financed in full, so nothing is owed upfront.
 *
 * Kept here beside the closure it replaces so every closed page makes the same
 * offer in the same words. The amount deliberately mirrors
 * `BASEMENT_FINANCING_PROGRAM.displayAmountLabel` in `lib/program-config.ts` —
 * "from about", never a quoted price, and always "on approved credit". If that
 * label changes, change this with it.
 */
export const BASEMENT_FINANCING_OFFER = {
  href: "/consultation/basement",
  eyebrow: "A better fit, and it's open",
  heading: "Build the basement anyway — from about $399 a month",
  body:
    "The full cost of the build is financed, so there is nothing to pay upfront. It is an open loan: pay it down or pay it off whenever you want, with no penalty and no lien on your home.",
  /** One line, for the closure notice — where every extra sentence costs a scroll. */
  shortBody: "The build is financed in full. Nothing upfront, and no penalty to pay it off early.",
  ctaLabel: "See my monthly payment",
  /** Short version for tight spaces. */
  subLabel: "No upfront cost — on approved credit.",
} as const;

/**
 * Copy for the intake form and the buttons that lead to it, once a city's grant
 * has closed.
 *
 * The form itself is not the problem — it is a good lead capture and the people
 * filling it in are real prospects who want a basement. The problem was that it
 * still asked them to apply for a grant that no longer accepts applications, and
 * three buttons labelled "Check If I Qualify" walked them into it past the
 * closure notice. So the form stays and the promise changes: it now qualifies
 * the reader for the financing offer in `BASEMENT_FINANCING_OFFER`, which is
 * open, and every button that scrolls to it says so.
 *
 * Kept beside the closure so the page, the buttons and the form cannot drift
 * into telling a homeowner three different things. If Hamilton reopens, pass
 * `variant="grant"` again and the original wording comes back.
 */
export const CLOSED_PROGRAM_INTAKE = {
  /** Replaces "Check If I Qualify" on a closed program's page. */
  ctaLabel: "See What My Build Would Cost",
  /** Replaces the calculator's "Get My Exact Eligibility". */
  calculatorCtaLabel: "See My Monthly Payment Estimate",
  heading: "See What Your Basement Build Would Cost a Month",
  subheading:
    "The grant is closed, but the build is not. Answer a few quick questions and we'll come back with what your project would cost financed.",
  bullets: [
    "Based on your home and project details",
    "The build is financed in full — nothing upfront",
    "No obligation",
  ],
  submitLabel: "Send My Details",
  formNote: "Quick project review — takes about 30 seconds",
  /**
   * What the reader is told after submitting. It must not name a grant amount:
   * the old copy promised "up to $40,000" to people applying for a closed
   * program.
   */
  confirmation:
    "Thanks — your details are in. A specialist from OntarioReno will call you shortly to go over the build and what it would cost a month, based on the availability you gave us.",
} as const;
