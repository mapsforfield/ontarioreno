import { jsPDF } from 'jspdf';
import { Download, Loader2, Plus, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import type { Contractor, Deal } from '../data/types';

// ── Layout constants (points; Letter page = 612 × 792). Tweak to fine-tune. ──
const PAGE_W = 612;
const PAGE_H = 792;
const BLUE: [number, number, number] = [42, 77, 160];
const INK: [number, number, number] = [25, 25, 25];
const LINE_BLUE: [number, number, number] = [150, 175, 215];

// A documented credit (−) or extra charge (+) on the invoice. Either a flat
// amount, or a percentage of a "scope" base (auto-computes & self-documents).
type Adjustment = {
  id: string;
  description: string;
  relatedJob: string; // the original job/deal this adjustment relates to
  kind: 'credit' | 'charge';
  mode: 'percent' | 'amount';
  base: number; // used in percent mode (e.g. the removed scope $)
  rate: number; // used in percent mode (e.g. the commission %)
  amount: number; // used in amount mode
};

/** The itemised label for an adjustment line (description, job ref, calc). */
function adjLabel(a: Adjustment): string {
  const desc = a.description.trim() || 'Adjustment';
  const job = (a.relatedJob ?? '').trim() ? ` — re: ${(a.relatedJob ?? '').trim()}` : '';
  const calc = a.mode === 'percent' && a.base > 0 ? ` ($${fmtNum(a.base)} × ${a.rate}%)` : '';
  return `${desc}${job}${calc}`;
}

export type InvoiceData = {
  invoiceNumber: string;
  fromLegalName: string;
  fromAddr1: string;
  fromAddr2: string;
  fromHst: string;
  toContact: string;
  toCompany: string;
  toAddr1: string;
  toAddr2: string;
  customerName: string;
  salesPrice: number;
  commissionRate: number; // percent, e.g. 8.5
  amount: number;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  showPayment: boolean;
  adjustments: Adjustment[];
};

function money(v: number) {
  return `CAD $${v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtNum(v: number) {
  return v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Signed dollar amount of an adjustment (negative for credits). */
function adjValue(a: Adjustment): number {
  const raw = a.mode === 'percent' ? (a.base * a.rate) / 100 : a.amount;
  const mag = Math.round(Math.abs(raw) * 100) / 100;
  return a.kind === 'credit' ? -mag : mag;
}

function signedMoney(v: number) {
  return `${v < 0 ? '-' : ''}CAD $${fmtNum(Math.abs(v))}`;
}

export async function loadLetterhead(): Promise<string | null> {
  try {
    const res = await fetch('/invoice-letterhead.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function buildPdf(letterhead: string | null, d: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  if (letterhead) doc.addImage(letterhead, 'PNG', 0, 0, PAGE_W, PAGE_H);

  // INVOICE number on the band
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`INVOICE: #${d.invoiceNumber}`, 49, 104);

  // FROM / TO boxes
  doc.setDrawColor(40, 40, 40);
  doc.setLineWidth(0.8);
  doc.rect(43, 135, 257, 120);
  doc.rect(312, 135, 257, 120);

  // FROM
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FROM:', 59, 162);
  doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
  doc.setFontSize(13);
  doc.text(d.fromLegalName, 59, 184);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFontSize(9.5);
  doc.text(d.fromAddr1, 59, 208);
  doc.text(d.fromAddr2, 59, 221);
  doc.text(`HST number: ${d.fromHst}`, 59, 234);

  // TO
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFontSize(11);
  doc.text('TO:', 328, 162);

  // Contact and company can both be long — wrap each within the TO box
  // (text starts at x=328, box right edge 569) and flow everything below
  // a running y cursor so nothing collides or runs off the page.
  const TO_MAX_W = 225;
  // Render a wrapped block, shrinking the font if it would exceed maxLines.
  const drawWrapped = (
    text: string,
    y: number,
    baseSize: number,
    color: number[],
    maxLines: number,
  ): number => {
    if (!text) return y;
    let size = baseSize;
    doc.setFontSize(size);
    let lines = doc.splitTextToSize(text, TO_MAX_W);
    if (lines.length > maxLines) {
      size = baseSize - 2;
      doc.setFontSize(size);
      lines = doc.splitTextToSize(text, TO_MAX_W);
    }
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(lines, 328, y);
    return y + lines.length * (size + 2);
  };

  let toY = 184;
  toY = drawWrapped(d.toContact, toY, 12.5, BLUE, 2);
  if (d.toCompany) toY = drawWrapped(d.toCompany, toY + 4, 12.5, BLUE, 2);
  toY += 6;
  doc.setFontSize(9.5);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  if (d.toAddr1) { doc.text(d.toAddr1, 328, toY); toY += 13; }
  if (d.toAddr2) doc.text(d.toAddr2, 328, toY);

  // Description / Amount headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text('Description', 43, 300);
  doc.text('Amount', 569, 300, { align: 'right' });
  doc.setDrawColor(LINE_BLUE[0], LINE_BLUE[1], LINE_BLUE[2]);
  doc.setLineWidth(1);
  doc.line(43, 309, 569, 309);

  // Description rows (flowing cursor so any adjustments fit beneath the main line)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  let dy = 330;
  doc.text(d.customerName, 43, dy);
  doc.text(money(d.amount), 569, dy, { align: 'right' });
  dy += 15;
  doc.setFontSize(9.5);
  doc.setTextColor(95, 95, 95);
  doc.text(`Sales price: $${fmtNum(d.salesPrice)} (incl. HST) · Commission ${d.commissionRate}%`, 43, dy);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  dy += 20;

  // Adjustments / credits
  const adjustments = (d.adjustments ?? []).filter((a) => adjValue(a) !== 0 || a.description.trim());
  const adjTotal = adjustments.reduce((s, a) => s + adjValue(a), 0);
  doc.setFontSize(10.5);
  for (const a of adjustments) {
    const lines = doc.splitTextToSize(adjLabel(a), 380) as string[];
    doc.text(lines, 43, dy);
    doc.text(signedMoney(adjValue(a)), 569, dy, { align: 'right' });
    dy += lines.length * 13 + 3;
  }

  // Totals
  const totalsTop = Math.max(dy + 8, 392);
  doc.setDrawColor(LINE_BLUE[0], LINE_BLUE[1], LINE_BLUE[2]);
  doc.setLineWidth(1);
  doc.line(43, totalsTop, 569, totalsTop);
  let ty = totalsTop + 22;
  doc.setFontSize(12);
  if (adjustments.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.text('Sub Total', 400, ty);
    doc.setFont('helvetica', 'normal');
    doc.text(money(d.amount), 569, ty, { align: 'right' });
    ty += 18;
    doc.setFont('helvetica', 'bold');
    doc.text('Adjustments', 400, ty);
    doc.setFont('helvetica', 'normal');
    doc.text(signedMoney(adjTotal), 569, ty, { align: 'right' });
    ty += 10;
  }
  doc.line(400, ty, 569, ty);
  ty += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Total (CAD)', 400, ty);
  doc.setFont('helvetica', 'normal');
  doc.text(money(d.amount + adjTotal), 569, ty, { align: 'right' });

  // ── Payment instructions (lower-left white space, clear of the wave) ──
  if (d.showPayment && (d.bankName || d.accountNumber)) {
    const px = 43;
    const py = totalsTop + 14;
    const pw = 332;
    const ph = 118;
    doc.setFillColor(247, 249, 252);
    doc.setDrawColor(LINE_BLUE[0], LINE_BLUE[1], LINE_BLUE[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(px, py, pw, ph, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.text('PAYMENT INSTRUCTIONS', px + 14, py + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(95, 95, 95);
    const intro = doc.splitTextToSize(
      'To settle the full balance in a single transaction and avoid standard daily Interac limits, please remit by Direct Deposit / EFT to:',
      pw - 28,
    );
    doc.text(intro, px + 14, py + 34);

    let by = py + 34 + intro.length * 11 + 9;
    doc.setTextColor(INK[0], INK[1], INK[2]);
    doc.setFontSize(9.5);
    const pair = (label: string, value: string, x: number, y: number, gap: number) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, x, y);
      doc.setFont('helvetica', 'normal');
      doc.text(value || '—', x + gap, y);
    };
    pair('Bank:', d.bankName, px + 14, by, 34);
    by += 15;
    pair('Institution:', d.institutionNumber, px + 14, by, 56);
    pair('Transit:', d.transitNumber, px + 150, by, 44);
    by += 15;
    pair('Account:', d.accountNumber, px + 14, by, 50);
  }

  return doc;
}

function ab2base64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

export default function CommissionInvoice({
  deal,
  contractor,
  onClose,
}: {
  deal: Deal;
  contractor: Contractor | undefined;
  onClose: () => void;
}) {
  const { getInvoiceConfig, saveBusinessProfile, getNextInvoiceNumber, recordInvoice, deals } = usePortalData();

  // This contractor's other jobs — offered as quick-pick when crediting against
  // a previous deal.
  const contractorJobs = useMemo(
    () =>
      deals
        .filter((d) => contractor && d.assignedContractorId === contractor.id && d.id !== deal.id)
        .map((d) => [d.homeownerName, d.projectType].filter(Boolean).join(' — '))
        .filter(Boolean),
    [deals, contractor, deal.id],
  );

  const [letterhead, setLetterhead] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  const rate = Math.round((contractor?.commissionRate ?? 0.085) * 10000) / 100;
  const [data, setData] = useState<InvoiceData>({
    invoiceNumber: '…',
    fromLegalName: '9664327 CANADA INC.',
    fromAddr1: '172 Silver Maple Rd',
    fromAddr2: 'Richmond Hill, Ontario L4E 4Y8',
    fromHst: '779706696RT0001',
    toContact: contractor?.contactName ?? '',
    toCompany: contractor?.companyName ?? '',
    toAddr1: contractor?.address ?? '',
    toAddr2: [contractor?.city, contractor?.province, contractor?.postalCode].filter(Boolean).join(' '),
    customerName: deal.homeownerName,
    salesPrice: deal.estimatedJobValue,
    commissionRate: rate,
    amount: Math.round(deal.estimatedJobValue * (rate / 100) * 100) / 100,
    bankName: 'TD Canada Trust',
    institutionNumber: '004',
    transitNumber: '11812',
    accountNumber: '5064635',
    showPayment: true,
    adjustments: [],
  });
  const [saveProfileDefault, setSaveProfileDefault] = useState(false);

  const set = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) =>
    setData((cur) => ({ ...cur, [key]: value }));

  const addAdjustment = () =>
    setData((cur) => ({
      ...cur,
      adjustments: [
        ...cur.adjustments,
        {
          id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
          description: '',
          relatedJob: '',
          kind: 'credit',
          mode: 'percent',
          base: 0,
          rate: cur.commissionRate,
          amount: 0,
        },
      ],
    }));
  const updateAdjustment = (id: string, patch: Partial<Adjustment>) =>
    setData((cur) => ({ ...cur, adjustments: cur.adjustments.map((a) => (a.id === id ? { ...a, ...patch } : a)) }));
  const removeAdjustment = (id: string) =>
    setData((cur) => ({ ...cur, adjustments: cur.adjustments.filter((a) => a.id !== id) }));

  const adjustmentsTotal = data.adjustments.reduce((s, a) => s + adjValue(a), 0);
  const netTotal = data.amount + adjustmentsTotal;

  // Recompute amount when price or rate changes
  useEffect(() => {
    setData((cur) => ({
      ...cur,
      amount: Math.round(cur.salesPrice * (cur.commissionRate / 100) * 100) / 100,
    }));
  }, [data.salesPrice, data.commissionRate]);

  // Initial load: letterhead, business profile, invoice number
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [lh, config, num] = await Promise.all([
        loadLetterhead(),
        getInvoiceConfig(),
        getNextInvoiceNumber(),
      ]);
      if (cancelled) return;
      setLetterhead(lh);
      setData((cur) => ({
        ...cur,
        invoiceNumber: String(num ?? ''),
        ...(config?.businessProfile
          ? {
              fromLegalName: config.businessProfile.legalName,
              fromAddr1: config.businessProfile.addressLine1,
              fromAddr2: config.businessProfile.addressLine2,
              fromHst: config.businessProfile.hstNumber,
              ...(config.businessProfile.bankName
                ? {
                    bankName: config.businessProfile.bankName,
                    institutionNumber: config.businessProfile.institutionNumber,
                    transitNumber: config.businessProfile.transitNumber,
                    accountNumber: config.businessProfile.accountNumber,
                  }
                : {}),
            }
          : {}),
      }));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Regenerate the live preview whenever data changes
  const lastUrl = useRef('');
  useEffect(() => {
    if (loading) return;
    const doc = buildPdf(letterhead, data);
    const url = doc.output('bloburl') as unknown as string;
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    lastUrl.current = url;
    setPreviewUrl(url);
    return () => { /* revoked on next gen */ };
  }, [data, letterhead, loading]);

  const fileName = useMemo(
    () => `Commission Invoice - ${data.customerName || 'Deal'}.pdf`,
    [data.customerName]
  );

  // Record the invoice in the ledger once per open (whether sent or downloaded),
  // so hitting Download repeatedly doesn't create duplicate entries.
  const recordedRef = useRef(false);
  const logInvoiceOnce = async (sentTo: string) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    try {
      await recordInvoice({
        invoiceNumber: Number(data.invoiceNumber) || null,
        dealId: deal.id,
        contractorId: contractor?.id ?? null,
        customerName: data.customerName,
        contractorName: data.toCompany,
        salesPrice: data.salesPrice,
        commissionRate: data.commissionRate,
        baseAmount: data.amount,
        adjustmentsTotal,
        netAmount: netTotal,
        sentTo,
        snapshot: JSON.stringify(data),
      });
    } catch {
      recordedRef.current = false; // allow a later attempt
    }
  };

  const handleDownload = async () => {
    buildPdf(letterhead, data).save(fileName);
    await persistProfileIfNeeded();
    await logInvoiceOnce('Downloaded');
    showToast({ variant: 'success', message: 'Invoice downloaded', description: 'Logged to Invoice History.' });
  };

  const persistProfileIfNeeded = async () => {
    if (saveProfileDefault) {
      await saveBusinessProfile({
        legalName: data.fromLegalName,
        addressLine1: data.fromAddr1,
        addressLine2: data.fromAddr2,
        hstNumber: data.fromHst,
        bankName: data.bankName,
        institutionNumber: data.institutionNumber,
        transitNumber: data.transitNumber,
        accountNumber: data.accountNumber,
      });
    }
  };

  const handleSend = async () => {
    const to = contractor?.email?.trim();
    if (!to) {
      showToast({ variant: 'error', message: 'This contractor has no email on file.' });
      return;
    }
    setSending(true);
    try {
      await persistProfileIfNeeded();
      const base64 = ab2base64(buildPdf(letterhead, data).output('arraybuffer'));
      const res = await fetch('/api/send-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc: 'info@ontarioreno.ca',
          subject: `Commission Invoice #${data.invoiceNumber} — ${data.customerName}`,
          body: [
            `Hi ${data.toContact || 'there'},`,
            '',
            `Please find attached the commission invoice for ${data.customerName}.`,
            '',
            `Invoice #${data.invoiceNumber}`,
            ...(data.adjustments.filter((a) => adjValue(a) !== 0 || a.description.trim()).length > 0
              ? [
                  `Commission subtotal: ${money(data.amount)}`,
                  ...data.adjustments
                    .filter((a) => adjValue(a) !== 0 || a.description.trim())
                    .map((a) => `${adjLabel(a)}: ${signedMoney(adjValue(a))}`),
                  `Total payable: ${money(netTotal)}`,
                ]
              : [`Amount: ${money(data.amount)}`]),
            ...(data.showPayment
              ? [
                  '',
                  'To settle the full balance in a single transaction and avoid standard daily Interac limits, please remit by Direct Deposit / EFT to:',
                  '',
                  `Bank: ${data.bankName}`,
                  `Institution Number: ${data.institutionNumber}`,
                  `Transit Number: ${data.transitNumber}`,
                  `Account Number: ${data.accountNumber}`,
                ]
              : []),
            '',
            'Thank you,',
            'MarketPlug',
          ].join('\n'),
          attachments: [{ filename: fileName, content: base64 }],
        }),
      });
      if (!res.ok) throw new Error('send failed');
      await logInvoiceOnce(to); // record in the ledger (best-effort)
      showToast({ variant: 'success', message: 'Invoice sent', description: `${data.toCompany} · ${money(netTotal)}` });
      onClose();
    } catch {
      showToast({ variant: 'error', message: 'Could not send the invoice. Try again.' });
    } finally {
      setSending(false);
    }
  };

  const field = (label: string, key: keyof InvoiceData, opts: { type?: string; full?: boolean } = {}) => (
    <label className={`grid gap-1 text-xs font-bold text-slate-600 ${opts.full ? 'sm:col-span-2' : ''}`}>
      {label}
      <input
        type={opts.type ?? 'text'}
        value={String(data[key])}
        onChange={(e) => set(key, (opts.type === 'number' ? Number(e.target.value) : e.target.value) as InvoiceData[typeof key])}
        className="rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[115] flex flex-col bg-slate-950/55 p-0 backdrop-blur-sm sm:p-5">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.3)] sm:rounded-[0.5rem]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4" style={{ paddingTop: 'max(1rem, calc(1rem + env(safe-area-inset-top, 0px)))' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Commission Invoice</p>
            <h2 className="mt-0.5 text-xl font-black tracking-[-0.02em]">#{data.invoiceNumber} · {data.customerName}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-0 overflow-hidden lg:grid-cols-[22rem_1fr] lg:grid-rows-1">
            {/* Editable fields */}
            <div className="overflow-y-auto border-b border-slate-200 p-4 lg:border-b-0 lg:border-r">
              <p className="mb-2 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">From (your details)</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {field('Legal name', 'fromLegalName', { full: true })}
                {field('Address line 1', 'fromAddr1', { full: true })}
                {field('Address line 2', 'fromAddr2', { full: true })}
                {field('HST number', 'fromHst', { full: true })}
              </div>
              <label className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                <input type="checkbox" checked={saveProfileDefault} onChange={(e) => setSaveProfileDefault(e.target.checked)} />
                Save these as my default
              </label>

              <p className="mb-2 mt-4 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">To (contractor)</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {field('Contact', 'toContact', { full: true })}
                {field('Company', 'toCompany', { full: true })}
                {field('Address line 1', 'toAddr1', { full: true })}
                {field('Address line 2', 'toAddr2', { full: true })}
              </div>

              <p className="mb-2 mt-4 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">Invoice details</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {field('Invoice #', 'invoiceNumber')}
                {field('Customer', 'customerName')}
                {field('Sales price (incl. HST)', 'salesPrice', { type: 'number' })}
                {field('Commission %', 'commissionRate', { type: 'number' })}
                {field('Amount (CAD)', 'amount', { type: 'number' })}
              </div>

              {/* ── Adjustments & credits ── */}
              <div className="mb-2 mt-4 flex items-center justify-between gap-2">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">Adjustments &amp; credits</p>
                <button type="button" onClick={addAdjustment} className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3C6C] hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              {data.adjustments.length === 0 ? (
                <p className="text-[0.7rem] font-semibold text-slate-400">
                  Optional. Add a credit (e.g. a portion of a job that didn’t proceed) or an extra charge — it’s itemised on the invoice and adjusts the total.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {data.adjustments.map((a) => (
                    <div key={a.id} className="rounded-[0.5rem] border border-slate-200 bg-slate-50/60 p-2.5">
                      <div className="flex items-start gap-2">
                        <input
                          value={a.description}
                          onChange={(e) => updateAdjustment(a.id, { description: e.target.value })}
                          placeholder="Reason — e.g. Landscaping scope not completed"
                          className="min-w-0 flex-1 rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
                        />
                        <button type="button" onClick={() => removeAdjustment(a.id)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-red-50 hover:text-red-500" aria-label="Remove">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        value={a.relatedJob}
                        onChange={(e) => updateAdjustment(a.id, { relatedJob: e.target.value })}
                        list={contractorJobs.length ? `adj-jobs-${a.id}` : undefined}
                        placeholder="Related job (optional) — e.g. Smith — Basement Reno"
                        className="mt-2 w-full rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
                      />
                      {contractorJobs.length > 0 && (
                        <datalist id={`adj-jobs-${a.id}`}>
                          {contractorJobs.map((j) => <option key={j} value={j} />)}
                        </datalist>
                      )}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <select
                          value={a.kind}
                          onChange={(e) => updateAdjustment(a.id, { kind: e.target.value as Adjustment['kind'] })}
                          className="rounded-[0.4rem] border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B3C6C]"
                        >
                          <option value="credit">Credit (−)</option>
                          <option value="charge">Charge (+)</option>
                        </select>
                        <select
                          value={a.mode}
                          onChange={(e) => updateAdjustment(a.id, { mode: e.target.value as Adjustment['mode'] })}
                          className="rounded-[0.4rem] border border-slate-200 bg-white px-2 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-[#1B3C6C]"
                        >
                          <option value="percent">% of scope amount</option>
                          <option value="amount">Flat amount</option>
                        </select>
                      </div>
                      {a.mode === 'percent' ? (
                        <div className="mt-2 flex items-center gap-2">
                          <input type="number" value={a.base || ''} onChange={(e) => updateAdjustment(a.id, { base: Number(e.target.value) })} placeholder="Scope $" className="w-0 flex-1 rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]" />
                          <span className="text-xs font-black text-slate-400">×</span>
                          <input type="number" value={a.rate || ''} onChange={(e) => updateAdjustment(a.id, { rate: Number(e.target.value) })} placeholder="%" className="w-16 rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]" />
                          <span className="text-xs font-black text-slate-400">=</span>
                          <span className={`shrink-0 text-sm font-black ${adjValue(a) < 0 ? 'text-red-600' : 'text-slate-900'}`}>{signedMoney(adjValue(a))}</span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center gap-2">
                          <input type="number" value={a.amount || ''} onChange={(e) => updateAdjustment(a.id, { amount: Number(e.target.value) })} placeholder="Amount $" className="w-0 flex-1 rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]" />
                          <span className="text-xs font-black text-slate-400">=</span>
                          <span className={`shrink-0 text-sm font-black ${adjValue(a) < 0 ? 'text-red-600' : 'text-slate-900'}`}>{signedMoney(adjValue(a))}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-[0.5rem] bg-[#f6faff] px-3 py-2">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Net total</span>
                    <span className="text-sm font-black text-[#1B3C6C]">{money(netTotal)}</span>
                  </div>
                </div>
              )}

              <div className="mb-2 mt-4 flex items-center justify-between gap-2">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">Payment details (EFT / direct deposit)</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.showPayment}
                  onClick={() => set('showPayment', !data.showPayment)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${data.showPayment ? 'bg-[#1B3C6C]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${data.showPayment ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className={`grid gap-2.5 sm:grid-cols-2 ${data.showPayment ? '' : 'pointer-events-none opacity-40'}`}>
                {field('Bank', 'bankName', { full: true })}
                {field('Institution #', 'institutionNumber')}
                {field('Transit #', 'transitNumber')}
                {field('Account #', 'accountNumber', { full: true })}
              </div>
              <p className="mt-1.5 text-[0.7rem] font-semibold text-slate-400">
                {data.showPayment
                  ? 'Shown on the invoice so the contractor can pay by direct deposit. Toggle off to hide it on this invoice.'
                  : 'Hidden — the payment section won’t appear on this invoice.'}
              </p>
            </div>

            {/* Live preview */}
            <div className="flex min-h-0 flex-col bg-slate-100">
              <div className="min-h-0 flex-1 overflow-hidden p-3">
                {previewUrl && (
                  <iframe title="Invoice preview" src={previewUrl} className="h-full w-full rounded-[0.4rem] border border-slate-200 bg-white" />
                )}
              </div>
              <div className="flex flex-col gap-2 border-t border-slate-200 bg-white p-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={handleDownload} className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  <Download className="h-4 w-4" /> Download PDF
                </button>
                <button type="button" onClick={handleSend} disabled={sending} className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : `Send to ${contractor?.companyName || 'contractor'}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
