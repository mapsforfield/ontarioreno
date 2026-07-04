import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowRight } from 'lucide-react';
import { buttonStyles } from '../lib/uiStyles';

// Public /grants hub. A React page (so it uses the real site Navbar/Footer via
// Layout), fed by /api/appointments?resource=grants-hub-data — which merges the
// hand-made grant pages (always shown) with scanner-approved programs.

type Row = { city: string; name: string; amount: string; status: string; href: string; lat: number | null; lng: number | null };
type MapCity = { city: string; lat: number; lng: number; count: number; amount: string; href: string };
type HubData = { updatedLabel: string; rows: Row[]; mapCities: MapCity[] };

const STATUS: Record<string, { c: string; t: string }> = {
  active: { c: 'bg-emerald-100 text-emerald-700', t: 'Open now' },
  upcoming: { c: 'bg-amber-100 text-amber-700', t: 'Upcoming' },
  closed: { c: 'bg-slate-200 text-slate-500', t: 'Closed' },
  unknown: { c: 'bg-slate-100 text-slate-500', t: 'Check status' },
};

function tagIcon(c: MapCity) {
  const badge = c.count > 1 ? `<i>${c.count}</i>` : '';
  return L.divIcon({ className: '', html: `<div class="atag">${c.amount || 'Incentive'}${badge}</div>`, iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -42] });
}

// Frame the Golden Horseshoe core on load; far pins stay but don't widen the view.
function FitCore({ cities }: { cities: MapCity[] }) {
  const map = useMap();
  useEffect(() => {
    if (!cities.length) return;
    const core = cities.filter((c) => c.lat > 42.8 && c.lat < 44.6 && c.lng > -81 && c.lng < -78.2);
    const frame = core.length ? core : cities;
    const b = L.latLngBounds(frame.map((c) => [c.lat, c.lng] as [number, number]));
    map.fitBounds(b.pad(0.3), { maxZoom: 10 });
  }, [cities, map]);
  return null;
}

const CSS = `
.atag{position:absolute;transform:translate(-50%,-100%);background:#1B3C6C;color:#fff;font-weight:800;font-size:13px;padding:6px 12px;border-radius:16px;white-space:nowrap;box-shadow:0 4px 9px rgba(15,23,42,.35);border:2px solid #fff;font-family:inherit;cursor:pointer}
.atag:after{content:"";position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:8px solid #fff}
.atag i{position:absolute;top:-9px;right:-9px;background:#fff;color:#1B3C6C;border-radius:999px;font-size:10px;font-style:normal;font-weight:800;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center;border:1.5px solid #1B3C6C;padding:0 3px}
.grantpop b{color:#1B3C6C}.grantpop a{display:inline-block;margin-top:6px;background:#1B3C6C;color:#fff;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:700}
.grantmap-brand{position:absolute;left:12px;bottom:12px;z-index:500;background:rgba(255,255,255,.94);border-radius:10px;padding:6px 11px;box-shadow:0 2px 10px rgba(15,23,42,.22)}
.grantmap-brand img{height:22px;display:block}
`;

export default function GrantsHub() {
  const [data, setData] = useState<HubData | null>(null);
  useEffect(() => {
    fetch('/api/appointments?resource=grants-hub-data')
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ updatedLabel: '', rows: [], mapCities: [] }));
  }, []);

  const rows = data?.rows ?? [];
  const mapCities = data?.mapCities ?? [];
  const title = 'Ontario Home Renovation & ADU Grants by City (2026) | OntarioReno';
  const desc = 'A living, regularly-updated list of Ontario homeowner renovation, ADU, and basement-suite incentives — by city, with amounts and how to apply. Free eligibility check.';

  return (
    <div className="bg-slate-50">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <link rel="canonical" href="https://ontarioreno.ca/grants" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
      </Helmet>
      <style>{CSS}</style>

      {/* Hero */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 md:py-20 lg:px-8">
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.03em] md:text-5xl">
            Ontario Home Renovation &amp; ADU Grants — by City
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            Ontario cities are funding homeowners to build basement apartments, garden suites, and additional dwelling units. We track every active program so you never miss one.
          </p>
          {data?.updatedLabel && (
            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-2 text-sm font-bold text-emerald-300">
              ● Updated {data.updatedLabel}
            </div>
          )}
          <div className="mt-7">
            <Link to="/match?ref=grants-hub" className={buttonStyles.primary}>
              Check your eligibility — free <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">Where the grants are</h2>
        <p className="mt-1 text-slate-600">Hover a marker to see the programs available in that city.</p>
        {/* z-0 keeps Leaflet's high internal z-indexes contained below the sticky header (z-50). */}
        <div className="relative z-0 mt-6">
          <MapContainer center={[43.95, -79.2]} zoom={8} scrollWheelZoom={false} style={{ height: 460, width: '100%', borderRadius: 16 }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; OpenStreetMap &copy; CARTO" maxZoom={13} />
            {mapCities.map((c) => (
              <Marker key={c.city} position={[c.lat, c.lng]} icon={tagIcon(c)} eventHandlers={{ mouseover: (e) => (e.target as L.Marker).openPopup() }}>
                <Popup>
                  <div className="grantpop">
                    <b>{c.city}</b><br />
                    {c.count} program{c.count > 1 ? 's' : ''}{c.amount ? ` · up to ${c.amount}` : ''}<br />
                    <a href={c.href}>View →</a>
                  </div>
                </Popup>
              </Marker>
            ))}
            <FitCore cities={mapCities} />
          </MapContainer>
          <a className="grantmap-brand" href="/"><img src="/logo.png" alt="OntarioReno" /></a>
        </div>
      </section>

      {/* Table */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">Grants by city</h2>
          <p className="mt-1 text-slate-600">
            {rows.length} programs across Ontario. Amounts and eligibility are set by each municipality — we'll confirm the current details with you.
          </p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-slate-400">{data ? 'Programs are being reviewed — check back shortly.' : 'Loading…'}</td></tr>
                )}
                {rows.map((r, i) => {
                  const s = STATUS[r.status] ?? STATUS.unknown;
                  const external = r.href.startsWith('/match');
                  return (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-bold text-slate-900">{r.city || '—'}</td>
                      <td className="px-4 py-3 text-slate-700">{r.name}</td>
                      <td className="px-4 py-3 text-slate-700">{r.amount || '—'}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${s.c}`}>{s.t}</span></td>
                      <td className="px-4 py-3">
                        <a href={r.href} className="inline-block whitespace-nowrap rounded-lg bg-[#1B3C6C] px-3 py-1.5 text-xs font-bold text-white">
                          {external ? 'Check eligibility' : 'View grant →'}
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold tracking-[-0.02em] md:text-3xl">Not sure which grants you qualify for?</h2>
          <p className="mt-3 text-slate-300">Start a free project review — a local specialist will confirm your eligibility and map out next steps. No cost, no obligation.</p>
          <div className="mt-6">
            <Link to="/match?ref=grants-hub" className={buttonStyles.primary}>Start Project Review <ArrowRight className="h-5 w-5" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
