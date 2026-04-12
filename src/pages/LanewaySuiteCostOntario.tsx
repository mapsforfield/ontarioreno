import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Home,
  Landmark,
  Timer,
} from 'lucide-react';

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

export default function LanewaySuiteCostOntario() {
  const costBreakdownItems = [
    {
      title: 'Design and drawings',
      body: 'Laneway sites usually need detailed architectural work because the fit, massing, and servicing plan are more constrained than a typical detached backyard suite.',
    },
    {
      title: 'Permits and approvals',
      body: 'Municipal review, permit drawings, planning checks, and resubmissions all add time and soft cost before construction starts.',
    },
    {
      title: 'Site preparation',
      body: 'Urban access limitations, demolition, clearing, temporary protection, and staging are often harder in laneway settings.',
    },
    {
      title: 'Foundation and structural work',
      body: 'Foundation strategy, structural design, and tight access conditions can materially affect the cost of the shell.',
    },
    {
      title: 'Framing and exterior',
      body: 'The building envelope, roof design, insulation, cladding, and windows all need to work within a tighter site and code context.',
    },
    {
      title: 'Plumbing / electrical / HVAC',
      body: 'Separate utility planning, mechanical systems, fire requirements, and service coordination are major cost drivers.',
    },
    {
      title: 'Interior finishes',
      body: 'Even compact laneway units still need full living-space finishes, kitchens, bathrooms, flooring, trim, and fixtures.',
    },
    {
      title: 'Utility servicing and trenching',
      body: 'Water, sewer, hydro, and trenching are among the biggest reasons a laneway home cost Ontario figure jumps beyond early expectations.',
    },
    {
      title: 'Builder overhead and margin',
      body: 'Complex urban construction carries real management cost, scheduling risk, coordination time, and appropriate builder margin.',
    },
  ];

  const hiddenCosts = [
    'Difficult site access',
    'Servicing upgrades',
    'Engineering',
    'Drainage work',
    'Demolition / clearing',
    'Revisions during approval',
    'Mid-project upgrades',
  ];

  const rangeCards = [
    {
      title: 'Smaller / simpler projects',
      range: 'From around $350,000+',
      body: 'Usually smaller footprints with fewer design complications, but still carrying real urban servicing and approval costs.',
    },
    {
      title: 'Mid-range projects',
      range: 'Around $450,000–$600,000+',
      body: 'Where many serious laneway projects land once design, construction, utilities, approvals, and site complexity are fully accounted for.',
    },
    {
      title: 'Higher-end urban custom builds',
      range: '$600,000+',
      body: 'Custom architecture, difficult access, premium finishes, or heavier servicing and structural challenges can push budgets well beyond basic expectations.',
    },
  ];

  const faqs = [
    {
      question: 'Why are laneway suites so expensive?',
      answer:
        'Because they combine detached construction with difficult urban conditions, tighter access, servicing complexity, and a full approval path.',
    },
    {
      question: 'Is a laneway suite more expensive than a garden suite?',
      answer:
        'Often yes. Laneway builds frequently face tougher site logistics, servicing constraints, and urban construction complications that push total cost higher.',
    },
    {
      question: 'Does prefab make a laneway suite cheap?',
      answer:
        'Not usually. Prefab may change part of the build strategy, but it does not remove site work, servicing, approvals, access challenges, or municipal review.',
    },
    {
      question: 'Are Toronto laneway houses harder to build?',
      answer:
        'They often are. Toronto laneway projects can involve more constrained access, tighter site conditions, fire-access questions, and more expensive urban construction logistics.',
    },
    {
      question: 'Can I finance a laneway suite?',
      answer:
        'Many homeowners explore financing, but the right path depends on project scope, property position, and how realistic the full build budget is from the start.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>
          Laneway Suite Cost in Ontario (2026 Real Price Guide) | OntarioReno
        </title>
        <meta
          name="description"
          content="Learn the real cost of building a laneway suite in Ontario, including servicing, design, permits, site access, hidden costs, and why Toronto laneway homes often cost more. Updated for 2026."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/laneway-suite-cost-ontario"
        />
      </Helmet>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-300">
              <Home className="h-4 w-4" />
              Ontario pricing guide
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              Laneway Suite Cost in Ontario
              <span className="block text-slate-300">
                (2026 Real Price Guide)
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Laneway projects are among the most complex and expensive detached
              secondary-unit builds in the province. They combine urban site
              constraints, servicing challenges, approvals, and full residential
              construction pricing in one project.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500"
              >
                Get a Real Cost Estimate
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
              >
                Check If Your Property Qualifies
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 shadow-sm">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
              How Much Does a Laneway Suite Cost in Ontario?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Many laneway suite projects in Ontario fall around{' '}
              <strong>$350,000 to $750,000+</strong>. Urban conditions,
              constrained access, servicing complexity, and custom design
              requirements often push the real cost much higher than homeowners
              expect, especially when looking at{' '}
              <strong>laneway house cost Toronto</strong> comparisons.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Why Laneway Suites Often Cost More Than Garden Suites"
            description="Once homeowners compare detached unit types side by side, the pricing difference usually becomes easier to understand."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              {
                title: 'Urban site complexity',
                body: 'Laneway lots are often tighter, busier, and less forgiving than a more open backyard build.',
              },
              {
                title: 'Tighter construction access',
                body: 'Moving labour, materials, equipment, and waste through constrained urban access adds real cost.',
              },
              {
                title: 'Servicing challenges',
                body: 'Routing water, sewer, and hydro through an already built-up urban property is a major cost driver.',
              },
              {
                title: 'Fire and code considerations',
                body: 'Fire access, exits, code interpretation, and urban safety conditions can add complexity quickly.',
              },
              {
                title: 'Custom design constraints',
                body: 'Laneway homes often need more tailored design responses because the site leaves less room for standard solutions.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">
              If you are still comparing detached unit types broadly, our{' '}
              <Link
                to="/garden-suites-laneway-suites-ontario"
                className="font-semibold underline underline-offset-4"
              >
                garden suites and laneway homes guide
              </Link>{' '}
              is the best starting point before getting too attached to an early
              budget assumption.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Makes Up the Cost?"
            description="A realistic laneway suite cost Ontario number is built from many moving pieces, not just the shell or the finish package."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {costBreakdownItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="The Costs People Forget to Budget For"
            description="Most expensive surprises are not random. They usually come from the parts of the job that are easy to under-scope at the beginning."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {hiddenCosts.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="font-medium leading-7 text-slate-800">{item}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-lg font-bold text-amber-900">
              Old headline numbers often ignore the hardest parts of a real
              laneway build.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeading
              title="Why Toronto Laneway Projects Need Special Budget Expectations"
              description="Toronto is one of the biggest drivers of interest in laneway housing, but it is also one of the places where realistic pricing matters most."
            />
            <p className="mt-8 leading-8 text-slate-600">
              Toronto laneway projects often face tighter site constraints,
              heavier servicing complexity, more sensitive fire-access questions,
              and more difficult construction logistics than homeowners expect.
              That is a major reason why{' '}
              <strong>laneway house cost Toronto</strong> and{' '}
              <strong>laneway suite price Toronto</strong> searches regularly
              return figures that feel much higher than detached backyard-suite
              expectations in other settings.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Typical Laneway Suite Cost Ranges"
            description="These are not fixed price bands, but they are useful reality-check ranges for different project types."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {rangeCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {card.title}
                </h3>
                <p className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900">
                  {card.range}
                </p>
                <p className="mt-4 leading-7 text-slate-600">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-50 p-3">
                <Timer className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  How Long Does a Laneway Suite Project Take?
                </h2>
                <p className="mt-3 text-lg leading-8 text-slate-600">
                  Most projects move through feasibility, design and approvals,
                  then construction. In practice, total timelines often land
                  around <strong>8–14 months</strong> or longer depending on
                  municipal review, site complexity, and how difficult the build
                  is to execute.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently Asked Questions"
            description="Short answers to the questions homeowners usually ask before they commit to the idea."
          />

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {faq.question}
                </h3>
                <p className="mt-3 leading-7 text-slate-600">{faq.answer}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm leading-7 text-slate-700">
              If you are moving from pricing into approvals, the next logical
              step is understanding the permit path. Start with our{' '}
              <Link
                to="/laneway-suite-permits-ontario"
                className="font-semibold underline underline-offset-4"
              >
                laneway suite permits guide
              </Link>
              . If you are also comparing detached suite types more broadly,
              it helps to benchmark against the{' '}
              <Link
                to="/garden-suite-cost-ontario"
                className="font-semibold underline underline-offset-4"
              >
                garden suite cost Ontario
              </Link>{' '}
              page.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
              Laneway projects go wrong when the budget is built around early
              assumptions instead of real site and servicing conditions.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              If you want realistic pricing before design expectations or
              permit strategy get too far ahead, OntarioReno can help you
              pressure-test the project early.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-lg font-bold text-white transition hover:bg-slate-800"
              >
                Get My Estimate
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
