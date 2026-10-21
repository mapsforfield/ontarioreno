import { useEffect, useRef, useState, type ComponentType } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Frame,
  Hammer,
  Layers,
  Lock,
  Trash2,
  Upload,
} from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { NeedsMarker } from '../components/project/NeedsMarker';
import { WindowQuoteForm } from '../components/windows/WindowQuoteForm';
import { TypePhotos, type TypePhoto } from '../components/windows/TypePhotos';
import {
  AwningIcon,
  BayBowIcon,
  CasementIcon,
  ColourPreview,
  EntryDoorIcon,
  FixedCasementIcon,
  PatioDoorIcon,
  ShapesIcon,
  SliderIcon,
} from '../components/windows/WindowIcons';
import type { WindowQuotePath } from '../../lib/window-quote';

/**
 * Windows & doors, served at /windows.
 *
 * A landing page first: most visitors arrive from a Meta ad or from a text
 * link sent to a homeowner who already had a window quote in hand and found
 * it too expensive. So the page makes one offer ("send us that quote, we'll
 * beat it") and every section either supports it or moves the reader to the
 * form.
 *
 * COPY RULES FOR THIS PAGE (asked for by the owner, October 2026):
 *   - No em dashes anywhere in visible copy. Commas, colons and full stops.
 *   - No competitor or manufacturer brand names.
 *   - No prices.
 *   - No invented reviews, stats or rebate figures. Anything we do not have
 *     yet renders as a NeedsMarker, so it cannot be mistaken for finished copy.
 *
 * The form, its validation and where submissions go: WindowQuoteForm and
 * lib/window-quote.ts.
 */

/**
 * The hero photograph. Must be a REAL modern GTA home with new black or brown
 * exterior windows (ideally one of our installs, with permission). Until one
 * is supplied the hero shows a marked placeholder rather than a stock photo.
 * Set to e.g. '/images/windows/hero.webp' with its real width and height.
 */
const HERO_IMAGE: { src: string; alt: string; width: number; height: number } | null = null;

const STEPS = [
  { title: 'Send your quote, or tell us what you need', body: 'Upload the quote you already have, or answer three quick questions if you do not have one yet.' },
  { title: 'We match the specs and find rebates', body: 'We price the same windows, glass and install method with a vetted local installer, and check every rebate your home may qualify for.' },
  { title: 'You get a lower price, installed', body: 'Same spec as the quote you have, for less, installed by a local crew.' },
];

type WindowType = {
  name: string;
  Icon: ComponentType<{ className?: string }>;
  what: string;
  where: string;
  badge?: string;
  photos: TypePhoto[];
};

/**
 * Photos per type, supplied by the owner in October 2026 (originals in
 * public/Windows/, cut to 4:3 WebP in public/images/windows/). They illustrate
 * what each type LOOKS like. Most are stock or rendered images, not our
 * installs, so no caption or alt text may present them as our work.
 */
const photo = (type: string, n: number, alt: string): TypePhoto => ({ src: `/images/windows/${type}/${n}`, alt });

/** In order of how often homeowners order them. */
const WINDOW_TYPES: WindowType[] = [
  {
    name: 'Fixed + casement combo',
    Icon: FixedCasementIcon,
    what: 'A large picture window with an opening crank-out side.',
    where: 'Living rooms, bedrooms, kitchens',
    badge: 'Most popular',
    photos: [
      photo('fixed-casement', 1, 'Bedroom with a wide picture window flanked by two opening casements'),
      photo('fixed-casement', 2, 'Dark grey fixed and casement window on a white rendered house'),
      photo('fixed-casement', 3, 'New fixed and casement window seen from inside, with the casement on the right'),
    ],
  },
  {
    name: 'Casement',
    Icon: CasementIcon,
    what: 'A single window that cranks out on a side hinge.',
    where: 'Bedrooms, bathrooms, beside doors',
    photos: [
      photo('casement', 1, 'Casement window open on a red brick wall, with colonial grilles'),
      photo('casement', 2, 'Row of three casement windows in a red brick wall'),
    ],
  },
  {
    name: 'Bay & bow',
    Icon: BayBowIcon,
    what: 'Three or more units angled out from the wall for light and space.',
    where: 'Living rooms, dining rooms, front elevations',
    photos: [
      photo('bay-bow', 1, 'Curved bow window with five units behind a sofa'),
      photo('bay-bow', 2, 'Living room with a large bow window and a window seat'),
      photo('bay-bow', 3, 'Empty room with a three-unit bay window'),
      photo('bay-bow', 4, 'Bow window seen from a covered porch'),
    ],
  },
  {
    name: 'Shapes & specialty',
    Icon: ShapesIcon,
    what: 'Octagons, and angled or sloped tops over casements.',
    where: 'Stairwells, gables, feature walls',
    photos: [
      photo('shapes', 1, 'House with black angled-top windows in the gable'),
      photo('shapes', 2, 'Large raked window in a timber-clad gable above patio doors'),
      photo('shapes', 3, 'Bedroom with a sloped-top window under a vaulted ceiling'),
      photo('shapes', 4, 'Peaked gable window seen from inside'),
    ],
  },
  {
    name: 'Awning',
    Icon: AwningIcon,
    what: 'Hinged at the top and opens out, so it can stay open in light rain.',
    where: 'Kitchens, bathrooms, basements',
    photos: [
      photo('awning', 1, 'Black awning window open above a fixed pane'),
      photo('awning', 2, 'Pair of black awning windows open outward'),
      photo('awning', 3, 'Wide black awning window hinged at the top and open'),
      photo('awning', 4, 'Close-up of an open awning vent in a dark grey frame'),
      photo('awning', 5, 'Awning window open in the rain'),
    ],
  },
  {
    name: 'Slider',
    Icon: SliderIcon,
    what: 'Slides sideways, and the sash tilts in for easy cleaning.',
    where: 'Small washroom and basement windows',
    photos: [
      photo('slider', 1, 'Wide sliding window above a kitchen sink'),
      photo('slider', 2, 'White sliding window in a grey brick wall'),
      photo('slider', 3, 'White sliding window in a red brick wall'),
      photo('slider', 4, 'White window with side panels on a red brick house'),
      photo('slider', 5, 'Black sliding window on a white house'),
    ],
  },
];

const DOORS = [
  {
    name: 'Steel entry doors',
    Icon: EntryDoorIcon,
    points: ['Single door, or with sidelites', "6'8\" or 8' tall", 'Decorative or security glass options'],
  },
  {
    name: 'Sliding patio doors',
    Icon: PatioDoorIcon,
    points: ['2-panel', '6068 and 6080 sizes', 'Laminated security glass option'],
  },
];

const STANDARD = [
  { Icon: Layers, title: 'Triple-pane glass', body: 'Dual Low-E coatings, argon filled' },
  { Icon: BadgeCheck, title: 'ENERGY STAR certified', body: 'U-factor as low as 0.97 W/m²K' },
  { Icon: Lock, title: 'Multi-point locking', body: 'On every opening sash' },
  { Icon: Hammer, title: 'Full-frame install', body: 'Brick-to-brick, insert install available' },
  { Icon: Frame, title: 'New trim inside and out', body: 'Wood jamb, colonial casing, exterior aluminum capping' },
  { Icon: Trash2, title: 'Old windows taken away', body: 'Removal and disposal included' },
];

const EXTERIOR_COLOURS = [
  { name: 'White', hex: '#f4f4f1' },
  { name: 'Commercial Brown', hex: '#4a3a30' },
  { name: 'Black', hex: '#1d1d1f' },
];

/**
 * FAQ. Answers state only what the spec list and the offer already commit to.
 * Install duration is not known to anyone writing this page, so it is a
 * marker, not a guess.
 */
const FAQS: { q: string; a: string; needs?: string }[] = [
  {
    q: 'How do you beat other quotes?',
    a: 'We take the specs on your quote, the window types, sizes, glass and install method, and price the same job with a vetted local installer. You compare like for like, and you only go ahead if our number is lower.',
  },
  {
    q: 'Is the install quality the same?',
    a: 'Every window comes with triple-pane glass, multi-point locks, a new interior wood jamb and colonial casing, exterior aluminum capping, and removal of the old windows. The install is done by a vetted local crew, to the same spec as the quote you already have.',
  },
  {
    q: 'Do you do insert or full-frame installs?',
    a: 'Both. Full-frame, brick-to-brick is our standard: the old frame comes out completely. An insert install, where the new window goes into the existing frame, is available when it suits the house.',
  },
  {
    q: 'How long does install take?',
    a: 'It depends on how many windows and doors you are replacing. We will give you a clear timeline with your quote.',
    needs: 'typical install time, e.g. days for an average home',
  },
  {
    q: 'What areas do you serve?',
    a: 'Toronto, the rest of the GTA, and Durham Region. Put your postal code in the form and we will confirm.',
  },
  {
    q: 'Do I have to commit to anything by uploading my quote?',
    a: 'No. Sending your quote is free and there is no obligation. We review it, come back with our price, and you decide.',
  },
];

/** On a phone the section intro stacks above the form, so go straight to the form card. */
function scrollToForm() {
  const target = window.innerWidth < 1024 ? 'quote-form' : 'quote';
  document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function WindowsDoors() {
  const [path, setPath] = useState<WindowQuotePath>('upload');
  const [exterior, setExterior] = useState(EXTERIOR_COLOURS[2]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [showSticky, setShowSticky] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLElement>(null);

  const goToForm = (p: WindowQuotePath) => {
    setPath(p);
    scrollToForm();
  };

  // Mobile sticky CTA: shown once the hero is out of view, hidden while the
  // form itself is on screen so it never covers a field.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    let heroVisible = true;
    let formVisible = false;
    const update = () => setShowSticky(!heroVisible && !formVisible);
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === heroRef.current) heroVisible = e.isIntersecting;
        if (e.target === formRef.current) formVisible = e.isIntersecting;
      }
      update();
    });
    if (heroRef.current) io.observe(heroRef.current);
    if (formRef.current) io.observe(formRef.current);
    return () => io.disconnect();
  }, []);

  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Window and door replacement',
    name: 'Window replacement in Toronto, the GTA and Durham Region',
    description:
      'Send us a window quote you already have and we will beat it with a vetted local installer, and check every rebate available for your home.',
    url: 'https://ontarioreno.ca/windows',
    provider: {
      '@type': 'HomeAndConstructionBusiness',
      name: 'OntarioReno',
      url: 'https://ontarioreno.ca',
      areaServed: ['Toronto', 'Greater Toronto Area', 'Durham Region'],
    },
    areaServed: [
      { '@type': 'City', name: 'Toronto' },
      { '@type': 'AdministrativeArea', name: 'Greater Toronto Area' },
      { '@type': 'AdministrativeArea', name: 'Durham Region' },
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Windows and doors',
      itemListElement: [...WINDOW_TYPES.map((w) => w.name), ...DOORS.map((d) => d.name)].map((n) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: n },
      })),
    },
  };
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.filter((f) => !f.needs).map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="bg-slate-50">
      <PageMeta
        path="/windows"
        title="Window Replacement Toronto & GTA | Beat My Window Quote | OntarioReno"
        description="Already got a window quote? Send it to us. We'll beat it with a vetted local installer and find you rebates on top. Triple-pane, ENERGY STAR windows and doors across Toronto, the GTA and Durham."
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(serviceSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      {/* ---- 1. Hero ---- */}
      <section
        ref={heroRef}
        className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:min-h-[min(66vh,560px)] lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-8 lg:py-16"
      >
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Windows & doors · Toronto, GTA & Durham</p>
          <h1 className="mt-4 max-w-[15ch] text-4xl font-bold leading-[1.05] tracking-[-0.025em] text-slate-900 md:text-5xl xl:text-6xl">
            Already got a window quote? We'll beat it.
          </h1>
          <p className="mt-5 max-w-[50ch] text-lg leading-8 text-slate-600">
            Send us the quote you were given. We'll price the same windows with a vetted local installer, beat it, and
            find you rebates on top.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={() => goToForm('upload')}
              data-analytics="windows-hero-upload"
              className="inline-flex min-h-[3.5rem] items-center justify-center gap-2 rounded-xl bg-[#1B3C6C] px-7 py-4 font-bold text-white shadow-md transition-colors hover:bg-[#16325a]"
            >
              <Upload className="h-5 w-5" aria-hidden="true" />
              Upload my quote
            </button>
            <button
              type="button"
              onClick={() => goToForm('request')}
              data-analytics="windows-hero-request"
              className="inline-flex min-h-[3.5rem] items-center justify-center rounded-[0.95rem] border border-slate-200 bg-white px-6 py-3.5 font-bold text-[#1B3C6C] shadow-sm transition hover:bg-slate-50"
            >
              Get a free quote
            </button>
          </div>
          <p className="mt-4 text-sm text-slate-500">Free and no obligation. We reply within 24 hours.</p>
        </div>

        <figure className="m-0 overflow-hidden rounded-[1.35rem] bg-slate-200 shadow-md">
          {HERO_IMAGE ? (
            <img
              src={HERO_IMAGE.src}
              alt={HERO_IMAGE.alt}
              width={HERO_IMAGE.width}
              height={HERO_IMAGE.height}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-4 bg-[linear-gradient(160deg,#e2e8f0_0%,#cbd5e1_100%)] p-6 text-center lg:aspect-[5/4]">
              <FixedCasementIcon className="h-24 w-36 text-slate-500" />
              <NeedsMarker label="hero photo: real modern GTA home, new black or brown windows" />
            </div>
          )}
        </figure>
      </section>

      {/* ---- 2. How it works ---- */}
      <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-300">How it works</p>
          <h2 className="mt-5 max-w-[18ch] text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
            Three steps to a lower price
          </h2>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-[1.35rem] bg-white/10 lg:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="bg-slate-900 p-6 lg:p-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-300/15 text-sm font-bold text-blue-200">
                  {i + 1}
                </span>
                <p className="mt-4 text-lg font-bold leading-snug tracking-[-0.02em]">{step.title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---- 3. Windows we install ---- */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Windows we install</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">Every common style, one standard of glass</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WINDOW_TYPES.map(({ name, Icon, what, where, badge, photos }) => (
              <article key={name} className="relative flex flex-col rounded-[1.35rem] border border-slate-200/80 bg-white shadow-sm">
                <TypePhotos photos={photos} label={name} />
                {badge && (
                  <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-[#1B3C6C] px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white shadow-sm">
                    {badge}
                  </span>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3">
                    <Icon className="h-8 w-12 shrink-0 text-[#1B3C6C]" />
                    <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-900">{name}</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{what}</p>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Typically</p>
                  <p className="mt-1 text-sm font-medium text-slate-700">{where}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 4. Doors ---- */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Doors we install</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">Entry and patio doors, quoted with your windows</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {DOORS.map(({ name, Icon, points }) => (
              <article key={name} className="flex gap-5 rounded-[1.35rem] border border-slate-200/80 bg-slate-50 p-6">
                <Icon className="h-16 w-24 shrink-0 text-[#1B3C6C]" />
                <div>
                  <h3 className="text-lg font-bold tracking-[-0.02em] text-slate-900">{name}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                    {points.map((p) => (
                      <li key={p} className="flex gap-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b5a96]" aria-hidden="true" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---- 5. Standard on every window ---- */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Standard on every window</p>
          <h2 className="mt-3 max-w-[24ch] text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">
            Not upgrades. What every window comes with.
          </h2>
          <ul className="mt-8 grid gap-px overflow-hidden rounded-[1.35rem] border border-slate-200/80 bg-slate-200/80 sm:grid-cols-2 lg:grid-cols-3">
            {STANDARD.map(({ Icon, title, body }) => (
              <li key={title} className="flex items-start gap-4 bg-white p-5 sm:p-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1B3C6C]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-bold tracking-[-0.015em] text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- 6. Colours ---- */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Colour options</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">White inside. Your choice outside.</h2>
            <p className="mt-4 max-w-[48ch] text-base leading-7 text-slate-600">
              Interiors are white as standard. Exteriors come in White, Commercial Brown or Black. Black exteriors, and a
              different colour on the front of the house than the back, are popular on newer GTA homes.
            </p>
            <div className="mt-6 flex flex-wrap gap-3" role="radiogroup" aria-label="Exterior colour">
              {EXTERIOR_COLOURS.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  role="radio"
                  aria-checked={exterior.name === c.name}
                  onClick={() => setExterior(c)}
                  className={`flex min-h-[3rem] items-center gap-3 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    exterior.name === c.name ? 'border-[#1B3C6C] ring-2 ring-[#1B3C6C]/20' : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <span className="h-6 w-6 rounded-full border border-slate-300" style={{ background: c.hex }} aria-hidden="true" />
                  {c.name}
                </button>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-3 text-sm text-slate-500">
              <span className="h-5 w-5 rounded-full border border-slate-300 bg-white" aria-hidden="true" />
              Interior: White (standard)
            </p>
          </div>
          <ColourPreview exterior={exterior.hex} className="w-full max-w-md justify-self-center rounded-[1.35rem] shadow-sm" />
        </div>
      </section>

      {/* ---- 7. Rebates ----
           The grant radar holds no window or door program for the GTA or
           Durham as of October 2026 (checked: 110 programs, the only energy
           rows are Ottawa, Kingston and Whitby non-window items, all dismissed
           or out of area). So no program is named here. Replace the marker with
           real names only from the radar or an official source, never amounts
           that are not on that source. */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl rounded-[1.35rem] border border-slate-200/80 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Rebates</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">We check every rebate for your home</h2>
          <p className="mt-4 max-w-[60ch] text-base leading-7 text-slate-600">
            Rebates for energy-efficient windows and doors change often and depend on where you live. With every quote we
            check what is open for your address, and only tell you about programs that are actually accepting
            applications.
          </p>
          <div className="mt-5">
            <NeedsMarker label="current window/door rebate programs for GTA and Durham, from an official source" />
          </div>
        </div>
      </section>

      {/* ---- 8. Proof ----
           Nothing here yet on purpose: the site has no window projects,
           reviews or warranty terms on file, and this page does not invent
           them. Each block is a marker until the real thing is supplied. */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Proof</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">Recent installs and what homeowners said</h2>
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            <div className="flex min-h-[10rem] flex-col items-start justify-between rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="font-bold text-slate-900">Project photos</p>
              <NeedsMarker label="3 to 6 real window/door install photos, before and after" />
            </div>
            <div className="flex min-h-[10rem] flex-col items-start justify-between rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="font-bold text-slate-900">Homeowner reviews</p>
              <NeedsMarker label="real reviews with first name, city and permission" />
            </div>
            <div className="flex min-h-[10rem] flex-col items-start justify-between rounded-[1.35rem] border border-dashed border-slate-300 bg-slate-50 p-6">
              <p className="font-bold text-slate-900">Warranty</p>
              <NeedsMarker label="warranty terms: product years, glass, labour" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- 9. The form ---- */}
      <section ref={formRef} id="quote" className="scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Get your price</p>
            <h2 className="mt-3 max-w-[18ch] text-3xl font-bold tracking-[-0.025em] text-slate-900 md:text-4xl">
              Send us your quote. We'll beat it.
            </h2>
            <p className="mt-4 max-w-[46ch] text-base leading-7 text-slate-600">
              Takes under a minute. A PDF or a phone photo of each page is fine. No quote yet? Switch to "I need a quote"
              and answer three questions instead.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />Reply within 24 hours</li>
              <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />No obligation, nothing to sign</li>
              <li className="flex gap-2"><BadgeCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />Your quote stays private</li>
            </ul>
          </div>
          <div id="quote-form" className="scroll-mt-20">
            <WindowQuoteForm path={path} onPathChange={setPath} onDone={() => setSubmitted(true)} />
          </div>
        </div>
      </section>

      {/* ---- 10. FAQ ---- */}
      <section className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1B3C6C]">Questions</p>
          <h2 className="mt-3 text-2xl font-bold tracking-[-0.025em] text-slate-900 md:text-3xl">Common questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-[1.35rem] border border-slate-200/80">
            {FAQS.map((f, i) => {
              const open = openFaq === i;
              return (
                <div key={f.q}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenFaq(open ? null : i)}
                    className="flex min-h-[3.5rem] w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold text-slate-900"
                  >
                    {f.q}
                    <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
                  </button>
                  {/* Kept in the DOM when closed, so search engines still read it. */}
                  <div className={open ? 'px-5 pb-5' : 'hidden'}>
                    <p className="text-sm leading-7 text-slate-600">{f.a}</p>
                    {f.needs && (
                      <div className="mt-2">
                        <NeedsMarker label={f.needs} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- 11. Final CTA ---- */}
      <section className="bg-slate-900 px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="max-w-[20ch] text-3xl font-bold leading-[1.08] tracking-[-0.03em] sm:text-4xl">
              Paying too much for windows? Let's check.
            </h2>
            <p className="mt-3 max-w-[50ch] text-slate-300">Send the quote you have. We'll beat it and find you rebates on top.</p>
          </div>
          <button
            type="button"
            onClick={() => goToForm('upload')}
            data-analytics="windows-final-upload"
            className="inline-flex min-h-[3.5rem] shrink-0 items-center gap-2 rounded-xl bg-white px-7 py-4 font-bold text-[#1B3C6C] shadow-md transition hover:bg-blue-50"
          >
            Upload my quote
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* Mobile-only sticky CTA. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur transition-transform duration-200 lg:hidden ${
          showSticky && !submitted ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        aria-hidden={!showSticky || submitted}
      >
        <button
          type="button"
          tabIndex={showSticky && !submitted ? 0 : -1}
          onClick={() => goToForm('upload')}
          className="inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3C6C] px-6 font-bold text-white shadow-md"
        >
          <Upload className="h-5 w-5" aria-hidden="true" />
          Upload my quote
        </button>
      </div>
    </div>
  );
}
