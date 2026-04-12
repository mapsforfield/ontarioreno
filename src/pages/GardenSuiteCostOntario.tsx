import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Home,
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

function getSuiteScaleImage(size: number) {
  if (size <= 550) {
    return '/images/suite-base-small.png';
  }

  if (size <= 750) {
    return '/images/suite-base-medium.png';
  }

  return '/images/suite-base-large.png';
}

export default function GardenSuiteCostOntario() {
  const [projectType, setProjectType] = useState<'Garden Suite' | 'Laneway Suite'>('Garden Suite');
  const [size, setSize] = useState(700);
  const [finishLevel, setFinishLevel] = useState<'Basic' | 'Mid-Range' | 'Higher-End'>('Mid-Range');
  const [accessDifficulty, setAccessDifficulty] = useState<'Easy access' | 'Moderate access' | 'Tight / difficult access'>('Moderate access');
  const [servicingComplexity, setServicingComplexity] = useState<'Straightforward / short run' | 'Moderate trenching / coordination' | 'Complex servicing / long run / upgrades likely'>('Moderate trenching / coordination');
  const [siteComplexity, setSiteComplexity] = useState<'Straightforward' | 'Some complexity' | 'Higher complexity'>('Some complexity');

  const costBreakdownItems = [
    {
      title: 'Design and drawings',
      body: 'Garden suite projects need real architectural work, site planning, and drawings that reflect the actual lot and servicing constraints.',
    },
    {
      title: 'Permits and approvals',
      body: 'Permit drawings, municipal review, and approval coordination are part of the real cost, not optional extras.',
    },
    {
      title: 'Site preparation',
      body: 'Backyard access, clearing, demolition, and site readiness often affect pricing more than homeowners expect at the concept stage.',
    },
    {
      title: 'Foundation',
      body: 'Foundation type, excavation, soil conditions, and structural requirements all materially affect budget.',
    },
    {
      title: 'Framing and exterior',
      body: 'The shell includes framing, roofing, insulation, cladding, windows, and the broader building envelope.',
    },
    {
      title: 'Plumbing / electrical / HVAC',
      body: 'Detached living space still needs real utility planning, mechanical systems, and code-compliant service work.',
    },
    {
      title: 'Interior finishes',
      body: 'Kitchens, bathrooms, flooring, trim, fixtures, and finish level can move the budget meaningfully.',
    },
    {
      title: 'Utility trenching and servicing',
      body: 'Water, sewer, hydro, and trenching are some of the biggest reasons a backyard home cost Ontario estimate climbs quickly.',
    },
    {
      title: 'Builder overhead and margin',
      body: 'Project management, scheduling, insurance, supervision, and builder margin are all part of the real price.',
    },
  ];

  const variationItems = [
    {
      title: 'Size',
      body: 'Larger suites naturally cost more, but even modest square footage still carries the full burden of detached construction and servicing.',
    },
    {
      title: 'Backyard access',
      body: 'Tight access can increase labour difficulty, staging complexity, and material handling cost.',
    },
    {
      title: 'Distance to services',
      body: 'The farther the unit is from water, sewer, and hydro connections, the more trenching and coordination may be required.',
    },
    {
      title: 'Site conditions',
      body: 'Grading, soil conditions, drainage, and awkward lot geometry can all push cost higher.',
    },
    {
      title: 'Finish level',
      body: 'A lean rental-oriented finish package prices differently than a highly customized long-term family-use build.',
    },
    {
      title: 'Custom vs prefab',
      body: 'Prefab can change part of the approach, but it does not eliminate site work, permits, servicing, or municipal review.',
    },
    {
      title: 'Municipality-specific approval complexity',
      body: 'Some municipalities are simply more demanding in how they review zoning, servicing, drainage, and detached secondary-unit feasibility.',
    },
  ];

  const hiddenCosts = [
    'Utility trenching',
    'Engineering',
    'Permit revisions',
    'Demolition / clearing',
    'Drainage or grading work',
    'Landscaping restoration',
    'Mid-project upgrade requests',
  ];

  const rangeCards = [
    {
      title: 'Smaller / simpler projects',
      range: 'From around $250,000+',
      body: 'Usually smaller detached units on more workable lots, but still carrying real servicing, permit, and construction costs.',
    },
    {
      title: 'Mid-range projects',
      range: 'Around $300,000–$400,000+',
      body: 'Where many serious garden suite projects land once design, servicing, construction, and approvals are priced properly.',
    },
    {
      title: 'Higher-end custom builds',
      range: '$400,000+',
      body: 'Custom architecture, harder access, premium finishes, or more difficult site conditions can push budgets well above entry-level expectations.',
    },
  ];

  const faqs = [
    {
      question: 'Does the price include permits?',
      answer:
        'Sometimes quotes include permit-related items and sometimes they do not. Homeowners should always confirm whether drawings, permit prep, and municipal fees are included or separate.',
    },
    {
      question: 'Are utility connections expensive?',
      answer:
        'They often are. Utility trenching and servicing are some of the most underestimated parts of a real garden suite budget.',
    },
    {
      question: 'Is prefab always cheaper?',
      answer:
        'Not always. Prefab can change the structure strategy, but it does not remove site work, servicing, approvals, access challenges, or finish costs.',
    },
    {
      question: 'Can I finance a garden suite?',
      answer:
        'Many homeowners explore financing, but the right approach depends on the full project budget, property position, and how realistic the scope is from the start.',
    },
    {
      question: 'Does a garden suite increase property value?',
      answer:
        'It can improve long-term utility and resale appeal, but the financial logic depends on the property, municipality, and whether the build is well planned.',
    },
  ];

  const calculatorResult = useMemo(() => {
    const sizeAdjustments = {
      'Garden Suite': {
        400: 0,
        500: 15000,
        600: 35000,
        700: 55000,
        800: 80000,
        900: 105000,
        1000: 135000,
      },
      'Laneway Suite': {
        400: 0,
        500: 20000,
        600: 45000,
        700: 70000,
        800: 100000,
        900: 130000,
        1000: 165000,
      },
    } as const;

    const baseCost = projectType === 'Garden Suite' ? 185000 : 260000;
    const sizeAdjustment = sizeAdjustments[projectType][size as 400 | 500 | 600 | 700 | 800 | 900 | 1000];
    const finishAdjustment =
      finishLevel === 'Basic' ? 0 : finishLevel === 'Mid-Range' ? 20000 : 45000;
    const accessAdjustment =
      accessDifficulty === 'Easy access'
        ? 0
        : accessDifficulty === 'Moderate access'
          ? 10000
          : 30000;
    const servicingAdjustment =
      servicingComplexity === 'Straightforward / short run'
        ? 5000
        : servicingComplexity === 'Moderate trenching / coordination'
          ? 25000
          : 50000;
    const siteComplexityAdjustment =
      siteComplexity === 'Straightforward'
        ? 0
        : siteComplexity === 'Some complexity'
          ? 10000
          : 30000;
    const softCosts = projectType === 'Garden Suite' ? 18000 : 25000;

    const total =
      baseCost +
      sizeAdjustment +
      accessAdjustment +
      servicingAdjustment +
      finishAdjustment +
      siteComplexityAdjustment +
      softCosts;

    const roundToNearestFiveThousand = (value: number) =>
      Math.round(value / 5000) * 5000;

    const lowEnd = roundToNearestFiveThousand(total * 0.94);
    const mostLikely = roundToNearestFiveThousand(total);
    const highEnd = roundToNearestFiveThousand(total * 1.09);

    const tags = [
      ...(projectType === 'Laneway Suite' ? ['Laneway conditions'] : ['Garden suite build']),
      ...(size >= 800 ? ['Larger footprint'] : []),
      ...(finishLevel === 'Mid-Range' ? ['Upgraded finishes'] : []),
      ...(finishLevel === 'Higher-End' ? ['Higher-end finishes'] : []),
      ...(accessDifficulty === 'Moderate access' ? ['Moderate access'] : []),
      ...(accessDifficulty === 'Tight / difficult access' ? ['Difficult access'] : []),
      ...(servicingComplexity === 'Moderate trenching / coordination' ? ['Moderate servicing'] : []),
      ...(servicingComplexity === 'Complex servicing / long run / upgrades likely' ? ['Complex servicing'] : []),
      ...(siteComplexity === 'Some complexity' ? ['Approval complexity'] : []),
      ...(siteComplexity === 'Higher complexity' ? ['Higher site complexity'] : []),
    ].slice(0, 4);

    return {
      lowEnd,
      mostLikely,
      highEnd,
      tags,
    };
  }, [accessDifficulty, finishLevel, projectType, servicingComplexity, siteComplexity, size]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0,
    }).format(value);

  const suiteScaleImage = getSuiteScaleImage(size);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>
          Garden Suite Cost in Ontario (2026 Real Price Guide) | OntarioReno
        </title>
        <meta
          name="description"
          content="Learn the real cost of building a garden suite in Ontario, including design, permits, servicing, construction, hidden costs, and what drives price. Updated for 2026."
        />
        <link
          rel="canonical"
          href="https://ontarioreno.ca/garden-suite-cost-ontario"
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
              Garden Suite Cost in Ontario
              <span className="block text-slate-300">
                (2026 Real Price Guide)
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-xl leading-8 text-slate-300">
              Most homeowners underestimate the real cost because detached
              backyard units involve much more than the structure itself. A
              proper <strong>garden suite cost Ontario</strong> number includes
              design, servicing, permits, site work, full construction, and the
              hidden items that rarely show up in early assumptions.
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
              How Much Does a Garden Suite Cost in Ontario?
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Many garden suite projects in Ontario fall around{' '}
              <strong>$250,000 to $400,000+</strong>. Simpler projects on easier
              lots can start closer to the <strong>low-$200Ks</strong>, but
              that is less common once a full project takes shape. Most
              homeowners who move forward with a full project fall closer to{' '}
              <strong>$260,000 to $350,000</strong>, while larger or more
              complex builds can go materially higher. That is one reason a
              realistic <strong>garden suite price Ontario</strong>{' '}
              conversation needs to be tied to the actual property, not just
              the unit size.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-8 shadow-[0_24px_70px_rgba(15,23,42,0.06)] md:p-10">
            <SectionHeading
              title="Interactive Garden Suite Cost Calculator"
              description="This is a ballpark planning tool, not a quote. Actual pricing depends on the lot, servicing, municipality, and design, but it helps homeowners understand what usually pushes an all-in Ontario project budget higher."
            />
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
              This tool reflects real-world all-in project ranges, not just
              construction pricing.
            </p>

            <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <label className="min-h-[2.75rem] text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Project type
                      </label>
                      <select
                        value={projectType}
                        onChange={(event) =>
                          setProjectType(event.target.value as 'Garden Suite' | 'Laneway Suite')
                        }
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                      >
                        <option>Garden Suite</option>
                        <option>Laneway Suite</option>
                      </select>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <div className="flex min-h-[2.75rem] items-start justify-between gap-4">
                        <label
                          htmlFor="garden-suite-size"
                          className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500"
                        >
                          Size
                        </label>
                        <span className="text-lg font-bold text-slate-900">
                          {size.toLocaleString()} sq ft
                        </span>
                      </div>
                      <input
                        id="garden-suite-size"
                        type="range"
                        min={400}
                        max={1000}
                        step={100}
                        value={size}
                        onChange={(event) => setSize(Number(event.target.value))}
                        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
                      />
                      <div className="mt-2 flex justify-between text-sm text-slate-500">
                        <span>400 sq ft</span>
                        <span>1000 sq ft</span>
                      </div>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <label className="min-h-[2.75rem] text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Finish level
                      </label>
                      <select
                        value={finishLevel}
                        onChange={(event) =>
                          setFinishLevel(event.target.value as 'Basic' | 'Mid-Range' | 'Higher-End')
                        }
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                      >
                        <option>Basic</option>
                        <option>Mid-Range</option>
                        <option>Higher-End</option>
                      </select>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <label className="min-h-[2.75rem] text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Backyard access
                      </label>
                      <select
                        value={accessDifficulty}
                        onChange={(event) =>
                          setAccessDifficulty(
                            event.target.value as
                              | 'Easy access'
                              | 'Moderate access'
                              | 'Tight / difficult access'
                          )
                        }
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                      >
                        <option>Easy access</option>
                        <option>Moderate access</option>
                        <option>Tight / difficult access</option>
                      </select>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <label className="min-h-[2.75rem] text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Servicing complexity
                      </label>
                      <select
                        value={servicingComplexity}
                        onChange={(event) =>
                          setServicingComplexity(
                            event.target.value as
                              | 'Straightforward / short run'
                              | 'Moderate trenching / coordination'
                              | 'Complex servicing / long run / upgrades likely'
                          )
                        }
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                      >
                        <option>Straightforward / short run</option>
                        <option>Moderate trenching / coordination</option>
                        <option>Complex servicing / long run / upgrades likely</option>
                      </select>
                    </div>

                    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                      <label className="min-h-[2.75rem] text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Site / approval complexity
                      </label>
                      <select
                        value={siteComplexity}
                        onChange={(event) =>
                          setSiteComplexity(
                            event.target.value as 'Straightforward' | 'Some complexity' | 'Higher complexity'
                          )
                        }
                        className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-100"
                      >
                        <option>Straightforward</option>
                        <option>Some complexity</option>
                        <option>Higher complexity</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Estimated Scale
                  </p>
                  <div className="mt-4 flex min-h-[260px] items-center justify-center rounded-xl border border-slate-200 bg-white p-6 md:min-h-[320px]">
                    <img
                      key={suiteScaleImage}
                      src={suiteScaleImage}
                      alt={`Estimated suite scale for ${size} square feet`}
                      className="w-full max-w-[28rem] object-contain transition-opacity duration-300"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-slate-900 p-6 text-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                  Estimated all-in project range
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                      Most likely
                    </p>
                    <h3 className="mt-2 text-4xl font-bold tracking-[-0.03em] text-white">
                      {formatCurrency(calculatorResult.mostLikely)}
                    </h3>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                        Low estimate
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {formatCurrency(calculatorResult.lowEnd)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                        High estimate
                      </p>
                      <p className="mt-2 text-2xl font-bold text-white">
                        {formatCurrency(calculatorResult.highEnd)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                    Main cost drivers
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {calculatorResult.tags.length > 0 ? (
                      calculatorResult.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-white"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-300">
                        Typical detached unit scope
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-200">
                    What this estimate includes
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      'Construction budget',
                      'Permit / design allowance',
                      'Servicing allowance',
                      'Site / approval complexity',
                    ].map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-medium text-white"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <p className="mt-6 text-sm leading-7 text-slate-300">
                  Most projects land between <strong>$250,000 and $400,000+</strong>,
                  and many full real-world projects fall closer to{' '}
                  <strong>$260,000 to $350,000</strong>. Some smaller or
                  simplified builds can start in the low-$200Ks, but that is
                  less common once full scope is accounted for.
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Lower contractor quotes are often build-only and may not
                  include permits, servicing, design, or site-related costs.
                  This tool reflects a fuller all-in planning range.
                </p>

                <div className="mt-8">
                  <Link
                    to="/match"
                    className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-base font-bold text-slate-900 transition hover:bg-slate-100"
                  >
                    Check If My Property Qualifies
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="What Makes Up the Cost?"
            description="A realistic backyard home cost Ontario figure is built from many pieces that homeowners often underestimate early."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {costBreakdownItems.map((item) => (
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
            title="Why One Garden Suite Costs More Than Another"
            description="Two projects with similar square footage can still land far apart on price once the lot and servicing reality become clear."
          />

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {variationItems.map((item) => (
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

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">
              If you are comparing detached unit types more broadly, it helps to
              start with our{' '}
              <Link
                to="/garden-suites-laneway-suites-ontario"
                className="font-semibold underline underline-offset-4"
              >
                garden suites and laneway homes guide
              </Link>{' '}
              before assuming a backyard build is automatically the lower-cost
              option.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="The Costs People Forget to Budget For"
            description="Most pricing surprises come from the parts of the project that are easy to gloss over when homeowners focus only on the building itself."
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
              Old headline numbers and simplified prefab marketing often ignore
              the hardest parts of a real build.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Typical Garden Suite Cost Ranges"
            description="These are not fixed prices, but they are useful reality-check ranges for different project types."
          />

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {rangeCards.map((card) => (
              <div
                key={card.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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

      <section className="bg-white py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-50 p-3">
                <Timer className="h-7 w-7 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
                  How Long Does a Garden Suite Project Take?
                </h2>
                <p className="mt-3 text-lg leading-8 text-slate-600">
                  Most projects move through feasibility and planning, then
                  design and permits, then construction. In practice, total
                  timelines often land around <strong>8–14 months</strong>{' '}
                  depending on the site, municipality, and overall complexity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="Frequently Asked Questions"
            description="Short answers to the pricing questions homeowners ask most often."
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

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-sm leading-7 text-slate-700">
              If your next question is approvals, review our{' '}
              <Link
                to="/garden-suite-permits-ontario"
                className="font-semibold underline underline-offset-4"
              >
                garden suite permits Ontario
              </Link>{' '}
              guide. If you are comparing against a tighter urban detached-unit
              concept, it also helps to benchmark against the{' '}
              <Link
                to="/laneway-suite-cost-ontario"
                className="font-semibold underline underline-offset-4"
              >
                laneway suite cost Ontario
              </Link>{' '}
              page.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-8 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.06)]">
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
              Garden suite projects go wrong when the budget is built around
              assumptions instead of the actual property, servicing path, and
              approval reality.
            </h2>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600">
              If you want a realistic number before early ideas turn into bad
              decisions, OntarioReno can help you pressure-test the project
              early.
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
