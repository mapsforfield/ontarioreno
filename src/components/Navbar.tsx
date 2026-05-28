import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { buttonStyles } from '../lib/uiStyles';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHubsOpen, setIsHubsOpen] = useState(false);
  const [isFinancingOpen, setIsFinancingOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isGrantsOpen, setIsGrantsOpen] = useState(false);
  const [isMobileHubsOpen, setIsMobileHubsOpen] = useState(false);
  const [isMobileFinancingOpen, setIsMobileFinancingOpen] = useState(false);
  const [isMobileToolsOpen, setIsMobileToolsOpen] = useState(false);
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
    setIsFinancingOpen(false);
    setIsToolsOpen(false);
    setIsGrantsOpen(false);
    setIsMobileHubsOpen(false);
    setIsMobileFinancingOpen(false);
    setIsMobileToolsOpen(false);
    setIsMobileGrantsOpen(false);
  }, [location.pathname]);

  const hubSections = [
    {
      label: 'Suites & Additions',
      items: [
        { name: 'Basement Finishing', href: '/basements' },
        { name: 'Legal Secondary Suites', href: '/legal-suites' },
        { name: 'Garden Suites', href: '/garden-suites' },
      ],
    },
    {
      label: 'Interior Renovations',
      items: [
        { name: 'Kitchen Renovations', href: '/kitchen-renovations' },
        { name: 'Bathroom Renovations', href: '/bathroom-renovations' },
      ],
    },
    {
      label: 'Planning',
      items: [{ name: 'Cost Guides', href: '/costs' }],
    },
  ];

  const hubs = hubSections.flatMap((section) => section.items);

  const financingPrimaryLinks = [
    { name: 'Renovation Financing', href: '/financing' },
    { name: 'Home Equity Renovation Guide', href: '/financing/home-equity-renovations-ontario' },
  ];

  const financingSecondaryLinks = [
    { name: 'HELOC vs Refinance', href: '/financing/heloc-vs-refinance-for-renovations' },
    { name: 'HELOC vs Renovation Financing', href: '/financing/heloc-vs-contractor-financing' },
    { name: 'Legal Basement Apartment Financing', href: '/financing/heloc-for-legal-basement-apartment' },
    { name: 'Garden Suite Financing', href: '/financing/garden-suite-financing-ontario' },
    { name: 'Phased Renovation Financing', href: '/financing/phased-renovation-financing' },
    { name: 'Grants & Home Equity', href: '/financing/grants-and-incentives-with-home-equity' },
  ];

  const grantLinks = [
    { name: 'Hamilton Grant Guide', href: '/hamilton-grant-guide' },
    { name: 'Grant Eligibility Calculator', href: '/grant-eligibility-calculator' },
    { name: 'Barrie Secondary Suite Funding', href: '/barrie-secondary-suite-funding' },
    { name: 'St. Catharines ADU Grant', href: '/st-catharines-adu-grant' },
    { name: 'Burlington ARU Incentive Program', href: '/burlington-aru-incentive-program' },
  ];

  const grantSections = [
    {
      label: 'Core Grant Resources',
      items: [
        { name: 'Hamilton Grant Guide', href: '/hamilton-grant-guide' },
        { name: 'Grant Eligibility Calculator', href: '/grant-eligibility-calculator' },
      ],
    },
    {
      label: 'City Programs',
      items: [
        { name: 'Barrie Secondary Suite Funding', href: '/barrie-secondary-suite-funding' },
        { name: 'St. Catharines ADU Grant', href: '/st-catharines-adu-grant' },
        { name: 'Burlington ARU Incentive Program', href: '/burlington-aru-incentive-program' },
      ],
    },
  ];

  const toolSections = [
    {
      label: 'Planning Tools',
      items: [
        { name: 'HELOC Fit Calculator', href: '/financing/home-equity-renovations-ontario#calculator' },
        { name: 'Garden Suite Calculator', href: '/garden-suite-cost-ontario#calculator' },
      ],
    },
    {
      label: 'Eligibility Tools',
      items: [{ name: 'Grant Eligibility Calculator', href: '/grant-eligibility-calculator' }],
    },
  ];

  const toolLinks = [
    { name: 'HELOC Fit Calculator', href: '/financing/home-equity-renovations-ontario#calculator' },
    { name: 'Grant Eligibility Calculator', href: '/grant-eligibility-calculator' },
    { name: 'Garden Suite Calculator', href: '/garden-suite-cost-ontario#calculator' },
  ];

  const isHubsActive = hubs.some((hub) => location.pathname === hub.href);
  const isFinancingActive = location.pathname === '/financing'
    || location.pathname.startsWith('/financing/');
  const isGrantsActive = grantLinks.some(
    (grant) => grant.href !== '/grant-eligibility-calculator' && location.pathname === grant.href
  );
  const isToolsActive = toolLinks.some(
    (tool) => location.pathname === tool.href.split('#')[0]
  );
  const isContractorPartnersPage = location.pathname === '/contractor-partners';

  const sectionLabelClassName =
    'px-2 pb-1 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-slate-400/85';

  return (
    <>
      <nav
        className={cn(
          isContractorPartnersPage ? 'relative z-0' : 'sticky top-0 z-50',
          isContractorPartnersPage
            ? 'bg-[#fbfaf7] shadow-none [transform:none] [will-change:auto]'
            : 'border-b border-slate-200/70 bg-white/92 backdrop-blur-xl'
        )}
      >
      <div
        className={cn(
          'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8',
          isContractorPartnersPage && 'xl:px-10'
        )}
      >
        <div
          className={cn(
            'flex h-[4.65rem] items-center justify-between',
            isContractorPartnersPage && 'lg:h-[5.15rem] xl:h-[5.35rem]'
          )}
        >
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="OntarioReno Logo"
                className={cn(
                  'h-10 w-auto object-contain',
                  isContractorPartnersPage && 'lg:h-11 xl:h-12'
                )}
              />
            </Link>
          </div>

          <div
            className={cn(
              'hidden items-center gap-8 md:flex',
              isContractorPartnersPage && 'lg:gap-9 xl:gap-10'
            )}
          >
            <div
              className="relative"
              onMouseEnter={() => setIsHubsOpen(true)}
              onMouseLeave={() => setIsHubsOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 py-7 text-sm font-semibold tracking-[-0.01em] transition-colors duration-150',
                  isHubsActive
                    ? 'text-[#1B3C6C]'
                    : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Renovation Hubs
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-0 top-full w-[312px] rounded-[1rem] border border-slate-200/75 bg-white/98 p-2 shadow-[0_10px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-200',
                  isHubsOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                <div className="space-y-2.5">
                  {hubSections.map((section, sectionIndex) => (
                    <div
                      key={section.label}
                      className={cn(
                        sectionIndex > 0 && 'border-t border-slate-200/70 pt-2.5'
                      )}
                    >
                      <p className={cn(sectionLabelClassName, 'px-3')}>
                        {section.label}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((hub) => (
                          <Link
                            key={hub.name}
                            to={hub.href}
                            className={cn(
                              'block rounded-[0.8rem] px-3.5 py-2.25 text-sm font-medium tracking-[-0.01em] transition-colors duration-150',
                              location.pathname === hub.href
                                ? 'bg-slate-50 text-[#1B3C6C]'
                                : 'text-slate-700 hover:bg-slate-50/80 hover:text-[#1B3C6C]'
                            )}
                          >
                            {hub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsFinancingOpen(true)}
              onMouseLeave={() => setIsFinancingOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 py-7 text-sm font-semibold tracking-[-0.01em] transition-colors duration-150',
                  isFinancingActive ? 'text-[#1B3C6C]' : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Financing
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-1/2 top-full w-[372px] -translate-x-1/2 rounded-[1rem] border border-slate-200/75 bg-white/98 p-2 shadow-[0_12px_36px_rgba(15,23,42,0.07)] backdrop-blur-sm transition duration-200',
                  isFinancingOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                <div className="rounded-[0.95rem] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-3">
                  <div className="border-b border-slate-200/80 pb-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Financing cluster
                      </p>
                      <h3 className="mt-2 text-lg font-bold text-slate-900">
                        Choose the path after the renovation is clear
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3.5">
                    <div>
                      <p className={sectionLabelClassName}>
                        Start here
                      </p>
                      <div className="space-y-1.5">
                        {financingPrimaryLinks.map((item, index) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                              'group flex items-center justify-between rounded-[0.85rem] border px-3.5 py-2.75 transition duration-150',
                              index === 0
                                ? 'border-slate-300/90 bg-white text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.04)] hover:border-slate-300 hover:bg-slate-50'
                                : 'border-slate-200/80 bg-slate-50/60 text-slate-900 hover:border-slate-300 hover:bg-white',
                              location.pathname === item.href && 'border-slate-300 bg-slate-50 text-[#1B3C6C]'
                            )}
                          >
                            <span className="text-sm font-semibold tracking-[-0.01em]">{item.name}</span>
                            <ChevronDown className="h-4 w-4 -rotate-90 text-slate-400 transition duration-150 group-hover:translate-x-0.5 group-hover:text-[#1B3C6C]" />
                          </Link>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-slate-200/70 pt-3">
                      <p className={sectionLabelClassName}>
                        Compare and plan further
                      </p>
                      <div className="mt-0.5">
                        {financingSecondaryLinks.map((item) => (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                              'group flex items-center justify-between gap-3 border-b border-slate-200/75 px-2 py-2.5 text-sm transition duration-150 last:border-b-0 hover:bg-slate-50/80',
                              location.pathname === item.href
                                ? 'bg-slate-50/75 text-[#1B3C6C]'
                                : 'text-slate-700 hover:text-[#1B3C6C]'
                            )}
                          >
                            <p className="pr-3 text-sm font-medium tracking-[-0.01em]">{item.name}</p>
                            <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-slate-400 transition duration-150 group-hover:translate-x-0.5 group-hover:text-[#1B3C6C]" />
                          </Link>
                        ))}
                      </div>
                    </div>
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
                  'flex items-center gap-1.5 py-7 text-sm font-semibold tracking-[-0.01em] transition-colors duration-150',
                  isGrantsActive ? 'text-[#1B3C6C]' : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Grants
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-1/2 top-full -translate-y-px w-[312px] -translate-x-1/2 rounded-[0.95rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(252,253,254,0.985)_0%,rgba(248,250,252,0.985)_100%)] p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-md transition duration-150',
                  isGrantsOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                <div className="space-y-2.5">
                  {grantSections.map((section, sectionIndex) => (
                    <div
                      key={section.label}
                      className={cn(sectionIndex > 0 && 'border-t border-slate-200/70 pt-2.5')}
                    >
                      <p className={sectionLabelClassName}>
                        {section.label}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((grant, itemIndex) => (
                          <Link
                            key={grant.name}
                            to={grant.href}
                            className={cn(
                              'block rounded-[0.72rem] px-3 py-2.25 text-sm leading-6 tracking-[-0.01em] transition-[background-color,color] duration-150 hover:bg-slate-50/80 hover:text-[#1B3C6C]',
                              sectionIndex === 0 && itemIndex === 0 && 'font-semibold text-slate-900/95',
                              !(sectionIndex === 0 && itemIndex === 0) && 'font-medium',
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
                  ))}
                </div>
              </div>
            </div>

            <div
              className="relative"
              onMouseEnter={() => setIsToolsOpen(true)}
              onMouseLeave={() => setIsToolsOpen(false)}
            >
              <button
                type="button"
                className={cn(
                  'flex items-center gap-1.5 py-7 text-sm font-semibold tracking-[-0.01em] transition-colors duration-150',
                  isToolsActive ? 'text-[#1B3C6C]' : 'text-slate-600 hover:text-[#1B3C6C]'
                )}
              >
                Tools
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  'absolute left-1/2 top-full w-[292px] -translate-x-1/2 rounded-[0.95rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(252,253,254,0.99)_0%,rgba(247,250,252,0.985)_100%)] p-2 shadow-[0_10px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm transition duration-150',
                  isToolsOpen
                    ? 'visible translate-y-0 opacity-100'
                    : 'invisible translate-y-2 opacity-0'
                )}
              >
                <div className="space-y-2.5">
                  {toolSections.map((section, sectionIndex) => (
                    <div
                      key={section.label}
                      className={cn(sectionIndex > 0 && 'border-t border-slate-200/70 pt-2.5')}
                    >
                      <p className={sectionLabelClassName}>
                        {section.label}
                      </p>
                      <div className="space-y-1">
                        {section.items.map((tool, itemIndex) => (
                          <Link
                            key={tool.name}
                            to={tool.href}
                            className={cn(
                              'block rounded-[0.72rem] px-3 py-2.25 text-sm tracking-[-0.01em] transition-[background-color,color] duration-150 hover:bg-slate-50/80 hover:text-[#1B3C6C]',
                              sectionIndex === 0 && itemIndex === 0 && 'font-semibold text-slate-900',
                              !(sectionIndex === 0 && itemIndex === 0) && 'font-medium text-slate-700',
                              location.pathname === tool.href.split('#')[0] && 'bg-slate-50 text-[#1B3C6C]'
                            )}
                          >
                            {tool.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Link
              to="/match"
              className={cn(buttonStyles.primary, 'px-6 py-[0.82rem] text-sm')}
            >
              Start Project Review
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
              <div className="mx-auto flex h-[4.65rem] max-w-7xl items-center justify-between">
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
                <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Navigation
                </div>

                <button
                  type="button"
                  onClick={() => setIsMobileHubsOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-base font-semibold tracking-[-0.01em] text-slate-900 transition hover:bg-slate-50"
                >
                  <span>Renovation Hubs</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-500 transition-transform',
                      isMobileHubsOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMobileHubsOpen && (
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-3">
                    <div className="space-y-2.5">
                      {hubSections.map((section, sectionIndex) => (
                        <div
                          key={section.label}
                          className={cn(
                            sectionIndex > 0 && 'border-t border-slate-200/80 pt-2.5'
                          )}
                        >
                          <p className="px-1 pb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-slate-400/85">
                            {section.label}
                          </p>
                          <div className="grid gap-2">
                            {section.items.map((hub) => (
                              <Link
                                key={hub.name}
                                to={hub.href}
                                className="rounded-[1rem] border border-transparent bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-200 hover:bg-slate-100 hover:text-[#1B3C6C]"
                              >
                                {hub.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="my-3 h-px bg-slate-200/80" />

                <button
                  type="button"
                  onClick={() => setIsMobileFinancingOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-base font-semibold tracking-[-0.01em] text-slate-900 transition hover:bg-slate-50"
                >
                  <span>Financing</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-500 transition-transform',
                      isMobileFinancingOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMobileFinancingOpen && (
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-3">
                    <div className="space-y-3.5">
                      <div>
                        <p className="px-1 pb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-slate-400/85">
                          Start here
                        </p>
                        <div className="grid gap-2">
                          {financingPrimaryLinks.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              className={cn(
                              'rounded-[0.9rem] border px-4 py-2.75 text-sm font-semibold tracking-[-0.01em] transition duration-150',
                              location.pathname === item.href
                                ? 'border-slate-300 bg-slate-50 text-[#1B3C6C]'
                                  : 'border-slate-200/80 bg-white text-slate-900 hover:border-slate-200 hover:bg-slate-100'
                              )}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-slate-200/80 pt-2.5">
                        <p className="px-1 pb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-slate-400/85">
                          Compare and plan further
                        </p>
                        <div className="space-y-1">
                          {financingSecondaryLinks.map((item) => (
                            <Link
                              key={item.name}
                              to={item.href}
                              className={cn(
                                'flex items-center justify-between gap-3 border-b border-slate-200/70 bg-white px-4 py-2.75 text-sm font-medium tracking-[-0.01em] text-slate-700 transition duration-150 last:border-b-0 hover:bg-slate-100 hover:text-[#1B3C6C]',
                                location.pathname === item.href && 'bg-slate-50 text-[#1B3C6C]'
                              )}
                            >
                              <span className="pr-3">{item.name}</span>
                              <ChevronDown className="h-4 w-4 shrink-0 -rotate-90 text-slate-400 transition duration-150" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
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
                    <div className="space-y-2.5">
                      {grantSections.map((section, sectionIndex) => (
                        <div
                          key={section.label}
                          className={cn(sectionIndex > 0 && 'border-t border-slate-200/80 pt-2.5')}
                        >
                          <p className="px-1 pb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-slate-400/85">
                            {section.label}
                          </p>
                          <div className="grid gap-2">
                            {section.items.map((grant) => (
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
                      ))}
                    </div>
                  </div>
                )}

                <div className="my-3 h-px bg-slate-200/80" />

                <button
                  type="button"
                  onClick={() => setIsMobileToolsOpen((value) => !value)}
                  className="flex w-full items-center justify-between rounded-[1rem] px-3 py-3 text-left text-base font-semibold tracking-[-0.01em] text-slate-900 transition hover:bg-slate-50"
                >
                  <span>Tools</span>
                  <ChevronDown
                    className={cn(
                      'h-5 w-5 text-slate-500 transition-transform',
                      isMobileToolsOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isMobileToolsOpen && (
                  <div className="rounded-[1.35rem] border border-slate-200/80 bg-slate-50/90 p-3">
                    <div className="space-y-2.5">
                      {toolSections.map((section, sectionIndex) => (
                        <div
                          key={section.label}
                          className={cn(sectionIndex > 0 && 'border-t border-slate-200/80 pt-2.5')}
                        >
                          <p className="px-1 pb-1.5 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-slate-400/85">
                            {section.label}
                          </p>
                          <div className="grid gap-2">
                            {section.items.map((tool) => (
                              <Link
                                key={tool.name}
                                to={tool.href}
                                className={cn(
                                  'rounded-[1rem] border border-transparent bg-white px-4 py-3 text-sm font-medium tracking-[-0.01em] text-slate-700 transition hover:border-slate-200 hover:bg-slate-100 hover:text-[#1B3C6C]',
                                  location.pathname === tool.href.split('#')[0] && 'border-slate-200 bg-slate-50 text-[#1B3C6C]'
                                )}
                              >
                                {tool.name}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-3 pt-3">
                  <Link
                    to="/match"
                    className={cn(buttonStyles.primary, 'w-full px-6 py-[0.92rem] text-center text-base')}
                  >
                    Start Project Review
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
