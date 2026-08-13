import { Link } from 'react-router-dom';
import {
  Home,
  CheckCircle2,
  ArrowRight,
  FileText,
  Calculator,
  Hammer,
} from 'lucide-react';
import { buttonStyles, eyebrowStyles } from '../lib/uiStyles';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ProjectGallery, type GalleryPhoto } from '../components/ProjectGallery';

/**
 * Gallery contents.
 *
 * Every file here is ALREADY PUBLISHED elsewhere on this site — the same photo
 * with the same city that the Ajax, Whitby, Milton, Brampton, Burlington, Oshawa
 * and Mississauga pages have been showing. Reusing an existing pairing rather
 * than inventing one is deliberate: the city on each caption is a claim this
 * site already makes, not a new one written to fill a grid. If one of them is
 * wrong it is wrong in two places, and should be fixed in both.
 *
 * Intrinsic dimensions are recorded so every tile reserves its box before the
 * image decodes — an image grid is the usual place a Core Web Vitals score is
 * lost, and these are the pages organic search lands on.
 */
const BASEMENT_PHOTOS: GalleryPhoto[] = [
  { src: '/images/ontarioreno/modern-wide-angle-basement.jpg', alt: 'Wide-angle view of a finished basement living area', caption: 'Finished basement living area', width: 1200, height: 800 },
  { src: '/images/ontarioreno/bright-finished-whitby-basement.jpg', alt: 'Bright finished basement in Whitby, Ontario', caption: 'Whitby', width: 1024, height: 683 },
  { src: '/images/ontarioreno/finished-basement-milton.jpg', alt: 'Finished basement in Milton, Ontario', caption: 'Milton', width: 1200, height: 800 },
  { src: '/images/ontarioreno/brampton-finished-basement.jpg', alt: 'Finished basement in Brampton, Ontario', caption: 'Brampton', width: 1200, height: 675 },
  { src: '/images/ontarioreno/burlington-basement.jpg', alt: 'Finished basement in Burlington, Ontario', caption: 'Burlington', width: 1024, height: 683 },
  { src: '/images/ontarioreno/oshawa-finished-basement.webp', alt: 'Finished basement in Oshawa, Ontario', caption: 'Oshawa', width: 1024, height: 683 },
  { src: '/images/ontarioreno/ajax-basement-1.webp', alt: 'Finished basement in Ajax, Ontario', caption: 'Ajax', width: 1024, height: 683 },
  { src: '/images/ontarioreno/basement-mississauga.webp', alt: 'Finished basement in Mississauga, Ontario', caption: 'Mississauga', width: 1024, height: 683 },
  { src: '/images/ontarioreno/whitby-basement-staircase.webp', alt: 'Basement staircase in a finished Whitby basement', caption: 'Whitby — staircase', width: 1024, height: 683 },
];
import { BookConsultationBand, BookConsultationButton } from '../components/BookConsultationCta';

export default function Basements() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 py-14 text-white sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium mb-6">
              <Home className="w-4 h-4" /> Ontario Renovation Hub
            </div>
            <h1 className="mb-5 text-4xl font-bold leading-tight tracking-[-0.03em] md:text-6xl">
              The Ultimate Guide to Finishing Your Basement in Ontario
            </h1>
            <p className="mb-8 text-lg leading-8 text-slate-300 sm:text-xl">
              Everything you need to know about costs, permits, layouts, and
              the right renovation path for your basement project.
            </p>
            {/* Two paths, both live. The booking is listed first because a
                reader who searched their way onto a basement cost guide is
                further along than a project review assumes. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/consultation/basement"
                className="inline-flex items-center justify-center gap-2 rounded-[0.72rem] bg-white px-7 py-[0.95rem] text-base font-bold text-[#1B3C6C] shadow-lg transition hover:bg-blue-50"
              >
                Book a free in-home consultation <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/match"
                className={buttonStyles.primary}
              >
                Start Project Review <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation, before the numbers.
          A reader arriving from "basement renovation cost" is trying to picture
          the result. Showing the change first is what makes the cost tables
          below read as a price for something, rather than as a bill. */}
      <section className="border-b border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className={eyebrowStyles}>See the difference</p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 md:text-4xl">
              From unfinished basement to finished living space
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The same square footage you already own, turned into a room the
              rest of the house actually uses. Drag the handle to compare.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl">
            <BeforeAfterSlider
              beforeSrc="/images/before-image-hero.jpg"
              afterSrc="/images/after-image-hero.jpg"
              beforeAlt="Unfinished Ontario basement before renovation"
              afterAlt="Finished basement living space after renovation"
              beforeLabel="Before"
              afterLabel="After"
              attribution="Basement renovation, before and after."
            />
          </div>

          {/* The grid answers the question the slider provokes: "fine, but what
              do finished ones actually look like?" Evidence after persuasion,
              rather than decoration standing on its own. */}
          <div className="mx-auto mt-14 max-w-5xl">
            <h3 className="text-center text-xl font-bold tracking-[-0.01em] text-slate-900">
              Finished basements across the GTA
            </h3>
            <ProjectGallery className="mt-6" photos={BASEMENT_PHOTOS} />
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              to="/consultation/basement"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-7 py-4 font-bold text-white shadow-lg transition hover:bg-[#16325a]"
            >
              Book a free in-home consultation <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_308px] lg:items-start lg:gap-10">
            {/* Left Column - Content */}
            <div className="min-w-0 space-y-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-blue-600" />
                Basement Renovation Costs in Ontario
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                In Ontario, a typical basement renovation for personal use
                usually ranges from <strong>$45,000 to $85,000+</strong>, with
                many projects falling between <strong>$50,000 and $70,000</strong>.
                If you are building a legal basement apartment with a bathroom,
                kitchen, permits, and code-compliant upgrades, costs more often
                range from <strong>$60,000 to $140,000+</strong>, with many
                projects landing between <strong>$70,000 and $110,000</strong>.

                If you're specifically comparing grant eligibility in Hamilton,
                see what counts as a{" "}
                <Link
                  to="/hamilton-secondary-suite-grant"
                  className="font-semibold underline underline-offset-4"
                >
                  legal secondary suite
                </Link>.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_1fr] bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                  <div>Typical Ontario / GTA Cost Components</div>
                  <div className="text-right">Estimated Range</div>
                </div>

                <div className="divide-y divide-slate-200 bg-white">
                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">
                      Framing, drywall, taping &amp; paint
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 - $22,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Electrical</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 - $10,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Plumbing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 - $12,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Flooring</div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 - $10,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">
                      Trim, doors &amp; finish carpentry
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $4,000 - $9,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Bathroom addition</div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 - $22,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Kitchen for legal apartment</div>
                    <div className="text-right font-semibold text-slate-900">
                      $12,000 - $25,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Separate entrance</div>
                    <div className="text-right font-semibold text-slate-900">
                      $8,000 - $20,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Permits &amp; drawings</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 - $6,000+
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 mt-6 leading-relaxed text-sm md:text-base">
                Final pricing depends heavily on layout, finish level, whether
                a bathroom or kitchen is being added, and whether the project is
                being built for personal use or as a legal income-generating
                basement apartment. If you want a more local pricing benchmark,
                read our{" "}
                <Link
                  to="/basement-renovation-cost-hamilton"
                  className="font-semibold underline underline-offset-4"
                >
                  Hamilton basement cost guide
                </Link>.

                For Hamilton homeowners, you can also read the{" "}
                <Link
                  to="/hamilton-grant-guide"
                  className="font-semibold underline underline-offset-4"
                >
                  full Hamilton grant guide
                </Link>{" "}
                to understand how the incentive works.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                What Actually Drives Basement Costs
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Two basements with the same square footage can end up tens of
                thousands apart. The biggest pricing differences usually come
                from scope, legal requirements, and existing site conditions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Common cost drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>Ceiling height and structural limitations</li>
                    <li>Adding a bathroom or full kitchen</li>
                    <li>Electrical panel upgrades</li>
                    <li>Waterproofing or moisture remediation</li>
                    <li>Separate entrance construction</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Legal suite upgrades
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>Fire separation requirements</li>
                    <li>Soundproofing between units</li>
                    <li>Egress and window compliance</li>
                    <li>Dedicated HVAC / ventilation work</li>
                    <li>Permit and drawing complexity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Do I need a permit?
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                <strong>Usually yes.</strong> In most GTA municipalities, if
                you are finishing a previously unfinished basement, adding
                rooms, changing plumbing, modifying electrical, or creating a
                legal secondary suite, you will usually need permits and
                approved drawings before construction starts.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Permits are commonly needed for:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Adding or moving walls
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        New bathroom plumbing
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        New kitchen plumbing
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Electrical changes or new circuits
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Enlarging windows for egress
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Creating a legal basement apartment
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Why it matters
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Protects safety and code compliance
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Helps avoid stop-work orders and fines
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Matters when selling or refinancing
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Especially important for income suites
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Right Column - Sidebar / Lead Capture */}
            <div className="min-w-0 self-start lg:sticky lg:top-28">
              <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <Hammer className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Ready to get quotes?
                  </h3>
                  <p className="text-slate-600 mb-6">
                    Tell us about your basement project and we&apos;ll help
                    review your requirements, understand your next steps, and
                    move forward with the right renovation path.
                  </p>
                  <BookConsultationButton slug="basement" />
                  <Link
                    to="/match"
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
                  >
                    Start Project Review
                  </Link>
                  <p className="text-xs text-center text-slate-400 mt-4">
                    100% free. No obligation to hire.
                  </p>
                </div>

                <div className="bg-yellow-50 p-8 rounded-2xl shadow-sm border border-yellow-200">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-800 mb-3">
                    Hamilton incentive
                  </p>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">
                    Up to $40,000 Available for Qualifying Basement Projects
                  </h3>
                  <p className="text-slate-700 mb-4">
                    Homeowners in Hamilton may qualify for a city-backed incentive
                    covering up to <strong>70% of eligible construction costs</strong>{" "}
                    when building a legal secondary unit. For a full breakdown, see the{" "}
                    <Link
                      to="/hamilton-grant-guide"
                      className="font-semibold underline underline-offset-4"
                    >
                      Hamilton grant guide
                    </Link>.
                  </p>
                  <p className="text-xs text-slate-500 mb-5">
                    Subject to approval, eligibility, and available funding.
                  </p>
                  <Link
                    to="/hamilton-basement-grant"
                    className="inline-flex text-sm font-semibold text-slate-900 underline underline-offset-4"
                  >
                    See if you qualify -{">"}
                  </Link>
                </div>

                <div className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 text-white">
                  <h3 className="text-lg font-bold mb-3">
                    Ontario pricing reality check
                  </h3>
                  <p className="text-sm leading-7 text-slate-300">
                    If a contractor is quoting far below normal Ontario market
                    pricing, there is usually a reason: missing permit scope,
                    lower-grade materials, incomplete labour coverage, or major
                    exclusions that show up later as extras.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BookConsultationBand
        slug="basement"
        heading="Get your basement priced properly, in person"
        body="A consultant measures the space, walks the condition with you, and puts a real number on the project — with monthly financing from about $399 if you want it."
      />
    </div>
  );
}





