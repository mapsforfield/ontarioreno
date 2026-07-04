import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ExternalLink, FileText, Loader2, Plus, RadarIcon, RefreshCw,
  Sparkles, Target, Trash2, Wand2, X,
} from 'lucide-react';
import { usePortalAuth } from '../auth';

// Admin-only "Grant Radar": surfaces government renovation / ADU / basement
// incentive programs detected by the daily scan. Read/act here; verify the source
// link before spending ad budget. All data comes from /api/appointments?resource=grants.

const API = '/api/appointments?resource=grants';

type Program = {
  id: string; name: string; city: string; jurisdiction: string; status: string;
  category: string; maxAmount: string; eligibility: string; deadline: string;
  summary: string; sourceUrl: string; relevanceScore: number; reviewState: string;
  linkUrl: string; firstSeenAt: string; changedAt: string | null;
};
type Source = {
  id: string; name: string; url: string; jurisdiction: string; category: string;
  pageType: string; hafLinked: boolean; active: boolean; lastCheckedAt: string | null; lastError: string;
};
type Municipality = {
  id: string; name: string; slug: string; hafRecipient: boolean;
  discoveryState: string; lastDiscoveryAt: string | null;
};
type LandingPage = {
  id: string; programId: string | null; slug: string; city: string; status: string;
  heroEyebrow: string; heroTitle: string; heroSubtitle: string; amountLabel: string; intro: string;
  sections: Array<{ heading: string; body: string }> | null;
  eligibility: string[] | null;
  faqs: Array<{ q: string; a: string }> | null;
  ctaHeading: string; ctaText: string; seoTitle: string; seoDescription: string;
  drift?: boolean;
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  upcoming: 'bg-amber-100 text-amber-700',
  closed: 'bg-slate-200 text-slate-500',
  unknown: 'bg-slate-100 text-slate-500',
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold capitalize ${STATUS_STYLES[status] ?? STATUS_STYLES.unknown}`}>
      {status}
    </span>
  );
}

function ProgramCard({ p, onAction, busy, page, onGenerate, onEditPage, onSetLink, generating }: {
  p: Program;
  onAction: (id: string, reviewState: string) => void;
  busy: boolean;
  page?: LandingPage;
  onGenerate?: () => void;
  onEditPage?: () => void;
  onSetLink?: (url: string) => void;
  generating?: boolean;
}) {
  const [link, setLinkVal] = useState(p.linkUrl ?? '');
  return (
    <div className="flex flex-col gap-2 rounded-[0.5rem] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-black tracking-[-0.01em] text-slate-900">{p.name}</h3>
            <StatusPill status={p.status} />
            {p.changedAt && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">changed</span>}
          </div>
          <p className="mt-0.5 text-sm font-semibold text-[#32639b]">
            {p.city || p.jurisdiction}{p.maxAmount ? ` · ${p.maxAmount}` : ''}{p.deadline ? ` · deadline ${p.deadline}` : ''}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end">
          <span className="text-2xl font-black leading-none text-[#1B3C6C]">{p.relevanceScore}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">score</span>
        </div>
      </div>
      {p.summary && <p className="text-sm text-slate-600">{p.summary}</p>}
      {p.eligibility && <p className="text-xs text-slate-500"><span className="font-bold">Who:</span> {p.eligibility}</p>}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <a
          href={p.sourceUrl} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Verify source
        </a>
        {p.reviewState !== 'targeting' && (
          <button
            type="button" disabled={busy} onClick={() => onAction(p.id, 'targeting')}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
          >
            <Target className="h-3.5 w-3.5" /> Targeting
          </button>
        )}
        {p.reviewState === 'new' && (
          <button
            type="button" disabled={busy} onClick={() => onAction(p.id, 'reviewed')}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Mark reviewed
          </button>
        )}
        {p.reviewState !== 'dismissed' && (
          <button
            type="button" disabled={busy} onClick={() => onAction(p.id, 'dismissed')}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Dismiss
          </button>
        )}
        {page ? (
          <button
            type="button" onClick={onEditPage}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
          >
            <FileText className="h-3.5 w-3.5" /> {page.status === 'published' ? 'Live page — edit' : 'Draft page — edit'}
          </button>
        ) : (
          <button
            type="button" disabled={generating} onClick={onGenerate}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            {generating ? 'Generating…' : 'Generate page'}
          </button>
        )}
      </div>
      {onSetLink && (
        <div className="mt-1 flex items-center gap-2">
          <input
            value={link}
            onChange={(e) => setLinkVal(e.target.value)}
            onBlur={() => { if (link !== (p.linkUrl ?? '')) onSetLink(link); }}
            placeholder="Hub link URL (e.g. /hamilton-grant-guide) — optional"
            className="min-w-0 flex-1 rounded-[0.5rem] border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 outline-none focus:border-[#1B3C6C]"
          />
          {p.linkUrl && <span className="shrink-0 text-[10px] font-bold uppercase text-emerald-600">linked</span>}
        </div>
      )}
    </div>
  );
}

export default function PortalGrants() {
  const { isAdmin } = usePortalAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [landingPages, setLandingPages] = useState<LandingPage[]>([]);
  const [editing, setEditing] = useState<LandingPage | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [rebuilding, setRebuilding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch(API, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSources(data.sources ?? []);
      setPrograms(data.programs ?? []);
      setMunicipalities(data.municipalities ?? []);
      setLandingPages(data.landingPages ?? []);
    } catch {
      setNotice('Could not load Grant Radar data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runScan = async () => {
    setScanning(true);
    setNotice('');
    try {
      const res = await fetch(`${API}&action=scan`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setNotice(`Scanned ${data.checked} sources · ${data.newPrograms} new · ${data.updatedPrograms} changed${data.errors ? ` · ${data.errors} errors` : ''}. Click again to continue through the list.`);
      await load();
    } catch (err) {
      setNotice(`Scan failed: ${(err as Error).message}`);
    } finally {
      setScanning(false);
    }
  };

  const discover = async () => {
    setDiscovering(true);
    setNotice('');
    try {
      const res = await fetch(`${API}&action=discover`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Discovery failed');
      setNotice(`Searched ${data.cities} cities · found ${data.pagesFound} pages (${data.moneyPages} with money, ${data.futurePages} upcoming). Click again for more cities.`);
      await load();
    } catch (err) {
      setNotice(`Discovery failed: ${(err as Error).message}. (Discovery needs TAVILY_API_KEY — normally it runs on the GitHub Actions worker.)`);
    } finally {
      setDiscovering(false);
    }
  };

  const rebuild = async () => {
    if (!confirm('Rebuild wipes all detected programs (including your Targeting picks) and rescans the curated source list from scratch. Continue?')) return;
    setRebuilding(true);
    setNotice('');
    try {
      const res = await fetch(`${API}&action=reset`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Rebuild failed');
      setNotice(`Rebuilt clean · scanned ${data.checked} sources · ${data.newPrograms} programs found${data.errors ? ` · ${data.errors} errors` : ''}.`);
      await load();
    } catch (err) {
      setNotice(`Rebuild failed: ${(err as Error).message}`);
    } finally {
      setRebuilding(false);
    }
  };

  const seed = async () => {
    setNotice('');
    const res = await fetch(`${API}&action=seed`, { method: 'POST', credentials: 'include' });
    const data = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Watch-list ready (${data.added ?? 0} added).` : 'Seed failed.');
    await load();
  };

  const act = async (id: string, reviewState: string) => {
    setBusyId(id);
    // Optimistic update.
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, reviewState } : p)));
    try {
      await fetch(`${API}&id=${encodeURIComponent(id)}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reviewState }),
      });
    } catch {
      await load(); // reconcile on failure
    } finally {
      setBusyId(null);
    }
  };

  const pageByProgram = useMemo(() => {
    const m = new Map<string, LandingPage>();
    for (const pg of landingPages) if (pg.programId) m.set(pg.programId, pg);
    return m;
  }, [landingPages]);

  const generatePage = async (programId: string) => {
    setGeneratingId(programId);
    setNotice('');
    try {
      const res = await fetch(`${API}&action=generate-page&id=${encodeURIComponent(programId)}`, { method: 'POST', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      const fresh = await (await fetch(API, { credentials: 'include' })).json();
      setLandingPages(fresh.landingPages ?? []);
      const newPage = (fresh.landingPages ?? []).find((p: LandingPage) => p.id === data.id);
      if (newPage) setEditing(newPage);
    } catch (err) {
      setNotice(`Page generation failed: ${(err as Error).message}`);
    } finally {
      setGeneratingId(null);
    }
  };

  const savePage = async (patch: Partial<LandingPage> & { id: string }) => {
    const res = await fetch(`${API}&action=save-page`, {
      method: 'POST', credentials: 'include',
      headers: { 'content-type': 'application/json' }, body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Save failed');
    await load();
    return data.page as LandingPage;
  };

  const deletePage = async (id: string) => {
    if (!confirm('Delete this landing page? If it was published it will go offline.')) return;
    await fetch(`${API}&action=delete-page&id=${encodeURIComponent(id)}`, { method: 'POST', credentials: 'include' });
    setEditing(null);
    await load();
  };

  const setLink = async (id: string, linkUrl: string) => {
    setPrograms((prev) => prev.map((p) => (p.id === id ? { ...p, linkUrl } : p)));
    try {
      await fetch(`${API}&id=${encodeURIComponent(id)}`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ linkUrl }),
      });
    } catch { await load(); }
  };

  const needsReview = useMemo(
    () => programs.filter((p) => p.reviewState === 'new' || (p.changedAt && p.reviewState !== 'dismissed' && p.reviewState !== 'targeting')),
    [programs]
  );
  const targeting = useMemo(() => programs.filter((p) => p.reviewState === 'targeting'), [programs]);
  const active = useMemo(
    () => programs.filter((p) => p.reviewState !== 'dismissed' && !needsReview.includes(p) && p.reviewState !== 'targeting'),
    [programs, needsReview]
  );
  const deadSources = useMemo(() => sources.filter((s) => s.lastError), [sources]);

  if (!isAdmin) {
    return <div className="p-6 text-sm font-semibold text-slate-600">Admin access required.</div>;
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            <RadarIcon className="h-4 w-4" /> Grant Radar
          </p>
          <h1 className="mt-1 text-3xl font-black tracking-[-0.02em]">Government program monitor</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Detects active renovation / ADU / basement incentive programs across Ontario so you can build a page and run ads before competitors. Always click <em>Verify source</em> before acting.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {sources.length === 0 && (
            <button type="button" onClick={seed}
              className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-[#b8c9dd]">
              <Sparkles className="h-4 w-4" /> Seed watch-list
            </button>
          )}
          <button type="button" onClick={discover} disabled={discovering || scanning || rebuilding}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C] disabled:opacity-50">
            {discovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <RadarIcon className="h-4 w-4" />}
            {discovering ? 'Discovering…' : 'Discover cities'}
          </button>
          <button type="button" onClick={rebuild} disabled={rebuilding || scanning}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C] disabled:opacity-50">
            {rebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {rebuilding ? 'Rebuilding…' : 'Rebuild'}
          </button>
          <button type="button" onClick={runScan} disabled={scanning || rebuilding}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {scanning ? 'Scanning…' : 'Scan now'}
          </button>
        </div>
      </header>

      {notice && (
        <div className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#eef3f9] px-4 py-3 text-sm font-semibold text-[#1B3C6C]">{notice}</div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 p-8 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
      ) : (
        <>
          <Section title="Needs review" count={needsReview.length} accent
            empty="Nothing new to review. The daily scan will surface new or changed programs here.">
            {needsReview.map((p) => <ProgramCard key={p.id} p={p} onAction={act} busy={busyId === p.id} page={pageByProgram.get(p.id)} onGenerate={() => generatePage(p.id)} onEditPage={() => { const pg = pageByProgram.get(p.id); if (pg) setEditing(pg); }} generating={generatingId === p.id} onSetLink={(url) => setLink(p.id, url)} />)}
          </Section>

          {targeting.length > 0 && (
            <Section title="Targeting" count={targeting.length}>
              {targeting.map((p) => <ProgramCard key={p.id} p={p} onAction={act} busy={busyId === p.id} page={pageByProgram.get(p.id)} onGenerate={() => generatePage(p.id)} onEditPage={() => { const pg = pageByProgram.get(p.id); if (pg) setEditing(pg); }} generating={generatingId === p.id} onSetLink={(url) => setLink(p.id, url)} />)}
            </Section>
          )}

          <Section title="Active programs" count={active.length}
            empty="No confirmed active programs yet — run a scan or wait for the daily sweep.">
            {active.map((p) => <ProgramCard key={p.id} p={p} onAction={act} busy={busyId === p.id} page={pageByProgram.get(p.id)} onGenerate={() => generatePage(p.id)} onEditPage={() => { const pg = pageByProgram.get(p.id); if (pg) setEditing(pg); }} generating={generatingId === p.id} onSetLink={(url) => setLink(p.id, url)} />)}
          </Section>

          <div className="rounded-[0.5rem] border border-slate-200 bg-white p-4 text-xs text-slate-500">
            <p className="font-bold text-slate-600">
              Registry: {municipalities.length} Ontario cities ·{' '}
              <span className="text-emerald-700">{municipalities.filter((m) => m.discoveryState === 'verified').length} with money</span> ·{' '}
              <span className="text-amber-700">{municipalities.filter((m) => m.discoveryState === 'watching').length} upcoming</span> ·{' '}
              {municipalities.filter((m) => m.discoveryState === 'candidate').length} not yet searched
            </p>
            <p className="mt-1">Watching {sources.filter((s) => s.active).length} live pages ({sources.filter((s) => s.pageType === 'money').length} money, {sources.filter((s) => s.pageType === 'future').length} upcoming). Discovery + daily scan run automatically on the worker.</p>
            {deadSources.length > 0 && (
              <div className="mt-2 flex items-start gap-2 text-amber-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{deadSources.length} source URL{deadSources.length > 1 ? 's' : ''} errored on last check (likely moved): {deadSources.map((s) => s.name).join(', ')}. Update the URL in the seed list.</span>
              </div>
            )}
          </div>
        </>
      )}

      {editing && (
        <PageEditor
          page={editing}
          onClose={() => setEditing(null)}
          onSave={savePage}
          onDelete={() => deletePage(editing.id)}
        />
      )}
    </div>
  );
}

function Section({ title, count, children, empty, accent }: {
  title: string; count: number; children: React.ReactNode; empty?: string; accent?: boolean;
}) {
  return (
    <section className={`rounded-[0.5rem] border p-4 shadow-sm sm:p-5 ${accent && count > 0 ? 'border-[#1B3C6C] bg-[#f7faff]' : 'border-white bg-white'}`}>
      <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-black tracking-[-0.01em]">{title}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">{count}</span>
      </div>
      {count === 0 ? (
        <p className="py-4 text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">{children}</div>
      )}
    </section>
  );
}

// ─── Landing-page editor (review AI draft → edit → publish) ───────────────────
function PageEditor({ page, onClose, onSave, onDelete }: {
  page: LandingPage;
  onClose: () => void;
  onSave: (patch: Partial<LandingPage> & { id: string }) => Promise<LandingPage>;
  onDelete: () => void;
}) {
  const [d, setD] = useState<LandingPage>({
    ...page,
    sections: page.sections ?? [],
    eligibility: page.eligibility ?? [],
    faqs: page.faqs ?? [],
  });
  const [busy, setBusy] = useState<string>('');
  const [msg, setMsg] = useState('');
  const field = (k: keyof LandingPage) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD((s) => ({ ...s, [k]: e.target.value }));

  const persist = async (status?: string) => {
    setBusy(status === 'published' ? 'publish' : status === 'draft' ? 'unpublish' : 'save');
    setMsg('');
    try {
      await onSave({
        id: d.id, slug: d.slug, heroEyebrow: d.heroEyebrow, heroTitle: d.heroTitle, heroSubtitle: d.heroSubtitle,
        amountLabel: d.amountLabel, intro: d.intro, sections: d.sections, eligibility: d.eligibility, faqs: d.faqs,
        ctaHeading: d.ctaHeading, ctaText: d.ctaText, seoTitle: d.seoTitle, seoDescription: d.seoDescription,
        ...(status ? { status } : {}),
      });
      if (status) setD((s) => ({ ...s, status }));
      setMsg(status === 'published' ? 'Published — your page is live.' : status === 'draft' ? 'Unpublished — page is offline.' : 'Saved.');
    } catch (err) {
      setMsg(`Failed: ${(err as Error).message}`);
    } finally {
      setBusy('');
    }
  };

  const input = 'w-full rounded-[0.5rem] border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#1B3C6C]';
  const label = 'mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-8 w-full max-w-3xl rounded-[0.75rem] bg-white p-5 shadow-2xl sm:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-[-0.02em]">Landing page</h2>
              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${d.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{d.status}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Public URL: <span className="font-mono text-[#1B3C6C]">/grants/{d.slug}</span></p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {page.drift && (
          <div className="mb-4 flex items-start gap-2 rounded-[0.5rem] border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>The underlying program changed since this page was drafted (amount / deadline / status). Review the copy before keeping it live.</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label}>Slug (URL)</label><input className={input} value={d.slug} onChange={field('slug')} /></div>
            <div><label className={label}>Amount label</label><input className={input} value={d.amountLabel} onChange={field('amountLabel')} /></div>
          </div>
          <div><label className={label}>Hero eyebrow</label><input className={input} value={d.heroEyebrow} onChange={field('heroEyebrow')} /></div>
          <div><label className={label}>Hero title</label><input className={input} value={d.heroTitle} onChange={field('heroTitle')} /></div>
          <div><label className={label}>Hero subtitle</label><textarea className={input} rows={2} value={d.heroSubtitle} onChange={field('heroSubtitle')} /></div>
          <div><label className={label}>Intro</label><textarea className={input} rows={3} value={d.intro} onChange={field('intro')} /></div>

          <ListEditor label="Content sections" items={d.sections ?? []} onChange={(v) => setD((s) => ({ ...s, sections: v }))}
            empty={{ heading: '', body: '' }}
            render={(it, upd) => (
              <div className="space-y-2">
                <input className={input} placeholder="Heading" value={it.heading} onChange={(e) => upd({ ...it, heading: e.target.value })} />
                <textarea className={input} rows={2} placeholder="Body" value={it.body} onChange={(e) => upd({ ...it, body: e.target.value })} />
              </div>
            )} />

          <StringListEditor label="Eligibility bullets" items={d.eligibility ?? []} onChange={(v) => setD((s) => ({ ...s, eligibility: v }))} inputClass={input} />

          <ListEditor label="FAQs" items={d.faqs ?? []} onChange={(v) => setD((s) => ({ ...s, faqs: v }))}
            empty={{ q: '', a: '' }}
            render={(it, upd) => (
              <div className="space-y-2">
                <input className={input} placeholder="Question" value={it.q} onChange={(e) => upd({ ...it, q: e.target.value })} />
                <textarea className={input} rows={2} placeholder="Answer" value={it.a} onChange={(e) => upd({ ...it, a: e.target.value })} />
              </div>
            )} />

          <div><label className={label}>CTA heading</label><input className={input} value={d.ctaHeading} onChange={field('ctaHeading')} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className={label}>SEO title</label><input className={input} value={d.seoTitle} onChange={field('seoTitle')} /></div>
            <div><label className={label}>SEO description</label><input className={input} value={d.seoDescription} onChange={field('seoDescription')} /></div>
          </div>
        </div>

        {msg && <p className="mt-4 text-sm font-semibold text-[#1B3C6C]">{msg}</p>}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
          <button onClick={() => persist()} disabled={!!busy} className="rounded-[0.5rem] border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50">{busy === 'save' ? 'Saving…' : 'Save draft'}</button>
          {d.status === 'published' ? (
            <button onClick={() => persist('draft')} disabled={!!busy} className="rounded-[0.5rem] border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100 disabled:opacity-50">{busy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}</button>
          ) : (
            <button onClick={() => persist('published')} disabled={!!busy} className="rounded-[0.5rem] bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50">{busy === 'publish' ? 'Publishing…' : 'Publish live'}</button>
          )}
          {d.status === 'published' && (
            <a href={`/grants/${d.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"><ExternalLink className="h-4 w-4" /> View live</a>
          )}
          <button onClick={onDelete} className="ml-auto inline-flex items-center gap-1.5 rounded-[0.5rem] px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /> Delete</button>
        </div>
      </div>
    </div>
  );
}

function ListEditor<T>({ label, items, onChange, render, empty }: {
  label: string; items: T[]; onChange: (v: T[]) => void; render: (item: T, update: (v: T) => void) => React.ReactNode; empty: T;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-start gap-2 rounded-[0.5rem] border border-slate-100 bg-slate-50 p-2">
            <div className="flex-1">{render(it, (v) => onChange(items.map((x, j) => (j === i ? v : x))))}</div>
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="mt-1 text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => onChange([...items, empty])} className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-[#1B3C6C] hover:text-[#1B3C6C]"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    </div>
  );
}

function StringListEditor({ label, items, onChange, inputClass }: {
  label: string; items: string[]; onChange: (v: string[]) => void; inputClass: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className={inputClass} value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => onChange([...items, ''])} className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-dashed border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-[#1B3C6C] hover:text-[#1B3C6C]"><Plus className="h-3.5 w-3.5" /> Add</button>
      </div>
    </div>
  );
}
