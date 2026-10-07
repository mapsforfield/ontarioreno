import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { otherBasementCities } from '../lib/basementCities';

/**
 * "Basement renovations by city" — plain links to every city basement guide,
 * grouped by region. On a city page, pass `current` to leave that city out and
 * lead with its neighbours. See src/lib/basementCities.ts for why.
 */
export function BasementCityLinks({ current }: { current?: string }) {
  const groups = otherBasementCities(current);
  return (
    <section className="border-t border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold tracking-[-0.02em] text-slate-900 md:text-3xl">
          {current ? 'Basement renovations in nearby cities' : 'Basement renovations by city'}
        </h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Local guides to finishing a basement or adding a legal suite: permits, typical costs, and what changes from city to city.
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.region}>
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{g.region}</h3>
              <ul className="mt-3 space-y-3">
                {g.cities.map((c) => (
                  <li key={c.name}>
                    <Link to={c.hub} className="inline-flex items-center gap-1.5 font-semibold text-[#1B3C6C] hover:underline">
                      <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                      Basement renovation in {c.name}
                    </Link>
                    {c.cost && (
                      <Link to={c.cost} className="ml-[1.375rem] block text-sm text-slate-500 hover:text-[#1B3C6C] hover:underline">
                        {c.name} basement costs
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
