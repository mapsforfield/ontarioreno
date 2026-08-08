import { AlertTriangle, ArrowRight } from "lucide-react";
import { BASEMENT_FINANCING_OFFER } from "../lib/programClosures";

// Shown at the top of a city page whose incentive program has stopped taking
// applications. Deliberately one shared component rather than copy pasted into
// each page: when a program reopens or another one closes, this is the single
// place to change, and every page stays consistent in the meantime.
//
// It replaces the closed program's booking CTA rather than sitting beside it. A
// homeowner who books an in-home visit expecting a grant that no longer exists
// costs them a wasted appointment and costs us the trust.
//
// What it offers instead is the basement financing consultation, not a grants
// index. Someone who came here for a $40,000 grant wanted a finished basement;
// "go look for another grant" hands them their own search back, while financing
// with no upfront cost is a live answer to the same want. The booking it links
// to is a real, open program — that is what makes it honest to offer here.
//
// SIZE IS A CORRECTNESS CONCERN HERE, not a matter of taste. This banner sits
// above the hero on a paid landing page, so every line it adds is a line the
// visitor must scroll past before seeing anything they came for. The earlier
// version ran five full paragraphs and pushed the live offer off a phone screen
// entirely — the reader got the bad news and none of the good. So:
//
//   • two short lines carry the closure, in the fewest words that are still true
//   • the offer and its one CTA are the only things with visual weight
//   • the full official wording, the "already applied" reassurance and the
//     re-check promise move into a disclosure — still one tap away, still on
//     the page, just not in front of someone who has not yet been told there is
//     a way forward
//
// Nothing was dropped. If you add a paragraph here, take one out.

type Props = {
  /** Program name as the city calls it. Shown in the expanded detail. */
  program: string;
  /** The same program in a few words, for the headline. */
  shortName: string;
  city: string;
  /** What the official page says, in plain words. Keep it factual. */
  reason?: string;
  /** Official source so a homeowner can confirm for themselves. */
  sourceUrl: string;
  /** Date we confirmed the closure, e.g. "August 6, 2026". */
  confirmedOn: string;
};

export default function ProgramClosedNotice({
  program,
  shortName,
  city,
  reason = "The program has reached its allocated funding capacity and the application portal is closed to new submissions.",
  sourceUrl,
  confirmedOn,
}: Props) {
  return (
    <section className="bg-amber-50" aria-labelledby="program-closed-heading">
      <div className="mx-auto max-w-5xl px-5 py-4 md:px-8 md:py-5">
        <div className="rounded-2xl border border-amber-300 bg-white px-4 py-4 shadow-sm md:px-6 md:py-5">
          {/* The closure — stated once, plainly, and then done. */}
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <h2
              id="program-closed-heading"
              className="text-base font-extrabold leading-snug text-slate-900 md:text-lg"
            >
              {shortName} is closed to new applications.
            </h2>
          </div>

          {/* The offer — the only part of this banner with any weight. */}
          <div className="mt-3.5 gap-4 rounded-xl bg-slate-50 p-4 md:flex md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-[0.98rem] font-extrabold leading-snug text-slate-900">
                {BASEMENT_FINANCING_OFFER.heading}
              </p>
              <p className="mt-1 text-[0.92rem] leading-6 text-slate-600">
                {BASEMENT_FINANCING_OFFER.shortBody}
              </p>
            </div>
            <a
              href={BASEMENT_FINANCING_OFFER.href}
              className="mt-3 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1B3C6C] px-5 py-3 text-[0.95rem] font-extrabold text-white transition hover:bg-[#153158] md:mt-0"
            >
              {BASEMENT_FINANCING_OFFER.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>

          {/* Everything a reader may want but nobody needs up front. */}
          <details className="group mt-3">
            <summary className="cursor-pointer list-none text-[0.82rem] font-bold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700">
              Why it closed, and what happens to applications already in
            </summary>
            <div className="mt-2.5 space-y-2 text-[0.9rem] leading-6 text-slate-600">
              <p>
                {program}: {reason}
              </p>
              <p>
                Applications submitted before it closed are still being reviewed by the
                City of {city}. The guidance on this page is kept up for reference and
                for anyone with an application already in.
              </p>
              <p className="text-[0.82rem] font-semibold text-slate-500">
                Confirmed {confirmedOn} on the{" "}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-slate-700"
                >
                  City of {city} program page
                </a>
                . Programs do reopen — we re-check it daily and will update this notice.
              </p>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
}
