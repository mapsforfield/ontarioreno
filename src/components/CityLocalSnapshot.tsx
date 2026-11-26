import { Link, useLocation } from 'react-router-dom';
import { ServiceSchema } from './StructuredData';
import { ArrowRight, CircleDollarSign, FileText, MapPin, Phone } from 'lucide-react';
import { PUBLIC_PHONE_DISPLAY, PUBLIC_PHONE_HREF } from '../lib/contact';

/**
 * A short, city-specific block for the basement city pages that rank on page
 * one-to-two in Google but earned almost no clicks (Search Console, Aug–Nov
 * 2026: "basement renovation hamilton" 1,292 impressions at position 8.9, zero
 * clicks; Burlington, Brampton, Ajax, Whitby the same story). The pages were
 * generic; this gives a visitor the three things they came for — what it
 * costs, whether it needs a permit, and whether we work in their area — in one
 * screen.
 *
 * WHAT IS ALLOWED IN HERE. Nothing invented:
 *   - cost ranges are the ones already published on that city's cost page
 *     (`/basement-renovation-cost-<city>`). Change them there and here together.
 *   - the permit lines restate what the site's own permit pages already say,
 *     plus the province-wide rule (Ontario's 2022 Bill 23) allowing up to three
 *     residential units on most serviced residential lots.
 *   - areas are EXAMPLES. The whole city is covered (owner, November 2026);
 *     the block says so above the names, so a neighbourhood left off the list
 *     never reads as one we do not serve.
 *   - no past job's price, ever (see data/projects/types.ts).
 */

type CityFacts = {
  city: string;
  /** What the municipality calls itself on its permits. */
  municipality: string;
  areas: string[];
  costPage: string;
  permitPage?: string;
  legalPage?: string;
};

export const CITY_FACTS: Record<string, CityFacts> = {
  hamilton: {
    city: 'Hamilton',
    municipality: 'City of Hamilton',
    areas: ['Hamilton Mountain', 'Stoney Creek', 'Ancaster', 'Dundas', 'Waterdown', 'Binbrook', 'Mount Hope', 'Glanbrook'],
    costPage: '/basement-renovation-cost-hamilton',
    permitPage: '/do-you-need-a-permit-for-a-basement-in-hamilton',
    legalPage: '/legal-suites',
  },
  burlington: {
    city: 'Burlington',
    municipality: 'City of Burlington',
    areas: ['Aldershot', 'Alton Village', 'Millcroft', 'Headon Forest', 'Brant Hills', 'Tyandaga', 'Orchard', 'Appleby'],
    costPage: '/basement-renovation-cost-burlington',
    permitPage: '/basement-permit-burlington',
    legalPage: '/legal-basement-burlington',
  },
  brampton: {
    city: 'Brampton',
    municipality: 'City of Brampton',
    areas: ['Springdale', 'Mount Pleasant', 'Castlemore', 'Credit Valley', 'Heart Lake', "Fletcher's Meadow", 'Bramalea', 'Sandringham-Wellington'],
    costPage: '/basement-renovation-cost-brampton',
    permitPage: '/basement-permit-brampton',
    legalPage: '/legal-basement-brampton',
  },
  ajax: {
    city: 'Ajax',
    municipality: 'Town of Ajax',
    areas: ['Pickering Village', 'South Ajax', 'Central Ajax', 'Northeast Ajax', 'Northwest Ajax'],
    costPage: '/basement-renovation-cost-ajax',
    permitPage: '/basement-permit-ajax',
    legalPage: '/legal-basement-ajax',
  },
  whitby: {
    city: 'Whitby',
    municipality: 'Town of Whitby',
    areas: ['Brooklin', 'Port Whitby', 'Downtown Whitby', 'Williamsburg', 'Rolling Acres', 'Taunton North', 'Blue Grass Meadows'],
    costPage: '/basement-renovation-cost-whitby',
    permitPage: '/basement-permit-whitby',
    legalPage: '/legal-basement-whitby',
  },
  mississauga: {
    city: 'Mississauga',
    municipality: 'City of Mississauga',
    areas: ['Port Credit', 'Streetsville', 'Meadowvale', 'Erin Mills', 'Clarkson', 'Churchill Meadows', 'Cooksville', 'Malton'],
    costPage: '/basement-renovation-cost-mississauga',
    permitPage: '/basement-permit-mississauga',
    legalPage: '/legal-basement-mississauga',
  },
  milton: {
    city: 'Milton',
    municipality: 'Town of Milton',
    areas: ['Old Milton', 'Dempsey', 'Beaty', 'Willmott', 'Ford', 'Harrison', 'Scott', 'Coates'],
    costPage: '/basement-renovation-cost-milton',
    permitPage: '/basement-permit-milton',
    legalPage: '/legal-basement-milton',
  },
  oshawa: {
    city: 'Oshawa',
    municipality: 'City of Oshawa',
    areas: ['Northglen', 'Taunton', 'Kedron', 'Windfields', 'Eastdale', 'Donevan', 'Samac', 'Centennial'],
    costPage: '/basement-renovation-cost-oshawa',
    permitPage: '/basement-permit-oshawa',
    legalPage: '/legal-basement-oshawa',
  },
  pickering: {
    city: 'Pickering',
    municipality: 'City of Pickering',
    areas: ['Bay Ridges', 'Amberlea', 'Liverpool', 'Rougemount', 'Brock Ridge', 'Duffin Heights', 'Highbush', 'Dunbarton'],
    costPage: '/basement-renovation-cost-pickering',
    permitPage: '/basement-permit-pickering',
    legalPage: '/legal-basement-pickering',
  },
};

/** Published on every `/basement-renovation-cost-<city>` page; keep in step. */
const COST_BANDS = [
  { label: 'Basic basement finish', range: '$45K–$60K' },
  { label: 'Family basement with a bathroom', range: '$60K–$75K' },
  { label: 'Legal secondary suite', range: '$75K–$90K+' },
];

export function CityLocalSnapshot({ cityKey }: { cityKey: keyof typeof CITY_FACTS }) {
  const f = CITY_FACTS[cityKey];
  const { pathname } = useLocation();
  if (!f) return null;
  return (
    <>
    <ServiceSchema
      name={`Basement renovation in ${f.city}`}
      serviceType="Basement renovation"
      path={pathname}
      city={f.city}
      description={`Basement finishing, renovation and legal secondary suites in ${f.city}, Ontario, with ${f.municipality} permit guidance and a free in-home consultation.`}
    />
    <section className="border-b border-slate-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">{f.city} at a glance</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">
          Basement renovation in {f.city}: cost, permits and where we work
        </h2>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <CircleDollarSign className="h-5 w-5 text-[#1B3C6C]" /> Typical {f.city} budgets
            </div>
            <ul className="mt-4 space-y-3">
              {COST_BANDS.map((b) => (
                <li key={b.label} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-slate-600">{b.label}</span>
                  <span className="whitespace-nowrap font-bold text-slate-900">{b.range}</span>
                </li>
              ))}
            </ul>
            <Link to={f.costPage} className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#2b5a96]">
              Full {f.city} cost guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <FileText className="h-5 w-5 text-[#1B3C6C]" /> Permits in {f.city}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <li>
                Adding walls, plumbing, bedrooms or a second unit usually needs a {f.municipality} building permit and inspections.
              </li>
              <li>
                Ontario allows up to three residential units on most serviced residential lots, so a basement suite is often permitted as-of-right — it still has to meet the Building and Fire Codes.
              </li>
            </ul>
            <div className="mt-4 flex flex-col">
              {f.permitPage && (
                <Link to={f.permitPage} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#2b5a96]">
                  {f.city} permit guide <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              {f.legalPage && (
                <Link to={f.legalPage} className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[#2b5a96]">
                  Legal basement suites in {f.city} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <MapPin className="h-5 w-5 text-[#1B3C6C]" /> We cover all of {f.city}
            </div>
            {/* The names are examples, never the boundary: every part of the
                city is covered (owner, November 2026). The copy must never
                read as a list of the only places we go. */}
            <p className="mt-4 text-sm text-slate-600">Every neighbourhood, including:</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {f.areas.map((a) => (
                <li key={a} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700">{a}</li>
              ))}
              <li className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-sm text-slate-500">and the rest of {f.city}</li>
            </ul>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Link to="/consultation/basement" className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#2b5a96] px-4 py-2.5 text-sm font-semibold text-white">
                Book a free visit <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={PUBLIC_PHONE_HREF} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900">
                <Phone className="h-4 w-4" /> {PUBLIC_PHONE_DISPLAY}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
    </>
  );
}
