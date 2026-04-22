import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  FileText,
  Home,
  Landmark,
  Scale,
} from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

const lastUpdated = 'April 2026';

const summaryItems = [
  {
    label: 'Attached / interior ARUs',
    value: 'Up to $70,000',
    detail:
      'For new affordable rental interior or attached units, including garage conversions.',
  },
  {
    label: 'Detached ARUs',
    value: 'Up to $95,000',
    detail:
      'For new detached affordable rental units such as backyard suites or detached garden suites.',
  },
  {
    label: 'Affordability period',
    value: '10 years',
    detail:
      "Rents must stay at or below the City's affordable rent thresholds for the full agreement term.",
  },
  {
    label: 'Annual compliance',
    value: 'Required',
    detail:
      'Owners must verify the unit remains compliant with the affordability rules each year.',
  },
];

const unitTypes = [
  {
    title: 'Basement apartments',
    body:
      'Interior basement units may fit the Burlington basement apartment incentive path if the property, zoning, permits, and affordability terms all line up.',
  },
  {
    title: 'Attached additions',
    body:
      'Main-house additions or attached conversions may qualify when they create a new affordable rental ARU permitted by Burlington rules.',
  },
  {
    title: 'Garage conversions',
    body:
      'Garage conversions are specifically referenced within the attached / interior funding category and should be evaluated against Burlington ARU rules first.',
  },
  {
    title: 'Detached ARUs',
    body:
      'Detached backyard suites, detached garden suites, and similar structures fall into the higher detached funding band when they meet program requirements.',
  },
];

const rentThresholds = [
  { unitType: 'Bachelor', maxRent: '$1,464' },
  { unitType: '1-bedroom', maxRent: '$1,733' },
  { unitType: '2-bedroom', maxRent: '$2,008' },
  { unitType: '3+ bedrooms', maxRent: '$2,330' },
];

const eligibleCosts = [
  'Construction labour and materials directly tied to building the ARU',
  'Building and fire code upgrades such as HVAC, plumbing, electrical, egress, and insulation',
  'Accessibility improvements that help make the design barrier-free',
  'Permanent finishes such as drywall, paint, permanent lighting, flooring, countertops, and cabinetry up to 25% of total eligible cost',
  'Professional services such as engineering, architecture, or planning up to 15% of total eligible cost',
  'Detached modular or prefabricated units, including purchase, installation, and foundation, up to 100% of eligible cost excluding appliances',
];

const ineligibleCosts = [
  'Land acquisition or land-related costs',
  'Household appliances',
  'Financing costs or borrowing costs',
  'Work completed before a Letter of Intent with conditional approval',
];

const loanTerms = [
  'No interest is charged during the agreement period.',
  "The loan agreement must be registered on title at the owner's expense.",
  'Annual reporting is required to verify continued affordability compliance.',
  'If the property is sold before the term ends, or the agreement is breached, repayment may be required in part or in full.',
];

const broaderSupportItems = [
  "Municipal fee waivers referenced on the City's ARU incentive page",
  'A one-time grant of up to $15,000 to legalize an existing non-compliant ARU',
  'Broader CIP-based affordable rental housing incentives that may be implemented in phases depending on funding and City resources',
];

const relatedGuides = [
  {
    title: 'Burlington legal basement guide',
    body:
      'See how Burlington legal basement planning connects zoning, permits, second-unit requirements, and project scope.',
    href: '/legal-basement-burlington',
  },
  {
    title: 'Burlington permit guide',
    body:
      'Understand permit expectations before treating zoning approval and incentive eligibility as the same question.',
    href: '/basement-permit-burlington',
  },
  {
    title: 'Ontario legal suites overview',
    body:
      'Compare legal secondary suite planning across Ontario and see how municipal requirements can differ from one city to another.',
    href: '/legal-suites',
  },
  {
    title: 'Ontario garden suite guide',
    body:
      'Explore detached ARU, backyard suite, and garden suite considerations when comparing Burlington with other Ontario property models.',
    href: '/garden-suites-laneway-suites-ontario',
  },
];

const bestFitItems = [
  'Homeowners planning to hold the property long-term',
  'Owners comfortable with capped affordable rents instead of maximum market rents',
  'Projects where upfront funding support materially improves feasibility',
  'Owners building a long-term rental strategy rather than a short flip',
];

const notIdealItems = [
  'Owners who want full rental pricing flexibility immediately',
  'Short-term investors or flippers',
  'Homeowners who may want to sell soon',
  'Projects that only make sense at unrestricted market rent',
];

const processSteps = [
  {
    step: '01',
    title: 'Confirm zoning and ARU feasibility',
    detail:
      'Start with Burlington zoning, ARU feasibility, and the practical fit of the property before assuming the incentive will apply.',
  },
  {
    step: '02',
    title: 'Prepare the application requirements',
    detail:
      'The City required a valid ARU zoning clearance certificate for the 2025 intake, and future intakes may have similar documentation requirements.',
  },
  {
    step: '03',
    title: 'Receive a Letter of Intent',
    detail:
      'Eligible costs are tied to City review and conditional approval. Costs incurred before that point may not qualify.',
  },
  {
    step: '04',
    title: 'Incur eligible costs and build the unit',
    detail:
      'Once the file is conditionally approved, the project can move through permit, construction, inspections, and occupancy with the program terms in mind.',
  },
  {
    step: '05',
    title: 'Rent within affordability limits',
    detail:
      'The ARU must be rented within the program affordability thresholds, and the 10-year agreement period begins once the unit is occupied under the program rules.',
  },
  {
    step: '06',
    title: 'Maintain compliance annually',
    detail:
      'Annual verification continues through the loan term. If the conditions are maintained for the full term, the forgivable loan may be forgiven.',
  },
];

const faqs = [
  {
    question: 'Is the Burlington ARU Incentive Program currently open?',
    answer:
      'The 2025 forgivable-loan intake closed on October 1, 2025 at 4:30 p.m. Future incentives or updates may be introduced by the City, so homeowners should verify the latest availability directly with Burlington before planning around funding.',
  },
  {
    question: 'Is the Burlington ARU Incentive Program a grant or a loan?',
    answer:
      "For new affordable rental units, the best-known Burlington ARU funding stream was structured as a no-interest forgivable loan under Burlington's Affordable Rental Housing Community Improvement Plan. If the affordability conditions are maintained for the full 10-year term, the loan may be forgiven.",
  },
  {
    question: 'Does Burlington offer any other ARU-related incentives?',
    answer:
      "The City's broader ARU and CIP materials also reference municipal fee waivers, a one-time grant to legalize an existing non-compliant ARU, and broader affordable rental housing incentive tools that may be implemented over time depending on funding and program phase. Homeowners should confirm current availability directly with the City.",
  },
  {
    question: 'Is there a grant to legalize an existing ARU in Burlington?',
    answer:
      "Burlington's ARU incentive materials reference a one-time grant of up to $15,000 to legalize an existing non-compliant ARU. That should not be read as a guarantee of current availability. Homeowners should verify whether that incentive is being offered in the current program cycle.",
  },
  {
    question: 'Can Burlington homeowners still add an ARU even if the 2025 incentive intake is closed?',
    answer:
      'Yes, funding availability and zoning / building permission are different questions. Burlington materials indicate ARUs may be supported for up to three additional residential units on qualifying urban residential properties, subject to zoning, servicing, and building code requirements. A property may still be eligible to add an ARU even if a specific funding intake is closed.',
  },
];

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-lg leading-8 text-slate-600">{description}</p>
      )}
    </div>
  );
}

export default function BurlingtonAruIncentiveProgram() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>
          Burlington ARU Incentive Program | Up to $70K-$95K for Affordable Rental Units
        </title>
        <meta
          name="description"
          content="Learn how the Burlington ARU Incentive Program works, including funding amounts, affordability rules, rent limits, eligible costs, and key requirements for basement apartments, garage conversions, and detached units."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/burlington-aru-incentive-program"
        />
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <section className="bg-slate-900 text-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-center lg:px-8 lg:py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/15 px-4 py-2 text-sm font-medium text-blue-200 ring-1 ring-white/10">
              <Landmark className="h-4 w-4" />
              Burlington ARU incentive guide
            </div>

            <h1 className="mt-6 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              Burlington ARU Incentive Program
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Up to $70,000 to $95,000 may be available for affordable rental
              additional residential units in Burlington, but the best-known
              funding stream was structured as a no-interest forgivable loan
              tied to 10 years of affordability compliance.
            </p>

            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-400">
              This page explains the Burlington ARU incentive program in plain
              language for homeowners comparing a Burlington basement apartment
              incentive, Burlington garage conversion incentive, or Burlington
              garden suite incentive path. It is not City advice, and final
              approval remains subject to City review and program terms.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-1 h-5 w-5 shrink-0 text-blue-200" />
                <p className="text-sm leading-7 text-slate-200">
                  The 2025 forgivable-loan intake closed on October 1, 2025.
                  Future incentives or updates may be introduced by the City,
                  and homeowners should verify the latest program availability
                  directly with Burlington before making assumptions about
                  funding.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Check Property Eligibility
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/legal-basement-burlington"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                See Burlington legal basement guide
              </Link>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.28)] backdrop-blur-sm">
            <div className="rounded-[1.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(15,23,42,0.4)_100%)] p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                What homeowners miss
              </p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.03em] text-white">
                This is funding support with a long-term rent commitment.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                Burlington&apos;s ARU forgivable loan can be meaningful, but it
                is not a simple Burlington basement grant with no restrictions.
                The tradeoff is upfront funding support now in exchange for
                capped affordable rents over a 10-year term.
              </p>
              <div className="mt-6 grid gap-3">
                {[
                  'No interest',
                  'Annual verification',
                  'Title registration',
                  'Repayment risk if terms are broken',
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <SectionHeading
            title="Quick program summary"
            description="This Burlington additional residential unit program is best understood as a funding-and-compliance tradeoff. The financial support can be meaningful, but only if the long-term rental model still works for you."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {summaryItems.map((item) => (
              <div
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p className="mt-3 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  {item.value}
                </p>
                <p className="mt-3 leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="What this program actually is"
                description="This is the part of Burlington's ARU incentive program that homeowners usually mean when they ask about the Burlington forgivable loan ARU or Burlington basement grant. It is not a simple rebate and it is not free money with no conditions."
              />
              <p className="mt-8 text-lg leading-8 text-slate-600">
                Burlington states that the forgivable loan may be available to
                homeowners, non-profits, and businesses that are registered or
                assessed owners of residential properties, subject to City
                approval and program requirements.
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The forgivable-loan portion of the program falls under
                Burlington&apos;s Affordable Rental Housing Community
                Improvement Plan. If approved, the City may fund eligible ARU
                costs through a no-interest loan. If the unit stays affordable
                and compliant for the full 10-year term, that loan may be
                forgiven.
              </p>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                The important tradeoff is straightforward: funding support now
                in exchange for capped rents, annual verification, and a
                longer-term compliance commitment. That structure works for some
                owners and filters out others quickly.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-amber-600">
                <CircleAlert className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-slate-900">
                Why the structure matters
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Burlington affordable rental ARU funding can help make a
                project feasible, but homeowners should evaluate the rent cap
                first, not last. If your project only works at unrestricted
                market rent, this program may not be the right fit even if the
                funding amount looks attractive upfront.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-[#1B3C6C]" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Policy and zoning support
                </h2>
              </div>
              <p className="mt-4 leading-8 text-slate-600">
                Burlington's materials indicate ARUs may be supported for up to
                three additional residential units on qualifying properties
                within Burlington's urban boundary, subject to zoning,
                servicing, and building code requirements.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                This is separate from funding availability. A property may be
                permitted to add ARUs even when a specific financial intake is
                closed.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[#1B3C6C]" />
                <h2 className="text-2xl font-bold text-slate-900">
                  Funding availability is a separate question
                </h2>
              </div>
              <p className="mt-4 leading-8 text-slate-700">
                Burlington's Affordable Rental Housing Community Improvement
                Plan is a broader framework with multiple incentive tools. The
                City may implement different incentives over time depending on
                available funding and resources.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Burlington has also stated that new affordable rental housing
                incentive programs or updates for 2026 will be introduced on
                its Housing Connections Centre webpage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Eligible unit types"
            description="The Burlington ARU incentive program is tied to additional residential units, not just one project format. Homeowners commonly look at basement apartments, garage conversions, and detached backyard units."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {unitTypes.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Home className="h-6 w-6 text-[#1B3C6C]" />
                  <h3 className="text-xl font-bold text-slate-900">
                    {item.title}
                  </h3>
                </div>
                <p className="mt-4 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 max-w-4xl text-lg leading-8 text-slate-600">
            If you are comparing formats first, review our{' '}
            <Link
              to="/garden-suites-laneway-suites-ontario"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              garden suite and backyard suite guide
            </Link>{' '}
            and the{' '}
            <Link
              to="/legal-basement-burlington"
              className="font-semibold text-slate-900 underline underline-offset-4"
            >
              Burlington legal basement guide
            </Link>{' '}
            before assuming the incentive alone should drive the decision.
          </p>
        </div>
      </section>
      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Funding breakdown"
            description="The headline number changes depending on whether the unit is interior or attached versus detached, but both categories still sit inside the same affordability-based forgivable-loan structure."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="text-2xl font-bold text-slate-900">
                  Interior or attached ARUs
                </h3>
              </div>
              <p className="mt-4 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                Up to $70,000
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                This band covers new interior or attached affordable rental
                units, including Burlington garage conversion incentive
                scenarios where the unit fits the City's ARU rules and
                affordability conditions.
              </p>
              <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-slate-700">
                This is still a no-interest forgivable loan, not an unrestricted
                grant. The 10-year affordability requirement remains central to
                the program.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <Landmark className="h-6 w-6 text-[#1B3C6C]" />
                <h3 className="text-2xl font-bold text-slate-900">
                  Detached ARUs
                </h3>
              </div>
              <p className="mt-4 text-4xl font-bold tracking-[-0.03em] text-slate-900">
                Up to $95,000
              </p>
              <p className="mt-4 leading-8 text-slate-600">
                Detached affordable rental units, including Burlington detached
                ARU incentive scenarios such as backyard suites or detached
                garden suites, fall into the higher funding category.
              </p>
              <p className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm leading-7 text-slate-700">
                The higher cap does not remove the affordability obligation. The
                rent cap, annual verification, and repayment risk still apply.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Rent and affordability requirements"
            description="These are maximum program rents used for affordability compliance. They are not marketing benchmarks, and homeowners should expect the City's thresholds to be updated periodically."
          />

          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <BadgeDollarSign className="h-5 w-5 text-blue-200" />
                <h3 className="text-xl font-bold">2025 maximum program rents</h3>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Rents must remain at or below these thresholds for the full
                10-year loan agreement period to preserve compliance.
              </p>
            </div>

            <div className="divide-y divide-slate-200">
              {rentThresholds.map((item) => (
                <div
                  key={item.unitType}
                  className="grid gap-2 px-6 py-5 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <p className="text-base font-semibold text-slate-900">
                    {item.unitType}
                  </p>
                  <p className="text-2xl font-bold tracking-[-0.03em] text-slate-900">
                    {item.maxRent}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">
              Burlington's page states that the City uses these maximum rents
              for program compliance and that thresholds may be updated
              periodically. Homeowners should confirm the current rent limits
              directly with the City if a future intake opens.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Eligible vs. ineligible costs"
            description="The City ties the Burlington additional residential unit program to eligible project costs directly associated with constructing the unit. This is another reason homeowners should understand the rules before budgeting too casually."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                <h3 className="text-2xl font-bold text-slate-900">
                  Eligible costs
                </h3>
              </div>
              <ul className="mt-6 space-y-4">
                {eligibleCosts.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <CircleAlert className="h-6 w-6 text-rose-600" />
                <h3 className="text-2xl font-bold text-slate-900">
                  Ineligible costs
                </h3>
              </div>
              <ul className="mt-6 space-y-4">
                {ineligibleCosts.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Loan terms and repayment risk"
            description="This is the section homeowners should understand before they get emotionally attached to the funding amount. The Burlington forgivable loan ARU structure only works when the compliance terms still fit your long-term plan."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="space-y-5">
                {loanTerms.map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <FileCheck2 className="mt-1 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <p className="text-lg leading-8 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                The practical risk
              </h3>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                If you think there is a real chance you will sell the property,
                need unrestricted rents, or prefer not to carry annual
                compliance obligations, this structure may be less attractive
                than it first appears.
              </p>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                That does not make it a bad program. It simply means the program
                is designed for a specific kind of owner and a specific rental
                strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="Who this program is best for"
                description="These owners usually understand the Burlington ARU incentive program fastest because the rent cap and long-term structure already fit what they want."
              />
              <div className="mt-8 space-y-4">
                {bestFitItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="Who this program may not be ideal for"
                description="The funding headline can pull in weak leads. In reality, the Burlington basement grant style search intent often includes homeowners who may not like the actual compliance structure once they see it clearly."
              />
              <div className="mt-8 space-y-4">
                {notIdealItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Application and process overview"
            description="Intake windows, deadlines, and available funding are controlled by the City. The 2025 intake closed on October 1, 2025 at 4:30 p.m., and homeowners should confirm whether a future intake is open before planning around this program."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {processSteps.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
                  Step {item.step}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">
              Burlington's 2025 intake required a valid ARU zoning clearance
              certificate to apply. Program terms may change in future rounds,
              and homeowners should verify the current intake status directly
              with the City of Burlington before relying on this program in a
              project pro forma.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Other ARU support in Burlington"
            description="While the best-known 2025 forgivable-loan intake closed, Burlington still supports ARU creation through a broader policy and incentive framework."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-lg leading-8 text-slate-600">
                The City's broader housing framework also references other
                support mechanisms beyond the closed 2025 forgivable-loan
                intake. Depending on funding availability and program phase,
                previous and related incentive streams have included:
              </p>
              <div className="mt-6 space-y-4">
                {broaderSupportItems.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <p className="leading-7 text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-blue-200 bg-blue-50 p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                What to verify directly with the City
              </h3>
              <p className="mt-4 text-lg leading-8 text-slate-700">
                Availability of specific financial incentives can change by
                intake period, program year, and available funding. Homeowners
                should confirm current intake status and available incentives
                directly with the City of Burlington rather than assuming that a
                previously described program stream is open.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-700">
                Burlington has stated that new affordable rental housing
                incentive programs or updates for 2026 will be introduced on
                its Housing Connections Centre webpage.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently asked questions"
            description="These are the questions that usually determine whether the Burlington ARU incentive program is actually a fit, not just an interesting headline."
          />

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {faq.question}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Exploring other ARU opportunities in Ontario"
            description="Burlington's 2025 intake closed, but ARU research does not end there. Homeowners often compare funding models, zoning rules, and project economics across municipalities before deciding what kind of unit still makes sense."
          />

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-lg leading-8 text-slate-600">
              OntarioReno also provides related guides on basement apartments,
              legal secondary suites, detached ARUs, and city-specific permit or
              incentive frameworks so homeowners can compare Burlington with
              broader Ontario ARU opportunities without assuming every city uses
              the same funding structure.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {relatedGuides.map((guide) => (
              <Link
                key={guide.href}
                to={guide.href}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
              >
                <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-[#1B3C6C]">
                  {guide.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{guide.body}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
                  Explore guide
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white pb-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-10">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  Important note
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  OntarioReno is an independent private platform. We are not the
                  City of Burlington and we do not administer this program.
                  Funding, deadlines, rent thresholds, eligibility, and program
                  terms may change. Final approval is determined by the City of
                  Burlington and the applicable program requirements.
                </p>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Homeowners should verify current intake status directly with
                  the{' '}
                  <a
                    href="https://www.burlington.ca/en/building-and-renovating/additional-residential-unit-incentive-program.aspx"
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-slate-900 underline underline-offset-4"
                  >
                    City's ARU incentive page
                  </a>{' '}
                  and review Burlington's broader ARU rules, permits,
                  affordability requirements, and Housing Connections Centre
                  updates before making financial assumptions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-12 shadow-[0_24px_70px_rgba(2,6,23,0.28)]">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
              Next step
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.03em] md:text-5xl">
              Check whether your Burlington property makes sense before
              budgeting around the incentive.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
              If you are comparing a Burlington basement apartment incentive,
              Burlington garage conversion incentive, or Burlington detached ARU
              incentive path, the smartest first move is usually to confirm the
              property fit, not to assume the funding solves everything.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
              >
                Book an Assessment
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/basement-permit-burlington"
                className={cn(buttonStyles.ghostDark, 'w-full sm:w-auto')}
              >
                See Burlington permit guide
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
