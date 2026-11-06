import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react';
import { CheckCircle2, FileText, Link2, Loader2, Upload, X } from 'lucide-react';
import { formStyles } from '../../lib/uiStyles';
import { newEventId, trackCustom } from '../../lib/pixel';
import { readAttribution } from '../../lib/attributionCapture';
import { ChoiceGroup, Field, formatSize, putFile, readTracking } from '../windows/WindowQuoteForm';
import {
  COMMERCIAL_CONSENT_TEXT,
  COMMERCIAL_FILE_RULES,
  COMMERCIAL_OWNER_BUSINESS_TYPES,
  COMMERCIAL_PROJECT_TYPES,
  COMMERCIAL_ROLES,
  commercialFileType,
  type CommercialPath,
} from '../../../lib/commercial-inquiry';

/**
 * The /commercial inquiry form. One form, two paths: a general contractor
 * pricing a tender (bid closing date), or a business asking for a quote (role
 * and target date). Everything else is shared.
 *
 * Drawings are optional on purpose. An estimator with no set yet should still
 * be able to reach us. The link field comes first because that is how large
 * packages actually travel. Files go straight from the browser to
 * private storage (see `commercial_presign` in api/leads/index.ts), and the
 * admin opens them through a login-gated link.
 *
 * /commercial passes `audience="owner"`: the quote tab comes first and
 * drops to the short form (name, email, phone, city, business type, opening
 * day), with plans and notes folded away. The contractor tab stays whole.
 *
 * Validation lives in lib/commercial-inquiry.ts and the server re-runs it.
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

const ACCEPT = '.pdf,.dwg,.dxf,.pln,.jpg,.jpeg,.png,.zip';
const MAX_MB = COMMERCIAL_FILE_RULES.maxBytes / 1024 / 1024;

export function CommercialInquiryForm({
  path,
  onPathChange,
  audience,
}: {
  path: CommercialPath;
  onPathChange: (p: CommercialPath) => void;
  audience?: 'owner';
}) {
  const short = audience === 'owner' && path === 'project';
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [projectType, setProjectType] = useState('');
  const [keyDate, setKeyDate] = useState('');
  const [role, setRole] = useState('');
  const [scope, setScope] = useState('');
  const [drawingsLink, setDrawingsLink] = useState('');
  const [consent, setConsent] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const thanks = useRef<HTMLDivElement>(null);
  const eventId = useRef(newEventId());

  // A bid closing date is not a target date: never carry one across the toggle.
  useEffect(() => {
    setKeyDate('');
  }, [path]);

  useEffect(() => {
    if (done) thanks.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [done]);

  const patch = (id: string, change: Partial<UploadState>) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)));

  async function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setError('');
    const room = COMMERCIAL_FILE_RULES.maxFiles - uploads.length;
    const picked = Array.from(fileList).slice(0, Math.max(0, room));
    if (fileList.length > room) setError(`Up to ${COMMERCIAL_FILE_RULES.maxFiles} files.${short ? '' : ' For a larger set, paste a link above.'}`);

    await Promise.all(
      picked.map(async (file) => {
        const id = newEventId();
        const type = commercialFileType(file.name, file.type);
        const tooBig = file.size > COMMERCIAL_FILE_RULES.maxBytes;
        const wrongType = !COMMERCIAL_FILE_RULES.types.includes(type);
        const entry: UploadState = { id, name: file.name, size: file.size, type, status: 'uploading', progress: 0 };
        if (tooBig || wrongType) {
          entry.status = 'error';
          entry.error = wrongType ? 'PDF, DWG, DXF, PLN, JPG, PNG or ZIP only' : `Over ${MAX_MB} MB.${short ? '' : ' Paste a link above instead'}`;
          setUploads((list) => [...list, entry]);
          return;
        }
        setUploads((list) => [...list, entry]);
        try {
          const r = await fetch('/api/leads?flow=commercial_presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name, type, size: file.size }),
          });
          const data = (await r.json().catch(() => ({}))) as { uploadUrl?: string; key?: string; error?: string };
          if (!r.ok || !data.uploadUrl || !data.key) throw new Error(data.error || 'Could not start the upload.');
          await putFile(data.uploadUrl, file, (progress) => patch(id, { progress }));
          patch(id, { status: 'done', progress: 100, key: data.key });
        } catch (err) {
          patch(id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
        }
      }),
    );
    if (fileInput.current) fileInput.current.value = '';
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setDragging(false);
    void addFiles(e.dataTransfer.files);
  }

  const uploading = uploads.some((u) => u.status === 'uploading');
  const ready = uploads.filter((u) => u.status === 'done' && u.key);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (uploading) return setError('Hang on, your files are still uploading.');
    if (!projectType) return setError(short ? 'Please choose your type of business.' : 'Please choose a project type.');
    if (path === 'tender' && !keyDate) return setError('Please enter the bid closing date.');
    if (path === 'project' && !short && !role) return setError('Please choose your role.');
    if (!consent) return setError('Please tick the box so we can contact you.');

    setSubmitting(true);
    try {
      const r = await fetch('/api/leads?flow=commercial_inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          audience: short ? 'owner' : '',
          company,
          name,
          phone,
          email,
          city,
          projectType,
          keyDate,
          role,
          scope,
          drawingsLink,
          consent,
          files: ready.map((u) => ({ key: u.key, name: u.name, size: u.size, type: u.type })),
          tracking: readTracking(),
          attribution: readAttribution(),
          eventId: eventId.current,
          pageUrl: window.location.href,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
      // A custom event only. See the note on `commercial_inquiry` in the API.
      trackCustom('CommercialInquiry', { content_category: 'commercial', audience: short ? 'owner' : 'all' });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div ref={thanks} className="rounded-[1.1rem] bg-white p-6 text-center shadow-xl sm:p-10" role="status">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" aria-hidden="true" />
        <h3 className="mt-4 text-2xl font-bold tracking-[-0.02em] text-slate-900 [text-wrap:balance]">
          {short ? `Thanks, ${name.split(' ')[0]}. We've got it.` : `Received. Thank you, ${name.split(' ')[0]}.`}
        </h3>
        <p className="mx-auto mt-3 max-w-[42ch] text-base leading-7 text-slate-600">
          {short
            ? "We'll call you within one business day to set up your free consultation."
            : "We'll review what you sent and reply within one business day."}
        </p>
        <p className="mx-auto mt-3 max-w-[44ch] text-sm leading-6 text-slate-500">We'll reach you at {phone} or {email}.</p>
      </div>
    );
  }

  const tab = (value: CommercialPath, label: string) => (
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

  const linkBlock = (
      <div className="mt-5 rounded-[0.85rem] border border-[#2b5a96]/30 bg-blue-50 p-4">
        <label htmlFor="cm-link" className="flex items-center gap-2 text-sm font-bold text-[#1B3C6C]">
          <Link2 className="h-4 w-4" aria-hidden="true" />
          Procore / Dropbox / Google Drive link
        </label>
        <input
          id="cm-link"
          type="url"
          inputMode="url"
          value={drawingsLink}
          onChange={(e) => setDrawingsLink(e.target.value)}
          placeholder="Paste your link here"
          className={`${formStyles.field} mt-2`}
        />
        <p className="mt-1.5 text-xs text-slate-600">The fastest way to send a large package. Make sure the link is shared so we can open it.</p>
      </div>
  );

  const uploadBlock = (
      <div className="mt-5">
        {short ? null : <p className={formStyles.label}>Or upload files</p>}
        <input
          ref={fileInput}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => void addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex w-full flex-col items-center justify-center rounded-[0.85rem] border-2 border-dashed px-4 py-7 text-center transition ${
            dragging ? 'border-[#2b5a96] bg-blue-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <Upload className="h-6 w-6 text-[#1B3C6C]" aria-hidden="true" />
          <span className="mt-2 text-sm font-bold text-slate-800">
            <span className="sm:hidden">Tap to choose files</span>
            <span className="hidden sm:inline">Drop files here or choose from your computer</span>
          </span>
          {short ? (
            <span className="mt-2 text-xs text-slate-500">PDF, photos or a ZIP. Up to {COMMERCIAL_FILE_RULES.maxFiles} files.</span>
          ) : (
            <>
              <span className="mt-3 flex flex-wrap justify-center gap-1.5">
                {['DWG', 'DXF', 'PLN', 'PDF', 'ZIP'].map((format) => (
                  <span key={format} className="rounded border border-[#2b5a96]/30 bg-white px-2 py-0.5 font-mono text-xs font-bold text-[#1B3C6C]">
                    {format}
                  </span>
                ))}
              </span>
              <span className="mt-2 text-xs text-slate-500">
                CAD files welcome, loose or zipped. JPG and PNG too. Up to {COMMERCIAL_FILE_RULES.maxFiles} files, {MAX_MB} MB each.
              </span>
            </>
          )}
        </button>
        {uploads.length > 0 ? (
          <ul className="mt-3 space-y-2">
            {uploads.map((u) => (
              <li key={u.id} className="flex items-center gap-3 rounded-[0.7rem] border border-slate-200 px-3 py-2 text-sm">
                {u.status === 'uploading' ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#2b5a96]" aria-hidden="true" />
                ) : (
                  <FileText className={`h-4 w-4 shrink-0 ${u.status === 'error' ? 'text-red-600' : 'text-emerald-600'}`} aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-slate-800">{u.name}</span>
                  <span className={`block text-xs ${u.status === 'error' ? 'text-red-600' : 'text-slate-500'}`}>
                    {u.status === 'error' ? u.error : u.status === 'uploading' ? `Uploading ${u.progress}%` : formatSize(u.size)}
                  </span>
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${u.name}`}
                  onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}
                  className="rounded p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
  );

  const notesBlock = (
      <div className="mt-5">
        <Field label={short ? 'Anything else we should know?' : 'Scope notes (optional)'} htmlFor="cm-scope">
          <textarea id="cm-scope" rows={3} value={scope} onChange={(e) => setScope(e.target.value)} className={formStyles.field} />
        </Field>
      </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="rounded-[1.1rem] bg-white p-4 shadow-xl sm:p-8" aria-label="Commercial inquiry form">
      <div role="tablist" aria-label="Who is this for?" className="flex gap-1 rounded-[0.85rem] bg-slate-100 p-1">
        {audience === 'owner' ? tab('project', 'Free consultation') : tab('tender', 'General contractor')}
        {audience === 'owner' ? tab('tender', 'General contractor') : tab('project', 'I need a quote')}
      </div>

      <div className="mt-5 grid gap-4 sm:mt-6 sm:grid-cols-2 sm:gap-5">
        {short ? null : (
          <Field label="Company" htmlFor="cm-company">
            <input id="cm-company" value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" required className={formStyles.field} />
          </Field>
        )}
        <Field label="Your name" htmlFor="cm-name">
          <input id="cm-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required className={formStyles.field} />
        </Field>
        <Field label={short ? 'Email' : 'Work email'} htmlFor="cm-email">
          <input id="cm-email" type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required className={formStyles.field} />
        </Field>
        <Field label="Phone" htmlFor="cm-phone">
          <input id="cm-phone" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" required className={formStyles.field} />
        </Field>
        <Field label={short ? 'City' : 'Project city'} htmlFor="cm-city">
          <input id="cm-city" value={city} onChange={(e) => setCity(e.target.value)} required className={formStyles.field} />
        </Field>
        <Field label={short ? 'Type of business' : 'Project type'} htmlFor="cm-type">
          <select id="cm-type" value={projectType} onChange={(e) => setProjectType(e.target.value)} required className={formStyles.field}>
            <option value="">Choose one</option>
            {short
              ? COMMERCIAL_OWNER_BUSINESS_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))
              : COMMERCIAL_PROJECT_TYPES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
          </select>
        </Field>
        <Field label={path === 'tender' ? 'Bid closing date' : short ? 'Opening day' : 'Target completion / opening date'} htmlFor="cm-date">
          <input
            id="cm-date"
            type="date"
            value={keyDate}
            onChange={(e) => setKeyDate(e.target.value)}
            required={path === 'tender'}
            className={formStyles.field}
          />
          {path === 'project' ? <p className="mt-1.5 text-xs text-slate-500">No date yet? Leave it blank.</p> : null}
        </Field>
      </div>

      {path === 'project' && !short ? (
        <div className="mt-5">
          <ChoiceGroup label="Your role" name="cm-role" options={COMMERCIAL_ROLES} value={role} onChange={setRole} />
        </div>
      ) : null}

      {short ? (
        <details className="mt-5 rounded-[0.85rem] border border-slate-200 bg-slate-50 p-4">
          <summary className="flex min-h-[1.75rem] cursor-pointer items-center text-sm font-bold text-[#1B3C6C]">Have plans or photos? Add them (optional)</summary>
          {uploadBlock}
          {notesBlock}
        </details>
      ) : (
        <>
          {linkBlock}
          {uploadBlock}
          {notesBlock}
        </>
      )}

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
        <span>{COMMERCIAL_CONSENT_TEXT}</span>
      </label>

      {error ? (
        <p role="alert" className="mt-4 rounded-[0.7rem] bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-[0.78rem] bg-[#1B3C6C] px-6 text-base font-bold text-white transition hover:bg-[#2b5a96] disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
        {path === 'tender' ? 'Send for pricing' : short ? 'Request my free consultation' : 'Request a quote'}
      </button>
    </form>
  );
}
