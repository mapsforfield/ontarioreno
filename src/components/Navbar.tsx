import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Home, Hammer, FileText, MapPin, Calculator } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHubsOpen, setIsHubsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Cost Guides', href: '/costs', icon: Calculator },
    { name: 'Contractor Match', href: '/match', icon: Hammer },
    { name: 'Toronto Guide', href: '/city/toronto', icon: MapPin },
  ];

  const hubs = [
    { name: 'Basement Finishing', href: '/basements' },
    { name: 'Legal Secondary Suites', href: '/legal-suites' },
    { name: 'Kitchen Renovations', href: '#' },
    { name: 'Bathroom Renovations', href: '#' },
  ];

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
  <Link to="/" className="flex items-center">
    <img 
      src="/logo.png" 
      alt="OntarioReno Logo" 
      className="h-10 w-auto object-contain"
    />
  </Link>
</div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <button 
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-medium transition-colors py-8"
                onMouseEnter={() => setIsHubsOpen(true)}
                onMouseLeave={() => setIsHubsOpen(false)}
              >
                Renovation Hubs <ChevronDown className="h-4 w-4" />
              </button>
              
              {/* Dropdown */}
              <div 
                className={cn(
                  "absolute top-full left-0 w-64 bg-white border border-gray-100 shadow-xl rounded-xl py-2 transition-all duration-200 opacity-0 invisible translate-y-2",
                  "group-hover:opacity-100 group-hover:visible group-hover:translate-y-0"
                )}
                onMouseEnter={() => setIsHubsOpen(true)}
                onMouseLeave={() => setIsHubsOpen(false)}
              >
                {hubs.map((hub) => (
                  <Link
                    key={hub.name}
                    to={hub.href}
                    className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 hover:text-blue-600 font-medium transition-colors"
                  >
                    {hub.name}
                  </Link>
                ))}
              </div>
            </div>

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={cn(
                  "text-slate-600 hover:text-[#5694CF] font-medium transition-colors",
                  location.pathname === link.href && "text-[#5694CF]"
                )}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/match"
              className="bg-[#1b3c6c] text-white px-6 py-2.5 rounded-full font-semibold hover:bg-[#5694CF] transition-colors shadow-sm hover:shadow-md"
            >
              Get Matched
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-6 space-y-1 shadow-lg">
          <div className="font-semibold text-slate-900 px-3 py-2 text-sm uppercase tracking-wider">Hubs</div>
          {hubs.map((hub) => (
            <Link
              key={hub.name}
              to={hub.href}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              {hub.name}
            </Link>
          ))}
          <div className="h-px bg-gray-100 my-2"></div>
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className="block px-3 py-2 rounded-md text-base font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              onClick={() => setIsOpen(false)}
            >
              {link.name}
            </Link>
          ))}
          <div className="mt-4 px-3">
            <Link
              to="/match"
              className="block w-full text-center bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              Get Matched with Contractors
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
