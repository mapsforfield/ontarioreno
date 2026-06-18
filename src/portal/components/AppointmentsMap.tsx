import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useEffect, useMemo } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import type { Appointment } from '../data/types';

type Props = {
  appointments: Appointment[];
  getRepName: (id: string) => string;
};

function haversine(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(x));
}

/** Nearest-neighbour ordering, starting from the earliest appointment. */
function orderRoute(points: Appointment[]): Appointment[] {
  if (points.length <= 2) return points;
  const remaining = [...points];
  const route: Appointment[] = [remaining.shift()!];
  while (remaining.length) {
    const last = route[route.length - 1];
    const from = { lat: last.latitude!, lon: last.longitude! };
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((p, i) => {
      const d = haversine(from, { lat: p.latitude!, lon: p.longitude! });
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    route.push(remaining.splice(bestIdx, 1)[0]);
  }
  return route;
}

function fmt12(time: string | undefined): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${period}` : `${h12}:${String(m).padStart(2, '0')}${period}`;
}

function numberedIcon(n: number) {
  return L.divIcon({
    className: 'or-route-pin',
    html: `<div style="background:#1B3C6C;color:#fff;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff;"><span style="transform:rotate(45deg);font-weight:800;font-size:13px;">${n}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  // Re-fit whenever the actual coordinates change (e.g. a far stop geocodes in
  // later) — keyed on the coordinate values, not the array reference.
  const key = points.map((p) => p.join(',')).join('|');
  useEffect(() => {
    if (points.length === 0) return;
    const t = setTimeout(() => {
      map.invalidateSize();
      if (points.length === 1) {
        map.setView(points[0], 13);
      } else {
        map.fitBounds(points, { padding: [50, 50] });
      }
    }, 80);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, key]);
  return null;
}

export default function AppointmentsMap({ appointments, getRepName }: Props) {
  const geocoded = useMemo(
    () => appointments.filter((a) => a.latitude != null && a.longitude != null),
    [appointments]
  );
  const unmapped = useMemo(
    () => appointments.filter((a) => a.latitude == null || a.longitude == null),
    [appointments]
  );
  const ordered = useMemo(() => orderRoute(geocoded), [geocoded]);
  const points = useMemo(
    () => ordered.map((a) => [a.latitude!, a.longitude!] as [number, number]),
    [ordered]
  );

  const googleMapsUrl = useMemo(() => {
    if (ordered.length === 0) return '';
    const path = ordered.map((a) => `${a.latitude},${a.longitude}`).join('/');
    return `https://www.google.com/maps/dir/${path}`;
  }, [ordered]);

  const center: [number, number] = points[0] ?? [43.2557, -79.8711]; // Hamilton, ON fallback

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="h-[26rem] overflow-hidden rounded-[0.5rem] border border-slate-200 lg:h-[32rem]">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.length > 1 && (
            <Polyline positions={points} pathOptions={{ color: '#1B3C6C', weight: 3, dashArray: '6 8', opacity: 0.7 }} />
          )}
          {ordered.map((a, i) => (
            <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={numberedIcon(i + 1)}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{a.customerName || 'Consultation'}</strong>
                  <br />
                  {fmt12(a.appointmentTime)} · {getRepName(a.assignedRepId)}
                  <br />
                  <span style={{ color: '#64748b' }}>{[a.address, a.city].filter(Boolean).join(', ')}</span>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds points={points} />
        </MapContainer>
      </div>

      <div className="flex flex-col rounded-[0.5rem] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#32639b]">Suggested Route</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            {ordered.length} stop{ordered.length !== 1 ? 's' : ''} · nearest-first order
          </p>
        </div>
        <div className="max-h-[18rem] flex-1 overflow-y-auto p-2 lg:max-h-none">
          {ordered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <MapPin className="h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-500">No mappable consultations</p>
              <p className="mt-1 text-xs text-slate-400">Addresses for this day couldn’t be located on the map.</p>
            </div>
          ) : (
            ordered.map((a, i) => (
              <div key={a.id} className="flex items-start gap-2.5 rounded-[0.5rem] px-2 py-2 hover:bg-slate-50">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3C6C] text-[0.7rem] font-black text-white">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-slate-900">{a.customerName || 'Consultation'}</p>
                  <p className="truncate text-xs font-semibold text-slate-500">
                    {fmt12(a.appointmentTime)} · {[a.address, a.city].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            ))
          )}
          {/* Consultations we couldn't place on the map yet */}
          {unmapped.length > 0 && (
            <div className="mt-2 border-t border-slate-100 pt-2">
              <p className="px-2 pb-1 text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-400">
                Locating… / no map address ({unmapped.length})
              </p>
              {unmapped.map((a) => (
                <div key={a.id} className="flex items-start gap-2.5 rounded-[0.5rem] px-2 py-2 opacity-70">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-500">
                    <MapPin className="h-3 w-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-700">{a.customerName || 'Consultation'}</p>
                    <p className="truncate text-xs font-semibold text-slate-400">
                      {fmt12(a.appointmentTime)} · {[a.address, a.city].filter(Boolean).join(', ') || 'No address'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {googleMapsUrl && (
          <div className="border-t border-slate-100 p-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
            >
              <Navigation className="h-4 w-4" />
              Open route in Google Maps
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
