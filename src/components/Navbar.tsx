import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, MapPin, Menu, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { cityDirectory, featuredCities } from '../lib/cities';
import { buttonStyles } from '../lib/uiStyles';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHubsOpen, setIsHubsOpen] = useState(false);
  const [isCitiesOpen, setIsCitiesOpen] = useState(false);
  const [isGrantsOpen, setIsGrantsOpen] = useState(false);
  const [isMobileCitiesOpen, setIsMobileCitiesOpen] = useState(false);
  const [isMobileGrantsOpen, setIsMobileGrantsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
    setIsHubsOpen(false);
    setIsCitiesOpen(false);
    setIsGrantsOpen(false);
    setIsMobileCitiesOpen(false);
    setIsMobileGrantsOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Cost Guides', href: '/costs' },
    { name: 'Garden Suites', href: '/garden-suites-laneway-suites-ontario' },
  ];

  const hubs = [
    { name: 'Basement Finishing', href: '/basements' },
    { name: 'Legal Secondary Suites', href: '/legal-suites' },
    { name: 'Garden Suites', href: '/garden-suites-laneway-suites-ontario' },
    { name: 'Kitchen Renovations', href: '/kitchen-renovations' },
    { name: 'Bathroom Renovations', href: '/bathroom-renovations' },
  ];

  const grantLinks = [
    { name: 'Hamilton Secondary Suite Grant', href: '/hamilton-grant-guide' },
    { name: 'St. Catharines ADU Grant', href: '/st-catharines-adu-grant' },
    { name: 'Burlington ARU Incentive Program', href: '/burlington-aru-incentive-program' },
  ];

  const cityPreview = useMemo(() => featuredCities.slice(0, 6), []);

  const isCitiesActive = cityDirectory.some((city) => location.pathname === city.href)
    || location.pathname === '/cities';
  const isGrantsActive = grantLinks.some((grant) => location.pathname === grant.href);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="OntarioReno Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <div
              className="relative"
              onMouseEnter={() => setIsHubsOpen(true)}
              onMouseLeave={() => setIsHubsOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 py-8 text-sm font-semibold tracking-[-0.01em] transition-colors',
                  hubs.some((hub) => location.pathname === hub.href)
                    ? 'text-[#1B3C6C]'
                    : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Renovation Hubs
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-0 top-full w-72 rounded-[1.35rem] border border-slate-200/80 bg-white/98 p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_20px_44px_rgba(15,23,42,0.09)] backdrop-blur-sm transition duration-200',
                  isHubsOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                {hubs.map((hub, index) => (
                  <Link
                    key={hub.name}
                    to={hub.href}
                    className={cn(
                      'block rounded-[1rem] px-4 py-3 text-sm font-medium tracking-[-0.01em] transition-colors hover:bg-slate-50 hover:text-[#1B3C6C]',
                      index === 2 && 'mt-1 border-t border-slate-200/80 pt-4',
                      location.pathname === hub.href
                        ? 'bg-slate-50 text-[#1B3C6C]'
                        : 'text-slate-700'
                    )}
                  >
                    {hub.name}
                  </Link>
                ))}
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsCitiesOpen(true)}
              onMouseLeave={() => setIsCitiesOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 py-8 text-sm font-semibold tracking-[-0.01em] transition-colors',
                  isCitiesActive ? 'text-[#1B3C6C]' : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Cities
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-1/2 top-full w-[420px] -translate-x-1/2 rounded-[1.6rem] border border-slate-200/80 bg-white/98 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_24px_56px_rgba(15,23,42,0.11)] backdrop-blur-sm transition duration-200',
                  isCitiesOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                  <div className="rounded-[1.2rem] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-200/80 pb-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Featured cities
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        Start with your local guide
                      </h3>
                    </div>
                    <div className="rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                      {cityDirectory.length} cities
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {cityPreview.map((city) => (
                      <Link
                        key={city.name}
                        to={city.href}
                        className="group rounded-[1rem] border border-slate-200/80 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_10px_24px_rgba(15,23,42,0.05)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{city.name}</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {city.descriptor}
                            </p>
                          </div>
                          <MapPin className="h-4 w-4 text-slate-400 transition group-hover:text-[#1B3C6C]" />
                        </div>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-slate-200/80 pt-4">
                    <Link
                      to="/cities"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 underline underline-offset-4"
                    >
                      View all cities
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsGrantsOpen(true)}
              onMouseLeave={() => setIsGrantsOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 py-8 text-sm font-semibold tracking-[-0.01em] transition-colors',
                  isGrantsActive ? 'text-[#1B3C6C]' : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Grants
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-1/2 top-full -translate-y-px w-[340px] -translate-x-1/2 rounded-[0.8rem] border border-slate-200/60 bg-[linear-gradient(180deg,rgba(252,253,254,0.985)_0%,rgba(248,250,252,0.985)_100%)] p-1.5 shadow-[0_8px_18px_rgba(15,23,42,0.045),0_18px_34px_rgba(15,23,42,0.04)] backdrop-blur-md transition duration-150',
                  isGrantsOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                {grantLinks.map((grant, index) => (
                  <Link
                    key={grant.name}
                    to={grant.href}
                    className={cn(
                      'block rounded-[0.55rem] px-4 py-3 text-sm leading-6 tracking-[-0.01em] text-slate-700 transition-[background-color,color] duration-150 hover:bg-white/55 hover:text-[#1B3C6C] focus-visible:bg-white/55 focus-visible:text-[#1B3C6C]',
                      index === 0 && 'font-semibold text-slate-900/95 hover:bg-slate-50/65 focus-visible:bg-slate-50/65',
                      index > 0 && 'font-medium',
                      location.pathname === grant.href
                        ? 'bg-slate-50 text-[#1B3C6C]'
                        : 'text-slate-700'
                    )}
                  >
                    {grant.name}
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  'text-sm font-semibold tracking-[-0.01em] text-slate-600 transition-colors hover:text-[#1B3C6C]',
                  location.pathname === link.href && 'text-[#1B3C6C]'
                )}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/match"
              className={cn(buttonStyles.primary, 'px-6 py-[0.82rem] text-sm')}
            >
              Review My Project
            </Link>
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="rounded-[0.95rem] p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-[#1B3C6C]"
              type="button"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      </nav>

      {isOpen && (
        <div className="fixed inset-0 z-[120] bg-white md:hidden">
          <div className="flex h-full min-h-0 flex-col overscroll-none bg-white">
            <div className="border-b border-slate-200/80 bg-white px-4">
              <div className="mx-auto flex h-20 max-w-7xl items-center justify-between">
                <Link
                  to="/"
                  className="flex items-center"
                  onClick={() => setIsOpen(false)}
                >
                  <img
                    src="/logo.png"
                    alt="OntarioReno Logo"
                    className="h-10 w-auto object-contain"
                  />
                </Link>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-[0.95rem] p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-[#1B3C6C]"
                  type="button"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-8 pt-3">
              <div className="mx-auto max-w-7xl space-y-1">
                <div className="px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Renovation hubs
                </div>

                {hubs.map((hub) => (
                  <Link
                    key={hub.name}
                    to={hub.href}
                    className={cn(
                      'block rounded-xl px-3 py-3 text-base font-medium transition hover:bg-slate-50 hover:text-[#1B3C6C]',
                      location.pathname === hub.href
                        ? 'bg-slate-50 text-[#1B3C6C]'
                        : 'text-slate-700'
                    )}
                  >
                    {hub.name}
                  </Link>
                ))}

                <div className="my-3 h-px bg-slate-200/80" />

                <button
                  type="button"
                  onClick={() => setIsMobileCitiesOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-base font-semibold tracking-[-0.01em] text-slate-900 transition hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#1B3C6C]" />
                    Cities
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-500 transition-transform',
                      isMobileCitiesOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMobileCitiesOpen && (
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-3">
                    <div className="grid gap-2">
                      {cityPreview.map((city) => (
                        <Link
                          key={city.name}
                          to={city.href}
                          className="rounded-[1rem] border border-transparent bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-200 hover:bg-slate-100 hover:text-[#1B3C6C]"
                        >
                          <span className="block text-base font-semibold text-slate-900">
                            {city.name}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {city.descriptor}
                          </span>
                        </Link>
                      ))}
                    </div>

                    <Link
                      to="/cities"
                      className="mt-3 inline-flex items-center gap-2 px-1 text-sm font-semibold text-slate-900 underline underline-offset-4"
                    >
                      View all cities
                      <ChevronDown className="h-4 w-4 -rotate-90" />
                    </Link>
                  </div>
                )}

                <div className="my-3 h-px bg-slate-200/80" />

                <button
                  type="button"
                  onClick={() => setIsMobileGrantsOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-base font-semibold tracking-[-0.01em] text-slate-900 transition hover:bg-slate-50"
                >
                  <span>Grants</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-500 transition-transform',
                      isMobileGrantsOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMobileGrantsOpen && (
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-3">
                    <div className="grid gap-2">
                      {grantLinks.map((grant) => (
                        <Link
                          key={grant.name}
                          to={grant.href}
                          className={cn(
                            'rounded-[1rem] border border-transparent bg-white px-4 py-3 text-sm font-medium tracking-[-0.01em] text-slate-700 transition hover:border-slate-200 hover:bg-slate-100 hover:text-[#1B3C6C]',
                            location.pathname === grant.href && 'border-slate-200 bg-slate-50 text-[#1B3C6C]'
                          )}
                        >
                          {grant.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="my-3 h-px bg-slate-200/80" />

                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className={cn(
                      'block rounded-[1rem] px-3 py-3 text-base font-medium tracking-[-0.01em] transition hover:bg-slate-50 hover:text-[#1B3C6C]',
                      location.pathname === link.href
                        ? 'bg-slate-50 text-[#1B3C6C]'
                        : 'text-slate-700'
                    )}
                  >
                    {link.name}
                  </Link>
                ))}

                <div className="px-3 pt-3">
                  <Link
                    to="/match"
                    className={cn(buttonStyles.primary, 'w-full px-6 py-[0.92rem] text-center text-base')}
                  >
                    Review My Project
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
