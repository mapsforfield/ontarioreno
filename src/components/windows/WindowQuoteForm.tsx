import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { CheckCircle2, FileText, Loader2, Upload, X } from 'lucide-react';
import { formStyles } from '../../lib/uiStyles';
import { newEventId, trackCustom, trackEvent } from '../../lib/pixel';
import { readAttribution } from '../../lib/attributionCapture';
import {
  DOOR_COUNT_OPTIONS,
  QUOTE_FILE_RULES,
  TIMELINE_OPTIONS,
  WINDOW_CONSENT_TEXT,
  WINDOW_COUNT_OPTIONS,
  type WindowQuotePath,
} from '../../../lib/window-quote';

/**
 * The /windows quote form. One form, two paths:
 *
 *   A. "I have a quote": files + four contact fields. Nothing else.
 *   B. "I need a quote": three tap-to-pick questions + the same contact fields.
 *
 * Built for a thumb on a phone that arrived from a Meta ad: every choice is a
 * big tap target rather than a dropdown, inputs carry the right keyboard and
 * autofill hints, and files upload the moment they are picked so submitting
 * does not wait on them.
 *
 * Files go straight from the browser to private storage (see `windows_presign`
 * in api/leads/index.ts). They are never public; the admin opens them through
 * a login-gated link.
 *
 * Validation lives in lib/window-quote.ts and the server re-runs it. The
 * checks here only exist to give the homeowner a message before the round
 * trip, so the two may never disagree about what is accepted.
 */

type UploadState = {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'done' | 'error';
  progress: number;
  key?: string;
  error?: string;
};

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/** utm_source / utm_campaign / ref: from this URL, else from the visit's first page. */
function readTracking() {
  const pick = (search: string) => {
    const q = new URLSearchParams(search);
    return { utmSource: q.get('utm_source') ?? '', utmCampaign: q.get('utm_campaign') ?? '', ref: q.get('ref') ?? '' };
  };
  const here = pick(window.location.search);
  const landing = readAttribution()?.landingPage ?? '';
  const first = pick(landing.includes('?') ? landing.slice(landing.indexOf('?')) : '');
  return {
    utmSource: here.utmSource || first.utmSource,
    utmCampaign: here.utmCampaign || first.utmCampaign,
    ref: here.ref || first.ref,
  };
}

function putFile(url: string, file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and try again.'));
    xhr.send(file);
  });
}

function formatSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ChoiceGroup({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <fieldset>
      <legend className={formStyles.label}>{label}</legend>
      <div className={`grid gap-2 ${options.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
        {options.map((option) => {
          const selected = value === option;
          return (
            <label
              key={option}
              className={`flex min-h-[3rem] cursor-pointer items-center justify-center rounded-[0.78rem] border px-3 text-center text-sm font-semibold transition focus-within:ring-4 focus-within:ring-blue-100 ${
                selected
                  ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white shadow-sm'
                  : 'border-slate-300/85 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={option}
                checked={selected}
                onChange={() => onChange(option)}
                className="sr-only"
              />
              {option}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function Field({ label, children, htmlFor }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className={formStyles.label}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function WindowQuoteForm({
  path,
  onPathChange,
  onDone,
}: {
  path: WindowQuotePath;
  onPathChange: (p: WindowQuotePath) => void;
  /** Called once the submission is accepted. */
  onDone?: () => void;
}) {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [windows, setWindows] = useState('');
  const [doors, setDoors] = useState('');
  const [timeline, setTimeline] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<WindowQuotePath | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const thanks = useRef<HTMLDivElement>(null);
  // One id per submission attempt, shared by the pixel and the server event.
  const eventId = useRef(newEventId());

  // The thank-you card is much shorter than the form it replaces, so without
  // this the reader is left looking at whatever slid up underneath it.
  useEffect(() => {
    if (done) thanks.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [done]);

  const patch = (id: string, change: Partial<UploadState>) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)));

  async function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError('');
    const room = QUOTE_FILE_RULES.maxFiles - uploads.length;
    const picked = Array.from(fileList).slice(0, Math.max(0, room));
    if (fileList.length > room) setError(`Up to ${QUOTE_FILE_RULES.maxFiles} files.`);

    for (const file of picked) {
      const id = newEventId();
      const tooBig = file.size > QUOTE_FILE_RULES.maxBytes;
      const wrongType = !QUOTE_FILE_RULES.types.includes(file.type);
      const entry: UploadState = { id, name: file.name, size: file.size, type: file.type, status: 'uploading', progress: 0 };
      if (tooBig || wrongType) {
        entry.status = 'error';
        entry.error = wrongType ? 'PDF, JPG or PNG only' : `Over ${QUOTE_FILE_RULES.maxBytes / 1024 / 1024} MB`;
        setUploads((list) => [...list, entry]);
        continue;
      }
      setUploads((list) => [...list, entry]);
      try {
        const r = await fetch('/api/leads?flow=windows_presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        });
        const data = (await r.json().catch(() => ({}))) as { uploadUrl?: string; key?: string; error?: string };
        if (!r.ok || !data.uploadUrl || !data.key) throw new Error(data.error || 'Could not start the upload.');
        await putFile(data.uploadUrl, file, (progress) => patch(id, { progress }));
        patch(id, { status: 'done', progress: 100, key: data.key });
      } catch (err) {
        patch(id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  }

  const uploading = uploads.some((u) => u.status === 'uploading');
  const ready = uploads.filter((u) => u.status === 'done' && u.key);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (path === 'upload') {
      if (uploading) return setError('Hang on, your file is still uploading.');
      if (ready.length === 0) return setError('Add your quote first (PDF, JPG or PNG).');
    } else if (!windows || !doors || !timeline) {
      return setError('Please answer the three questions above.');
    }
    if (!consent) return setError('Please tick the box so we can contact you.');

    setSubmitting(true);
    try {
      const r = await fetch('/api/leads?flow=windows_quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          name,
          phone,
          email,
          postalCode,
          consent,
          windows,
          doors,
          timeline,
          files: path === 'upload' ? ready.map((u) => ({ key: u.key, name: u.name, size: u.size, type: u.type })) : [],
          tracking: readTracking(),
          attribution: readAttribution(),
          eventId: eventId.current,
          pageUrl: window.location.href,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');

      const contentName = path === 'upload' ? 'windows_quote_upload' : 'windows_quote_request';
      trackEvent('Lead', { content_name: contentName, content_category: 'windows' }, eventId.current);
      trackCustom(path === 'upload' ? 'WindowQuoteUpload' : 'WindowQuoteRequest', { content_category: 'windows' });
      setDone(path);
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div ref={thanks} className="rounded-[1.35rem] border border-slate-200/80 bg-white p-6 text-center shadow-sm sm:p-10" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] text-slate-900">Got it. Thank you, {name.split(' ')[0]}.</h3>
        <p className="mx-auto mt-3 max-w-[40ch] text-base leading-7 text-slate-600">
          {done === 'upload'
            ? "We'll review your quote and get back to you within 24 hours."
            : "We'll review your details and get back to you within 24 hours."}
        </p>
        <p className="mx-auto mt-3 max-w-[44ch] text-sm leading-6 text-slate-500">
          We'll reach you at {phone} or {email}. Nothing is booked and nothing is owed.
        </p>
      </div>
    );
  }

  const tab = (value: WindowQuotePath, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={path === value}
      onClick={() => {
        setError('');
        onPathChange(value);
      }}
      className={`min-h-[3rem] flex-1 rounded-[0.7rem] px-3 text-sm font-bold transition sm:text-base ${
        path === value ? 'bg-white text-[#1B3C6C] shadow-sm' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {label}
    </button>
  );

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[1.35rem] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-8"
      aria-label="Window and door quote form"
    >
      <div role="tablist" aria-label="Do you have a quote?" className="flex gap-1 rounded-[0.9rem] bg-slate-100 p-1">
        {tab('upload', 'I have a quote')}
        {tab('request', 'I need a quote')}
      </div>

      <div className="mt-6 space-y-5">
        {path === 'upload' ? (
          <div>
            <p className={formStyles.label}>Your quote</p>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void addFiles(e.dataTransfer.files);
              }}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-[0.9rem] border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-center transition hover:border-[#2b5a96] hover:bg-blue-50/40"
            >
              <Upload className="h-7 w-7 text-[#2b5a96]" aria-hidden="true" />
              <span className="text-base font-bold text-slate-900">Tap to add your quote</span>
              <span className="text-sm text-slate-500">PDF, or a photo of each page. Up to {QUOTE_FILE_RULES.maxFiles} files.</span>
            </button>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => void addFiles(e.target.files)}
            />
            {uploads.length > 0 && (
              <ul className="mt-3 space-y-2">
                {uploads.map((u) => (
                  <li key={u.id} className="flex items-center gap-3 rounded-[0.78rem] border border-slate-200 bg-white px-3 py-2.5">
                    {u.status === 'uploading' ? (
                      <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#2b5a96]" aria-hidden="true" />
                    ) : u.status === 'done' ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                    ) : (
                      <FileText className="h-5 w-5 shrink-0 text-red-500" aria-hidden="true" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                      <p className={`text-xs ${u.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                        {u.status === 'uploading' ? `Uploading ${u.progress}%` : u.status === 'error' ? u.error : formatSize(u.size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={`Remove ${u.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            <ChoiceGroup label="How many windows?" name="windows" options={WINDOW_COUNT_OPTIONS} value={windows} onChange={setWindows} />
            <ChoiceGroup label="How many doors?" name="doors" options={DOOR_COUNT_OPTIONS} value={doors} onChange={setDoors} />
            <ChoiceGroup label="When are you hoping to install?" name="timeline" options={TIMELINE_OPTIONS} value={timeline} onChange={setTimeline} />
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="wq-name">
            <input id="wq-name" className={formStyles.field} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </Field>
          <Field label="Phone" htmlFor="wq-phone">
            <input id="wq-phone" className={formStyles.field} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" required />
          </Field>
          <Field label="Email" htmlFor="wq-email">
            <input id="wq-email" className={formStyles.field} value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" required />
          </Field>
          <Field label="Postal code" htmlFor="wq-postal">
            <input
              id="wq-postal"
              className={`${formStyles.field} uppercase`}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              autoComplete="postal-code"
              autoCapitalize="characters"
              maxLength={7}
              placeholder="L1S 2T6"
              required
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[0.78rem] bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#1B3C6C]"
          />
          <span className="text-sm leading-6 text-slate-600">{WINDOW_CONSENT_TEXT}</span>
        </label>

        {error && (
          <p className="rounded-[0.78rem] border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl bg-[#1B3C6C] px-7 py-4 text-base font-bold text-white shadow-md transition-colors hover:bg-[#16325a] disabled:opacity-70"
        >
          {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
          {path === 'upload' ? 'Send my quote' : 'Get my free quote'}
        </button>
        <p className="text-center text-xs text-slate-500">Free, no obligation. Your quote is kept private.</p>
      </div>
    </form>
  );
}
