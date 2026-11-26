import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Phone } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { ServiceSchema, type Faq } from '../components/StructuredData';
import { BookConsultationBand } from '../components/BookConsultationCta';
import { ProjectDossierCompact } from '../components/project/ProjectDossierCompact';
import { BATHROOM_ROWS } from '../data/projects/costContent';
import { BATHROOM_PROJECTS } from '../data/projects/bathroom';
import { PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_HREF } from '../lib/contact';

/**
 * /shower-renovation-ontario — showers and tub-to-shower conversions.
 *
 * Search Console (Aug–Nov 2026): "shower renovation" 269 impressions at
 * position 19, "shower remodel" 168 at 20.5, "shower renovation cost" 124 at
 * 12.6 — and no page on the site was about showers.
 *
 * Sourcing, as everywhere on the bathroom pages:
 *   - every figure is a BATHROOM_ROWS line (office-approved, data/projects/
 *     costContent.tsx); nothing is totalled or invented.
 *   - the timing is the office's own band for a standard three-piece tub or
 *     shower (8 to 12 days on site — see the header of data/projects/bathroom.ts).
 *   - the featured job is a real tub-to-walk-in conversion from BATHROOM_PROJECTS,
 *     with its scope read off its photographs and no price.
 */

const row = (label: string) => BATHROOM_ROWS.find(([l]) => l === label)?.[1] ?? '';

const SHOWER_LINES = ['Waterproofing & shower prep', 'Tile supply & installation', 'Glass / shower enclosure', 'Plumbing changes'];

const CONVERSION = BATHROOM_PROJECTS.find((p) => p.slug === 'bathroom-three-piece-walk-in');

const STEPS = [
  {
    title: 'Tear-out to the studs',
    body: 'The old tub or shower, its tile and the board behind it come out, so the wall and floor can be checked for water damage before anything new goes on.',
  },
  {
    title: 'Drain and valve',
    body: 'A tub-to-shower conversion usually moves or changes the drain, and the valve is set for the new head and handheld. This is the plumbing-change line.',
  },
  {
    title: 'Waterproofing',
    body: 'Walls and floor are sealed with a waterproofing membrane before any tile. It is invisible once the tile is up, and it is what decides whether the shower lasts.',
  },
  {
    title: 'Tile, niche and glass',
    body: 'Wall and floor tile, any recessed niche, then the glass panel or enclosure once the tile is set.',
  },
];

const FAQS: Faq[] = [
  {
    question: 'How much does a shower renovation cost in Ontario?',
    answer: `Most of a shower's cost is in four lines: waterproofing and shower prep (${row('Waterproofing & shower prep')}), tile supply and installation (${row('Tile supply & installation')}), glass (${row('Glass / shower enclosure')}) and any plumbing changes (${row('Plumbing changes')}). The full bathroom usually ranges from $15,000 to $40,000+.`,
  },
  {
    question: 'Can you convert a bathtub into a walk-in shower?',
    answer:
      'Yes. The tub comes out, the drain and valve are reworked for a shower, the walls and floor are waterproofed, then tiled and closed in with glass. The finished conversion on this page is one we did.',
  },
  {
    question: 'How long does a shower or tub-to-shower renovation take?',
    answer:
      'A standard three-piece bathroom with a tub or shower usually takes about 8 to 12 days on site. Larger ensuites take longer.',
  },
];

export default function ShowerRenovationOntario() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-50">
      <PageMeta
        path="/shower-renovation-ontario"
        title="Shower Renovation & Tub-to-Shower Ontario | OntarioReno"
        description="Shower renovations and tub-to-shower conversions in Ontario: what the work involves, what each part costs, how long it takes, and a real finished conversion."
      />
      <ServiceSchema
        name="Shower renovation and tub-to-shower conversion in Ontario"
        serviceType="Shower renovation"
        path="/shower-renovation-ontario"
        description="Shower renovations and bathtub-to-walk-in-shower conversions across Ontario, priced in the home with a free consultation."
        faqs={FAQS}
      />

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">Showers · Tub-to-shower</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-5xl">
            Shower Renovations &amp; Tub-to-Shower Conversions in Ontario
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            A new shower is mostly work you never see: the drain, the valve and the waterproofing behind the
            tile. Here is what is involved, what each part costs, and a real tub we turned into a walk-in shower.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/consultation/bathroom"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900"
            >
              Book a free in-home visit <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href={PUBLIC_PHONE_HREF}
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-semibold text-white"
            >
              <Phone className="h-5 w-5" /> {PUBLIC_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </section>

      {CONVERSION && (
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">A real conversion</p>
          <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">
            Tub out, walk-in shower in
          </h2>
          <div className="mt-6">
            <ProjectDossierCompact
              project={CONVERSION}
              index={0}
              eager
              onOpenCosts={() => navigate('/bathroom-renovation-cost-ontario')}
            />
          </div>
        </section>
      )}

      <section className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">What the work involves</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{s.body}</p>
              </li>
            ))}
          </ol>

          <h2 className="mt-14 text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">What a shower costs</h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            The lines that make up a shower, from our Ontario bathroom cost guide. The whole bathroom usually
            ranges from $15,000 to $40,000+; yours is priced in the home, with the room measured.
          </p>
          <dl className="mt-6 max-w-xl border-t border-slate-200">
            {SHOWER_LINES.map((l) => (
              <div key={l} className="flex items-baseline justify-between gap-3 border-b border-slate-200 py-3">
                <dt className="text-slate-700">{l}</dt>
                <dd className="whitespace-nowrap font-semibold text-slate-900">{row(l)}</dd>
              </div>
            ))}
          </dl>
          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> About 8 to 12 days on site for a standard three-piece tub or shower.</li>
            <li className="flex gap-2"><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /> Monthly financing from about $99 a month, on approved credit.</li>
          </ul>
          <Link to="/bathroom-renovation-cost-ontario" className="mt-6 inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-[#2b5a96]">
            Full bathroom cost breakdown <ArrowRight className="h-4 w-4" />
          </Link>

          <h2 className="mt-14 text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">Common questions</h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((f) => (
              <details key={f.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <summary className="cursor-pointer font-semibold text-slate-900">{f.question}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <BookConsultationBand
        slug="bathroom"
        heading="Get your shower priced properly, in person"
        body="A consultant looks at the room, the drain and the walls with you, and puts a real number on the project — with monthly financing from about $99 if you want it."
      />
    </div>
  );
}
