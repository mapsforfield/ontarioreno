import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

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
            <div className="flex space-x-4">
              <a
                href="https://www.facebook.com/profile.php?id=61573361066338"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1B3C6C] transition-colors"
              >
                <span className="text-xs font-bold">FB</span>
              </a>

              <a
                href="https://www.instagram.com/ontarioreno.ca?igsh=MXhtNmVlcjV1dHBwdg%3D%3D&utm_source=qr"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1B3C6C] transition-colors"
              >
                <span className="text-xs font-bold">IG</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-6">Renovation Hubs</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/basements" className="hover:text-[#5694CF] transition-colors">Basement Finishing</Link></li>
              <li><Link to="/legal-suites" className="hover:text-[#5694CF] transition-colors">Legal Secondary Suites</Link></li>
              <li><Link to="#" className="hover:text-[#5694CF] transition-colors">Kitchen Renovations</Link></li>
              <li><Link to="#" className="hover:text-[#5694CF] transition-colors">Bathroom Renovations</Link></li>
              <li><Link to="/costs" className="hover:text-[#5694CF] transition-colors">2026 Cost Guides</Link></li>
            </ul>
          </div>

          {/* Cities */}
          <div>
            <h3 className="text-white font-semibold mb-6">City Guides</h3>
            <ul className="space-y-4 text-sm">
              <li><Link to="/city/toronto" className="hover:text-[#5694CF] transition-colors">Toronto</Link></li>
              <li><Link to="#" className="hover:text-[#5694CF] transition-colors">Mississauga</Link></li>
              <li><Link to="#" className="hover:text-[#5694CF] transition-colors">Brampton</Link></li>
              <li><Link to="#" className="hover:text-[#5694CF] transition-colors">Vaughan</Link></li>
              <li><Link to="#" className="hover:text-[#5694CF] transition-colors">Ottawa</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-6">Contact & Support</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-slate-500" />
                <span>hello@ontarioreno.ca</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-slate-500" />
                <span>1-800-RENO-ONT</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                <span>Serving all major municipalities across Ontario, Canada.</span>
              </li>
            </ul>
            <div className="mt-6">
              <Link
                to="/match"
                className="inline-block bg-slate-800 hover:bg-[#1B3C6C] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700"
              >
                Contractor Login
              </Link>
            </div>
          </div>

        </div>

        <div className="mt-16 pt-8 border-t border-slate-800 text-sm text-slate-500 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} OntarioReno. All rights reserved. Not a contracting company.</p>
          <div className="flex space-x-6">
            <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
