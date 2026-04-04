<footer className="bg-slate-900 text-white">
  <div className="max-w-7xl mx-auto px-6 py-12">
    <div className="grid md:grid-cols-4 gap-10">

      {/* Brand */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Ontario Reno</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          Plan your renovation with clarity. Understand costs, permits, and what it takes to get it done right.
        </p>
      </div>

      {/* Explore */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-slate-300">Explore</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li><a href="/basements" className="hover:text-white transition">Basement Renovations</a></li>
          <li><a href="/legal-suites" className="hover:text-white transition">Legal Suites</a></li>
          <li><a href="/kitchen-renovations" className="hover:text-white transition">Kitchen Renovations</a></li>
          <li><a href="/bathroom-renovations" className="hover:text-white transition">Bathroom Renovations</a></li>
          <li><a href="/costs" className="hover:text-white transition">Renovation Costs</a></li>
        </ul>
      </div>

      {/* Resources */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-slate-300">Resources</h4>
        <ul className="space-y-2 text-sm text-slate-400">
          <li><a href="/hamilton-grant-guide" className="hover:text-white transition">Hamilton $40K Grant Guide</a></li>
          <li><a href="/match" className="hover:text-white transition">Find a Contractor</a></li>
        </ul>
      </div>

      {/* Social + Contact */}
      <div>
        <h4 className="text-sm font-semibold mb-3 text-slate-300">Connect</h4>

        <div className="flex space-x-4 mb-4">
          <a
            href="https://www.facebook.com/profile.php?id=61573361066338"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1B3C6C] transition-colors cursor-pointer">
              <span className="text-xs font-bold">FB</span>
            </div>
          </a>

          <a
            href="https://www.instagram.com/ontarioreno.ca?igsh=MXhtNmVlcjV1dHBwdg%3D%3D&utm_source=qr"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#1B3C6C] transition-colors cursor-pointer">
              <span className="text-xs font-bold">IG</span>
            </div>
          </a>
        </div>

        <p className="text-sm text-slate-400">
          info@ontarioreno.ca
        </p>
      </div>

    </div>

    {/* Bottom */}
    <div className="border-t border-slate-800 mt-10 pt-6 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} Ontario Reno. All rights reserved.
    </div>
  </div>
</footer>