import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, ExternalLink, Loader2, RadarIcon, RefreshCw,
  Sparkles, Target, X,
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
  firstSeenAt: string; changedAt: string | null;
};
type Source = {
  id: string; name: string; url: string; jurisdiction: string; category: string;
  pageType: string; hafLinked: boolean; active: boolean; lastCheckedAt: string | null; lastError: string;
};
type Municipality = {
  id: string; name: string; slug: string; hafRecipient: boolean;
  discoveryState: string; lastDiscoveryAt: string | null;
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

function ProgramCard({ p, onAction, busy }: {
  p: Program;
  onAction: (id: string, reviewState: string) => void;
  busy: boolean;
}) {
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
      </div>
    </div>
  );
}

export default function PortalGrants() {
  const { isAdmin } = usePortalAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
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
            {needsReview.map((p) => <ProgramCard key={p.id} p={p} onAction={act} busy={busyId === p.id} />)}
          </Section>

          {targeting.length > 0 && (
            <Section title="Targeting" count={targeting.length}>
              {targeting.map((p) => <ProgramCard key={p.id} p={p} onAction={act} busy={busyId === p.id} />)}
            </Section>
          )}

          <Section title="Active programs" count={active.length}
            empty="No confirmed active programs yet — run a scan or wait for the daily sweep.">
            {active.map((p) => <ProgramCard key={p.id} p={p} onAction={act} busy={busyId === p.id} />)}
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
