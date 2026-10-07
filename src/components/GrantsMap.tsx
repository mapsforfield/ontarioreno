import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { FALLBACK_TILES, PRIMARY_TILES, probeTiles, type TileProvider } from '../../lib/map-tiles';

// The /grants hub's Leaflet map, moved out of GrantsHub.tsx unchanged so the
// page can load it only in the browser: Leaflet touches `window` the moment it
// is imported, which crashes the build-time pre-render. GrantsHub lazy-loads
// this after mount; the pins' CSS (.atag, .ocluster, .grantmapbox) still lives
// in GrantsHub's CSS block.

export type MapCity = { city: string; lat: number; lng: number; count: number; amount: string; href: string };

function tagIcon(c: MapCity) {
  const badge = c.count > 1 ? `<i>${c.count}</i>` : '';
  return L.divIcon({ className: '', html: `<div class="atag">${c.amount || 'Incentive'}${badge}</div>`, iconSize: [0, 0], iconAnchor: [0, 0], popupAnchor: [0, -42] });
}

const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Cluster nearby pins so the dense Golden Horseshoe doesn't overlap into a blob;
// spread-out cities keep their amount pins. Click a cluster to expand.
function ClusterLayer({ cities }: { cities: MapCity[] }) {
  const map = useMap();
  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 48,
      showCoverageOnHover: false,
      spiderfyDistanceMultiplier: 1.6,
      iconCreateFunction: (cluster) => L.divIcon({ html: `<div class="ocluster">${cluster.getChildCount()}</div>`, className: '', iconSize: L.point(42, 42) }),
    });
    cities.forEach((c) => {
      const m = L.marker([c.lat, c.lng], { icon: tagIcon(c) });
      m.bindPopup(`<div class="grantpop"><b>${esc(c.city)}</b><br>${c.count} program${c.count > 1 ? 's' : ''}${c.amount ? ` · ${esc(c.amount)}` : ''}<br><a href="${esc(c.href)}">View →</a></div>`);
      m.on('mouseover', () => m.openPopup());
      group.addLayer(m);
    });
    map.addLayer(group);
    return () => { map.removeLayer(group); };
  }, [cities, map]);
  return null;
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

export default function GrantsMap({ cities }: { cities: MapCity[] }) {
  // Render the primary tiles straight away, then swap to the fallback if the
  // probe says the provider is serving a placeholder. See lib/map-tiles.ts.
  const [tiles, setTiles] = useState<TileProvider>(PRIMARY_TILES);
  useEffect(() => {
    probeTiles(PRIMARY_TILES).then((problem) => {
      if (problem) {
        console.warn(`[grants map] ${PRIMARY_TILES.name} unusable (${problem}); using ${FALLBACK_TILES.name}`);
        setTiles(FALLBACK_TILES);
      }
    });
  }, []);

  return (
    <MapContainer center={[43.95, -79.2]} zoom={8} scrollWheelZoom={false} className="grantmapbox">
      {tiles.layers.map((l) => <TileLayer key={l.url} url={l.url} attribution={l.attribution} maxZoom={l.maxZoom} />)}
      <ClusterLayer cities={cities} />
      <FitCore cities={cities} />
    </MapContainer>
  );
}
