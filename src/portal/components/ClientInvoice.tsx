// ─── Client invoice (marketing / retainer work) ───────────────────────────────
//
// The commission invoice next door is welded to a Deal: it charges one
// contractor a percentage of one sales price. That is the right shape for the
// reno business and the wrong shape for the marketing side, where an invoice is
// a retainer plus whatever else was done that month, with HST on top.
//
// So this is a SECOND generator, not a rewrite of the first. It shares the
// letterhead loader and nothing else — CommissionInvoice keeps its layout, its
// adjustments model, and its deal wiring untouched. Both write to the same
// invoice ledger and draw from the same number sequence, so a client invoice
// and a commission invoice can never be issued under the same number.

import { jsPDF } from 'jspdf';
import { Download, Loader2, Plus, Send, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import { loadLetterhead } from './CommissionInvoice';

// ── Layout constants (points; Letter page = 612 × 792) ──
const PAGE_W = 612;
const PAGE_H = 792;
const BLUE: [number, number, number] = [42, 77, 160];
const INK: [number, number, number] = [25, 25, 25];
const LINE_BLUE: [number, number, number] = [150, 175, 215];

/** Ontario HST. Editable on the form — this is only the starting point. */
export const DEFAULT_HST_RATE = 13;

/** One billable line: a retainer, a project fee, an expense passed through. */
export type ClientLineItem = {
  id: string;
  description: string;
  /** Optional second line under the description — scope, period, whatever. */
  detail: string;
  quantity: number;
  unitAmount: number;
  /** Off for a line that is out of scope for HST (e.g. a disbursement). */
  taxable: boolean;
};

export type ClientInvoiceData = {
  /**
   * Marks the snapshot so a ledger row can be told apart from a commission
   * invoice and re-rendered with the right builder. Rows written before this
   * feature have no `kind`, which reads as a commission invoice — correct.
   */
  kind: 'client';
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  fromLegalName: string;
  fromAddr1: string;
  fromAddr2: string;
  fromHst: string;
  toContact: string;
  toCompany: string;
  toAddr1: string;
  toAddr2: string;
  toEmail: string;
  lineItems: ClientLineItem[];
  hstEnabled: boolean;
  hstRate: number;
  notes: string;
  bankName: string;
  institutionNumber: string;
  transitNumber: string;
  accountNumber: string;
  showPayment: boolean;
};

function fmtNum(v: number) {
  return v.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function money(v: number) {
  return `CAD $${fmtNum(v)}`;
}

function round2(v: number) {
  return Math.round(v * 100) / 100;
}

export function lineTotal(item: ClientLineItem): number {
  return round2((Number(item.quantity) || 0) * (Number(item.unitAmount) || 0));
}

export type ClientInvoiceTotals = {
  subtotal: number;
  taxableBase: number;
  hst: number;
  total: number;
};

/** Subtotal, HST on the taxable lines only, and the grand total. */
export function computeTotals(d: ClientInvoiceData): ClientInvoiceTotals {
  const subtotal = round2(d.lineItems.reduce((sum, item) => sum + lineTotal(item), 0));
  const taxableBase = round2(
    d.lineItems.filter((item) => item.taxable).reduce((sum, item) => sum + lineTotal(item), 0),
  );
  const hst = d.hstEnabled ? round2((taxableBase * (Number(d.hstRate) || 0)) / 100) : 0;
  return { subtotal, taxableBase, hst, total: round2(subtotal + hst) };
}

/** A human date for the PDF, from a yyyy-mm-dd input value. */
function prettyDate(iso: string): string {
  if (!iso) return '';
  const [y, m, day] = iso.split('-').map(Number);
  if (!y || !m || !day) return iso;
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString('en-CA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function buildClientInvoicePdf(letterhead: string | null, d: ClientInvoiceData): jsPDF {
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

  // TO — contact and company both wrap; everything below flows on a cursor.
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFontSize(11);
  doc.text('TO:', 328, 162);

  const TO_MAX_W = 225;
  const drawWrapped = (text: string, y: number, baseSize: number, color: number[], maxLines: number): number => {
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
  if (d.toAddr2) { doc.text(d.toAddr2, 328, toY); toY += 13; }
  if (d.toEmail) doc.text(d.toEmail, 328, toY);

  // Dates, on the line between the boxes and the table
  let headY = 278;
  doc.setFontSize(9.5);
  doc.setTextColor(95, 95, 95);
  const dateBits = [
    d.issueDate ? `Invoice date: ${prettyDate(d.issueDate)}` : '',
    d.dueDate ? `Due: ${prettyDate(d.dueDate)}` : '',
  ].filter(Boolean);
  if (dateBits.length) doc.text(dateBits.join('   ·   '), 43, headY);
  headY += 22;

  // Description / Amount headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.text('Description', 43, headY);
  doc.text('Amount', 569, headY, { align: 'right' });
  doc.setDrawColor(LINE_BLUE[0], LINE_BLUE[1], LINE_BLUE[2]);
  doc.setLineWidth(1);
  doc.line(43, headY + 9, 569, headY + 9);

  // Line items, on a flowing cursor so any number of them fit.
  let dy = headY + 30;
  const items = d.lineItems.filter((item) => item.description.trim() || lineTotal(item) !== 0);
  for (const item of items) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(INK[0], INK[1], INK[2]);
    const nameLines = doc.splitTextToSize(item.description.trim() || 'Services', 380) as string[];
    doc.text(nameLines, 43, dy);
    doc.text(money(lineTotal(item)), 569, dy, { align: 'right' });
    dy += nameLines.length * 14;

    doc.setFontSize(9.5);
    doc.setTextColor(95, 95, 95);
    if (item.detail.trim()) {
      const detailLines = doc.splitTextToSize(item.detail.trim(), 380) as string[];
      doc.text(detailLines, 43, dy);
      dy += detailLines.length * 12;
    }
    // Show the arithmetic only when it isn't a plain single charge.
    if ((Number(item.quantity) || 0) !== 1) {
      doc.text(`${fmtNum(Number(item.quantity) || 0)} × $${fmtNum(Number(item.unitAmount) || 0)}`, 43, dy);
      dy += 12;
    }
    if (d.hstEnabled && !item.taxable) {
      doc.text('HST not applicable', 43, dy);
      dy += 12;
    }
    dy += 8;
  }

  // Totals
  const { subtotal, hst, total } = computeTotals(d);
  const totalsTop = Math.max(dy + 8, 392);
  doc.setDrawColor(LINE_BLUE[0], LINE_BLUE[1], LINE_BLUE[2]);
  doc.setLineWidth(1);
  doc.line(43, totalsTop, 569, totalsTop);
  let ty = totalsTop + 22;
  doc.setFontSize(12);
  doc.setTextColor(INK[0], INK[1], INK[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('Sub Total', 400, ty);
  doc.setFont('helvetica', 'normal');
  doc.text(money(subtotal), 569, ty, { align: 'right' });
  ty += 18;
  if (d.hstEnabled) {
    doc.setFont('helvetica', 'bold');
    doc.text(`HST (${d.hstRate}%)`, 400, ty);
    doc.setFont('helvetica', 'normal');
    doc.text(money(hst), 569, ty, { align: 'right' });
    ty += 18;
  }
  ty -= 8;
  doc.line(400, ty, 569, ty);
  ty += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Total (CAD)', 400, ty);
  doc.setFont('helvetica', 'normal');
  doc.text(money(total), 569, ty, { align: 'right' });

  // ── Payment instructions (lower-left white space, clear of the wave) ──
  const px = 43;
  let py = totalsTop + 14;
  if (d.showPayment && (d.bankName || d.accountNumber)) {
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
    py += ph + 14;
  }

  if (d.notes.trim()) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(95, 95, 95);
    const noteLines = doc.splitTextToSize(d.notes.trim(), 332) as string[];
    doc.text(noteLines, px, py + 12);
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

const newId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

/** A fresh, empty billable line. */
export function blankLineItem(): ClientLineItem {
  return { id: newId(), description: '', detail: '', quantity: 1, unitAmount: 0, taxable: true };
}

/** Today in Toronto, as yyyy-mm-dd for a date input. */
function todayIso(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto' }).format(new Date());
}

/** yyyy-mm-dd, `days` after today. */
function todayPlus(days: number): string {
  const base = new Date(`${todayIso()}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export default function ClientInvoice({ onClose, onSaved }: { onClose: () => void; onSaved?: () => void }) {
  const { getInvoiceConfig, saveBusinessProfile, getNextInvoiceNumber, recordInvoice } = usePortalData();

  const [letterhead, setLetterhead] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [saveProfileDefault, setSaveProfileDefault] = useState(false);

  const [data, setData] = useState<ClientInvoiceData>({
    kind: 'client',
    invoiceNumber: '…',
    issueDate: todayIso(),
    dueDate: todayPlus(14),
    fromLegalName: '9664327 CANADA INC.',
    fromAddr1: '172 Silver Maple Rd',
    fromAddr2: 'Richmond Hill, Ontario L4E 4Y8',
    fromHst: '779706696RT0001',
    toContact: '',
    toCompany: '',
    toAddr1: '',
    toAddr2: '',
    toEmail: '',
    lineItems: [{ ...blankLineItem(), description: 'Monthly marketing retainer' }],
    hstEnabled: true,
    hstRate: DEFAULT_HST_RATE,
    notes: '',
    bankName: 'TD Canada Trust',
    institutionNumber: '004',
    transitNumber: '11812',
    accountNumber: '5064635',
    showPayment: true,
  });

  const set = <K extends keyof ClientInvoiceData>(key: K, value: ClientInvoiceData[K]) =>
    setData((cur) => ({ ...cur, [key]: value }));

  const addLine = () => setData((cur) => ({ ...cur, lineItems: [...cur.lineItems, blankLineItem()] }));
  const updateLine = (id: string, patch: Partial<ClientLineItem>) =>
    setData((cur) => ({
      ...cur,
      lineItems: cur.lineItems.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  const removeLine = (id: string) =>
    setData((cur) => ({ ...cur, lineItems: cur.lineItems.filter((item) => item.id !== id) }));

  const totals = computeTotals(data);

  // Initial load: letterhead, business profile, invoice number
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [lh, config, num] = await Promise.all([loadLetterhead(), getInvoiceConfig(), getNextInvoiceNumber()]);
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
    const doc = buildClientInvoicePdf(letterhead, data);
    const url = doc.output('bloburl') as unknown as string;
    if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
    lastUrl.current = url;
    setPreviewUrl(url);
  }, [data, letterhead, loading]);

  const clientLabel = data.toCompany.trim() || data.toContact.trim() || 'Client';
  const fileName = useMemo(() => `Invoice ${data.invoiceNumber} - ${clientLabel}.pdf`, [data.invoiceNumber, clientLabel]);

  // Log once per open, whether it went out by email or was downloaded, so
  // hitting Download twice doesn't double up in the history.
  const recordedRef = useRef(false);
  const logInvoiceOnce = async (sentTo: string) => {
    if (recordedRef.current) return;
    recordedRef.current = true;
    try {
      await recordInvoice({
        invoiceNumber: Number(data.invoiceNumber) || null,
        dealId: null,
        contractorId: null,
        customerName: clientLabel,
        contractorName: data.toContact,
        salesPrice: totals.subtotal,
        commissionRate: data.hstEnabled ? data.hstRate : 0,
        baseAmount: totals.subtotal,
        adjustmentsTotal: totals.hst,
        netAmount: totals.total,
        sentTo,
        snapshot: JSON.stringify(data),
      });
      onSaved?.();
    } catch {
      recordedRef.current = false; // allow a later attempt
    }
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

  const handleDownload = async () => {
    buildClientInvoicePdf(letterhead, data).save(fileName);
    await persistProfileIfNeeded();
    await logInvoiceOnce('Downloaded');
    showToast({ variant: 'success', message: 'Invoice downloaded', description: 'Logged to Invoice History.' });
  };

  const handleSend = async () => {
    const to = data.toEmail.trim();
    if (!to) {
      showToast({ variant: 'error', message: 'Add the client’s email address first.' });
      return;
    }
    setSending(true);
    try {
      await persistProfileIfNeeded();
      const base64 = ab2base64(buildClientInvoicePdf(letterhead, data).output('arraybuffer'));
      const res = await fetch('/api/send-email', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc: 'info@ontarioreno.ca',
          subject: `Invoice #${data.invoiceNumber} — ${clientLabel}`,
          body: [
            `Hi ${data.toContact || 'there'},`,
            '',
            `Please find attached invoice #${data.invoiceNumber}.`,
            '',
            ...data.lineItems
              .filter((item) => item.description.trim() || lineTotal(item) !== 0)
              .map((item) => `${item.description.trim() || 'Services'}: ${money(lineTotal(item))}`),
            `Subtotal: ${money(totals.subtotal)}`,
            ...(data.hstEnabled ? [`HST (${data.hstRate}%): ${money(totals.hst)}`] : []),
            `Total payable: ${money(totals.total)}`,
            ...(data.dueDate ? ['', `Due: ${prettyDate(data.dueDate)}`] : []),
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
      await logInvoiceOnce(to);
      showToast({ variant: 'success', message: 'Invoice sent', description: `${clientLabel} · ${money(totals.total)}` });
      onClose();
    } catch {
      showToast({ variant: 'error', message: 'Could not send the invoice. Try again.' });
    } finally {
      setSending(false);
    }
  };

  const field = (
    label: string,
    key: keyof ClientInvoiceData,
    opts: { type?: string; full?: boolean } = {},
  ) => (
    <label className={`grid gap-1 text-xs font-bold text-slate-600 ${opts.full ? 'sm:col-span-2' : ''}`}>
      {label}
      <input
        type={opts.type ?? 'text'}
        value={String(data[key])}
        onChange={(e) =>
          set(key, (opts.type === 'number' ? Number(e.target.value) : e.target.value) as ClientInvoiceData[typeof key])
        }
        className="rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-[115] flex flex-col bg-slate-950/55 p-0 backdrop-blur-sm sm:p-5">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.3)] sm:rounded-[0.5rem]">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4" style={{ paddingTop: 'max(1rem, calc(1rem + env(safe-area-inset-top, 0px)))' }}>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Client Invoice</p>
            <h2 className="mt-0.5 text-xl font-black tracking-[-0.02em]">#{data.invoiceNumber} · {clientLabel}</h2>
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

              <p className="mb-2 mt-4 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">To (client)</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {field('Contact', 'toContact', { full: true })}
                {field('Company', 'toCompany', { full: true })}
                {field('Email', 'toEmail', { type: 'email', full: true })}
                {field('Address line 1', 'toAddr1', { full: true })}
                {field('Address line 2', 'toAddr2', { full: true })}
              </div>

              <p className="mb-2 mt-4 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">Invoice details</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {field('Invoice #', 'invoiceNumber')}
                {field('Invoice date', 'issueDate', { type: 'date' })}
                {field('Due date', 'dueDate', { type: 'date', full: true })}
              </div>

              {/* ── Line items ── */}
              <div className="mb-2 mt-4 flex items-center justify-between gap-2">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">Line items</p>
                <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-xs font-bold text-[#1B3C6C] hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add
                </button>
              </div>
              <div className="space-y-2.5">
                {data.lineItems.map((item) => (
                  <div key={item.id} className="rounded-[0.5rem] border border-slate-200 bg-slate-50/60 p-2.5">
                    <div className="flex items-start gap-2">
                      <input
                        value={item.description}
                        onChange={(e) => updateLine(item.id, { description: e.target.value })}
                        placeholder="Description — e.g. Monthly marketing retainer"
                        className="min-w-0 flex-1 rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
                      />
                      <button
                        type="button"
                        onClick={() => removeLine(item.id)}
                        disabled={data.lineItems.length === 1}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-300"
                        aria-label="Remove line"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      value={item.detail}
                      onChange={(e) => updateLine(item.id, { detail: e.target.value })}
                      placeholder="Detail (optional) — e.g. August 2026"
                      className="mt-2 w-full rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateLine(item.id, { quantity: Number(e.target.value) })}
                        placeholder="Qty"
                        className="w-16 rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
                      />
                      <span className="text-xs font-black text-slate-400">×</span>
                      <input
                        type="number"
                        value={item.unitAmount || ''}
                        onChange={(e) => updateLine(item.id, { unitAmount: Number(e.target.value) })}
                        placeholder="Amount $"
                        className="w-0 flex-1 rounded-[0.4rem] border border-slate-200 px-2 py-1.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
                      />
                      <span className="text-xs font-black text-slate-400">=</span>
                      <span className="shrink-0 text-sm font-black text-slate-900">{money(lineTotal(item))}</span>
                    </div>
                    <label className="mt-2 flex items-center gap-2 text-[0.7rem] font-bold text-slate-500">
                      <input
                        type="checkbox"
                        checked={item.taxable}
                        onChange={(e) => updateLine(item.id, { taxable: e.target.checked })}
                      />
                      HST applies to this line
                    </label>
                  </div>
                ))}
              </div>

              {/* ── Tax ── */}
              <div className="mb-2 mt-4 flex items-center justify-between gap-2">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">HST</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.hstEnabled}
                  onClick={() => set('hstEnabled', !data.hstEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${data.hstEnabled ? 'bg-[#1B3C6C]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${data.hstEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <div className={`grid gap-2.5 sm:grid-cols-2 ${data.hstEnabled ? '' : 'pointer-events-none opacity-40'}`}>
                {field('HST rate (%)', 'hstRate', { type: 'number' })}
              </div>

              <div className="mt-3 space-y-1 rounded-[0.5rem] bg-[#f6faff] px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Subtotal</span>
                  <span className="text-sm font-bold text-slate-700">{money(totals.subtotal)}</span>
                </div>
                {data.hstEnabled && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">HST ({data.hstRate}%)</span>
                    <span className="text-sm font-bold text-slate-700">{money(totals.hst)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-[#d9e7f7] pt-1.5">
                  <span className="text-xs font-black uppercase tracking-[0.1em] text-slate-500">Total</span>
                  <span className="text-sm font-black text-[#1B3C6C]">{money(totals.total)}</span>
                </div>
              </div>

              <p className="mb-2 mt-4 text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">Notes (optional)</p>
              <textarea
                value={data.notes}
                onChange={(e) => set('notes', e.target.value)}
                rows={2}
                placeholder="Anything the client should see under the payment box."
                className="w-full rounded-[0.4rem] border border-slate-200 px-2.5 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
              />

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
                <button type="button" onClick={handleSend} disabled={sending || !data.toEmail.trim()} className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {sending ? 'Sending…' : `Send to ${clientLabel}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
