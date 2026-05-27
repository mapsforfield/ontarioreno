import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowRight } from 'lucide-react';

type FooterProps = {
  compactOnMobile?: boolean;
};

export default function Footer({ compactOnMobile = false }: FooterProps) {
  return (
    <>
      {compactOnMobile && (
        <footer className="border-t border-white/10 bg-[#07101d] px-4 py-9 text-slate-300 md:hidden">
          <div className="mx-auto max-w-md">
            <div className="flex items-center justify-between gap-4">
              <Link to="/" className="flex items-center text-white">
                <img
                  src="/logo-white.png?v=2"
                  alt="OntarioReno"
                  className="h-7 w-auto object-contain"
                />
              </Link>
              <a
                href="mailto:info@ontarioreno.ca"
                className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
              >
                info@ontarioreno.ca
              </a>
            </div>

            <p className="mt-7 text-sm leading-6 text-slate-400">
              Ontario renovation opportunity and fulfillment network.
            </p>

            <div className="mt-7 flex items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500">
              <p>&copy; {new Date().getFullYear()} OntarioReno</p>
              <div className="flex gap-4">
                <Link to="/privacy-policy" className="transition-colors hover:text-white">
                  Privacy
                </Link>
                <Link to="/terms-of-service" className="transition-colors hover:text-white">
                  Terms
                </Link>
              </div>
            </div>
          </div>
        </footer>
      )}

      <footer className={`${compactOnMobile ? 'hidden md:block' : ''} border-t border-slate-800 bg-slate-900 py-16 text-slate-300`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <Link to="/" className="flex items-center text-white">
              <img
                src="/logo-white.png?v=2"
                alt="OntarioReno"
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=61573361066338"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-[#1B3C6C]"
              >
                <span className="text-xs font-bold">FB</span>
              </a>

              <a
                href="https://www.instagram.com/ontarioreno.ca?igsh=MXhtNmVlcjV1dHBwdg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-[#1B3C6C]"
              >
                <span className="text-xs font-bold">IG</span>
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-6 font-semibold text-white">Renovation Hubs</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/basements" className="transition-colors hover:text-[#5694CF]">
                  Basement Finishing
                </Link>
              </li>
              <li>
                <Link to="/legal-suites" className="transition-colors hover:text-[#5694CF]">
                  Legal Secondary Suites
                </Link>
              </li>
              <li>
                <Link to="/kitchen-renovations" className="transition-colors hover:text-[#5694CF]">
                  Kitchen Renovations
                </Link>
              </li>
              <li>
                <Link to="/bathroom-renovations" className="transition-colors hover:text-[#5694CF]">
                  Bathroom Renovations
                </Link>
              </li>
              <li>
                <Link to="/costs" className="transition-colors hover:text-[#5694CF]">
                  2026 Cost Guides
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-semibold text-white">Popular Resources</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link to="/hamilton-grant-guide" className="transition-colors hover:text-[#5694CF]">
                  Hamilton Grant Guide
                </Link>
              </li>
              <li>
                <Link to="/hamilton-basement-grant" className="transition-colors hover:text-[#5694CF]">
                  Hamilton Grant Calculator
                </Link>
              </li>
              <li>
                <Link to="/match" className="transition-colors hover:text-[#5694CF]">
                  Start Project Review
                </Link>
              </li>
              <li>
                <Link to="/costs" className="transition-colors hover:text-[#5694CF]">
                  Ontario Pricing Data
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 font-semibold text-white">Contact</h3>

            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <a
                  href="mailto:info@ontarioreno.ca"
                  className="transition-colors hover:text-[#5694CF]"
                >
                  info@ontarioreno.ca
                </a>
              </li>

              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
                <span>Serving homeowners across Ontario, Canada.</span>
              </li>
            </ul>

            <div className="mt-6">
              <Link
                to="/match"
                className="inline-flex items-center gap-2 font-medium text-white transition-colors hover:text-[#5694CF]"
              >
                Start Project Review <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm text-slate-500 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} OntarioReno. All rights reserved.
            Renovation planning and project guidance for homeowners across Ontario.
          </p>

          <div className="flex space-x-6">
            <Link to="/privacy-policy" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
      </footer>
    </>
  );
}
