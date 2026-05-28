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
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {shouldShowContractorBanner && (
        <div className="relative z-[70] border-b border-white/10 bg-[linear-gradient(90deg,#0a1424_0%,#0f2f55_55%,#0a1424_100%)] px-4 text-white shadow-[0_12px_28px_rgba(3,7,18,0.18)]">
          <div className="mx-auto flex min-h-[3rem] max-w-7xl items-center justify-center gap-3 pr-9 text-center sm:min-h-[3.35rem] sm:pr-10">
            <p className="text-[0.88rem] font-medium leading-6 tracking-[-0.01em] text-white/92 sm:text-sm">
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
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:ring-white/25 sm:right-5"
              aria-label="Dismiss contractor partner notice"
            >
              <X className="h-4.5 w-4.5" />
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
