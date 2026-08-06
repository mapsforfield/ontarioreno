import { AlertTriangle, ArrowRight } from "lucide-react";

// Shown at the top of a city page whose incentive program has stopped taking
// applications. Deliberately one shared component rather than copy pasted into
// each page: when a program reopens or another one closes, this is the single
// place to change, and every page stays consistent in the meantime.
//
// It replaces the booking CTA rather than sitting beside it. A homeowner who
// books an in-home visit expecting a grant that no longer exists costs them a
// wasted appointment and costs us the trust — so the page routes them to the
// programs that are still open instead.

type Props = {
  /** Program name as the city calls it. */
  program: string;
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
  city,
  reason = "The program has reached its allocated funding capacity and the application portal is closed to new submissions.",
  sourceUrl,
  confirmedOn,
}: Props) {
  return (
    <section className="bg-amber-50" aria-labelledby="program-closed-heading">
      <div className="mx-auto max-w-5xl px-6 py-6 md:px-8 md:py-8">
        <div className="rounded-2xl border-2 border-amber-300 bg-white p-5 shadow-sm md:p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-6 w-6 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div className="min-w-0">
              <h2
                id="program-closed-heading"
                className="text-lg font-extrabold leading-snug text-slate-900 md:text-xl"
              >
                {program} is closed to new applications
              </h2>

              <p className="mt-2 text-base leading-7 text-slate-700">{reason}</p>

              <p className="mt-2 text-base leading-7 text-slate-700">
                Applications submitted before it closed are still being reviewed by
                the City of {city}. The guidance below is kept up for reference and
                for anyone with an application already in.
              </p>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a
                  href="/grants"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1B3C6C] px-6 py-3.5 text-base font-extrabold text-white transition hover:bg-[#153158]"
                >
                  See Ontario grants that are still open
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </a>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Confirm on the City of {city} site
                </a>
              </div>

              <p className="mt-3 text-sm font-semibold text-slate-500">
                Closure confirmed {confirmedOn}. Programs do reopen — we re-check the
                official page daily and will update this notice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
