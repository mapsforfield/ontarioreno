import { upload } from '@vercel/blob/client';
import {
  ArrowDown,
  ArrowUp,
  Calculator,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FileSignature,
  Layers,
  Loader2,
  Paperclip,
  Plus,
  RotateCcw,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import { CONTRACT_TEMPLATES, templateForContractor, type ContractTemplateId } from '../data/contractTemplates';
import { usePortalData } from '../data/store';
import { presetsForProjectType, type ScopeLine } from '../data/scopePresets';
import { buildContractPdf, contractFileName, loadImageAsDataUrl, type ContractData, type PaymentMethod } from '../lib/contractPdf';
import { showToast } from '../lib/toast';

const HST = 0.13;

/** YYYY/MM/DD for today, in Toronto terms (the portal's working timezone). */
function todaySlashed(): string {
  const d = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' }); // YYYY-MM-DD
  return d.replace(/-/g, '/');
}

function toSlashed(isoDate: string): string {
  return isoDate ? isoDate.replace(/-/g, '/') : '';
}

function toIso(slashed: string): string {
  return slashed ? slashed.replace(/\//g, '-') : '';
}

let lineSeq = 0;
function newLine(item = '', detail = ''): ScopeLine {
  lineSeq += 1;
  return { id: `l${Date.now().toString(36)}${lineSeq}`, item, detail };
}

/** Everything the rep has typed — the shape we autosave per deal. */
type Draft = {
  dealId: string;
  contractorId: string;
  templateId: ContractTemplateId;
  agreementDate: string; // ISO for the date input
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  propertyAddress: string;
  contractorSignatory: string;
  startDate: string;
  completionDate: string;
  totalPrice: string;
  taxNote: string;
  paymentMethod: PaymentMethod;
  financeRate: string;
  financeTermMonths: string;
  financeAmortMonths: string;
  financeMonthlyPayment: string;
  financeUpfrontPct: string;
  cashSchedule: Array<{ pct: string; when: string }>;
  scope: ScopeLine[];
  specialTerms: string;
};

const DRAFT_KEY = (dealId: string) => `orp:contract-draft:${dealId || 'standalone'}`;

const DEFAULT_CASH: Array<{ pct: string; when: string }> = [
  { pct: '30', when: 'upon contract signing' },
  { pct: '50', when: 'upon delivery of materials / mid-project' },
  { pct: '20', when: 'upon project completion' },
];

export default function PortalContracts() {
  const { currentUser } = usePortalAuth();
  const { deals, contractors, addSalesAgreement, isLoading, loadError, refetch } = usePortalData();
  const location = useLocation();
  const preselectedDealId = (location.state as { dealId?: string } | null)?.dealId ?? '';

  const [dealId, setDealId] = useState(preselectedDealId);
  const [d, setD] = useState<Draft | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attaching, setAttaching] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const previewRef = useRef<string | null>(null);

  const myDeals = useMemo(() => {
    const visible = currentUser?.role === 'admin'
      ? deals
      : deals.filter((deal) => deal.assignedRepId === currentUser?.id);
    return [...visible].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [deals, currentUser]);

  const deal = useMemo(() => deals.find((x) => x.id === dealId) ?? null, [deals, dealId]);
  const contractor = useMemo(
    () => contractors.find((c) => c.id === d?.contractorId) ?? null,
    [contractors, d?.contractorId],
  );

  // ── Draft lifecycle: restore what the rep had, else seed from the deal ──────
  const seedFromDeal = useCallback((): Draft => {
    const contractorId = deal?.assignedContractorId ?? contractors[0]?.id ?? '';
    const address = [deal?.address, deal?.city, deal?.postalCode].filter(Boolean).join(', ');
    return {
      dealId,
      contractorId,
      templateId: templateForContractor(contractorId),
      agreementDate: toIso(todaySlashed()),
      ownerName: deal?.homeownerName ?? '',
      ownerPhone: deal?.phone ?? '',
      ownerEmail: deal?.email ?? '',
      propertyAddress: address,
      contractorSignatory: contractors.find((c) => c.id === contractorId)?.contactName ?? '',
      startDate: '',
      completionDate: '',
      totalPrice: deal?.estimatedJobValue ? String(deal.estimatedJobValue) : '',
      taxNote: '+ HST',
      paymentMethod: deal?.financingRequired ? 'financing' : 'cash',
      financeRate: '8.99',
      financeTermMonths: '36',
      financeAmortMonths: '240',
      financeMonthlyPayment: '',
      financeUpfrontPct: '40',
      cashSchedule: DEFAULT_CASH.map((s) => ({ ...s })),
      scope: [newLine()],
      specialTerms: '',
    };
  }, [deal, contractors, dealId]);

  useEffect(() => {
    // Wait for the contractor list before seeding — the draft's default template
    // is derived from the contractor, and re-seeding later would clobber edits.
    if (isLoading || contractors.length === 0) return;
    let restored: Draft | null = null;
    try {
      const raw = localStorage.getItem(DRAFT_KEY(dealId));
      if (raw) restored = JSON.parse(raw) as Draft;
    } catch { /* corrupt draft — fall through to a fresh one */ }
    setD(restored ?? seedFromDeal());
  }, [dealId, contractors.length, seedFromDeal]);

  // Autosave — reps close the tablet mid-appointment more often than you'd think.
  useEffect(() => {
    if (!d) return;
    try { localStorage.setItem(DRAFT_KEY(dealId), JSON.stringify(d)); } catch { /* quota — ignore */ }
  }, [d, dealId]);

  // Contractor logo, fetched once per contractor.
  useEffect(() => {
    let cancelled = false;
    setLogo(null);
    if (contractor?.logoUrl) {
      loadImageAsDataUrl(contractor.logoUrl).then((url) => { if (!cancelled) setLogo(url); });
    }
    return () => { cancelled = true; };
  }, [contractor?.logoUrl]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setD((cur) => (cur ? { ...cur, [key]: value } : cur));

  // ── Assemble the render payload ────────────────────────────────────────────
  const contractData: ContractData | null = useMemo(() => {
    if (!d) return null;
    const c = contractors.find((x) => x.id === d.contractorId);
    return {
      agreementDate: toSlashed(d.agreementDate),
      contractorName: c?.publicCompanyName || c?.companyName || 'Contractor',
      contractorAddress1: c?.address || '',
      contractorAddress2: [c?.city, c?.province, c?.postalCode].filter(Boolean).join(', '),
      contractorPhone: c?.publicPhone || c?.phone || '',
      contractorEmail: c?.publicEmail || c?.email || '',
      contractorWebsite: c?.publicWebsite || c?.website || '',
      contractorSignatory: d.contractorSignatory,
      logoDataUrl: logo,
      ownerName: d.ownerName,
      ownerPhone: d.ownerPhone,
      ownerEmail: d.ownerEmail,
      propertyAddress: d.propertyAddress,
      startDate: toSlashed(d.startDate),
      completionDate: toSlashed(d.completionDate),
      totalPrice: Number(d.totalPrice) || 0,
      taxNote: d.taxNote,
      paymentMethod: d.paymentMethod,
      financeRate: d.financeRate,
      financeTermMonths: d.financeTermMonths,
      financeAmortMonths: d.financeAmortMonths,
      financeMonthlyPayment: d.financeMonthlyPayment,
      financeUpfrontPct: d.financeUpfrontPct,
      cashSchedule: d.cashSchedule,
      scope: d.scope,
      specialTerms: d.specialTerms,
      templateId: d.templateId,
    };
  }, [d, contractors, logo]);

  // ── Live preview, debounced so typing stays smooth ─────────────────────────
  useEffect(() => {
    if (!contractData) return;
    const timer = window.setTimeout(() => {
      try {
        const blob = buildContractPdf(contractData).output('blob') as Blob;
        const url = URL.createObjectURL(blob);
        if (previewRef.current) URL.revokeObjectURL(previewRef.current);
        previewRef.current = url;
        setPreviewUrl(url);
      } catch (err) {
        console.error('[contracts] preview render failed:', err);
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [contractData]);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  // ── Actions ────────────────────────────────────────────────────────────────
  const download = () => {
    if (!contractData) return;
    buildContractPdf(contractData).save(contractFileName(contractData));
  };

  const attach = async () => {
    if (!contractData || !deal) return;
    setAttaching(true);
    try {
      const blob = buildContractPdf(contractData).output('blob') as Blob;
      const fileName = contractFileName(contractData);
      const file = new File([blob], fileName, { type: 'application/pdf' });
      const uploaded = await upload(`agreements/${deal.id}/${fileName}`, file, {
        access: 'private',
        handleUploadUrl: `/api/deals/${deal.id}`,
        contentType: 'application/pdf',
      });
      await addSalesAgreement(deal.id, fileName, uploaded.url, currentUser ?? undefined);
      showToast({ message: 'Agreement attached to the deal', variant: 'success' });
    } catch (err) {
      showToast({
        message: 'Could not attach the agreement',
        description: err instanceof Error ? err.message : 'Upload failed.',
        variant: 'error',
      });
    }
    setAttaching(false);
  };

  const calcMonthly = () => {
    if (!d) return;
    const principal = (Number(d.totalPrice) || 0) * (1 + HST);
    const rate = (Number(d.financeRate) || 0) / 100 / 12;
    const n = Number(d.financeAmortMonths) || 0;
    if (!principal || !n) return;
    const payment = rate === 0 ? principal / n : (principal * rate) / (1 - (1 + rate) ** -n);
    set('financeMonthlyPayment', payment.toFixed(2));
  };

  const applyPreset = (presetId: string) => {
    if (!d) return;
    const preset = presetsForProjectType(deal?.projectType).find((p) => p.id === presetId);
    if (!preset) return;
    set('scope', preset.lines.map((l) => newLine(l.item, l.detail)));
    showToast({ message: `Loaded "${preset.label}" — ${preset.lines.length} lines`, variant: 'success' });
  };

  const applyPaste = () => {
    if (!d) return;
    // One line per row; "item | detail" or "item — detail" splits the columns.
    const rows = pasteText
      .split('\n')
      .map((raw) => raw.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter(Boolean)
      .map((raw) => {
        const m = raw.split(/\s*(?:\||\t|—|–\s)\s*/);
        return newLine((m[0] ?? '').trim(), (m.slice(1).join(' — ') ?? '').trim());
      });
    if (rows.length === 0) return;
    set('scope', [...d.scope.filter((l) => l.item.trim() || l.detail.trim()), ...rows]);
    setPasteText('');
    setPasteOpen(false);
    showToast({ message: `Added ${rows.length} scope lines`, variant: 'success' });
  };

  const moveLine = (index: number, delta: number) => {
    if (!d) return;
    const next = [...d.scope];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    set('scope', next);
  };

  const resetDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY(dealId)); } catch { /* ignore */ }
    setD(seedFromDeal());
    showToast({ message: 'Draft reset from the deal', variant: 'default' });
  };

  const presets = useMemo(() => presetsForProjectType(deal?.projectType), [deal?.projectType]);
  const filledScope = d?.scope.filter((l) => l.item.trim()).length ?? 0;
  const ready = Boolean(d?.ownerName.trim() && d?.propertyAddress.trim() && Number(d?.totalPrice) > 0 && filledScope > 0);

  if (!d) {
    // Distinguish "still fetching" from "loaded, but there's nothing to work
    // with" — an endless spinner tells the rep nothing about what went wrong.
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-24 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      );
    }
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <FileSignature className="mx-auto h-10 w-10 text-slate-300" />
        <h1 className="mt-4 text-lg font-black text-slate-900">
          {loadError ? 'Could not load portal data' : 'No contractors yet'}
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          {loadError
            ? 'The contractor list did not load, so there is nothing to build an agreement from.'
            : 'Add a contractor under Admin → Contractors before generating an agreement.'}
        </p>
        {loadError && (
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 inline-flex items-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#16325a]"
          >
            <RotateCcw className="h-4 w-4" /> Retry
          </button>
        )}
      </div>
    );
  }

  const label = 'mb-1 block text-[0.7rem] font-black uppercase tracking-[0.12em] text-slate-500';
  const input =
    'w-full rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-[#1B3C6C] focus:ring-2 focus:ring-[#1B3C6C]/15';
  const card = 'rounded-[0.75rem] border border-slate-200 bg-white p-4 sm:p-5';

  return (
    <div className="pb-24">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#1B3C6C]">Sales Tools</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-950 sm:text-3xl">
            <FileSignature className="h-6 w-6 text-[#1B3C6C]" />
            Contract Creator
          </h1>
          <p className="mt-1 max-w-2xl text-sm font-semibold text-slate-500">
            Pick the contractor, fill the details, generate a branded agreement. Each contractor has its own
            document style so no two brands hand the homeowner the same paperwork.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetDraft}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3.5 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button
            type="button"
            onClick={attach}
            disabled={!deal || attaching || !ready}
            title={!deal ? 'Select a deal first' : !ready ? 'Fill the homeowner, address, price and scope first' : ''}
            className="inline-flex items-center gap-1.5 rounded-[0.5rem] bg-[#1B3C6C] px-3.5 py-2 text-sm font-bold text-white transition hover:bg-[#16325a] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {attaching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            Attach to deal
          </button>
        </div>
      </header>

      {/* Mobile pane switch */}
      <div className="mb-4 flex gap-1 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-1 lg:hidden">
        {(['form', 'preview'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`flex-1 rounded-[0.4rem] px-3 py-2 text-sm font-bold capitalize transition ${
              mobileTab === tab ? 'bg-white text-[#1B3C6C] shadow-sm' : 'text-slate-500'
            }`}
          >
            {tab === 'form' ? 'Details' : 'Live preview'}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
        {/* ── Form column ─────────────────────────────────────────────── */}
        <div className={`space-y-5 ${mobileTab === 'preview' ? 'hidden lg:block' : ''}`}>
          {/* Deal + contractor */}
          <section className={card}>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.1em] text-slate-900">Deal &amp; Contractor</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="deal">Deal</label>
                <select id="deal" className={input} value={dealId} onChange={(e) => setDealId(e.target.value)}>
                  <option value="">— No deal (standalone document) —</option>
                  {myDeals.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.homeownerName} · {x.projectType || 'Project'} · {x.city}
                    </option>
                  ))}
                </select>
                {!deal && (
                  <p className="mt-1.5 text-xs font-semibold text-amber-600">
                    Pick a deal to enable “Attach to deal”. You can still download the PDF without one.
                  </p>
                )}
              </div>
              <div>
                <label className={label} htmlFor="contractor">Contractor</label>
                <select
                  id="contractor"
                  className={input}
                  value={d.contractorId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setD((cur) => cur && ({
                      ...cur,
                      contractorId: id,
                      // Switching brand switches the document style with it.
                      templateId: templateForContractor(id),
                      contractorSignatory: contractors.find((c) => c.id === id)?.contactName ?? cur.contractorSignatory,
                    }));
                  }}
                >
                  {contractors.map((c) => (
                    <option key={c.id} value={c.id}>{c.publicCompanyName || c.companyName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={label} htmlFor="signatory">Signs for the contractor</label>
                <input
                  id="signatory"
                  className={input}
                  value={d.contractorSignatory}
                  onChange={(e) => set('contractorSignatory', e.target.value)}
                  placeholder="Full name"
                />
              </div>
            </div>

            {/* Style picker */}
            <div className="mt-4">
              <p className={label}>Document style</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONTRACT_TEMPLATES.map((t) => {
                  const active = d.templateId === t.id;
                  const isDefault = templateForContractor(d.contractorId) === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => set('templateId', t.id)}
                      className={`flex items-start gap-3 rounded-[0.5rem] border p-3 text-left transition ${
                        active ? 'border-[#1B3C6C] bg-[#f6faff] ring-2 ring-[#1B3C6C]/15' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.4rem] text-xs font-black text-white"
                        style={{ backgroundColor: `rgb(${t.accent.join(',')})`, fontFamily: t.font === 'times' ? 'Georgia, serif' : 'inherit' }}
                      >
                        {t.name[0]}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-900">{t.name}</span>
                          {isDefault && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate-500">
                              Default
                            </span>
                          )}
                          {active && <Check className="h-3.5 w-3.5 text-[#1B3C6C]" />}
                        </span>
                        <span className="mt-0.5 block text-xs font-semibold leading-snug text-slate-500">{t.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Homeowner + dates */}
          <section className={card}>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.1em] text-slate-900">Homeowner &amp; Property</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={label} htmlFor="owner">Homeowner name</label>
                <input id="owner" className={input} value={d.ownerName} onChange={(e) => set('ownerName', e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="ophone">Phone</label>
                <input id="ophone" className={input} value={d.ownerPhone} onChange={(e) => set('ownerPhone', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="oemail">Email</label>
                <input id="oemail" className={input} value={d.ownerEmail} onChange={(e) => set('ownerEmail', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className={label} htmlFor="prop">Property address</label>
                <input id="prop" className={input} value={d.propertyAddress} onChange={(e) => set('propertyAddress', e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="adate">Agreement date</label>
                <input id="adate" type="date" className={input} value={d.agreementDate} onChange={(e) => set('agreementDate', e.target.value)} />
              </div>
              <div />
              <div>
                <label className={label} htmlFor="sdate">Start date</label>
                <input id="sdate" type="date" className={input} value={d.startDate} onChange={(e) => set('startDate', e.target.value)} />
              </div>
              <div>
                <label className={label} htmlFor="cdate">Completion date</label>
                <input id="cdate" type="date" className={input} value={d.completionDate} onChange={(e) => set('completionDate', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section className={card}>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.1em] text-slate-900">Price &amp; Payment</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label className={label} htmlFor="price">Total price (before tax)</label>
                <input
                  id="price"
                  type="number"
                  inputMode="decimal"
                  className={input}
                  value={d.totalPrice}
                  onChange={(e) => set('totalPrice', e.target.value)}
                />
              </div>
              <div>
                <label className={label} htmlFor="tax">Tax note</label>
                <input id="tax" className={input} value={d.taxNote} onChange={(e) => set('taxNote', e.target.value)} />
              </div>
            </div>

            <div className="mt-4">
              <p className={label}>Payment method</p>
              <div className="flex flex-wrap gap-2">
                {([['financing', 'Financing'], ['cash', 'Cash'], ['both', 'Both']] as const).map(([value, text]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => set('paymentMethod', value as PaymentMethod)}
                    className={`rounded-[0.5rem] border px-3.5 py-2 text-sm font-bold transition ${
                      d.paymentMethod === value
                        ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {(d.paymentMethod === 'financing' || d.paymentMethod === 'both') && (
              <div className="mt-4 rounded-[0.5rem] border border-slate-200 bg-slate-50/60 p-3">
                <div className="grid gap-3 sm:grid-cols-4">
                  <div>
                    <label className={label} htmlFor="rate">Rate %</label>
                    <input id="rate" className={input} value={d.financeRate} onChange={(e) => set('financeRate', e.target.value)} />
                  </div>
                  <div>
                    <label className={label} htmlFor="term">Term (mo)</label>
                    <input id="term" className={input} value={d.financeTermMonths} onChange={(e) => set('financeTermMonths', e.target.value)} />
                  </div>
                  <div>
                    <label className={label} htmlFor="amort">Amort. (mo)</label>
                    <input id="amort" className={input} value={d.financeAmortMonths} onChange={(e) => set('financeAmortMonths', e.target.value)} />
                  </div>
                  <div>
                    <label className={label} htmlFor="upfront">Released up front %</label>
                    <input id="upfront" className={input} value={d.financeUpfrontPct} onChange={(e) => set('financeUpfrontPct', e.target.value)} />
                  </div>
                  <div className="sm:col-span-4">
                    <label className={label} htmlFor="monthly">Monthly payment (incl. tax)</label>
                    <div className="flex gap-2">
                      <input id="monthly" className={input} value={d.financeMonthlyPayment} onChange={(e) => set('financeMonthlyPayment', e.target.value)} placeholder="687.11" />
                      <button
                        type="button"
                        onClick={calcMonthly}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                      >
                        <Calculator className="h-3.5 w-3.5" /> Calculate
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-400">
                      Amortises the price plus HST at the rate above. Override it if FinanceIt quotes differently.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(d.paymentMethod === 'cash' || d.paymentMethod === 'both') && (
              <div className="mt-4 rounded-[0.5rem] border border-slate-200 bg-slate-50/60 p-3">
                <p className={label}>Cash schedule</p>
                <div className="space-y-2">
                  {d.cashSchedule.map((s, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        className={`${input} w-20 shrink-0`}
                        value={s.pct}
                        onChange={(e) => {
                          const next = [...d.cashSchedule];
                          next[i] = { ...next[i], pct: e.target.value };
                          set('cashSchedule', next);
                        }}
                        aria-label={`Milestone ${i + 1} percentage`}
                      />
                      <input
                        className={input}
                        value={s.when}
                        onChange={(e) => {
                          const next = [...d.cashSchedule];
                          next[i] = { ...next[i], when: e.target.value };
                          set('cashSchedule', next);
                        }}
                        aria-label={`Milestone ${i + 1} description`}
                      />
                      <button
                        type="button"
                        onClick={() => set('cashSchedule', d.cashSchedule.filter((_, j) => j !== i))}
                        className="shrink-0 rounded-[0.5rem] border border-slate-200 bg-white px-2.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove milestone"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => set('cashSchedule', [...d.cashSchedule, { pct: '', when: '' }])}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3C6C] hover:underline"
                >
                  <Plus className="h-3.5 w-3.5" /> Add milestone
                </button>
              </div>
            )}
          </section>

          {/* Scope builder */}
          <section className={card}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900">
                Scope of Work <span className="text-slate-400">({filledScope})</span>
              </h2>
              <button
                type="button"
                onClick={() => setPasteOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
              >
                <ClipboardPaste className="h-3.5 w-3.5" /> Paste lines
              </button>
            </div>

            {/* Preset loader */}
            <div className="mb-3">
              <p className={label}><Layers className="mr-1 inline h-3 w-3" /> Start from a preset</p>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyPreset(p.id)}
                    title={p.description}
                    className="rounded-[0.5rem] border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:bg-[#f6faff] hover:text-[#1B3C6C]"
                  >
                    <Wand2 className="mr-1 inline h-3 w-3" />
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-400">
                Replaces the current scope. Presets are ordered to match this deal&apos;s project type.
              </p>
            </div>

            {pasteOpen && (
              <div className="mb-3 rounded-[0.5rem] border border-slate-200 bg-slate-50/60 p-3">
                <textarea
                  className={`${input} h-28 resize-y font-normal`}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={'One item per line. Use "|" to split the spec column:\nPot lights | 40 pcs, 4 inch\nFlooring | Luxury vinyl plank'}
                />
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={applyPaste} className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-1.5 text-xs font-bold text-white">
                    Add lines
                  </button>
                  <button type="button" onClick={() => setPasteOpen(false)} className="rounded-[0.5rem] border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {d.scope.map((line, i) => (
                <div key={line.id} className="flex items-start gap-2 rounded-[0.5rem] border border-slate-200 bg-white p-2">
                  <span className="mt-2.5 w-5 shrink-0 text-center text-xs font-black text-slate-400">{i + 1}</span>
                  <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                    <input
                      className={input}
                      value={line.item}
                      placeholder="Work item"
                      onChange={(e) => {
                        const next = [...d.scope];
                        next[i] = { ...next[i], item: e.target.value };
                        set('scope', next);
                      }}
                      aria-label={`Scope line ${i + 1} item`}
                    />
                    <input
                      className={input}
                      value={line.detail}
                      placeholder="Specification / material / count"
                      onChange={(e) => {
                        const next = [...d.scope];
                        next[i] = { ...next[i], detail: e.target.value };
                        set('scope', next);
                      }}
                      aria-label={`Scope line ${i + 1} specification`}
                    />
                  </div>
                  <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row">
                    <button type="button" onClick={() => moveLine(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30" aria-label="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveLine(i, 1)} disabled={i === d.scope.length - 1} className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30" aria-label="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => set('scope', [...d.scope.slice(0, i + 1), newLine(line.item, line.detail), ...d.scope.slice(i + 1)])}
                      className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Duplicate line"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => set('scope', d.scope.filter((_, j) => j !== i))}
                      className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete line"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => set('scope', [...d.scope, newLine()])}
              className="mt-3 inline-flex items-center gap-1.5 rounded-[0.5rem] border border-dashed border-slate-300 px-3 py-2 text-sm font-bold text-slate-500 transition hover:border-[#1B3C6C] hover:text-[#1B3C6C]"
            >
              <Plus className="h-4 w-4" /> Add line
            </button>
          </section>

          {/* Special terms */}
          <section className={card}>
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.1em] text-slate-900">Additional Terms</h2>
            <textarea
              className={`${input} h-28 resize-y font-normal`}
              value={d.specialTerms}
              onChange={(e) => set('specialTerms', e.target.value)}
              placeholder="Anything negotiated for this deal specifically — special payment arrangements, exclusions, side agreements. Blank paragraphs separate clauses."
            />
          </section>
        </div>

        {/* ── Preview column ──────────────────────────────────────────── */}
        <div className={mobileTab === 'form' ? 'hidden lg:block' : ''}>
          <div className="lg:sticky lg:top-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Live preview</p>
              <p className="text-xs font-semibold text-slate-400">
                {CONTRACT_TEMPLATES.find((t) => t.id === d.templateId)?.name} style
              </p>
            </div>
            <div className="overflow-hidden rounded-[0.75rem] border border-slate-200 bg-slate-100">
              {previewUrl ? (
                <iframe
                  key="contract-preview"
                  src={previewUrl}
                  title="Agreement preview"
                  className="h-[68vh] w-full bg-white lg:h-[calc(100vh-9rem)]"
                />
              ) : (
                <div className="flex h-[60vh] items-center justify-center text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-400">
              Preview updates as you type. Download the PDF, then send it for signature the way you normally do.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
