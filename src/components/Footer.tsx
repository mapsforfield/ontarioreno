import { Link } from 'react-router-dom';
import { Mail, MapPin, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center text-white">
              <img
                src="/logo-white.png?v=2"
                alt="OntarioReno"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              Ontario&apos;s homeowner resource platform for renovation planning,
              pricing guidance, permit education, and best-fit contractor matching.
            </p>

            <div className="flex space-x-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1B3C6C] transition-colors cursor-pointer">
                <span className="text-xs font-bold">FB</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1B3C6C] transition-colors cursor-pointer">
                <span className="text-xs font-bold">IG</span>
              </div>
            </div>
          </div>

          {/* Renovation Hubs */}
          <div>
            <h3 className="text-white font-semibold mb-6">Renovation Hubs</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/basements"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Basement Finishing
                </Link>
              </li>
              <li>
                <Link
                  to="/legal-suites"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Legal Secondary Suites
                </Link>
              </li>
              <li>
                <Link
                  to="/kitchen-renovations"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Kitchen Renovations
                </Link>
              </li>
              <li>
                <Link
                  to="/bathroom-renovations"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Bathroom Renovations
                </Link>
              </li>
              <li>
                <Link
                  to="/costs"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  2026 Cost Guides
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Resources */}
          <div>
            <h3 className="text-white font-semibold mb-6">Popular Resources</h3>
            <ul className="space-y-4 text-sm">
              <li>
                <Link
                  to="/hamilton-grant-guide"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Hamilton Grant Guide
                </Link>
              </li>
              <li>
                <Link
                  to="/hamilton-basement-grant"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Hamilton Grant Calculator
                </Link>
              </li>
              <li>
                <Link
                  to="/match"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Find the Right Contractor
                </Link>
              </li>
              <li>
                <Link
                  to="/costs"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  Ontario Pricing Data
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contact</h3>

            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <a
                  href="mailto:info@ontarioreno.ca"
                  className="hover:text-[#5694CF] transition-colors"
                >
                  info@ontarioreno.ca
                </a>
              </li>

              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                <span>Serving homeowners across Ontario, Canada.</span>
              </li>
            </ul>

            <div className="mt-6">
              <Link
                to="/match"
                className="inline-flex items-center gap-2 text-white font-medium hover:text-[#5694CF] transition-colors"
              >
                Get Matched <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>
            © {new Date().getFullYear()} OntarioReno. All rights reserved. Not a
            contracting company.
          </p>

          <div className="flex space-x-6">
            <Link to="#" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}