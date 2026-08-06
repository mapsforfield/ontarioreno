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
  city: "Hamilton",
  reason:
    "The City of Hamilton has confirmed the program reached its allocated funding capacity, and the application portal is now closed to new submissions.",
  sourceUrl:
    "https://www.hamilton.ca/build-invest-grow/housing-secretariat/housing-accelerator-fund/additional-dwelling-unit-and-multi",
  confirmedOn: "August 6, 2026",
};
