import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, ArrowRight, ShieldCheck, MapPin, ChevronDown } from 'lucide-react';
import { buttonStyles, formStyles, eyebrowStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';

// Public, data-driven grant landing page. Content comes from a published
// GrantLandingPage record (drafted by AI + reviewed in the portal). One template,
// any number of pages at /grants/:slug — no per-page code or deploy.

// Same consultation funnel the /match project review posts to.
const LEAD_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyi1JG7OXDwCghiVQb2PaOEME7ZByUa8Mxl3N7xbTCCaL07Bdrx3h01dA4YisDPV_Yw/exec';

type Page = {
  slug: string; city: string; heroEyebrow: string; heroTitle: string; heroSubtitle: string;
  amountLabel: string; intro: string;
  sections: Array<{ heading: string; body: string }> | null;
  eligibility: string[] | null;
  faqs: Array<{ q: string; a: string }> | null;
  ctaHeading: string; ctaText: string; seoTitle: string; seoDescription: string;
  officialSourceUrl?: string | null; officialSourceLabel?: string;
};

export default function GrantLandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<Page | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'notfound'>('loading');
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    setState('loading');
    fetch(`/api/appointments?resource=grant-page&slug=${encodeURIComponent(slug ?? '')}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => { if (alive) { setPage(data); setState('ready'); } })
      .catch(() => { if (alive) setState('notfound'); });
    return () => { alive = false; };
  }, [slug]);

  if (state === 'loading') {
    return <div className="flex min-h-[60vh] items-center justify-center text-slate-400">Loading…</div>;
  }
  if (state === 'notfound' || !page) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Page not found</h1>
        <p className="text-slate-600">This grant page isn’t available.</p>
        <Link to="/" className={buttonStyles.primary}>Back to OntarioReno</Link>
      </div>
    );
  }

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="bg-slate-50">
      <Helmet>
        <title>{page.seoTitle || page.heroTitle}</title>
        <meta name="description" content={page.seoDescription || page.heroSubtitle} />
        <meta property="og:title" content={page.seoTitle || page.heroTitle} />
        <meta property="og:description" content={page.seoDescription || page.heroSubtitle} />
        <link rel="canonical" href={`https://ontarioreno.ca/grants/${page.slug}`} />
      </Helmet>

      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24 lg:px-8">
          <div>
            {page.heroEyebrow && (
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                <MapPin className="h-4 w-4" /> {page.heroEyebrow}
              </div>
            )}
            <h1 className="text-4xl font-bold leading-[1.05] tracking-[-0.035em] md:text-5xl">{page.heroTitle}</h1>
            {page.amountLabel && (
              <p className="mt-5 inline-block rounded-xl bg-emerald-500/15 px-4 py-2 text-xl font-bold text-emerald-300">{page.amountLabel}</p>
            )}
            <p className="mt-5 max-w-xl text-lg text-slate-300">{page.heroSubtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={scrollToForm} className={buttonStyles.primary}>
                {page.ctaText || 'Book a free consultation'} <ArrowRight className="h-5 w-5" />
              </button>
              <a href="#how" className={buttonStyles.ghostDark}>How it works</a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-slate-400">
              <ShieldCheck className="h-4 w-4" /> Free, no-obligation consultation with a local specialist
            </p>
          </div>

          {/* Inline lead form (top of page) */}
          <div ref={formRef}>
            <LeadForm page={page} />
          </div>
        </div>
      </section>

      {/* Intro */}
      {page.intro && (
        <section className="mx-auto max-w-3xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <p className={eyebrowStyles}>The opportunity</p>
          <p className="mt-4 text-xl leading-relaxed text-slate-700">{page.intro}</p>
        </section>
      )}

      {/* Sections */}
      {page.sections && page.sections.length > 0 && (
        <section id="how" className="bg-white py-16">
          <div className="mx-auto grid max-w-5xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8">
            {page.sections.map((s, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-7 shadow-sm">
                <h3 className="text-xl font-bold tracking-[-0.02em] text-slate-900">{s.heading}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Eligibility */}
      {page.eligibility && page.eligibility.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-[-0.03em] text-slate-900">Do you qualify?</h2>
            <ul className="mt-8 space-y-3">
              {page.eligibility.map((e, i) => (
                <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <span className="text-slate-700">{e}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-sm text-slate-500">
              Not sure if you qualify? That’s exactly what the free consultation is for — we’ll check for you.
            </p>
            <div className="mt-6 text-center">
              <button onClick={scrollToForm} className={buttonStyles.primary}>{page.ctaText} <ArrowRight className="h-5 w-5" /></button>
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {page.faqs && page.faqs.length > 0 && (
        <section className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-3xl font-bold tracking-[-0.03em] text-slate-900">Common questions</h2>
            <div className="mt-8 divide-y divide-slate-200">
              {page.faqs.map((f, i) => <Faq key={i} q={f.q} a={f.a} />)}
            </div>
          </div>
        </section>
      )}

      {page.officialSourceUrl && (
        <section className="border-t border-slate-200 bg-white py-5">
          <p className="mx-auto max-w-3xl px-4 text-center text-sm text-slate-600 sm:px-6 lg:px-8">
            Official source: Verify current program details on the{' '}
            <a href={page.officialSourceUrl} target="_blank" rel="noopener noreferrer" className="inline-block min-h-11 py-3 font-semibold text-[#1B3C6C] underline decoration-slate-300 underline-offset-2">
              {page.officialSourceLabel || page.city || 'program administrator'} website ↗
            </a>
          </p>
        </section>
      )}

      {/* Final CTA */}
      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-[-0.03em]">{page.ctaHeading || `Ready to explore your ${page.city} grant?`}</h2>
          <p className="mt-3 text-slate-300">Book a free consultation — we’ll confirm your eligibility and map out next steps.</p>
          <div className="mt-7">
            <button onClick={scrollToForm} className={buttonStyles.primary}>{page.ctaText} <ArrowRight className="h-5 w-5" /></button>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Grant amounts and eligibility are set by the municipality and can change — we’ll confirm the current details with you directly.
          </p>
        </div>
      </section>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="py-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-4 text-left">
        <span className="font-semibold text-slate-900">{q}</span>
        <ChevronDown className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <p className="mt-3 leading-relaxed text-slate-600">{a}</p>}
    </div>
  );
}

function LeadForm({ page }: { page: Page }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '', companyWebsite: '' });
  const [status, setStatus] = useState<{ type: 'idle' | 'error' | 'success'; message: string }>({ type: 'idle', message: '' });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const source = useMemo(() => `grant-${page.slug}`, [page.slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.companyWebsite) return; // honeypot tripped
    if (!form.name.trim() || (!form.phone.trim() && !form.email.trim())) {
      setStatus({ type: 'error', message: 'Please add your name and a phone or email.' });
      return;
    }
    setBusy(true);
    setStatus({ type: 'idle', message: '' });
    const payload = {
      type: 'grant',
      source,
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      address: form.address.trim(),
      city: page.city,
      projectType: 'ADU / Grant',
      notes: `Grant landing page lead — ${page.heroTitle} (${page.city}).\nPage: ${typeof window !== 'undefined' ? window.location.href : ''}`,
      pageUrl: typeof window !== 'undefined' ? window.location.href : '',
    };
    try {
      await fetch(LEAD_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(payload) });
      setStatus({ type: 'success', message: "Got it — we’ll call you shortly to confirm your eligibility and next steps." });
    } catch {
      setStatus({ type: 'error', message: 'Something went wrong. Please try again or email info@ontarioreno.ca.' });
    } finally {
      setBusy(false);
    }
  };

  if (status.type === 'success') {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl bg-white p-8 text-center text-slate-900 shadow-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        <h3 className="mt-4 text-xl font-bold">You’re on the list</h3>
        <p className="mt-2 text-slate-600">{status.message}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl sm:p-7">
      <h3 className="text-lg font-bold tracking-[-0.02em]">Check your eligibility — free</h3>
      <p className="mt-1 text-sm text-slate-500">A local specialist will call you back. No cost, no obligation.</p>
      <div className="mt-5 space-y-3">
        <div>
          <label className={formStyles.label}>Full name</label>
          <input value={form.name} onChange={set('name')} className={formStyles.field} placeholder="Jane Doe" autoComplete="name" />
        </div>
        <div>
          <label className={formStyles.label}>Phone</label>
          <input value={form.phone} onChange={set('phone')} className={formStyles.field} placeholder="(905) 555-0199" inputMode="tel" autoComplete="tel" />
        </div>
        <div>
          <label className={formStyles.label}>Email</label>
          <input value={form.email} onChange={set('email')} className={formStyles.field} placeholder="jane@email.com" inputMode="email" autoComplete="email" />
        </div>
        <div>
          <label className={formStyles.label}>Property address <span className="font-normal text-slate-400">(optional)</span></label>
          <input value={form.address} onChange={set('address')} className={formStyles.field} placeholder="123 Main St" autoComplete="street-address" />
        </div>
        {/* Honeypot */}
        <input value={form.companyWebsite} onChange={set('companyWebsite')} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      </div>
      {status.type === 'error' && <p className="mt-3 text-sm font-medium text-red-600">{status.message}</p>}
      <button type="submit" disabled={busy} className={cn(buttonStyles.primary, 'mt-5 w-full')}>
        {busy ? 'Submitting…' : page.ctaText || 'Book a free consultation'}
      </button>
      <p className="mt-3 text-center text-xs text-slate-400">By submitting you agree to be contacted about your project.</p>
    </form>
  );
}
