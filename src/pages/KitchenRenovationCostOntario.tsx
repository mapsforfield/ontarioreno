import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { ServiceSchema, type Faq } from '../components/StructuredData';
import { BookConsultationBand } from '../components/BookConsultationCta';
import { KITCHEN_COST_TABS, KITCHEN_ROWS } from '../data/projects/costContent';
import { PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_HREF } from '../lib/contact';

/**
 * /kitchen-renovation-cost-ontario
 *
 * Search Console (Aug–Nov 2026): kitchen searches showed the site only 358
 * times in three months — there was no kitchen cost page for Google to rank at
 * all; the figures lived inside a drawer on /kitchen-renovations.
 *
 * NO NEW FIGURES, same rule as the bathroom cost page: every number is
 * KITCHEN_ROWS / KITCHEN_COST_TABS from data/projects/costContent.tsx, the
 * office-approved copy the drawer also renders. The grouped sections only point
 * at the rows that make up that work; they add no totals of their own.
 */

const row = (label: string) => KITCHEN_ROWS.find(([l]) => l === label)?.[1] ?? '';

const PARTS = [
  {
    id: 'cabinets',
    heading: 'Cabinets and counters',
    body: 'Cabinetry is the largest single line in most kitchens. Refacing or painting what is there costs far less than all-new boxes; the counter material moves the number next.',
    lines: ['Cabinetry', 'Countertops', 'Backsplash'],
  },
  {
    id: 'layout',
    heading: 'Moving the layout',
    body: 'Keeping the sink, range and fridge where they are keeps plumbing and electrical work small. Moving them, or taking out a wall for an island, is where a kitchen budget grows.',
    lines: ['Plumbing', 'Electrical', 'Demolition & prep'],
  },
  {
    id: 'finishes',
    heading: 'Floors, appliances and finish',
    body: 'Appliances range more than anything else in the room. Flooring and painting are steadier, and depend mostly on how much of the space is being opened up.',
    lines: ['Appliances', 'Flooring', 'Painting & finishing'],
  },
];

const FAQS: Faq[] = [
  {
    question: 'How much does a kitchen renovation cost in Ontario?',
    answer:
      'Kitchen renovations in Ontario usually range from $30,000 to $70,000+, with many projects falling between $35,000 and $55,000. Where yours lands is settled in the home, with the room measured.',
  },
  {
    question: 'What is the most expensive part of a kitchen renovation?',
    answer:
      'Cabinetry is usually the largest line, followed by appliances and countertops. Moving plumbing or removing walls adds to the plumbing, electrical and demolition lines.',
  },
  {
    question: 'Can I finance a kitchen renovation?',
    answer:
      'Yes. Monthly plans start from about $199 a month, on approved credit, with nothing upfront. Your exact rate and payment are confirmed in writing before you sign anything.',
  },
];

export default function KitchenRenovationCostOntario() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageMeta
        path="/kitchen-renovation-cost-ontario"
        title="Kitchen Renovation Cost in Ontario (2026) | OntarioReno"
        description="What a kitchen renovation costs in Ontario: line-by-line ranges for cabinets, counters, appliances, plumbing and electrical, and what moves the price."
      />
      <ServiceSchema
        name="Kitchen renovation in Ontario"
        serviceType="Kitchen renovation"
        path="/kitchen-renovation-cost-ontario"
        description="Kitchen renovations across Ontario: cabinets, countertops, layout changes and full replacements, priced in the home with a free consultation."
        faqs={FAQS}
      />

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">2026 cost guide</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-5xl">
            Kitchen Renovation Cost in Ontario
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Kitchen renovations in Ontario usually range from $30,000 to $70,000+, with many projects falling
            between $35,000 and $55,000. Cabinets, the layout and appliances decide most of it. Here is where
            the money goes.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/consultation/kitchen"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900"
            >
              Get your kitchen priced in person <ArrowRight className="h-5 w-5" />
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

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {KITCHEN_COST_TABS.map((t) => (
            <article key={t.key} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">{t.label}</h2>
              <div className="mt-3">{t.body}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">
            Where a kitchen budget goes
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {PARTS.map((p) => (
              <article key={p.id} id={p.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-lg font-bold text-slate-900">{p.heading}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{p.body}</p>
                <dl className="mt-4 border-t border-slate-200">
                  {p.lines.map((l) => (
                    <div key={l} className="flex items-baseline justify-between gap-3 border-b border-slate-200 py-2.5">
                      <dt className="text-sm text-slate-700">{l}</dt>
                      <dd className="whitespace-nowrap text-sm font-semibold text-slate-900">{row(l)}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">Common questions</h2>
          <div className="mt-6 space-y-4">
            {FAQS.map((f) => (
              <details key={f.question} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <summary className="cursor-pointer font-semibold text-slate-900">{f.question}</summary>
                <p className="mt-3 text-sm leading-6 text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>

          <p className="mt-8 text-sm text-slate-600">
            Want to see finished kitchens first?{' '}
            <Link to="/kitchen-renovations" className="font-semibold text-[#2b5a96] underline underline-offset-4">
              Browse our kitchen renovations
            </Link>
            .
          </p>
        </div>
      </section>

      <BookConsultationBand
        slug="kitchen"
        heading="Get your kitchen priced properly, in person"
        body="A consultant measures the room, walks the layout with you, and puts a real number on the project — with monthly financing from about $199 if you want it."
      />
    </div>
  );
}
