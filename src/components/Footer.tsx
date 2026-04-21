import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-900 py-16 text-slate-300">
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
                  Find the Right Contractor
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
                Get Matched <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-sm text-slate-500 md:flex-row">
          <p>
            &copy; {new Date().getFullYear()} OntarioReno. All rights reserved.
            Not a contracting company.
          </p>

          <div className="flex space-x-6">
            <Link to="#" className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <Link to="#" className="transition-colors hover:text-white">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
