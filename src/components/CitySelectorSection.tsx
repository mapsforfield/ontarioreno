import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Search, Sparkles } from 'lucide-react';
import { cityDirectory, featuredCities } from '../lib/cities';
import { cn } from '../lib/utils';

type CitySelectorSectionProps = {
  mode?: 'home' | 'page';
};

export default function CitySelectorSection({
  mode = 'home',
}: CitySelectorSectionProps) {
  const [query, setQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredCities = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (!normalized) return cityDirectory;

    return cityDirectory.filter((city) => {
      const haystack = `${city.name} ${city.descriptor} ${city.summary}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [query]);

  const featured = query.trim()
    ? filteredCities.slice(0, Math.min(3, filteredCities.length))
    : featuredCities.slice(0, 3);
  const secondary = filteredCities.filter(
    (city) => !featured.some((featuredCity) => featuredCity.name === city.name)
  );

  const fullBrowser = (
    <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
            Search cities
          </p>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Start with the nearest city guide, then move into costs,
            permits, and legal basement planning.
          </p>
        </div>

        <label className="relative block w-full max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Start typing your city (e.g. Ajax, Mississauga...)"
            className="w-full rounded-2xl border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-4 pl-12 pr-4 text-base text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-slate-400 focus:border-[#1B3C6C] focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <div className="relative mt-8 overflow-hidden rounded-[1.75rem] md:hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-white via-white/88 to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-white via-white/88 to-transparent" />
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredCities.map((city) => (
            <Link
              key={city.name}
              to={city.href}
              className="group min-w-[86%] snap-center rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_18px_38px_rgba(15,23,42,0.07)] transition duration-200 active:scale-[0.985]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {city.descriptor}
                  </p>
                  <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-slate-900">
                    {city.name}
                  </h3>
                </div>
                  <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-500 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                  <ArrowRight className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-4 text-base leading-7 text-slate-600">
                {city.summary}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-3">
        {filteredCities.map((city) => (
          <Link
            key={city.name}
            to={city.href}
            className="group rounded-[1.75rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.08)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {city.descriptor}
                </p>
                <h3 className="mt-3 text-2xl font-bold tracking-[-0.02em] text-slate-900">
                  {city.name}
                </h3>
              </div>
              <span className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition group-hover:border-[#1B3C6C]/20 group-hover:text-[#1B3C6C]">
                <ArrowRight className="h-5 w-5" />
              </span>
            </div>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {city.summary}
            </p>
          </Link>
        ))}
      </div>

      {filteredCities.length === 0 && (
        <div className="mt-8 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center text-slate-500">
          No cities matched that search yet.
        </div>
      )}
    </div>
  );

  if (mode === 'page') {
    return (
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              <MapPin className="h-4 w-4 text-[#1B3C6C]" />
              Ontario city index
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.03em] text-slate-900 md:text-6xl">
              Explore OntarioReno by city
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Explore basement renovation costs, permits, and legal basement
              rules by city.
            </p>
          </div>

          <div className="mt-12">{fullBrowser}</div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] shadow-[0_1px_2px_rgba(15,23,42,0.03),0_24px_70px_rgba(15,23,42,0.06)]">
          <div className="grid gap-10 p-6 md:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.3fr)] lg:p-10">
            <div className="flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                  <Sparkles className="h-4 w-4 text-[#1B3C6C]" />
                  Curated city guides
                </div>
                <h2 className="mt-6 text-3xl font-bold tracking-[-0.03em] text-slate-900 md:text-5xl">
                  Find your city
                </h2>
                <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                  Explore basement renovation costs, permits, and legal basement
                  rules by city.
                </p>
                <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
                  Start with your city to see real costs, permit requirements,
                  and what actually applies to your property.
                </p>
              </div>

              <div className="mt-8 space-y-4">
                {featured.map((city, index) => (
                  <Link
                    key={city.name}
                    to={city.href}
                    className={`group block overflow-hidden rounded-[1.75rem] border transition duration-200 ${
                      index === 0
                        ? 'border-slate-900 bg-slate-900 text-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_50px_rgba(15,23,42,0.18)]'
                        : 'border-slate-200/80 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_18px_40px_rgba(15,23,42,0.08)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 p-5">
                      <div>
                        <p
                          className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                            index === 0 ? 'text-blue-200' : 'text-slate-500'
                          }`}
                        >
                          {city.descriptor}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold tracking-[-0.02em]">
                          {city.name}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition ${
                          index === 0
                            ? 'border-white/15 bg-white/10 text-white'
                            : 'border-slate-200/80 bg-slate-50 text-slate-500 group-hover:border-[#1B3C6C]/20 group-hover:text-[#1B3C6C]'
                        }`}
                      >
                        <ArrowRight className="h-5 w-5" />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-5 shadow-sm md:p-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Search cities
                  </p>
                  <p className="mt-2 text-base leading-7 text-slate-600">
                    Start with the nearest city guide, then move into costs,
                    permits, and legal basement planning.
                  </p>
                </div>

                <label className="relative block w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Start typing your city (e.g. Ajax, Mississauga...)"
                    className="w-full rounded-2xl border border-slate-300 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-4 pl-12 pr-4 text-base text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.03),0_10px_24px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-slate-400 focus:border-[#1B3C6C] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {secondary.map((city) => (
                  <Link
                    key={city.name}
                    to={city.href}
                    className="group rounded-[1.4rem] border border-slate-200/80 bg-slate-50/70 px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-[0_1px_2px_rgba(15,23,42,0.03),0_16px_30px_rgba(15,23,42,0.06)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {city.name}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {city.descriptor}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:text-[#1B3C6C]" />
                    </div>
                  </Link>
                ))}
              </div>
              {filteredCities.length === 0 && (
                <div className="mt-6 rounded-[1.4rem] border border-dashed border-slate-300 bg-slate-50 px-5 py-6 text-center text-sm text-slate-500">
                  No matching city yet. Try a nearby city or browse the full index.
                </div>
              )}

              <div className="mt-6 border-t border-slate-200/80 pt-5">
                <button
                  type="button"
                  onClick={() => setIsExpanded((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-sm font-semibold tracking-[-0.01em] text-slate-900 transition hover:border-slate-300 hover:bg-white"
                >
                  {isExpanded ? 'Show fewer cities' : 'View all cities'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div
            className={cn(
              'grid transition-all duration-300 ease-out',
              isExpanded ? 'mt-8 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            )}
          >
            <div className="overflow-hidden">
              <div className="rounded-t-none border-t-0">{fullBrowser}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
