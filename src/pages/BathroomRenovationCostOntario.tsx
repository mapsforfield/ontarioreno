import { Link } from 'react-router-dom';
import { ArrowRight, Phone } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { ServiceSchema } from '../components/StructuredData';
import { BookConsultationBand } from '../components/BookConsultationCta';
import { BATHROOM_COST_TABS, BATHROOM_ROWS } from '../data/projects/costContent';
import { PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_HREF } from '../lib/contact';

/**
 * /bathroom-renovation-cost-ontario
 *
 * Search Console (Aug–Nov 2026) showed ~1,000 impressions a quarter for
 * "bathroom renovation cost", "shower renovation cost", "vanity renovation
 * cost", "bathtub renovation cost" — and the site had no page for them; the
 * figures only existed inside a drawer on /bathroom-renovations.
 *
 * NO NEW FIGURES. Every number here is BATHROOM_ROWS / BATHROOM_COST_TABS from
 * data/projects/costContent.tsx — the office-approved copy that the drawer on
 * /bathroom-renovations also renders. Change a number there and it changes
 * here. The shower/vanity/tub sections only point at the rows that make up
 * that work; they do not add totals of their own.
 */

const row = (label: string) => BATHROOM_ROWS.find(([l]) => l === label)?.[1] ?? '';

const PARTS = [
  {
    id: 'shower',
    heading: 'Shower renovation cost',
    body: 'A shower is where a bathroom budget is decided. Most of the cost sits behind the tile: the waterproofing membrane and shower prep, then the tile itself, then the glass.',
    lines: ['Waterproofing & shower prep', 'Tile supply & installation', 'Glass / shower enclosure'],
  },
  {
    id: 'vanity',
    heading: 'Vanity renovation cost',
    body: 'Swapping a vanity in the same spot is one of the lighter jobs in a bathroom. It grows once the counter changes material, the sink moves, or the lighting above it is redone.',
    lines: ['Vanity & countertop', 'Electrical & lighting'],
  },
  {
    id: 'bathtub',
    heading: 'Bathtub and fixture cost',
    body: 'Replacing a tub with a tub keeps the drain where it is. Converting a tub to a walk-in shower usually means moving the drain and redoing the waterproofing, which is a plumbing change.',
    lines: ['Toilet, tub, shower fixtures', 'Plumbing changes'],
  },
];

export default function BathroomRenovationCostOntario() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PageMeta
        path="/bathroom-renovation-cost-ontario"
        title="Bathroom Renovation Cost in Ontario (2026) | OntarioReno"
        description="What a bathroom renovation costs in Ontario: line-by-line ranges for tile, waterproofing, showers, vanities, tubs and plumbing, and what moves the price."
      />

      <ServiceSchema
        name="Bathroom renovation in Ontario"
        serviceType="Bathroom renovation"
        path="/bathroom-renovation-cost-ontario"
        description="Bathroom renovations across Ontario: showers, tile, vanities, tubs and full rebuilds, priced in the home with a free consultation."
      />

      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">2026 cost guide</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-5xl">
            Bathroom Renovation Cost in Ontario
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Bathroom renovations in Ontario usually range from $15,000 to $40,000+, with many projects falling
            between $20,000 and $30,000. A refresh that keeps the layout costs less; moving plumbing and redoing
            the waterproofing costs more. Here is where the money goes.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/consultation/bathroom"
              className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-900"
            >
              Get your bathroom priced in person <ArrowRight className="h-5 w-5" />
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
          {BATHROOM_COST_TABS.map((t) => (
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
            Shower, vanity and tub costs
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
          <p className="mt-8 text-sm text-slate-600">
            Want to see finished bathrooms first?{' '}
            <Link to="/bathroom-renovations" className="font-semibold text-[#2b5a96] underline underline-offset-4">
              Browse our bathroom renovations
            </Link>
            .
          </p>
        </div>
      </section>

      <BookConsultationBand
        slug="bathroom"
        heading="Get your bathroom priced properly, in person"
        body="A consultant measures the room, walks the layout and condition with you, and puts a real number on the project — with monthly financing from about $99 if you want it."
      />
    </div>
  );
}
