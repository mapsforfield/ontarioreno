import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Home,
  MapPinned,
  ShieldCheck,
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

export default function GardenSuitePermitsOntario() {
  const municipalityReviewItems = [
    {
      title: 'Zoning',
      body: 'Whether a detached secondary unit is allowed on the lot and how the municipality applies local garden suite zoning Ontario rules.',
    },
    {
      title: 'Setbacks',
      body: 'How close the proposed building can sit to rear, side, and sometimes front lot lines.',
    },
    {
      title: 'Lot coverage',
      body: 'How much of the property can be occupied by buildings, hard surfaces, and accessory structures.',
    },
    {
      title: 'Building height',
      body: 'Maximum height limits, roof form constraints, and how massing affects neighbouring properties.',
    },
    {
      title: 'Separation distances',
      body: 'Clearances from the main house, lot lines, and in some cases other structures or easements.',
    },
    {
      title: 'Servicing and drainage',
      body: 'Water, sewer, hydro, grading, stormwater handling, and whether the site can support another residential unit.',
    },
    {
      title: 'Access',
      body: 'Whether construction access, occupant access, and emergency access are workable for the proposed suite.',
    },
  ];

  const permitNeeds = [
    {
      title: 'Survey or site information',
      body: 'A clear site plan or survey showing lot dimensions, existing buildings, and where the garden suite is proposed.',
    },
    {
      title: 'Architectural drawings',
      body: 'Floor plans, elevations, building sections, and other permit drawings showing what is actually being built.',
    },
    {
      title: 'Zoning review',
      body: 'A review to confirm the project fits local zoning rules or to identify where planning relief may be needed.',
    },
    {
      title: 'Structural details or engineering',
      body: 'Engineering is often required depending on the foundation type, framing, spans, or unusual site conditions.',
    },
    {
      title: 'Servicing plan',
      body: 'A practical plan for water, sewer, hydro, grading, and sometimes drainage or utility trenching.',
    },
    {
      title: 'Permit application documents',
      body: 'The full package usually includes forms, drawings, site information, and supporting documents required by the municipality.',
    },
  ];

  const delayItems = [
    'Lot too tight for setbacks, separation distance, or usable building footprint',
    'Setback conflicts that force redesign or planning relief',
    'Servicing challenges tied to water, sewer, or hydro routing',
    'Incomplete drawings that trigger repeated resubmissions',
    'Drainage issues that create grading or engineering complications',
    'Variance requirements that slow the timeline before permit issuance',
  ];

  const permitSteps = [
    'Feasibility review',
    'Design and drawings',
    'Zoning / planning review',
    'Permit submission',
    'Approval and construction',
  ];

  const faqs = [
    {
      question: 'Can I build a garden suite without a permit?',
      answer:
        'No, not in any normal living-space scenario. A detached garden suite intended as a dwelling unit almost always requires permits and municipal review.',
    },
    {
      question: 'Do I need zoning approval first?',
      answer:
        'You need to know the zoning position early. In many cases, zoning review happens before or alongside permit preparation so major conflicts are caught before submission.',
    },
    {
      question: 'How long does approval take?',
      answer:
        'It depends on the municipality, the quality of drawings, and whether planning issues arise. Straightforward files move faster than projects with servicing or zoning problems.',
    },
    {
      question: 'What if my lot does not comply?',
      answer:
        'The project may need redesign, a smaller footprint, or planning relief such as a variance. Not every lot is a practical candidate.',
    },
    {
      question: 'Are permits different for prefab garden suites?',
      answer:
        'Prefab does not remove the permit path. The municipality still reviews zoning, siting, servicing, and building-code compliance for the actual property.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Garden Suite Permits Ontario (2026 Rules + Approval Guide)</title>
        <meta
          name="description"
          content="Understand garden suite permits in Ontario, including zoning, approvals, drawings, timelines, and common reasons projects get delayed."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/garden-suite-permits-ontario"
        />
      </Helmet>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-300">
              <Home className="h-4 w-4" />
              Ontario permit guide
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              Garden Suite Permits in Ontario
              <span className="block text-slate-300">(2026 Guide)</span>
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              A garden suite is a fully regulated residential structure that requires proper approvals, drawings, servicing, and code compliance before construction begins.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500"
              >
                Check My Property
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/garden-suite-cost-ontario"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
              >
                View Garden Suite Costs
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-white p-3">
                <ShieldCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="max-w-4xl">
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  Do You Need a Permit for a Garden Suite in Ontario?
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  Yes. In almost all cases, a detached garden suite requires a
                  building permit and must comply with zoning, building code,
                  fire safety, servicing, and municipal review. If you are
                  still comparing unit types, start with our{' '}
                  <Link
                    to="/garden-suites-laneway-suites-ontario"
                    className="font-semibold underline underline-offset-4"
                  >
                    garden suites and laneway homes guide
                  </Link>{' '}
                  before moving into drawings or submissions.
                </p>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  Permit requirements are also one of the reasons real garden suite projects often land in the $250K-$400K+ range. Approvals, servicing, and compliance are a core part of the total project, not an optional add-on.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Municipalities Review for Garden Suite Permits"
            description="A backyard suite permit Ontario review is really a full-property review. Municipalities are checking whether the lot, the servicing, and the building all work together as a real additional dwelling unit."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {municipalityReviewItems.map((item) => (
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

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <p className="text-sm leading-7 text-slate-700">
              Rules vary by municipality across Ontario. The province has opened
              the door for more additional residential units, but each city or
              town still applies local site standards, review practices, and
              garden suite zoning Ontario interpretation differently.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What You Typically Need"
            description="Most delayed projects are not delayed because the idea is impossible. They are delayed because the submission package is incomplete or the property constraints were not understood early."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {permitNeeds.map((item) => (
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
            title="What Commonly Delays Approval"
            description="Garden suite permits Ontario files usually slow down for the same reasons over and over again."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {delayItems.map((item) => (
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
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="Ontario Rules vs Local Municipal Rules"
                description="Ontario now allows additional residential units more broadly, but municipalities still control local zoning, site standards, and permit approvals."
              />
              <p className="mt-8 leading-8 text-slate-600">
                Province-wide direction supports more housing options, but local
                municipalities still interpret and apply zoning, setbacks, site
                standards, servicing review, and permit requirements on the
                ground. That is why a property that looks workable in one city
                can become more complicated somewhere else.
              </p>
              <p className="mt-5 leading-8 text-slate-600">
                Toronto rules are also not identical to other Ontario cities.
                A detached backyard suite permit Ontario pathway still depends
                on the local municipality, the lot, and the practical servicing
                constraints attached to that property. If you want the broader
                planning context first, start with our{' '}
                <Link
                  to="/garden-suites-laneway-suites-ontario"
                  className="font-semibold underline underline-offset-4"
                >
                  garden suites and laneway homes overview
                </Link>
                .
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-sm">
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-center">
                <MapPinned className="h-10 w-10 text-slate-400" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Review context
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Municipal interpretation, site constraints, and servicing are
                  often what separate quick approvals from drawn-out revisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Typical Garden Suite Permit Process"
            description="The cleanest approvals usually follow a predictable sequence, starting with feasibility before anyone gets too far into design."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {permitSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">
                  {step}
                </h3>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">
              If you are at the early stage, it usually makes more sense to
              check feasibility before chasing detailed pricing. If cost is your
              next question, see our{' '}
              <Link
                to="/garden-suite-cost-ontario"
                className="font-semibold underline underline-offset-4"
              >
                garden suite cost Ontario guide
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently Asked Questions"
            description="Short answers to the questions homeowners ask most often before moving into permit drawings."
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
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
              Garden suite projects go smoother when feasibility is checked
              before design assumptions harden into expensive mistakes.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              OntarioReno helps homeowners simplify the early decision-making,
              understand the likely permit path, and get connected with the
              right contractor if the property makes sense.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-lg font-bold text-white transition hover:bg-slate-800"
              >
                Check My Property
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
