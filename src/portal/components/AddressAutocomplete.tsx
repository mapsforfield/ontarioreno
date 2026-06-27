import { useEffect, useRef, useState } from 'react';

type Picked = { address: string; city: string; postalCode: string };

type NominatimItem = {
  display_name: string;
  address?: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    hamlet?: string;
    postcode?: string;
  };
};

/**
 * Address field with Canada-wide autocomplete (OpenStreetMap/Nominatim, free).
 * Debounced; on select it fills address + (optionally) city + postal code via
 * onSelect. The parent owns the text value, so it degrades to a plain input if
 * suggestions don't load.
 */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  fillCityPostal = true,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (p: Picked) => void;
  placeholder?: string;
  fillCityPostal?: boolean;
}) {
  const [results, setResults] = useState<NominatimItem[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const skipNext = useRef(false);

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    const q = value.trim();
    if (q.length < 4) { setResults([]); return; }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=ca&limit=5&q=${encodeURIComponent(q)}`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        const json = await res.json();
        setResults(Array.isArray(json) ? json : []);
      } catch {
        setResults([]);
      }
    }, 450);
    return () => window.clearTimeout(timer.current);
  }, [value]);

  const choose = (item: NominatimItem) => {
    const a = item.address ?? {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    const city = a.city || a.town || a.village || a.municipality || a.hamlet || '';
    const postalCode = a.postcode || '';
    skipNext.current = true;
    const address = street || item.display_name.split(',')[0];
    onSelect({ address, city: fillCityPostal ? city : '', postalCode: fillCityPostal ? postalCode : '' });
    setResults([]);
    setOpen(false);
  };

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto divide-y divide-slate-100 rounded-[0.5rem] border border-slate-200 bg-white shadow-lg">
          {results.map((r, i) => (
            <button
              key={`${r.display_name}-${i}`}
              type="button"
              onMouseDown={() => choose(r)}
              className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6faff]"
            >
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
