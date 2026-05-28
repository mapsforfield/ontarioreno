import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import Navbar from './Navbar';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();
  const [isContractorBannerVisible, setIsContractorBannerVisible] = useState(true);

  const hideFooterRoutes = ['/hamilton-basement-grant'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  const useCompactMobileFooter = location.pathname === '/contractor-partners';
  const shouldShowContractorBanner =
    useCompactMobileFooter && isContractorBannerVisible;

  return (
    <div
      className={`min-h-screen flex flex-col font-sans text-slate-900 ${
        useCompactMobileFooter ? 'bg-[#fbfaf7]' : 'bg-slate-50'
      }`}
    >
      {shouldShowContractorBanner && (
        <div
          className="relative z-[70] border-b border-white/10 bg-[#0d1729] text-white shadow-[0_12px_28px_rgba(3,7,18,0.18)]"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <div className="relative mx-auto flex min-h-[4.25rem] max-w-7xl items-center justify-center px-7 py-4 text-center sm:min-h-0 sm:px-14 sm:py-3 lg:min-h-[3.25rem] lg:px-16 lg:py-4">
            <p className="mx-auto max-w-[21.5rem] text-[0.82rem] font-medium leading-[1.45] tracking-[-0.01em] text-white/92 sm:max-w-none sm:text-sm sm:leading-6 lg:text-[0.95rem] lg:leading-7">
              Limited contractor partner openings currently available by project category and service area.{' '}
              <a
                href="#partner-application"
                className="whitespace-nowrap font-semibold text-white underline decoration-white/45 underline-offset-4 transition hover:decoration-white"
              >
                Learn more
              </a>
            </p>
            <button
              type="button"
              onClick={() => setIsContractorBannerVisible(false)}
              className="absolute right-1 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:ring-white/25 sm:right-4 lg:right-6"
              aria-label="Dismiss contractor partner notice"
            >
              <X className="h-[1.15rem] w-[1.15rem]" />
            </button>
          </div>
        </div>
      )}
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!shouldHideFooter && <Footer compactOnMobile={useCompactMobileFooter} />}
    </div>
  );
}
