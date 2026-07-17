import { Check, FileText, Loader2, Mail, MessageCircle, Save, Send, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePortalData } from '../data/store';
import { showToast } from '../lib/toast';
import type { FinanceDocument, FinancePayload } from '../data/types';
import AddressAutocomplete from './AddressAutocomplete';

const DEFAULT_DOCS: FinanceDocument[] = [
  { type: 'noa', label: 'Notice of Assessment (most recent)', requested: false },
  { type: 'self_emp_invoices', label: 'Invoices — business → personal account payments', note: 'For self-employment', requested: false },
  { type: 'bank_3mo', label: '3 months of personal bank statements', requested: false },
  { type: 'paystubs', label: 'Two non-recent paystubs', requested: false },
  { type: 'rental', label: 'Rental income — lease agreement and/or 6 months of statements', note: 'If applicable', requested: false },
];

type Prefill = { firstName?: string; lastName?: string; phone?: string; email?: string; address?: string };

// The finance form keeps a single address string. Prefer Google's own one-line
// formatted address (already complete); only fall back to composing from the
// street/city/postal components when that isn't available.
function fullAddress(p: { address: string; city: string; postalCode: string; formatted?: string }): string {
  if (p.formatted && p.formatted.trim()) return p.formatted.trim();
  const cityPostal = [p.city, p.postalCode].filter(Boolean).join(' ');
  return [p.address, cityPostal].filter(Boolean).join(', ');
}

function blankPayload(prefill: Prefill): FinancePayload {
  return {
    firstName: prefill.firstName ?? '',
    middleName: '',
    lastName: prefill.lastName ?? '',
    birthday: '',
    phone: prefill.phone ?? '',
    address: prefill.address ?? '',
    mailingSameAsInstall: true,
    mailingAddress: '',
    email: prefill.email ?? '',
    incomeWithTaxes: '',
    otherIncome: '',
    employer: '',
    employmentPosition: '',
    employerAddress: '',
    status: 'draft',
    documents: DEFAULT_DOCS,
    notes: '',
  };
}

// Keep any saved doc rows, add any new default ones we don't have yet.
function mergeDocs(saved: FinanceDocument[] | undefined): FinanceDocument[] {
  const byType = new Map((saved ?? []).map((d) => [d.type, d]));
  return DEFAULT_DOCS.map((d) => ({ ...d, ...(byType.get(d.type) ?? {}) }));
}

export default function FinanceTab({ appointmentId, prefill }: { appointmentId: string; prefill: Prefill }) {
  const { getFinance, saveFinance, financeUpload, sendFinance, contractors } = usePortalData();
  const [form, setForm] = useState<FinancePayload>(() => blankPayload(prefill));
  const [sendMethod, setSendMethod] = useState<'email' | 'whatsapp'>('email');
  const [sendContractorId, setSendContractorId] = useState('');
  const [sendEmail, setSendEmail] = useState('');
  const [sendPhone, setSendPhone] = useState('');
  const [sendBusy, setSendBusy] = useState(false);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const dlRef = useRef<HTMLInputElement>(null);
  const docRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { payload, urls: u } = await getFinance(appointmentId);
    if (payload) {
      setForm({ ...blankPayload(prefill), ...payload, documents: mergeDocs(payload.documents) });
    } else {
      setForm(blankPayload(prefill));
    }
    setUrls(u ?? {});
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointmentId, getFinance]);

  useEffect(() => { load(); }, [load]);

  const set = <K extends keyof FinancePayload>(key: K, value: FinancePayload[K]) =>
    setForm((cur) => ({ ...cur, [key]: value }));

  const persist = async (next: FinancePayload) => {
    setForm(next);
    const u = await saveFinance(appointmentId, next);
    setUrls((cur) => ({ ...cur, ...u }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const u = await saveFinance(appointmentId, form);
      setUrls((cur) => ({ ...cur, ...u }));
      showToast({ variant: 'success', message: 'Finance info saved' });
    } catch {
      showToast({ variant: 'error', message: 'Could not save. Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const uploadDl = async (file: File) => {
    setUploadingSlot('dl');
    try {
      const r = await financeUpload(appointmentId, 'dl', file);
      if (r) {
        setUrls((cur) => ({ ...cur, [r.key]: r.url }));
        await persist({ ...form, dlPhotoKey: r.key, dlPhotoName: file.name });
      }
    } catch {
      showToast({ variant: 'error', message: 'Upload failed. Try again.' });
    } finally {
      setUploadingSlot(null);
    }
  };

  const uploadDoc = async (docType: string, file: File) => {
    setUploadingSlot(docType);
    try {
      const r = await financeUpload(appointmentId, 'doc', file);
      if (r) {
        setUrls((cur) => ({ ...cur, [r.key]: r.url }));
        const documents = form.documents.map((d) => (d.type === docType ? { ...d, key: r.key, fileName: file.name, requested: true } : d));
        await persist({ ...form, documents });
      }
    } catch {
      showToast({ variant: 'error', message: 'Upload failed. Try again.' });
    } finally {
      setUploadingSlot(null);
    }
  };

  const toggleDoc = (docType: string, requested: boolean) => {
    set('documents', form.documents.map((d) => (d.type === docType ? { ...d, requested } : d)));
  };

  const onPickContractor = (id: string) => {
    setSendContractorId(id);
    const c = contractors.find((x) => x.id === id);
    if (c) {
      setSendEmail((c.email ?? '').trim());
      setSendPhone((c.phone ?? '').trim());
    }
  };

  const doSend = async () => {
    const recipient = (sendMethod === 'email' ? sendEmail : sendPhone).trim();
    if (!recipient) {
      showToast({ variant: 'error', message: sendMethod === 'email' ? 'Enter an email.' : 'Enter a phone number.' });
      return;
    }
    // Open the tab synchronously (within the click) so it isn't popup-blocked;
    // we redirect it to the WhatsApp URL once the server returns it.
    const waWindow = sendMethod === 'whatsapp' ? window.open('', '_blank') : null;
    setSendBusy(true);
    try {
      await saveFinance(appointmentId, form); // send the latest saved info
      const r = await sendFinance(appointmentId, sendMethod, recipient);
      if (!r.ok) { waWindow?.close(); showToast({ variant: 'error', message: 'Could not send', description: r.error }); return; }
      if (sendMethod === 'whatsapp' && r.waUrl) {
        if (waWindow) waWindow.location.href = r.waUrl; else window.open(r.waUrl, '_blank', 'noopener');
        showToast({ variant: 'success', message: 'Opening WhatsApp…' });
      } else {
        showToast({ variant: 'success', message: 'Finance application emailed', description: recipient });
      }
    } catch {
      showToast({ variant: 'error', message: 'Could not send. Try again.' });
    } finally {
      setSendBusy(false);
    }
  };

  const contractorsWithContact = contractors.filter((c) => (c.email ?? '').trim() || (c.phone ?? '').trim());

  const field = (label: string, key: keyof FinancePayload, opts: { type?: string; full?: boolean; placeholder?: string } = {}) => (
    <label className={`grid gap-1.5 text-sm font-bold text-slate-700 ${opts.full ? 'sm:col-span-2' : ''}`}>
      {label}
      <input
        type={opts.type ?? 'text'}
        value={String(form[key] ?? '')}
        placeholder={opts.placeholder}
        onChange={(e) => set(key, e.target.value as FinancePayload[typeof key])}
      />
    </label>
  );

  if (loading) {
    return <div className="flex items-center justify-center py-10 text-slate-300"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">FinanceIt Send-In</p>
            <h3 className="mt-1 text-xl font-black tracking-[-0.02em]">Applicant details</h3>
          </div>
          <label className="grid gap-1 text-xs font-bold text-slate-600">
            Status
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value as FinancePayload['status'])}
              className="rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-800"
            >
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {field('First name', 'firstName')}
        {field('Middle name', 'middleName')}
        {field('Last name', 'lastName')}
        {field('Birthday (year/month/day)', 'birthday', { type: 'date' })}
        {field('Phone number', 'phone')}
        {field('Email', 'email', { type: 'email' })}
        <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
          Address (where the product is installed)
          <AddressAutocomplete value={form.address} onChange={(v) => set('address', v)} onSelect={(p) => set('address', fullAddress(p))} placeholder="Start typing the home address…" />
        </label>
        <div className="grid gap-2 sm:col-span-2">
          <label className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
            <button
              type="button"
              onClick={() => set('mailingSameAsInstall', !(form.mailingSameAsInstall ?? true))}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${(form.mailingSameAsInstall ?? true) ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white' : 'border-slate-300 hover:border-[#1B3C6C]'}`}
              aria-label="Mailing address same as install address"
            >
              {(form.mailingSameAsInstall ?? true) && <Check className="h-3 w-3" />}
            </button>
            Mailing address is the same as the install address
          </label>
          {!(form.mailingSameAsInstall ?? true) && (
            <label className="grid gap-1.5 text-sm font-bold text-slate-700">
              Mailing address
              <AddressAutocomplete value={form.mailingAddress ?? ''} onChange={(v) => set('mailingAddress', v)} onSelect={(p) => set('mailingAddress', fullAddress(p))} placeholder="Start typing the mailing address…" />
            </label>
          )}
        </div>
        {field('Income (including taxes)', 'incomeWithTaxes', { placeholder: 'e.g. 85,000' })}
        {field('Other income', 'otherIncome')}
        {field('Employer', 'employer')}
        {field('Employment position', 'employmentPosition')}
        <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
          Employer's address
          <AddressAutocomplete value={form.employerAddress} onChange={(v) => set('employerAddress', v)} onSelect={(p) => set('employerAddress', fullAddress(p))} placeholder="Start typing the employer's address…" />
        </label>
      </div>

      {/* Driver's licence front photo */}
      <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Driver's licence — front</p>
        <div className="mt-2 flex items-center gap-3">
          {form.dlPhotoKey && urls[form.dlPhotoKey] ? (
            <a href={urls[form.dlPhotoKey]} target="_blank" rel="noreferrer" className="block">
              <img src={urls[form.dlPhotoKey]} alt="Driver's licence" className="h-24 w-40 rounded-[0.4rem] border border-slate-200 object-cover" />
            </a>
          ) : (
            <div className="flex h-24 w-40 items-center justify-center rounded-[0.4rem] border border-dashed border-slate-300 bg-slate-50 text-xs font-semibold text-slate-400">No photo</div>
          )}
          <button
            type="button"
            onClick={() => dlRef.current?.click()}
            disabled={uploadingSlot === 'dl'}
            className="inline-flex items-center gap-2 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb] disabled:opacity-50"
          >
            {uploadingSlot === 'dl' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {form.dlPhotoKey ? 'Replace photo' : 'Upload photo'}
          </button>
          <input ref={dlRef} type="file" accept="image/*" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadDl(f); }} />
        </div>
      </section>

      {/* Approval document checklist */}
      {form.status === 'approved' && (
        <section className="rounded-[0.5rem] border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">Documents to request for approval</p>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">Tick each as requested, and attach it here once received.</p>
          <div className="mt-3 space-y-2">
            {form.documents.map((d) => (
              <div key={d.type} className="flex items-start gap-3 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => toggleDoc(d.type, !d.requested)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${d.requested ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 hover:border-[#1B3C6C]'}`}
                  aria-label="Mark requested"
                >
                  {d.requested && <Check className="h-3 w-3" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-900">{d.label}</p>
                  {d.note && <p className="text-xs font-semibold text-slate-400">{d.note}</p>}
                  {d.key && urls[d.key] && (
                    <a href={urls[d.key]} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#1B3C6C] hover:underline">
                      <FileText className="h-3.5 w-3.5" /> {d.fileName || 'View file'}
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => docRefs.current[d.type]?.click()}
                  disabled={uploadingSlot === d.type}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[0.5rem] border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  {uploadingSlot === d.type ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  {d.key ? 'Replace' : 'Attach'}
                </button>
                <input
                  ref={(el) => { docRefs.current[d.type] = el; }}
                  type="file"
                  accept="image/*,application/pdf"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) uploadDoc(d.type, f); }}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Send to a contractor */}
      <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Send to contractor</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            Contractor
            <select value={sendContractorId} onChange={(e) => onPickContractor(e.target.value)}>
              <option value="">Select a contractor…</option>
              {contractorsWithContact.map((c) => (
                <option key={c.id} value={c.id}>{c.companyName}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-1.5 text-sm font-bold text-slate-700">
            Send via
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSendMethod('email')}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[0.5rem] border px-3 py-2 text-xs font-bold transition ${sendMethod === 'email' ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <Mail className="h-3.5 w-3.5" /> Email
              </button>
              <button
                type="button"
                onClick={() => setSendMethod('whatsapp')}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[0.5rem] border px-3 py-2 text-xs font-bold transition ${sendMethod === 'whatsapp' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
              >
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </button>
            </div>
          </div>
          {sendMethod === 'email' ? (
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
              Email (edit if needed)
              <input type="email" value={sendEmail} onChange={(e) => setSendEmail(e.target.value)} placeholder="contractor@example.com" />
            </label>
          ) : (
            <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
              WhatsApp number (edit if needed)
              <input type="tel" value={sendPhone} onChange={(e) => setSendPhone(e.target.value)} placeholder="e.g. 416-555-0100" />
            </label>
          )}
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={doSend}
            disabled={sendBusy}
            className={`inline-flex items-center gap-2 rounded-[0.5rem] px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-50 ${sendMethod === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-[#1B3C6C] hover:bg-[#153158]'}`}
          >
            {sendBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : sendMethod === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            {sendBusy ? 'Sending…' : sendMethod === 'whatsapp' ? 'Open in WhatsApp' : 'Send email'}
          </button>
        </div>
        <p className="mt-2 text-[0.7rem] font-semibold text-slate-400">
          Sends the applicant details plus secure 7-day links to the licence &amp; documents. Saves the form first.
        </p>
      </section>

      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
        Notes (optional)
        <textarea rows={3} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} placeholder="Anything else the finance sign-up will need…" />
      </label>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save finance info'}
        </button>
      </div>
    </div>
  );
}
