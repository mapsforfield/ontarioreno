import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Home,
  Landmark,
  MapPinned,
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

function BulletList({ items }: { items: string[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item} className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <p className="text-slate-700">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default function GardenSuitesLanewaySuitesOntario() {
  const processSteps = [
    'Feasibility',
    'Design',
    'Permits',
    'Approval',
    'Build',
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>
          Garden Suites & Laneway Homes in Ontario (2026 Guide) | OntarioReno
        </title>
        <meta
          name="description"
          content="Learn what a garden suite Ontario project or laneway suite Ontario build really costs in 2026. Understand permits, eligibility, timelines, and real garden suite cost Ontario expectations."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/garden-suites-laneway-suites-ontario"
        />
      </Helmet>

      <section className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-300">
              <Home className="h-4 w-4" />
              Ontario housing guide
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              Garden Suites &amp; Laneway Homes in Ontario
              <span className="block text-slate-300">(2026 Complete Guide)</span>
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Understand what a <strong>garden suite Ontario</strong> project or
              <strong> laneway suite Ontario</strong> build really involves,
              including costs, permits, eligibility, servicing, and the biggest
              mistakes homeowners make before they start.
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
                to="/garden-suite-cost-ontario"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20"
              >
                Get a Cost Estimate
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <SectionHeading
                title="Garden Suite vs Laneway Suite"
                description="These terms get mixed together constantly, but they are not the same thing. The site conditions and approval path can be very different across Ontario municipalities."
              />

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    Garden suite
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    A detached backyard dwelling built on the same lot as the
                    main house. No laneway is required, but zoning, setbacks,
                    utility servicing, and access still matter. If you are still
                    pricing options, start with our{' '}
                    <Link
                      to="/garden-suite-cost-ontario"
                      className="font-semibold underline underline-offset-4"
                    >
                      garden suite cost Ontario
                    </Link>{' '}
                    guide.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                  <h3 className="text-xl font-bold text-slate-900">
                    Laneway suite
                  </h3>
                  <p className="mt-3 leading-7 text-slate-600">
                    A detached secondary unit that must directly face a public
                    laneway. If the property does not have laneway access, it is
                    not a laneway suite. In places like Toronto, laneway suites
                    often face stricter conditions around access, servicing, and
                    fire separation, so review the{' '}
                    <Link
                      to="/laneway-suite-permits-ontario"
                      className="font-semibold underline underline-offset-4"
                    >
                      permit requirements
                    </Link>{' '}
                    early.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-slate-300 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-sm">
              <div className="flex h-full min-h-[320px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-center">
                <MapPinned className="h-10 w-10 text-slate-400" />
                <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Diagram space
                </p>
                <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                  Reserved for a future visual showing backyard access,
                  laneway-facing lots, and the difference in site conditions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <SectionHeading
                title="Can You Build One?"
                description="Ontario has become more permissive, but that does not mean every lot is automatically workable. Feasibility still comes down to the property and to how your municipality applies zoning and servicing rules."
              />
              <div className="mt-8">
                <BulletList
                  items={[
                    'Ontario rules can allow up to 3 residential units on many serviced lots, including the main home plus additional units.',
                    'Zoning still matters for setbacks, lot coverage, height, rear-yard conditions, and where a detached unit can actually sit.',
                    'Servicing is a major filter. Water, sewer, and hydro capacity often decide whether a garden suite or laneway suite is realistic.',
                  ]}
                />
              </div>

              <Link
                to="/match"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
              >
                Check If Your Property Qualifies
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                What qualifies fastest
              </h3>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="font-semibold text-slate-900">
                    Better candidate lots
                  </p>
                  <p className="mt-2 leading-7 text-slate-600">
                    Larger urban lots with clear backyard access, straightforward
                    servicing, and fewer variance triggers.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    Harder candidate lots
                  </p>
                  <p className="mt-2 leading-7 text-slate-600">
                    Tight sites, difficult grading, limited utility capacity,
                    awkward access, or properties needing multiple planning
                    exceptions.
                  </p>
                </div>
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm leading-7 text-slate-700">
                    If you are still comparing detached options against a{' '}
                    <Link
                      to="/legal-suites"
                      className="font-semibold underline underline-offset-4"
                    >
                      legal secondary suite
                    </Link>
                    , feasibility usually comes down to site constraints and
                    total budget, not just unit count. For approval details,
                    review the broader{' '}
                    <Link
                      to="/garden-suite-permits-ontario"
                      className="font-semibold underline underline-offset-4"
                    >
                      Ontario permit path
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Does It Cost?"
            description="Detached accessory units are not small-budget projects anymore. The approval path is only one part of the equation."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Garden suite Ontario
              </p>
              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                $250K - $400K+
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                Most detached backyard units land here once site servicing,
                design, permits, foundation work, and actual construction are
                included. For a deeper breakdown, see the full{' '}
                <Link
                  to="/garden-suite-cost-ontario"
                  className="font-semibold underline underline-offset-4"
                >
                  garden suite cost Ontario
                </Link>{' '}
                page.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                Laneway suite Ontario
              </p>
              <h3 className="mt-3 text-3xl font-bold text-slate-900">
                $350K - $750K+
              </h3>
              <p className="mt-4 leading-7 text-slate-600">
                A true laneway build can run materially higher because of urban
                complexity, access constraints, service upgrades, and tighter
                construction conditions. If you want lane-specific pricing,
                compare our{' '}
                <Link
                  to="/laneway-suite-cost-ontario"
                  className="font-semibold underline underline-offset-4"
                >
                  laneway suite cost guide
                </Link>
                .
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {['Utilities', 'Access', 'Foundation', 'Custom vs prefab'].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5">
            <p className="text-lg font-bold text-amber-900">
              Most homeowners underestimate costs by 30-50%
            </p>
            <p className="mt-2 text-sm leading-6 text-amber-800">
              The gap usually comes from servicing, soft costs, site prep,
              permit drawings, and the difference between early concept pricing
              and real build-ready scope. If you need a broader pricing baseline,
              start with our{' '}
              <Link
                to="/costs"
                className="font-semibold underline underline-offset-4"
              >
                Ontario renovation cost guides
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Process"
            description="Most good projects move through the same stages, even when the design and municipal review details differ."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-5">
            {processSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{step}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <SectionHeading
              title="Grants, Exemptions & Loan Support"
              description="Development charge exemptions are one of the most meaningful incentives in this category, but the exact savings depend on the municipality and project type."
            />
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <Landmark className="h-7 w-7 text-blue-600" />
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  Development charge exemptions
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  Many Ontario municipalities are exempting or reducing
                  development charges for qualifying additional residential units,
                  but the rules, timing, and categories vary by municipality.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
                <FileText className="h-7 w-7 text-blue-600" />
                <h3 className="mt-4 text-xl font-bold text-slate-900">
                  Government-backed financing
                </h3>
                <p className="mt-3 leading-7 text-slate-600">
                  Government-backed financing and housing supply programs are now
                  part of the conversation for many accessory dwelling projects,
                  especially where municipalities are actively encouraging new
                  rental supply.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Use Cases"
            description="The best project type usually depends on why you are building it in the first place."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-bold text-slate-900">Rental income</h3>
              <p className="mt-3 leading-7 text-slate-600">
                A detached unit can create a separate rental stream where zoning
                and servicing support it.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-bold text-slate-900">Family living</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Useful for aging parents, adult children, caregivers, or a
                flexible multi-generational setup.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <h3 className="text-xl font-bold text-slate-900">
                Property value increase
              </h3>
              <p className="mt-3 leading-7 text-slate-600">
                Detached housing additions can improve long-term utility and
                resale appeal when executed properly.
              </p>
            </div>
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
                  Timeline
                </h2>
                <p className="mt-3 text-lg leading-8 text-slate-600">
                  A realistic detached suite timeline is usually{' '}
                  <strong>8-14 months total</strong> once feasibility,
                  municipal review, servicing coordination, and construction are
                  included.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Common Reasons Garden Suite Projects Get More Expensive"
            description="The biggest jumps usually come from site realities that are easy to miss in early planning."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {[
              'Utility trenching distance',
              'Backyard access limitations',
              'Permit revisions / zoning variances',
              'Site conditions (grading, soil)',
              'Upgrades during construction',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                  <p className="font-medium text-slate-800">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-900 bg-slate-900 p-8 text-white shadow-xl">
            <h2 className="text-3xl font-bold tracking-[-0.03em] md:text-4xl">
              Why $150K Expectations Usually Fall Apart
            </h2>
            <p className="mt-5 max-w-4xl text-lg leading-8 text-slate-300">
              Detached backyard housing now carries real planning costs,
              servicing complexity, consultant fees, foundation work, utility
              coordination, code compliance, and full construction pricing. The
              headline number people hear early rarely includes the hidden costs
              that make the project real.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
              Detached suite projects succeed when the property, budget, and
              approval path are aligned from the start.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              If you are weighing a backyard unit against a basement
              conversion, OntarioReno can help you compare scope, pricing, and
              next steps before you commit.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                to="/match"
                className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 text-lg font-bold text-white transition hover:bg-slate-800"
              >
                Get Started
              </Link>
              <Link
                to="/garden-suite-cost-ontario"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-8 py-4 text-lg font-semibold text-slate-900 transition hover:bg-white"
              >
                Get a Cost Estimate
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


