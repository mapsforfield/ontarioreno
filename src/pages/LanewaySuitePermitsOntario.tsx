import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
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

export default function LanewaySuitePermitsOntario() {
  const complexityItems = [
    {
      title: 'Urban lot constraints',
      body: 'Laneway sites are often tighter and less forgiving than typical detached backyard-suite lots.',
    },
    {
      title: 'Laneway access requirements',
      body: 'A property needs a real qualifying laneway condition, not just general rear access or a narrow service corridor.',
    },
    {
      title: 'Servicing complexity',
      body: 'Water, sewer, hydro, and utility routing are often harder in dense urban conditions than homeowners expect.',
    },
    {
      title: 'Emergency and fire access concerns',
      body: 'Fire review, exit conditions, and emergency access can add layers of scrutiny that do not show up in simpler detached projects.',
    },
    {
      title: 'Tight construction conditions',
      body: 'Limited access for labour, equipment, staging, and demolition can affect both permit planning and build strategy.',
    },
    {
      title: 'Municipality-specific interpretation',
      body: 'Laneway suite permits Ontario files are still shaped by how each municipality interprets and applies local standards.',
    },
  ];

  const municipalityReviewItems = [
    {
      title: 'Zoning',
      body: 'Whether a laneway suite is permitted on the property and how local laneway suite zoning Ontario rules are applied.',
    },
    {
      title: 'Setbacks',
      body: 'Clearances from lot lines and neighbouring structures still matter even when the lot already faces a laneway.',
    },
    {
      title: 'Lot coverage',
      body: 'Municipalities review how much of the site is occupied by buildings, hard surfaces, and new detached structures.',
    },
    {
      title: 'Building height',
      body: 'Height limits and massing controls can materially affect what kind of laneway suite is actually possible.',
    },
    {
      title: 'Separation distances',
      body: 'Distance from the main house, adjacent structures, and lot lines often shapes the entire layout.',
    },
    {
      title: 'Servicing and drainage',
      body: 'Water, sewer, hydro, grading, drainage, and site infrastructure are major parts of the review process.',
    },
    {
      title: 'Access and laneway conditions',
      body: 'The municipality will look closely at the actual laneway context, site approach, and whether the conditions support the proposed use.',
    },
  ];

  const permitNeeds = [
    {
      title: 'Survey or site information',
      body: 'A clear survey or site plan showing lot dimensions, existing buildings, and how the laneway suite sits on the property.',
    },
    {
      title: 'Architectural drawings',
      body: 'Floor plans, elevations, and sections are needed to show what is actually being built and how it fits the site.',
    },
    {
      title: 'Zoning review',
      body: 'A zoning review helps confirm whether the concept fits local rules or whether planning relief may be required.',
    },
    {
      title: 'Structural details or engineering',
      body: 'Engineering is often required depending on the structure, spans, foundation, and site-specific construction conditions.',
    },
    {
      title: 'Servicing plan',
      body: 'A realistic plan for water, sewer, hydro, grading, and drainage is often one of the most important parts of the submission.',
    },
    {
      title: 'Permit application documents',
      body: 'The submission package usually includes forms, drawings, site information, and any required supporting documents.',
    },
  ];

  const delayItems = [
    'No qualifying laneway condition',
    'Lot too tight',
    'Setback conflicts',
    'Servicing challenges',
    'Incomplete drawings',
    'Drainage issues',
    'Variance requirements',
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
      question: 'Can I build a laneway suite without a permit?',
      answer:
        'No, not in any normal living-space scenario. A laneway suite intended as a dwelling unit almost always requires permits and municipal review.',
    },
    {
      question: 'What makes a property qualify as a laneway site?',
      answer:
        'The property needs a real laneway condition that satisfies local rules. A house near the rear of a lot is not automatically a laneway-site candidate.',
    },
    {
      question: 'Are Toronto laneway permits harder?',
      answer:
        'They often are. A Toronto laneway suite permit can involve tighter site conditions, fire-access review, servicing complexity, and more layered urban constraints.',
    },
    {
      question: 'What if my lot does not comply?',
      answer:
        'The project may need redesign, a smaller footprint, or planning relief such as a variance. Some sites simply are not practical candidates.',
    },
    {
      question: 'Are prefab laneway suites easier to approve?',
      answer:
        'Not automatically. Prefab may change part of the construction approach, but it does not remove zoning, siting, servicing, or permit review requirements.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>Laneway Suite Permits in Ontario (2026 Guide) | OntarioReno</title>
        <meta
          name="description"
          content="Learn how laneway suite permits work in Ontario, including zoning, servicing, access, drawings, approvals, and why Toronto laneway projects often face more complex review. Updated for 2026."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/laneway-suite-permits-ontario"
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
              Laneway Suite Permits in Ontario
              <span className="block text-slate-300">(2026 Guide)</span>
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              A laneway suite is a real detached dwelling unit with added urban
              constraints, and it usually requires careful review of access,
              servicing, code compliance, and local municipal conditions before
              anything gets approved.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-4 text-lg font-bold text-white transition-all hover:bg-blue-500"
              >
                Check If Your Property Qualifies
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/laneway-suite-cost-ontario"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
              >
                See Laneway Suite Costs
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
                  Do You Need a Permit for a Laneway Suite in Ontario?
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-700">
                  Yes. In almost all real cases, a laneway suite intended for
                  living space requires permits and must comply with zoning,
                  building code, fire safety, servicing, and local municipal
                  review. If you are still comparing detached suite types more
                  broadly, start with our{' '}
                  <Link
                    to="/garden-suites-laneway-suites-ontario"
                    className="font-semibold underline underline-offset-4"
                  >
                    garden suites and laneway homes guide
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Why Laneway Suite Permits Are Often More Complex"
            description="Laneway suite permits Ontario files are usually more approval-sensitive than typical backyard builds because the site and access conditions are less forgiving from the start."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {complexityItems.map((item) => (
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
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Municipalities Review"
            description="A laneway house permit Toronto review or any other laneway suite zoning Ontario review is really a property-wide review, not just a building review."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {municipalityReviewItems.map((item) => (
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

          <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <p className="text-sm leading-7 text-slate-700">
              Rules vary by municipality across Ontario. The province has become
              more permissive around additional residential units, but local
              zoning, site standards, and review practices still shape what is
              actually possible.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What You Typically Need for a Laneway Suite Permit"
            description="Most delayed projects are not blocked because the idea is impossible. They are blocked because the submission package does not match the complexity of the site."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {permitNeeds.map((item) => (
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
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Commonly Delays Approval"
            description="The same issues show up repeatedly when a Toronto laneway suite permit or broader laneway suite permits Ontario file stalls."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {delayItems.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <SectionHeading
              title="Why Toronto Laneway Permits Need Special Attention"
              description="Toronto is one of the biggest sources of demand for laneway housing, but it is also one of the places where approval work becomes more complex than homeowners expect."
            />
            <p className="mt-8 leading-8 text-slate-600">
              Toronto laneway projects often involve tighter site conditions,
              more sensitive access rules, heavier fire review, and more complex
              servicing realities than a typical detached backyard-unit file.
              That is a major reason a{' '}
              <strong>Toronto laneway suite permit</strong> process can feel
              more demanding than homeowners expect at the concept stage.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="Ontario Rules vs Local Municipal Rules"
                description="Ontario has become more permissive around additional residential units, but municipalities still apply local zoning, site standards, and permit review differently."
              />
              <p className="mt-8 leading-8 text-slate-600">
                Province-wide direction matters, but municipalities still decide
                how local standards are applied in practice. That means a site
                that looks workable on paper can still run into local review
                issues tied to access, lot conditions, servicing, or planning
                interpretation.
              </p>
              <p className="mt-5 leading-8 text-slate-600">
                Toronto-style laneway conditions are not the same in every
                Ontario city. It also helps to compare the broader detached-unit
                permit context against our{' '}
                <Link
                  to="/garden-suite-permits-ontario"
                  className="font-semibold underline underline-offset-4"
                >
                  garden suite permits Ontario
                </Link>{' '}
                guide.
              </p>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-sm">
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-center">
                <MapPinned className="h-10 w-10 text-slate-400" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Review context
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Access, servicing, and urban site conditions are often what
                  separate a workable laneway file from a stalled one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Typical Laneway Suite Permit Process"
            description="The cleanest files usually start with feasibility before detailed design assumptions lock in the wrong direction."
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
              If pricing is still your bigger question, review our{' '}
              <Link
                to="/laneway-suite-cost-ontario"
                className="font-semibold underline underline-offset-4"
              >
                laneway suite cost Ontario
              </Link>{' '}
              guide before you move too far into drawings.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently Asked Questions"
            description="Short answers to the questions homeowners ask most often before they commit to the process."
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
              Laneway projects go smoother when feasibility is checked early and
              permit assumptions are pressure-tested before design moves too far.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              OntarioReno helps homeowners simplify the early decision-making
              and avoid wrong assumptions before the project becomes expensive
              to unwind.
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
