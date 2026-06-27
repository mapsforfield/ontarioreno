import { useEffect, useRef, useState } from 'react';

type Picked = { address: string; city: string; postalCode: string };
type Suggestion = { placeId: string; description: string };

function newToken(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

/**
 * Address field with Google Places autocomplete (accurate addresses, postal
 * codes and cities). The API key stays server-side — this only talks to our
 * own /api proxy. Degrades to a plain input if suggestions don't load.
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
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const skipNext = useRef(false);
  // One session token per "type + pick" cycle keeps it billed as a single,
  // cheaper autocomplete session.
  const tokenRef = useRef<string>(newToken());

  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    const q = value.trim();
    if (q.length < 3) { setResults([]); return; }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/appointments?_resource=places_autocomplete&input=${encodeURIComponent(q)}&token=${tokenRef.current}`,
          { credentials: 'include' },
        );
        const json = (await res.json()) as { suggestions?: Suggestion[] };
        setResults(json.suggestions ?? []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => window.clearTimeout(timer.current);
  }, [value]);

  const choose = async (item: Suggestion) => {
    skipNext.current = true;
    onChange(item.description); // immediate feedback
    setResults([]);
    setOpen(false);
    try {
      const res = await fetch(
        `/api/appointments?_resource=places_details&placeId=${encodeURIComponent(item.placeId)}&token=${tokenRef.current}`,
        { credentials: 'include' },
      );
      const p = (await res.json()) as Picked;
      if (p && p.address) {
        onSelect({ address: p.address, city: fillCityPostal ? p.city : '', postalCode: fillCityPostal ? p.postalCode : '' });
      }
    } catch {
      /* keep the description text we already set */
    }
    tokenRef.current = newToken(); // next lookup is a fresh session
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
          {results.map((r) => (
            <button
              key={r.placeId}
              type="button"
              onMouseDown={() => choose(r)}
              className="block w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-[#f6faff]"
            >
              {r.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
