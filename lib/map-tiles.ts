// The ONE place a public map's tile provider is chosen.
//
// Why this file exists: /grants used CARTO's free basemap until CARTO started
// requiring an API key (Sept 2026). Keyless requests still answer 200 OK with a
// real PNG — it just says "API KEY REQUIRED" — so nothing errored, nothing
// logged, and the map quietly turned into a watermark until someone looked.
//
// Three defences, all driven from this file:
//   1. Every map reads its URLs from here (guarded by map-tiles.test.ts, which
//      fails if a tile URL is hardcoded anywhere else).
//   2. Each map probes the primary provider on load and swaps to the fallback if
//      the probe fails — see probeTiles() and tileProbeScript().
//   3. scripts/map-tile-check.ts runs daily on GitHub Actions and alerts when
//      either provider stops serving real tiles, so a swap never goes unnoticed.
//
// How a broken provider is spotted: a "key required" / "access blocked" tile is
// the SAME image whatever tile you ask for. Real map tiles of two different
// places never are. So we fetch two known land tiles and compare bytes — that
// catches CARTO's watermark and OSM's "Access blocked" tile (both verified), and
// any future placeholder, without knowing what it looks like.

export type TileLayerSpec = { url: string; attribution: string; maxZoom: number };
export type TileProvider = {
  name: string;
  /** Drawn bottom-up. A second layer carries labels where the base has none. */
  layers: TileLayerSpec[];
  /** Two land tiles (z/x/y) that must differ. Toronto and Ottawa at z8. */
  probe: [string, string];
};

const ESRI_ATTR = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';

/** Esri light-grey canvas: keyless, same quiet look CARTO's light_all had. */
export const PRIMARY_TILES: TileProvider = {
  name: 'Esri World Light Gray',
  layers: [
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', attribution: ESRI_ATTR, maxZoom: 13 },
    { url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', attribution: '', maxZoom: 13 },
  ],
  probe: [
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/8/93/71',
    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/8/91/74',
  ],
};

/** OpenStreetMap standard — a different operator, so one outage can't take both. */
export const FALLBACK_TILES: TileProvider = {
  name: 'OpenStreetMap',
  layers: [
    { url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', maxZoom: 13 },
  ],
  probe: ['https://tile.openstreetmap.org/8/71/93.png', 'https://tile.openstreetmap.org/8/74/91.png'],
};

export type ProbeTile = { ok: boolean; contentType: string; bytes: Uint8Array };

/** Pure verdict on two probe tiles. Returns null when healthy, else the reason. */
export function tileProbeProblem(a: ProbeTile, b: ProbeTile): string | null {
  for (const t of [a, b]) {
    if (!t.ok) return 'probe tile did not return 200';
    if (!/^image\//i.test(t.contentType)) return `probe tile is ${t.contentType || 'not an image'}`;
    if (t.bytes.length < 200) return 'probe tile is empty';
  }
  if (a.bytes.length === b.bytes.length && a.bytes.every((v, i) => v === b.bytes[i])) {
    return 'two different places returned the same image — the provider is serving a placeholder (API key / blocked notice)';
  }
  return null;
}

/** Fetch both probe tiles and judge them. Never throws. */
export async function probeTiles(p: TileProvider, init?: RequestInit): Promise<string | null> {
  try {
    const [a, b] = await Promise.all(p.probe.map(async (url) => {
      const r = await fetch(url, init);
      return { ok: r.ok, contentType: r.headers.get('content-type') ?? '', bytes: new Uint8Array(await r.arrayBuffer()) };
    }));
    return tileProbeProblem(a, b);
  } catch (err) {
    return `probe request failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/**
 * The same probe-and-swap, as a plain-JS snippet for the server-rendered grant
 * hub (lib/grants.ts), which has no bundler. Expects `map` (a Leaflet map) in
 * scope; adds the primary layers, then swaps to the fallback if the probe fails.
 */
export function tileProbeScript(): string {
  const cfg = JSON.stringify({ p: PRIMARY_TILES, f: FALLBACK_TILES });
  return `(function(){var C=${cfg};var on=[];
function use(pv){on.forEach(function(l){map.removeLayer(l);});on=pv.layers.map(function(s){return L.tileLayer(s.url,{attribution:s.attribution,maxZoom:s.maxZoom}).addTo(map);});}
function get(u){return fetch(u,{cache:'no-store'}).then(function(r){return r.arrayBuffer().then(function(b){return{ok:r.ok,t:r.headers.get('content-type')||'',b:new Uint8Array(b)};});});}
use(C.p);
Promise.all(C.p.probe.map(get)).then(function(x){var a=x[0],b=x[1];
var bad=!a.ok||!b.ok||!/^image\\//i.test(a.t)||!/^image\\//i.test(b.t)||a.b.length<200||b.b.length<200||(a.b.length===b.b.length&&a.b.every(function(v,i){return v===b.b[i];}));
if(bad)use(C.f);}).catch(function(){use(C.f);});})();`;
}
