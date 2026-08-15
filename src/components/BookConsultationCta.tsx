import { Link } from 'react-router-dom';
import { ArrowRight, CalendarCheck, CheckCircle2 } from 'lucide-react';

/**
 * The booking call-to-action for the renovation guide pages.
 *
 * These pages are where organic search lands. They are long, they answer the
 * question the visitor arrived with, and until now the only thing they offered
 * at the end of that answer was `/match` — a project review, not a booked
 * appointment. A reader who finishes the cost guide convinced is the single
 * best-qualified visitor the site gets, and there was nothing on the page that
 * turned that into a consultation.
 *
 * So this is ADDED alongside the existing project-review CTAs, never in place
 * of them. Both paths stay live on every page that had one.
 *
 * `slug` picks which of the three consultation flows the page belongs to —
 * basement, bathroom or kitchen. It is the caller's call rather than derived
 * from the URL, because two different pages (the basement guide and the legal
 * suites guide) both lead to the basement flow.
 */
export type ConsultationSlug = 'basement' | 'bathroom' | 'kitchen' | 'garden-suite';

/** Per-page accent, so the band sits inside the page's own palette. */
type Accent = 'blue' | 'emerald';

const ACCENT: Record<Accent, { band: string; button: string; check: string; eyebrow: string }> = {
  blue: {
    band: 'from-[#12305c] to-[#1B3C6C]',
    button: 'bg-white text-[#1B3C6C] hover:bg-blue-50',
    check: 'text-blue-300',
    eyebrow: 'text-blue-200',
  },
  emerald: {
    band: 'from-[#064e3b] to-[#065f46]',
    button: 'bg-white text-emerald-800 hover:bg-emerald-50',
    check: 'text-emerald-300',
    eyebrow: 'text-emerald-200',
  },
};

/**
 * Full-width band, placed at the end of the guide content.
 *
 * Deliberately states what the visit IS and what it costs before asking for
 * it — a homeowner who has just read that their project runs $30,000 needs to
 * know the next step is free and carries no obligation, or the button reads as
 * the start of a sales process rather than the end of their research.
 */
export function BookConsultationBand({
  slug,
  accent = 'blue',
  heading,
  body,
  ctaLabel = 'Book a free in-home consultation',
}: {
  slug: ConsultationSlug;
  accent?: Accent;
  heading: string;
  body: string;
  ctaLabel?: string;
}) {
  const a = ACCENT[accent];
  return (
    <section className={`bg-gradient-to-br ${a.band} py-14`}>
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <p className={`mb-3 text-xs font-bold uppercase tracking-[0.18em] ${a.eyebrow}`}>
          Next step
        </p>
        <h2 className="text-3xl font-bold leading-tight text-white md:text-4xl">{heading}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/80">{body}</p>

        <Link
          to={`/consultation/${slug}`}
          className={`mt-8 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-lg font-bold shadow-lg transition-all ${a.button}`}
        >
          <CalendarCheck className="h-5 w-5" />
          {ctaLabel}
          <ArrowRight className="h-5 w-5" />
        </Link>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/75">
          {['100% free', 'No obligation to hire', 'About 45 minutes'].map((point) => (
            <span key={point} className="inline-flex items-center gap-1.5">
              <CheckCircle2 className={`h-4 w-4 ${a.check}`} />
              {point}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Sidebar button, for the "Ready to get quotes?" cards.
 *
 * Rendered ABOVE the existing project-review link on those cards: the booking
 * is the action worth the top slot on a page whose reader has already decided
 * they want the work done. The project review stays exactly where it was,
 * directly beneath.
 */
export function BookConsultationButton({
  slug,
  accent = 'blue',
  label = 'Book a free in-home consultation',
}: {
  slug: ConsultationSlug;
  accent?: Accent;
  label?: string;
}) {
  const filled =
    accent === 'emerald'
      ? 'bg-emerald-600 hover:bg-emerald-500'
      : 'bg-[#1B3C6C] hover:bg-[#16325a]';
  return (
    <Link
      to={`/consultation/${slug}`}
      className={`mb-3 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-4 text-center font-bold text-white transition-colors ${filled}`}
    >
      <CalendarCheck className="h-4 w-4 shrink-0" />
      {label}
    </Link>
  );
}
