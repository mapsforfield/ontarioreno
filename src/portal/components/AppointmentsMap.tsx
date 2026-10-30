import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Home, MapPin, Navigation, Pencil } from 'lucide-react';
import type { Appointment } from '../data/types';
import { usePortalAuth } from '../auth';
import { viewAsHeaders } from '../lib/viewAs';
import { orderStops, roadKm } from '../../../lib/route-plan';

type Props = {
  appointments: Appointment[];
  getRepName: (id: string) => string;
};

// For custom events the address field is the full freeform location, so we
// don't append the (often stale) city.
const EVENT_TYPES = ['showroom_visit', 'supplier_meeting', 'site_check', 'custom_event'];
function locationText(a: Appointment): string {
  // Events: the address field is the full freeform location — never fall back to
  // the (often stale, client-inherited) city.
  if (EVENT_TYPES.includes(a.appointmentType)) return (a.address || '').trim();
  return [a.address, a.city].filter(Boolean).join(', ');
}

// ── Start / end points ───────────────────────────────────────────────────────
// A rep's day starts wherever they are (GPS by default, or an address they type
// — a night at a friend's, a visit that isn't on the calendar) and ends at home.
// Choices are remembered per device; the home address is saved to the account.
type StartMode = 'gps' | 'home' | 'custom' | 'none';
type OrderMode = 'drive' | 'time';
type Place = { lat: number; lon: number; label: string };
type RouteHome = { address: string; lat: number; lon: number };

const PREFS_KEY = 'or-route-prefs';
type Prefs = { startMode: StartMode; endHome: boolean; orderMode: OrderMode; customStart?: Place | null };
const DEFAULT_PREFS: Prefs = { startMode: 'gps', endHome: true, orderMode: 'drive', customStart: null };
function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}
function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* private mode — fine, just not remembered */
  }
}

async function routeApi<T>(url: string, init?: RequestInit): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  try {
    const res = await fetch(url, {
      credentials: 'include',
      ...init,
      headers: { 'Content-Type': 'application/json', ...viewAsHeaders() },
    });
    const body = (await res.json().catch(() => ({}))) as T & { error?: string };
    if (!res.ok) return { ok: false, error: body.error || 'Something went wrong.' };
    return { ok: true, data: body };
  } catch {
    return { ok: false, error: 'No connection.' };
  }
}

function kmText(km: number): string {
  return km < 10 ? `${km.toFixed(1)} km` : `${Math.round(km)} km`;
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

function endpointIcon(text: string, color: string) {
  return L.divIcon({
    className: 'or-route-endpoint',
    html: `<div style="background:${color};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff;font-weight:800;font-size:12px;">${text}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
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

const pill = (active: boolean) =>
  `inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.68rem] font-black transition ${
    active ? 'bg-[#1B3C6C] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
  }`;

export default function AppointmentsMap({ appointments, getRepName }: Props) {
  const { currentUser } = usePortalAuth();
  const userId = currentUser?.id ?? '';

  const [prefs, setPrefsState] = useState<Prefs>(loadPrefs);
  const setPrefs = useCallback((patch: Partial<Prefs>) => {
    setPrefsState((p) => {
      const next = { ...p, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  // ── Home (saved on the account) ──
  const [home, setHome] = useState<RouteHome | null>(null);
  const [homeLoaded, setHomeLoaded] = useState(false);
  const [editingHome, setEditingHome] = useState(false);
  const [homeDraft, setHomeDraft] = useState('');
  const [homeBusy, setHomeBusy] = useState(false);
  const [homeError, setHomeError] = useState('');
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    routeApi<{ home: RouteHome | null }>(`/api/users/${encodeURIComponent(userId)}?_resource=route_home`).then((r) => {
      if (cancelled) return;
      if ('data' in r) setHome(r.data.home);
      setHomeLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  const saveHome = async () => {
    setHomeBusy(true);
    setHomeError('');
    const r = await routeApi<{ home: RouteHome | null }>(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ _action: 'route_home_set', address: homeDraft }),
    });
    setHomeBusy(false);
    if ('error' in r) {
      setHomeError(r.error);
      return;
    }
    setHome(r.data.home);
    setEditingHome(false);
  };

  // ── Start: GPS ──
  const [gps, setGps] = useState<Place | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'ok' | 'error'>('idle');
  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      return;
    }
    setGpsStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lon: pos.coords.longitude, label: 'My location' });
        setGpsStatus('ok');
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 }
    );
  }, []);
  useEffect(() => {
    if (prefs.startMode === 'gps' && gpsStatus === 'idle') locate();
  }, [prefs.startMode, gpsStatus, locate]);

  // ── Start: typed address ──
  const [customDraft, setCustomDraft] = useState(prefs.customStart?.label ?? '');
  const [customBusy, setCustomBusy] = useState(false);
  const [customError, setCustomError] = useState('');
  const [editingCustom, setEditingCustom] = useState(prefs.startMode === 'custom' && !prefs.customStart);
  const setCustomStart = async () => {
    setCustomBusy(true);
    setCustomError('');
    const r = await routeApi<{ place: Place }>(`/api/users/${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ _action: 'geocode_place', query: customDraft }),
    });
    setCustomBusy(false);
    if ('error' in r) {
      setCustomError(r.error);
      return;
    }
    setPrefs({ customStart: { ...r.data.place, label: customDraft.trim() } });
    setEditingCustom(false);
  };

  const start: Place | null =
    prefs.startMode === 'gps'
      ? gps
      : prefs.startMode === 'home' && home
        ? { lat: home.lat, lon: home.lon, label: 'Home' }
        : prefs.startMode === 'custom'
          ? prefs.customStart ?? null
          : null;
  const end: Place | null = prefs.endHome && home ? { lat: home.lat, lon: home.lon, label: 'Home' } : null;

  // ── Stops ──
  const geocoded = useMemo(
    () => appointments.filter((a) => a.latitude != null && a.longitude != null),
    [appointments]
  );
  const unmapped = useMemo(
    () => appointments.filter((a) => a.latitude == null || a.longitude == null),
    [appointments]
  );
  const startKey = start ? `${start.lat},${start.lon}` : '';
  const endKey = end ? `${end.lat},${end.lon}` : '';
  const ordered = useMemo(() => {
    if (prefs.orderMode === 'time') {
      return [...geocoded].sort((a, b) => (a.appointmentTime || '').localeCompare(b.appointmentTime || ''));
    }
    const stops = geocoded.map((a) => ({ a, lat: a.latitude!, lon: a.longitude! }));
    return orderStops(stops, start, end).map((s) => s.a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geocoded, prefs.orderMode, startKey, endKey]);

  const stopPoints = useMemo(
    () => ordered.map((a) => [a.latitude!, a.longitude!] as [number, number]),
    [ordered]
  );
  const linePoints = useMemo(
    () => [
      ...(start ? [[start.lat, start.lon] as [number, number]] : []),
      ...stopPoints,
      ...(end ? [[end.lat, end.lon] as [number, number]] : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stopPoints, startKey, endKey]
  );

  // Rough road km into each stop (index i = drive to ordered[i]), and home.
  const legKm = useMemo(() => {
    const into: Array<number | null> = ordered.map((a, i) => {
      const prev = i === 0 ? start : { lat: ordered[i - 1].latitude!, lon: ordered[i - 1].longitude! };
      return prev ? roadKm(prev, { lat: a.latitude!, lon: a.longitude! }) : null;
    });
    const last = ordered[ordered.length - 1];
    const toHome = home && last ? roadKm({ lat: last.latitude!, lon: last.longitude! }, home) : null;
    const total = into.reduce<number>((s, k) => s + (k ?? 0), 0) + (end && toHome != null ? toHome : 0);
    return { into, toHome, total };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, startKey, home]);

  const googleMapsUrl = useMemo(() => {
    if (ordered.length === 0) return '';
    const path = [
      ...(start ? [`${start.lat},${start.lon}`] : []),
      ...ordered.map((a) => `${a.latitude},${a.longitude}`),
      ...(end ? [`${end.lat},${end.lon}`] : []),
    ].join('/');
    return `https://www.google.com/maps/dir/${path}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered, startKey, endKey]);

  const center: [number, number] = linePoints[0] ?? [43.2557, -79.8711]; // Hamilton, ON fallback
  const sameSpot = start && end && Math.abs(start.lat - end.lat) < 1e-6 && Math.abs(start.lon - end.lon) < 1e-6;

  const homeEditor = (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        <input
          value={homeDraft}
          onChange={(e) => setHomeDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && homeDraft.trim()) saveHome();
          }}
          placeholder="Your home address"
          className="min-w-0 flex-1 rounded-[0.5rem] border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#32639b]"
        />
        <button
          type="button"
          disabled={homeBusy || !homeDraft.trim()}
          onClick={saveHome}
          className="rounded-[0.5rem] bg-[#1B3C6C] px-3 text-xs font-black text-white disabled:opacity-50"
        >
          {homeBusy ? '…' : 'Save'}
        </button>
      </div>
      {homeError && <p className="text-xs font-semibold text-red-600">{homeError}</p>}
      <p className="text-[0.65rem] font-semibold text-slate-400">Only you and admins can see this.</p>
    </div>
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="h-[26rem] overflow-hidden rounded-[0.5rem] border border-slate-200 lg:h-[32rem]">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {linePoints.length > 1 && (
            <Polyline positions={linePoints} pathOptions={{ color: '#1B3C6C', weight: 3, dashArray: '6 8', opacity: 0.7 }} />
          )}
          {start && (
            <Marker position={[start.lat, start.lon]} icon={endpointIcon(sameSpot ? 'S/H' : 'S', '#15803d')}>
              <Popup>
                <strong>Start</strong>
                <br />
                <span style={{ color: '#64748b' }}>{start.label}</span>
              </Popup>
            </Marker>
          )}
          {end && !sameSpot && (
            <Marker position={[end.lat, end.lon]} icon={endpointIcon('H', '#b45309')}>
              <Popup>
                <strong>Home</strong>
                <br />
                <span style={{ color: '#64748b' }}>{home?.address}</span>
              </Popup>
            </Marker>
          )}
          {ordered.map((a, i) => (
            <Marker key={a.id} position={[a.latitude!, a.longitude!]} icon={numberedIcon(i + 1)}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong>{a.customerName || 'Consultation'}</strong>
                  <br />
                  {fmt12(a.appointmentTime)} · {getRepName(a.assignedRepId)}
                  <br />
                  <span style={{ color: '#64748b' }}>{locationText(a)}</span>
                </div>
              </Popup>
            </Marker>
          ))}
          <FitBounds points={linePoints} />
        </MapContainer>
      </div>

      <div className="flex flex-col rounded-[0.5rem] border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-3">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#32639b]">Suggested Route</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-500">
            {ordered.length} stop{ordered.length !== 1 ? 's' : ''} ·{' '}
            {prefs.orderMode === 'time' ? 'appointment-time order' : start || end ? 'shortest drive' : 'nearest-first order'}
            {legKm.total > 0 && <> · ≈ {kmText(legKm.total)}</>}
          </p>

          {/* Start point */}
          <div className="mt-3">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-400">Start from</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <button
                type="button"
                className={pill(prefs.startMode === 'gps')}
                onClick={() => {
                  setPrefs({ startMode: 'gps' });
                  locate();
                }}
              >
                <Crosshair className="h-3 w-3" /> My location
              </button>
              <button type="button" className={pill(prefs.startMode === 'home')} onClick={() => setPrefs({ startMode: 'home' })}>
                <Home className="h-3 w-3" /> Home
              </button>
              <button
                type="button"
                className={pill(prefs.startMode === 'custom')}
                onClick={() => {
                  setPrefs({ startMode: 'custom' });
                  if (!prefs.customStart) setEditingCustom(true);
                }}
              >
                <Pencil className="h-3 w-3" /> Other
              </button>
              <button type="button" className={pill(prefs.startMode === 'none')} onClick={() => setPrefs({ startMode: 'none' })}>
                First stop
              </button>
            </div>
            {prefs.startMode === 'gps' && gpsStatus === 'locating' && (
              <p className="mt-1 text-xs font-semibold text-slate-400">Finding your location…</p>
            )}
            {prefs.startMode === 'gps' && gpsStatus === 'error' && (
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Couldn’t get your location. Allow location for this site, or pick “Other” and type where you are.{' '}
                <button type="button" onClick={locate} className="underline">
                  Retry
                </button>
              </p>
            )}
            {prefs.startMode === 'home' && homeLoaded && !home && !editingHome && (
              <button type="button" onClick={() => setEditingHome(true)} className="mt-1 text-xs font-bold text-[#32639b] underline">
                Set your home address
              </button>
            )}
            {prefs.startMode === 'custom' &&
              (editingCustom || !prefs.customStart ? (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      value={customDraft}
                      onChange={(e) => setCustomDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customDraft.trim()) setCustomStart();
                      }}
                      placeholder="Where are you starting from?"
                      className="min-w-0 flex-1 rounded-[0.5rem] border border-slate-200 px-2.5 py-1.5 text-sm font-semibold text-slate-800 outline-none focus:border-[#32639b]"
                    />
                    <button
                      type="button"
                      disabled={customBusy || !customDraft.trim()}
                      onClick={setCustomStart}
                      className="rounded-[0.5rem] bg-[#1B3C6C] px-3 text-xs font-black text-white disabled:opacity-50"
                    >
                      {customBusy ? '…' : 'Set'}
                    </button>
                  </div>
                  {customError && <p className="text-xs font-semibold text-red-600">{customError}</p>}
                </div>
              ) : (
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {prefs.customStart?.label}{' '}
                  <button type="button" onClick={() => setEditingCustom(true)} className="font-bold text-[#32639b] underline">
                    Change
                  </button>
                </p>
              ))}
          </div>

          {/* End point */}
          <div className="mt-3">
            <p className="text-[0.6rem] font-black uppercase tracking-[0.12em] text-slate-400">End at</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <button
                type="button"
                className={pill(prefs.endHome)}
                onClick={() => {
                  setPrefs({ endHome: true });
                  if (homeLoaded && !home) setEditingHome(true);
                }}
              >
                <Home className="h-3 w-3" /> Home
              </button>
              <button type="button" className={pill(!prefs.endHome)} onClick={() => setPrefs({ endHome: false })}>
                Last stop
              </button>
            </div>
            {home && !editingHome && (
              <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                <Home className="mr-1 inline h-3 w-3" />
                {home.address}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setHomeDraft(home.address);
                    setEditingHome(true);
                  }}
                  className="font-bold text-[#32639b] underline"
                >
                  Change
                </button>
              </p>
            )}
            {prefs.endHome && homeLoaded && !home && !editingHome && (
              <button type="button" onClick={() => setEditingHome(true)} className="mt-1 text-xs font-bold text-[#32639b] underline">
                Set your home address
              </button>
            )}
            {editingHome && homeEditor}
          </div>

          {/* Order */}
          <div className="mt-3 flex flex-wrap gap-1">
            <button type="button" className={pill(prefs.orderMode === 'drive')} onClick={() => setPrefs({ orderMode: 'drive' })}>
              Shortest drive
            </button>
            <button type="button" className={pill(prefs.orderMode === 'time')} onClick={() => setPrefs({ orderMode: 'time' })}>
              By appointment time
            </button>
          </div>
        </div>
        <div className="max-h-[18rem] flex-1 overflow-y-auto p-2 lg:max-h-none">
          {ordered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
              <MapPin className="h-7 w-7 text-slate-300" />
              <p className="mt-2 text-sm font-bold text-slate-500">No mappable consultations</p>
              <p className="mt-1 text-xs text-slate-400">Addresses for this day couldn’t be located on the map.</p>
            </div>
          ) : (
            <>
              {start && (
                <div className="flex items-start gap-2.5 rounded-[0.5rem] px-2 py-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-700 text-[0.65rem] font-black text-white">
                    S
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">Start</p>
                    <p className="truncate text-xs font-semibold text-slate-500">{start.label}</p>
                  </div>
                </div>
              )}
              {ordered.map((a, i) => (
                <div key={a.id}>
                  {legKm.into[i] != null && (
                    <p className="pl-10 text-[0.65rem] font-bold text-slate-400">↓ ≈ {kmText(legKm.into[i]!)}</p>
                  )}
                  <div className="flex items-start gap-2.5 rounded-[0.5rem] px-2 py-2 hover:bg-slate-50">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B3C6C] text-[0.7rem] font-black text-white">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">{a.customerName || 'Consultation'}</p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        {fmt12(a.appointmentTime)} · {locationText(a)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {home && legKm.toHome != null && (
                <>
                  <p className="pl-10 text-[0.65rem] font-bold text-slate-400">↓ ≈ {kmText(legKm.toHome)}</p>
                  <div className={`flex items-start gap-2.5 rounded-[0.5rem] px-2 py-2 ${prefs.endHome ? '' : 'opacity-60'}`}>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-700 text-white">
                      <Home className="h-3 w-3" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        Home{!prefs.endHome && <span className="font-semibold text-slate-400"> · not in route</span>}
                      </p>
                      <p className="truncate text-xs font-semibold text-slate-500">
                        ≈ {kmText(legKm.toHome)} from the last stop
                      </p>
                    </div>
                  </div>
                </>
              )}
              <p className="px-2 pt-1 text-[0.6rem] font-semibold text-slate-400">
                Distances are estimates — Google Maps has the real drive.
              </p>
            </>
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
                      {fmt12(a.appointmentTime)} · {locationText(a) || 'No address'}
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
