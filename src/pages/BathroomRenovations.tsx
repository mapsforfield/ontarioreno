import { Link } from 'react-router-dom';
import {
  Bath,
  ArrowRight,
  FileText,
  Calculator,
  CheckCircle2,
  Hammer,
  AlertTriangle,
} from 'lucide-react';
import { BookConsultationBand, BookConsultationButton } from '../components/BookConsultationCta';
import { BeforeAfterSlider } from '../components/BeforeAfterSlider';
import { ProjectGallery, type GalleryPhoto } from '../components/ProjectGallery';

/**
 * Gallery contents.
 *
 * Portrait, unlike the basement set, because that is how bathrooms are shot —
 * they are tall narrow rooms and the useful information (shower, vanity, tile
 * run) is vertical. The grid is told to use 3/4 tiles for the same reason;
 * forcing these into the basement page's 3/2 landscape tiles would crop away
 * the top and bottom of every one.
 *
 * Captions stay generic. These came from several sources within the team and
 * nothing in the repo records which job each one is, so naming a city would be
 * inventing one — the same rule the basement gallery follows.
 *
 * Intrinsic dimensions are recorded so every tile reserves its box before the
 * image decodes.
 */
const BATHROOM_PHOTOS: GalleryPhoto[] = [
  { src: '/images/bathroom-reno/bathroom-01.webp', alt: 'Finished bathroom renovation with tiled shower', caption: 'Finished bathroom', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-02.webp', alt: 'Renovated bathroom with vanity and mirror', caption: 'Vanity and mirror', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-03.webp', alt: 'Modern bathroom renovation with glass shower enclosure', caption: 'Glass shower enclosure', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-04.webp', alt: 'Bathroom renovation with tiled walls and floor', caption: 'Full tile surround', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-05.webp', alt: 'Finished bathroom with freestanding fixtures', caption: 'Finished bathroom', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-06.webp', alt: 'Renovated bathroom with walk-in shower', caption: 'Walk-in shower', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-07.webp', alt: 'Bathroom renovation with custom tile work', caption: 'Custom tile work', width: 1080, height: 1440 },
  { src: '/images/bathroom-reno/bathroom-08.webp', alt: 'Completed bathroom renovation interior', caption: 'Completed renovation', width: 1080, height: 1349 },
  { src: '/images/bathroom-reno/bathroom-09.jpg', alt: 'Finished bathroom with tiled shower and vanity', caption: 'Shower and vanity', width: 1700, height: 2267 },
  { src: '/images/bathroom-reno/bathroom-10.jpg', alt: 'Renovated bathroom interior', caption: 'Finished bathroom', width: 1700, height: 2267 },
  { src: '/images/bathroom-reno/bathroom-11.jpg', alt: 'Bathroom renovation with feature tile', caption: 'Feature tile', width: 1578, height: 2048 },
  { src: '/images/bathroom-reno/bathroom-12.jpg', alt: 'Finished bathroom renovation detail', caption: 'Finished bathroom', width: 1824, height: 2560 },
];

export default function BathroomRenovations() {
  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 text-blue-300 text-sm font-medium mb-6">
              <Bath className="w-4 h-4" /> Ontario Renovation Hub
            </div>

            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Bathroom Renovation Costs in Ontario
            </h1>

            <p className="text-xl text-slate-300 mb-8">
              Real bathroom pricing, smart planning, and what actually drives
              renovation costs across Ontario before you lock in your next step.
            </p>

            {/* Both paths stay live; the booking leads because a reader on
                a cost guide has usually already decided they want the work. */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/consultation/bathroom"
                className="bg-white hover:bg-blue-50 text-[#1B3C6C] px-8 py-4 rounded-xl font-bold text-lg shadow-lg transition-all inline-flex items-center justify-center gap-2"
              >
                Book a free in-home consultation <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/match"
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all inline-flex items-center justify-center gap-2"
              >
                Start Project Review <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Transformation, before the numbers.
          Same order as the basement guide: a reader arriving from "bathroom
          renovation cost" is trying to picture the result, and the cost tables
          below read as a price for something rather than as a bill once they
          can. */}
      <section className="border-b border-slate-200 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#1B3C6C]">
              See the difference
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-[-0.02em] text-slate-900 md:text-4xl">
              From dated bathroom to finished space
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The same footprint, rebuilt properly — waterproofing, tile and
              fixtures done once. Drag the handle to compare.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            {/* This sits inside the first viewport on desktop, which makes it
                the page's LCP element — so it loads eagerly rather than being
                deferred. Same lesson as the basement guide. */}
            <BeforeAfterSlider
              beforeSrc="/images/bathroom-reno/before-after/pair-1-before.webp"
              afterSrc="/images/bathroom-reno/before-after/pair-1-after.webp"
              beforeAlt="Dated bathroom before renovation"
              afterAlt="Finished bathroom after renovation"
              width={1080}
              height={813}
              loading="eager"
              attribution="Bathroom renovation, before and after."
            />
          </div>

          <div className="mx-auto mt-14 max-w-6xl">
            <h3 className="text-center text-xl font-bold tracking-[-0.01em] text-slate-900">
              Finished bathrooms across the GTA
            </h3>
            {/* 3/4 tiles: bathrooms are shot portrait and the landscape default
                would crop the shower and vanity out of frame. */}
            <ProjectGallery className="mt-6" photos={BATHROOM_PHOTOS} aspect="3/4" />
          </div>

          <div className="mt-12 flex justify-center">
            <Link
              to="/consultation/bathroom"
              className="inline-flex items-center gap-2 rounded-xl bg-[#1B3C6C] px-7 py-4 font-bold text-white shadow-lg transition hover:bg-[#16325a]"
            >
              Book a free in-home consultation <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-12">
          {/* Left Column */}
          <div className="lg:w-2/3 space-y-12">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Calculator className="w-8 h-8 text-blue-600" />
                Bathroom Renovation Costs in Ontario
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                In Ontario, bathroom renovations usually range from{' '}
                <strong>$15,000 to $40,000+</strong>, with many projects falling
                between <strong>$20,000 and $30,000</strong>. Final cost depends
                on tile selection, waterproofing scope, plumbing changes, vanity
                and fixture quality, glass work, and whether the layout stays the
                same or is being reconfigured.
              </p>

              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-[1.4fr_1fr] bg-slate-100 px-5 py-4 text-sm font-bold text-slate-900">
                  <div>Typical Ontario Bathroom Cost Components</div>
                  <div className="text-right">Estimated Range</div>
                </div>

                <div className="divide-y divide-slate-200 bg-white">
                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Demolition & prep</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 - $4,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">
                      Waterproofing & shower prep
                    </div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 - $6,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Tile supply & installation</div>
                    <div className="text-right font-semibold text-slate-900">
                      $5,000 - $14,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Vanity & countertop</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 - $7,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Toilet, tub, shower fixtures</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 - $8,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Plumbing changes</div>
                    <div className="text-right font-semibold text-slate-900">
                      $2,500 - $8,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Electrical & lighting</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 - $5,000
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Glass / shower enclosure</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 - $5,000+
                    </div>
                  </div>

                  <div className="grid grid-cols-[1.4fr_1fr] px-5 py-4 text-sm md:text-base">
                    <div className="text-slate-700">Painting & finishing</div>
                    <div className="text-right font-semibold text-slate-900">
                      $1,500 - $4,000
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-slate-500 mt-6 leading-relaxed text-sm md:text-base">
                Bathrooms become expensive quickly when premium tile, custom
                glass, layout changes, plumbing relocation, in-floor heating, or
                waterproofing remediation are part of the job.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                What Actually Drives Bathroom Costs
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Two bathrooms of similar size can land far apart in price. In
                most cases, the biggest differences come from tile selection,
                waterproofing scope, fixture quality, and whether plumbing or
                layout changes are needed.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Common cost drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>Tile size, type, and installation complexity</li>
                    <li>Custom shower builds and waterproofing</li>
                    <li>Vanity, countertop, and fixture upgrades</li>
                    <li>Plumbing relocation</li>
                    <li>Glass enclosures and premium hardware</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-3">
                    Scope-related drivers
                  </p>
                  <ul className="space-y-2 text-sm text-slate-700">
                    <li>Rot, mold, or subfloor repair discovered after demo</li>
                    <li>Electrical corrections and added lighting</li>
                    <li>In-floor heating systems</li>
                    <li>Niche details, benches, and custom trim</li>
                    <li>Permit and design complexity</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
              <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-bold text-amber-900 mb-2">
                  Why bathroom quotes can be misleading
                </h3>
                <p className="text-amber-800 text-sm leading-relaxed">
                  Some quotes look attractive because they exclude waterproofing
                  details, fixture allowances, glass, tile prep, hidden plumbing
                  work, waste removal, or finish-level assumptions. Bathrooms are
                  one of the easiest places for "extras" to show up if the quote
                  is not detailed.
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                Do You Need a Permit?
              </h2>

              <p className="text-slate-600 mb-6 leading-relaxed">
                Sometimes. A straightforward bathroom refresh that keeps the same
                layout may not require a permit. But once plumbing is relocated,
                electrical is modified, ventilation changes, or structural work
                is involved, permits and code compliance become much more likely.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Permits are more likely needed for:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Moving drains or plumbing lines
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        New electrical circuits or wiring changes
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Ventilation / exhaust changes
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Structural framing modifications
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Adding a brand new bathroom where one did not exist
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="font-semibold text-slate-900 mb-4">
                    Why this matters
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Protects waterproofing and code compliance
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Helps avoid hidden failures behind finished tile
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Important for resale and renovation documentation
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-700">
                        Prevents shortcuts on plumbing and ventilation work
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:w-1/3">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                  <Hammer className="w-8 h-8 text-blue-600" />
                </div>

                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Ready to get quotes?
                </h3>

                <p className="text-slate-600 mb-6">
                  Tell us about your bathroom project and we&apos;ll help review
                  your requirements, understand your next steps, and move
                  forward with the right renovation path.
                </p>

                {/* Booking takes the top slot: this page's whole subject is
                    what a bathroom costs, and the consultation is where that
                    gets priced for real. The project review keeps its place. */}
                <BookConsultationButton slug="bathroom" />
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

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">
                  Ontario pricing reality check
                </p>

                <h3 className="text-xl font-bold text-slate-900 mb-4">
                  Lower quotes often skip the expensive hidden work
                </h3>

                <p className="text-slate-600 text-sm leading-7">
                  In bathroom renovations, cheaper quotes often understate
                  waterproofing, tile prep, plumbing changes, niche work, shower
                  glass, ventilation corrections, or fixture allowances. That is
                  why many "budget" bathrooms become much more expensive once
                  construction begins.
                </p>
              </div>

              <div className="bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-800 text-white">
                <h3 className="text-lg font-bold mb-3">
                  Most homeowners underestimate bathroom complexity
                </h3>

                <p className="text-sm leading-7 text-slate-300">
                  Bathrooms are compact, but they are one of the most technically
                  sensitive rooms in the house. Small mistakes in waterproofing,
                  slope, drainage, or ventilation can become costly problems
                  later.
                </p>
              </div>
            </div>
          </div>
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


