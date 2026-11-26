import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

// Catch-all for any URL the app does not know. Before this existed an unknown
// URL rendered a blank white page with no header, no footer and no way back —
// including the old WordPress addresses Google still shows. This keeps the
// visitor on the site and one tap from booking.

const PATHS = [
  { to: '/basements', label: 'Basement renovations' },
  { to: '/legal-suites', label: 'Legal basement suites' },
  { to: '/bathroom-renovations', label: 'Bathroom renovations' },
  { to: '/kitchen-renovations', label: 'Kitchen renovations' },
  { to: '/costs', label: 'Renovation cost guides' },
  { to: '/grants', label: 'Ontario renovation grants' },
  { to: '/cities', label: 'Find your city' },
  { to: '/financing', label: 'Financing options' },
];

export default function NotFound() {
  return (
    <section className="bg-slate-50">
      <Helmet>
        <title>Page not found | OntarioReno</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">Page not found</p>
        <h1 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
          That page has moved or no longer exists.
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Pick what you're planning below, or book a free consultation and we'll walk you through costs, permits and financing for your home.
        </p>
        <div className="mt-7">
          <Link to="/book" className={buttonStyles.primary}>
            Book a free consultation <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {PATHS.map((p) => (
            <li key={p.to}>
              <Link
                to={p.to}
                className="flex min-h-[52px] items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-900 shadow-sm transition hover:border-slate-300"
              >
                {p.label} <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
