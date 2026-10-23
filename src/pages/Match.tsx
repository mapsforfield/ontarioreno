import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  FileText,
  HelpCircle,
  Home,
  Loader2,
  MapPin,
  Paperclip,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';
import { buttonStyles, formStyles } from '../lib/uiStyles';
import { cn } from '../lib/utils';
import { readAttribution } from '../lib/attributionCapture';
import { newEventId, trackEvent } from '../lib/pixel';
import { AddToCalendar, fmtDate, fmtDateShort, fmtTime } from './consultation/shell';
import {
  consultationAnswers,
  detailOptionsFor,
  INTAKE_TIMELINE_OPTIONS,
  PROJECT_CHOICES,
  PROJECT_FILE_KINDS,
  programForChoice,
  type ProjectChoice,
} from '../../lib/project-intake';
import { QUOTE_FILE_RULES, type QuoteFile } from '../../lib/window-quote';

// ─── Project Review (/match) ──────────────────────────────────────────────────
// Project first, then the questions that project needs, the property, optional
// documents, contact — and, for every project with a consultation program, that
// program's live calendar. Projects without one (full home, not sure) end on the
// call-back they always did. The mapping lives in lib/project-intake.ts.
//
// Budget and payment are no longer asked: on a first touch they read as a
// qualification test, and the consultant covers them in person.

type PropertyType = 'Detached' | 'Semi-Detached' | 'Townhome' | 'Condo' | '';
type ContactTiming = 'Today' | 'Tomorrow' | 'This week' | 'Flexible' | '';

type StepId = 'project' | 'details' | 'feasibility' | 'property' | 'documents' | 'contact' | 'calendar';

type IntakeData = {
  city: string;
  propertyType: PropertyType;
  address: string;
  unit: string;
  projectType: string;
  /** Program projectType value, for projects that book under a program. */
  detailValue: string;
  /** What the homeowner picked on the details screen, in their words. */
  currentState: string;
  separateEntrance: string;
  permitStatus: string;
  backyardSpace: string;
  zoningStatus: string;
  timeline: string;
  windowCount: string;
  doorCount: string;
  fullName: string;
  phone: string;
  email: string;
  contactTiming: ContactTiming;
};

type Option = {
  label: string;
  value?: string;
  subtext?: string;
};

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

type Slot = { date: string; time: string };

const initialData: IntakeData = {
  city: '',
  propertyType: '',
  address: '',
  unit: '',
  projectType: '',
  detailValue: '',
  currentState: '',
  separateEntrance: '',
  permitStatus: '',
  backyardSpace: '',
  zoningStatus: '',
  timeline: '',
  windowCount: '',
  doorCount: '',
  fullName: '',
  phone: '',
  email: '',
  contactTiming: '',
};

const propertyTypeOptions: Option[] = [
  { label: 'Detached' },
  { label: 'Semi-Detached' },
  { label: 'Townhome' },
  { label: 'Condo' },
];

const ontarioCitySuggestions = [
  'Toronto',
  'Mississauga',
  'Brampton',
  'Hamilton',
  'Burlington',
  'Oakville',
  'Milton',
  'Kitchener',
  'Waterloo',
  'Cambridge',
  'London',
  'Ottawa',
];

const timingOptions: Option[] = [
  { label: 'Today' },
  { label: 'Tomorrow' },
  { label: 'This week' },
  { label: 'Flexible' },
];

const timelineOptions: Option[] = INTAKE_TIMELINE_OPTIONS.map((o) => ({ label: o.label, value: o.value }));

// Same buckets as the windows program's prep questions, so the answers can be
// saved onto the booking as they are.
const windowCountOptions: Option[] = [
  { value: '1-5', label: '1–5' },
  { value: '6-10', label: '6–10' },
  { value: '11-20', label: '11–20' },
  { value: '20+', label: 'More than 20' },
  { value: '0', label: 'None, just doors' },
];
const doorCountOptions: Option[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3+', label: '3 or more' },
  { value: '0', label: 'None, just windows' },
];

const ACCEPT = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

const APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyi1JG7OXDwCghiVQb2PaOEME7ZByUa8Mxl3N7xbTCCaL07Bdrx3h01dA4YisDPV_Yw/exec';

const phoneDigits = (value: string) => value.replace(/\D/g, '');

const formatPhoneInput = (value: string) => {
  const digits = phoneDigits(value).slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const isBasementProject = (projectType: string) =>
  projectType === 'Basement renovation' || projectType === 'Legal basement / secondary suite';

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

function IntakeProgress({ step, total }: { step: number; total: number }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-700">
          Step {step} of {total}
        </p>
        <p className="text-sm text-slate-500">
          {Math.round((step / total) * 100)}% complete
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#1B3C6C_0%,#5694CF_100%)] transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

function StepLayout({
  step,
  total,
  title,
  helper,
  children,
}: {
  step: number;
  total: number;
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="transition duration-300">
      <IntakeProgress step={step} total={total} />
      <div className="mt-8">
        <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
          {title}
        </h2>
        {helper && (
          <p className="mt-3 text-base leading-7 text-slate-600">{helper}</p>
        )}
      </div>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

function OptionCards({
  options,
  value,
  onChange,
  columns = 'sm:grid-cols-2',
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  columns?: string;
}) {
  return (
    <div className={cn('grid gap-3', columns)}>
      {options.map((option) => {
        const optionValue = option.value ?? option.label;
        const isSelected = value === optionValue;

        return (
          <button
            key={optionValue}
            type="button"
            onClick={() => onChange(optionValue)}
            className={cn(
              'min-h-[92px] rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
              isSelected
                ? 'border-[#1B3C6C] bg-blue-50/70 shadow-[0_18px_38px_rgba(27,60,108,0.14)]'
                : 'border-slate-200'
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold leading-6 text-slate-900">
                  {option.label}
                </p>
                {option.subtext && (
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {option.subtext}
                  </p>
                )}
              </div>
              <span
                className={cn(
                  'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border',
                  isSelected
                    ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                    : 'border-slate-300 bg-white text-transparent'
                )}
              >
                <CheckCircle2 className="h-4 w-4" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/** The opening screen's picture tiles. */
function ProjectTiles({
  value,
  onPick,
}: {
  value: string;
  onPick: (choice: ProjectChoice) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
      {PROJECT_CHOICES.map((choice) => {
        const isSelected = value === choice.label;
        return (
          <button
            key={choice.label}
            type="button"
            onClick={() => onPick(choice)}
            aria-pressed={isSelected}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100',
              isSelected
                ? 'border-[#1B3C6C] ring-2 ring-[#1B3C6C]'
                : 'border-slate-200 hover:border-blue-200'
            )}
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[linear-gradient(160deg,#eef4fb_0%,#dbe7f5_100%)]">
              {choice.image ? (
                <img
                  src={encodeURI(choice.image)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'h-full w-full transition duration-500 group-hover:scale-[1.04]',
                    choice.label === 'Full home renovation'
                      ? 'object-contain p-2'
                      : 'object-cover'
                  )}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[#1B3C6C]">
                  <HelpCircle className="h-12 w-12 opacity-70" />
                </div>
              )}
              <span
                className={cn(
                  'absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm transition',
                  isSelected
                    ? 'border-white bg-[#1B3C6C] text-white'
                    : 'border-white/90 bg-white/80 text-transparent'
                )}
              >
                <Check className="h-4 w-4" />
              </span>
            </div>
            <div className="flex-1 p-3.5 sm:p-4">
              <p className="text-[15px] font-bold leading-5 text-slate-900">{choice.label}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">{choice.blurb}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Field({
  label,
  optional,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  optional?: boolean;
  error?: string;
}) {
  return (
    <div>
      <label className={formStyles.label}>
        {label}
        {optional && (
          <span className="ml-2 font-normal text-slate-400">Optional</span>
        )}
      </label>
      <input
        {...props}
        aria-invalid={error ? true : undefined}
        className={cn(
          formStyles.field,
          error && 'border-red-300 focus:border-red-400 focus:ring-red-100',
          props.className
        )}
      />
      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default function Match() {
  const [step, setStep] = useState<StepId>('project');
  const [data, setData] = useState<IntakeData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<{ fullName?: boolean; phone?: boolean }>({});
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({
    type: null,
    message: '',
  });

  // Address: the same Places suggest the consultation flows use. A picked
  // suggestion is what lets the calendar measure the drive to this property.
  const [placeId, setPlaceId] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ placeId: string; description: string }>>([]);
  const suggestTimer = useRef<number | undefined>(undefined);
  const skipSuggest = useRef(false);

  // Documents
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [fileKinds, setFileKinds] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  // Booking
  const [leadRef, setLeadRef] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [remote, setRemote] = useState(false);
  const [chosen, setChosen] = useState<Slot | null>(null);
  const [booking, setBooking] = useState<
    { publicReference: string; date: string; time: string; propertyAddress?: string } | null
  >(null);
  const [bookingError, setBookingError] = useState('');

  const program = useMemo(() => programForChoice(data.projectType), [data.projectType]);
  const detailOptions = useMemo<Option[]>(
    () => detailOptionsFor(data.projectType).map((o) => ({ label: o.label, value: o.value })),
    [data.projectType]
  );

  const steps = useMemo<StepId[]>(
    () => [
      'project',
      'details',
      'feasibility',
      'property',
      'documents',
      'contact',
      ...(program ? (['calendar'] as StepId[]) : []),
    ],
    [program]
  );
  const stepNumber = steps.indexOf(step) + 1;
  const totalSteps = steps.length;

  useEffect(() => {
    if (skipSuggest.current) {
      skipSuggest.current = false;
      return;
    }
    const q = data.address.trim();
    if (q.length < 3 || placeId) {
      setSuggestions([]);
      return;
    }
    window.clearTimeout(suggestTimer.current);
    suggestTimer.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/leads?flow=address_suggest&q=${encodeURIComponent(q)}`);
        setSuggestions((await r.json()).suggestions ?? []);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => window.clearTimeout(suggestTimer.current);
  }, [data.address, placeId]);

  // Each screen starts at the top of the card, not wherever the last one ended.
  const cardTop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = cardTop.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [step]);

  const currentStateOptions = useMemo<Option[]>(() => {
    if (detailOptions.length > 0) return detailOptions;

    if (data.projectType === 'Full home renovation') {
      return [
        { label: 'Full remodel' },
        { label: 'Partial upgrade' },
        { label: 'Not sure' },
      ];
    }

    return [
      { label: 'I know the space I want to improve' },
      { label: 'I need guidance' },
      { label: 'Not sure' },
    ];
  }, [data.projectType, detailOptions]);

  const currentStateTitle = useMemo(() => {
    if (data.projectType === 'Legal basement / secondary suite') {
      return "What's your starting point?";
    }
    if (data.projectType === 'Garden suite') return 'What are you planning?';
    if (data.projectType === 'Windows & doors') return 'What are you replacing?';
    if (data.projectType === 'Not sure yet') {
      return 'Where are you in the planning process?';
    }
    if (isBasementProject(data.projectType)) return "What's the current state of your basement?";
    return 'What best describes your renovation?';
  }, [data.projectType]);

  const updateData = <K extends keyof IntakeData>(
    key: K,
    value: IntakeData[K]
  ) => {
    setData((current) => ({
      ...current,
      [key]: value,
    }));
    setSubmitStatus({ type: null, message: '' });
  };

  const validateStep = () => {
    if (step === 'project') return data.projectType;
    if (step === 'details') return data.currentState;
    if (step === 'feasibility') {
      if (data.projectType === 'Garden suite') {
        return data.backyardSpace && data.zoningStatus;
      }
      if (isBasementProject(data.projectType)) {
        return data.separateEntrance && data.permitStatus;
      }
      if (data.projectType === 'Windows & doors') {
        return data.windowCount && data.doorCount;
      }
      return data.timeline;
    }
    if (step === 'property') {
      // The calendar needs somewhere to measure the drive to.
      return data.city.trim() && data.propertyType && (!program || data.address.trim());
    }
    if (step === 'documents') {
      return !uploads.some((u) => u.status === 'uploading');
    }
    return (
      data.fullName.trim() &&
      phoneDigits(data.phone).length >= 10 &&
      (program || data.contactTiming)
    );
  };

  const goTo = (target: StepId) => {
    setSubmitStatus({ type: null, message: '' });
    setStep(target);
  };

  const nextStep = () => {
    if (!validateStep()) {
      setSubmitStatus({
        type: 'error',
        message:
          step === 'documents'
            ? 'Hang on, a file is still uploading.'
            : 'Please complete the required choices before continuing.',
      });
      return;
    }
    const next = steps[steps.indexOf(step) + 1];
    if (next) goTo(next);
  };

  const prevStep = () => {
    const prev = steps[steps.indexOf(step) - 1];
    if (prev) goTo(prev);
  };

  const pickProject = (choice: ProjectChoice) => {
    // A different project asks different questions; answers to the old one
    // would only mislead the rep.
    setData((current) => ({
      ...current,
      projectType: choice.label,
      ...(current.projectType === choice.label
        ? {}
        : {
            detailValue: '',
            currentState: '',
            separateEntrance: '',
            permitStatus: '',
            backyardSpace: '',
            zoningStatus: '',
            timeline: '',
            windowCount: '',
            doorCount: '',
          }),
    }));
    setSubmitStatus({ type: null, message: '' });
    // The pause is the acknowledgement: a tap that selects and navigates in the
    // same frame reads as the page jumping on its own.
    window.setTimeout(() => goTo('details'), 200);
  };

  // ── Documents ──
  const patchUpload = (id: string, change: Partial<UploadState>) =>
    setUploads((list) => list.map((u) => (u.id === id ? { ...u, ...change } : u)));

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList) return;
    setUploadError('');
    const room = QUOTE_FILE_RULES.maxFiles - uploads.length;
    const picked = Array.from(fileList).slice(0, Math.max(0, room));
    if (fileList.length > room) setUploadError(`Up to ${QUOTE_FILE_RULES.maxFiles} files.`);

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
        const r = await fetch('/api/leads?flow=project_presign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, type: file.type, size: file.size }),
        });
        const res = (await r.json().catch(() => ({}))) as { uploadUrl?: string; key?: string; error?: string };
        if (!r.ok || !res.uploadUrl || !res.key) throw new Error(res.error || 'Could not start the upload.');
        await putFile(res.uploadUrl, file, (progress) => patchUpload(id, { progress }));
        patchUpload(id, { status: 'done', progress: 100, key: res.key });
      } catch (err) {
        patchUpload(id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const readyFiles = (): QuoteFile[] =>
    uploads
      .filter((u) => u.status === 'done' && u.key)
      .map((u) => ({ key: u.key as string, name: u.name, size: u.size, type: u.type }));

  /**
   * Attach the documents to the lead the review created. After the lead exists,
   * never before it: a storage hiccup here may cost the files, never the lead.
   */
  const attachFiles = async (ref: string) => {
    const files = readyFiles();
    if (!ref || files.length === 0) return;
    await fetch('/api/leads?flow=project_files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadRef: ref, files, kinds: fileKinds, projectType: data.projectType }),
    }).catch(() => {});
  };

  /** Everything the homeowner told us, as the lines a rep reads. */
  const summaryLines = () => {
    const files = readyFiles();
    return [
      `Project: ${data.projectType}`,
      `Project Detail: ${data.currentState}`,
      `City: ${data.city}`,
      `Property Type: ${data.propertyType}`,
      `Address: ${[data.address, data.unit && `Unit ${data.unit}`].filter(Boolean).join(', ') || 'Not provided'}`,
      `Separate Entrance: ${data.separateEntrance || 'N/A'}`,
      `Permit Status: ${data.permitStatus || data.zoningStatus || 'N/A'}`,
      `Backyard Space: ${data.backyardSpace || 'N/A'}`,
      `Windows / Doors: ${data.windowCount || data.doorCount ? `${data.windowCount || '?'} windows, ${data.doorCount || '?'} doors` : 'N/A'}`,
      `Timeline: ${INTAKE_TIMELINE_OPTIONS.find((o) => o.value === data.timeline)?.label ?? 'N/A'}`,
      `Documents: ${files.length ? files.map((f) => f.name).join(', ') : 'None'}`,
      program
        ? 'Next step: booking a consultation time online'
        : `Preferred Contact Time: ${data.contactTiming}`,
    ];
  };

  /** The call-back path: the review as it always worked, texting a booking link. */
  const sendProjectReview = async () => {
    const r = await fetch('/api/leads?flow=project_review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectType: data.projectType,
        timeline: data.contactTiming,
        name: data.fullName.trim(),
        email: data.email.trim(),
        phone: phoneDigits(data.phone),
        message: summaryLines().join('\n'),
        attribution: readAttribution(),
      }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => null) : null;
    return (j?.leadId as string | undefined) ?? '';
  };

  const loadAvailability = async (ref: string): Promise<{ slots?: Slot[]; remoteConsultation?: boolean } | null> => {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(`/api/leads?flow=availability&leadRef=${encodeURIComponent(ref)}`);
        if (!res.ok) throw new Error(`availability ${res.status}`);
        return await res.json();
      } catch {
        // A cold serverless start is the usual cause; it clears in under a second.
        if (attempt === 0) await new Promise((r) => setTimeout(r, 700));
      }
    }
    return null;
  };

  const callBackSuccess = () =>
    setSubmitStatus({
      type: 'success',
      message:
        "We're reviewing your project now. You'll receive a call shortly to go over details and schedule your consultation.",
    });

  const handleSubmit = async () => {
    if (!validateStep()) {
      setSubmitStatus({
        type: 'error',
        message: program
          ? 'Please add your name and phone number so we can hold a time for you.'
          : 'Please add your name, phone number, and preferred contact time before we review the project.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    const payload = {
      projectType: data.projectType,
      timeline: data.contactTiming,
      name: data.fullName.trim(),
      email: data.email.trim(),
      phone: phoneDigits(data.phone),
      message: summaryLines().join('\n'),
    };

    try {
      // The Apps Script has always received this form and emails "New Lead Just
      // Came In". Left exactly as it was — it is the notification the office
      // actually watches.
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify(payload),
      });

      if (!program) {
        // No consultation program fits (full home, not sure): the call-back
        // path exactly as before. Failure is swallowed on purpose — the Apps
        // Script already has the submission, and a red banner now would only
        // make them submit twice.
        const ref = await sendProjectReview();
        await attachFiles(ref);
        callBackSuccess();
        return;
      }

      // A program fits: create the lead through that program's own submit, so
      // routing, scheduling area and rep assignment are decided exactly as on
      // /consultation/<slug>, and the calendar below is that program's.
      const eventId = newEventId();
      let submitted: { leadRef?: string; outcome?: string; offersCalendar?: boolean } | null = null;
      try {
        const r = await fetch('/api/leads?flow=submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventId,
            pageUrl: window.location.href,
            programSlug: program.slug,
            leadRef,
            name: data.fullName.trim(),
            phone: phoneDigits(data.phone),
            email: data.email.trim(),
            placeId,
            addressText: data.address.trim(),
            unit: data.unit.trim(),
            sourceDetail: 'project_review',
            attribution: readAttribution(),
            notes: ['Project Review (/match)', ...summaryLines()].join('\n'),
            answers: consultationAnswers(program, {
              projectType: data.detailValue,
              timeline: data.timeline,
            }),
          }),
        });
        if (r.ok) submitted = await r.json();
      } catch {
        submitted = null;
      }

      if (!submitted?.leadRef) {
        // Our side failed. The office still has it by email; fall back to the
        // call-back path so the homeowner is not told something went wrong
        // with a submission that reached us.
        const ref = await sendProjectReview();
        await attachFiles(ref);
        callBackSuccess();
        return;
      }

      const ref = submitted.leadRef;
      setLeadRef(ref);
      trackEvent(
        'Lead',
        { content_name: program.slug, content_category: 'project_review', status: submitted.outcome },
        eventId
      );

      // Answers this program normally asks after booking, given here already.
      if (data.windowCount || data.doorCount) {
        void fetch('/api/leads?flow=prep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadRef: ref,
            programSlug: program.slug,
            answers: { windowCount: data.windowCount, doorCount: data.doorCount },
          }),
        }).catch(() => {});
      }
      await attachFiles(ref);

      if (!submitted.offersCalendar) {
        // Routed to a person (an address we could not place, say). The text
        // with their booking link still goes out, as it always did.
        await sendProjectReview();
        callBackSuccess();
        return;
      }

      const av = await loadAvailability(ref);
      setSlots(av?.slots ?? []);
      setRemote(av?.remoteConsultation === true);
      setChosen(null);
      setBookingError('');
      goTo('calendar');
    } catch (error) {
      console.error(error);
      setSubmitStatus({
        type: 'error',
        message:
          'Something went wrong while submitting. Please try again or email info@ontarioreno.ca.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const book = async () => {
    if (!chosen || isSubmitting || !program) return;
    setIsSubmitting(true);
    setBookingError('');
    const eventId = newEventId();
    try {
      const r = await fetch('/api/leads?flow=book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadRef,
          date: chosen.date,
          time: chosen.time,
          eventId,
          pageUrl: window.location.href,
        }),
      });
      const j = await r.json();
      if (r.status === 409 && j?.code === 'SLOT_UNAVAILABLE') {
        setBookingError('That time was just taken. Please choose another.');
        setSlots(j.alternatives?.length ? j.alternatives : slots.filter((s) => !(s.date === chosen.date && s.time === chosen.time)));
        setChosen(null);
        return;
      }
      if (!r.ok) throw new Error(j?.error ?? 'We could not complete the booking.');
      // The server decides again at booking time; trust that over availability.
      setRemote(j.remoteConsultation === true);
      setBooking(j);
      trackEvent('Schedule', { content_name: program.slug, content_category: 'project_review' }, eventId);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'We could not complete the booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const byDate = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) map.set(s.date, [...(map.get(s.date) ?? []), s.time]);
    return [...map.entries()];
  }, [slots]);

  const resetAll = () => {
    setData(initialData);
    setStep('project');
    setSubmitStatus({ type: null, message: '' });
    setUploads([]);
    setFileKinds([]);
    setPlaceId('');
    setLeadRef('');
    setSlots([]);
    setChosen(null);
    setBooking(null);
  };

  // What the homeowner is booking, said the same way before and after.
  const meeting = !program
    ? null
    : program.consultationMode === 'phone'
      ? {
          line: `Phone Consultation · ${program.visitMinutes} minutes`,
          detail: 'A specialist will call you around your chosen time.',
        }
      : remote
        ? {
            line: `Virtual Consultation · ${program.visitMinutes} minutes`,
            detail:
              'Your city is outside our in-person visit area, so this one is done by video or phone. A specialist will contact you around your chosen time.',
          }
        : {
            line: `In-Person Consultation · ${program.visitMinutes} minutes`,
            detail: 'A specialist will visit your property at the time you choose.',
          };

  const renderStep = () => {
    if (step === 'project') {
      return (
        <StepLayout
          step={stepNumber}
          total={totalSteps}
          title="What's your project?"
          helper="Pick the closest one. We'll tailor the next few questions to it."
        >
          <ProjectTiles value={data.projectType} onPick={pickProject} />
        </StepLayout>
      );
    }

    if (step === 'details') {
      return (
        <StepLayout step={stepNumber} total={totalSteps} title={currentStateTitle}>
          <OptionCards
            options={currentStateOptions}
            value={detailOptions.length > 0 ? data.detailValue : data.currentState}
            onChange={(value) => {
              const option = currentStateOptions.find((o) => (o.value ?? o.label) === value);
              updateData('detailValue', detailOptions.length > 0 ? value : '');
              updateData('currentState', option?.label ?? value);
            }}
          />
        </StepLayout>
      );
    }

    if (step === 'feasibility') {
      if (data.projectType === 'Garden suite') {
        return (
          <StepLayout
            step={stepNumber}
            total={totalSteps}
            title="Let's check early feasibility"
            helper="This helps us assess feasibility and avoid wasted time on-site."
          >
            <div>
              <p className={formStyles.label}>
                Do you have space available in your backyard?
              </p>
              <OptionCards
                options={[{ label: 'Yes' }, { label: 'Not sure' }]}
                value={data.backyardSpace}
                onChange={(value) => updateData('backyardSpace', value)}
              />
            </div>

            <div>
              <p className={formStyles.label}>
                Have you looked into zoning or permits?
              </p>
              <OptionCards
                options={[
                  { label: 'Approved' },
                  { label: 'In progress' },
                  { label: 'Not yet' },
                  { label: 'Not sure' },
                ]}
                value={data.zoningStatus}
                onChange={(value) => updateData('zoningStatus', value)}
              />
            </div>
          </StepLayout>
        );
      }

      if (isBasementProject(data.projectType)) {
        return (
          <StepLayout
            step={stepNumber}
            total={totalSteps}
            title="Let's check early feasibility"
            helper="This helps us assess feasibility and avoid wasted time on-site."
          >
            <div>
              <p className={formStyles.label}>
                Do you have a separate entrance?
              </p>
              <OptionCards
                options={[
                  { label: 'Yes' },
                  { label: 'No' },
                  { label: 'Not sure' },
                ]}
                value={data.separateEntrance}
                onChange={(value) => updateData('separateEntrance', value)}
              />
            </div>

            <div>
              <p className={formStyles.label}>
                Have you applied for permits yet?
              </p>
              <OptionCards
                options={[
                  { label: 'Approved' },
                  { label: 'In progress' },
                  { label: 'Not yet' },
                  { label: 'Not sure' },
                ]}
                value={data.permitStatus}
                onChange={(value) => updateData('permitStatus', value)}
              />
            </div>
          </StepLayout>
        );
      }

      if (data.projectType === 'Windows & doors') {
        return (
          <StepLayout
            step={stepNumber}
            total={totalSteps}
            title="Roughly how many openings?"
            helper="A rough count is fine. Your specialist measures every one at the visit."
          >
            <div>
              <p className={formStyles.label}>Windows</p>
              <OptionCards
                options={windowCountOptions}
                value={data.windowCount}
                onChange={(value) => updateData('windowCount', value)}
                columns="grid-cols-2 sm:grid-cols-3"
              />
            </div>

            {data.windowCount && (
              <div>
                <p className={formStyles.label}>Doors</p>
                <OptionCards
                  options={doorCountOptions}
                  value={data.doorCount}
                  onChange={(value) => updateData('doorCount', value)}
                  columns="grid-cols-2"
                />
              </div>
            )}
          </StepLayout>
        );
      }

      return (
        <StepLayout
          step={stepNumber}
          total={totalSteps}
          title="Let's understand your timing"
          helper="This helps us assess feasibility and avoid wasted time on-site."
        >
          <div>
            <p className={formStyles.label}>When would you like to start?</p>
            <OptionCards
              options={timelineOptions}
              value={data.timeline}
              onChange={(value) => updateData('timeline', value)}
            />
          </div>
        </StepLayout>
      );
    }

    if (step === 'property') {
      return (
        <StepLayout
          step={stepNumber}
          total={totalSteps}
          title="Tell us about your property"
          helper={program ? 'Your address lets us show consultation times that reach you.' : undefined}
        >
          <Field
            label="City"
            placeholder="Hamilton, Mississauga, Burlington..."
            value={data.city}
            onChange={(event) => updateData('city', event.target.value)}
            autoComplete="address-level2"
            list="ontario-city-suggestions"
          />
          <datalist id="ontario-city-suggestions">
            {ontarioCitySuggestions.map((city) => (
              <option key={city} value={city} />
            ))}
          </datalist>

          {data.city.trim() && (
            <div>
              <p className={formStyles.label}>Property type</p>
              <OptionCards
                options={propertyTypeOptions}
                value={data.propertyType}
                onChange={(value) =>
                  updateData('propertyType', value as PropertyType)
                }
              />
            </div>
          )}

          {data.propertyType && (
            <div className="space-y-4">
              <div className="relative">
                <label className={formStyles.label}>
                  <MapPin className="mr-1 inline h-4 w-4 text-[#1B3C6C]" />
                  {program ? 'Property address' : 'Add your address for more accurate results'}
                  {!program && <span className="ml-2 font-normal text-slate-400">Optional</span>}
                </label>
                <input
                  className={formStyles.field}
                  placeholder={program ? 'Start typing, then pick your address' : '123 Main St'}
                  value={data.address}
                  autoComplete="off"
                  onChange={(event) => {
                    updateData('address', event.target.value);
                    setPlaceId('');
                  }}
                  // Suggestions are picked on mousedown, before blur fires.
                  onBlur={() => setSuggestions([])}
                />
                {placeId ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <Check className="h-3.5 w-3.5" /> Address confirmed
                  </p>
                ) : program && data.address.trim().length > 2 ? (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    Pick your address from the list so we can check times in your area.
                  </p>
                ) : null}
                {suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {suggestions.map((s) => (
                      <button
                        key={s.placeId}
                        type="button"
                        onMouseDown={() => {
                          skipSuggest.current = true;
                          setPlaceId(s.placeId);
                          setSuggestions([]);
                          setData((current) => ({ ...current, address: s.description }));
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-[#f6faff]"
                      >
                        {s.description}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {(data.propertyType === 'Condo' || data.propertyType === 'Townhome') && (
                <Field
                  label="Unit / Apt / Suite"
                  optional
                  placeholder="e.g. 12"
                  value={data.unit}
                  onChange={(event) => updateData('unit', event.target.value)}
                  autoComplete="address-line2"
                />
              )}
            </div>
          )}
        </StepLayout>
      );
    }

    if (step === 'documents') {
      const ready = uploads.filter((u) => u.status === 'done').length;
      return (
        <StepLayout
          step={stepNumber}
          total={totalSteps}
          title="Have anything to share?"
          helper="Optional. Drawings, permits or a quote from someone else help your specialist arrive prepared. Skip it if you don't have any."
        >
          <div>
            <p className={formStyles.label}>What do you have?</p>
            <div className="flex flex-wrap gap-2">
              {PROJECT_FILE_KINDS.map((kind) => {
                const on = fileKinds.includes(kind);
                return (
                  <button
                    key={kind}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setFileKinds((list) => (on ? list.filter((k) => k !== kind) : [...list, kind]))
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition',
                      on
                        ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-[#1B3C6C]'
                    )}
                  >
                    {on && <Check className="h-3.5 w-3.5" />}
                    {kind}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <input
              ref={fileInput}
              type="file"
              accept={ACCEPT}
              multiple
              className="hidden"
              onChange={(event) => void addFiles(event.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void addFiles(event.dataTransfer.files);
              }}
              disabled={uploads.length >= QUOTE_FILE_RULES.maxFiles}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 px-6 py-8 text-center transition hover:border-[#1B3C6C] hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1B3C6C] shadow-sm">
                <Upload className="h-6 w-6" />
              </span>
              <span className="font-bold text-slate-900">Add files</span>
              <span className="text-sm text-slate-500">
                PDF, JPG or PNG · up to {QUOTE_FILE_RULES.maxBytes / 1024 / 1024} MB each · {QUOTE_FILE_RULES.maxFiles} files max
              </span>
            </button>

            {uploads.length > 0 && (
              <ul className="mt-4 space-y-2">
                {uploads.map((u) => (
                  <li
                    key={u.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-[#1B3C6C]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{u.name}</p>
                      <p className={cn('text-xs', u.status === 'error' ? 'text-red-600' : 'text-slate-500')}>
                        {u.status === 'uploading'
                          ? `Uploading… ${u.progress}%`
                          : u.status === 'error'
                            ? u.error
                            : `${formatSize(u.size)} · uploaded`}
                      </p>
                    </div>
                    {u.status === 'uploading' ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
                    ) : (
                      <button
                        type="button"
                        aria-label={`Remove ${u.name}`}
                        onClick={() => setUploads((list) => list.filter((x) => x.id !== u.id))}
                        className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
            {ready > 0 && (
              <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Paperclip className="h-4 w-4" />
                {ready} file{ready === 1 ? '' : 's'} ready to send with your review
              </p>
            )}
          </div>
        </StepLayout>
      );
    }

    if (step === 'calendar' && program && meeting) {
      if (booking) {
        return (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-3xl font-bold tracking-[-0.03em] text-slate-900">
              Your consultation is booked
            </h2>
            <p className="mt-5 text-xl font-bold text-slate-900">{fmtDate(booking.date)}</p>
            <p className="text-lg font-bold text-[#1B3C6C]">{fmtTime(booking.time)}</p>
            <p className="mt-2 text-sm font-bold uppercase tracking-wide text-slate-500">{meeting.line}</p>
            <p className="mt-3 text-slate-600">{meeting.detail}</p>
            <p className="mt-4 text-sm font-semibold text-slate-500">Reference {booking.publicReference}</p>

            <AddToCalendar
              event={{
                title: remote
                  ? `OntarioReno - ${program.appointmentProjectTypeLabel} (virtual)`
                  : `OntarioReno - ${program.appointmentProjectTypeLabel}`,
                location: remote ? '' : booking.propertyAddress || data.address,
                description: `${program.visitMinutes}-minute consultation with an OntarioReno specialist. Reference: ${booking.publicReference}`,
                date: booking.date,
                time: booking.time,
                durationMinutes: program.visitMinutes,
              }}
              uid={booking.publicReference}
            />

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left">
              <p className="mb-3 text-sm font-bold text-slate-800">What happens next?</p>
              <ul className="space-y-3">
                {[
                  ['Confirmation sent:', data.email.trim()
                    ? 'Check your texts and email for the booking details.'
                    : 'Check your texts for the booking details.'],
                  ['Project review:', 'Your specialist reads your answers and any documents before the consultation.'],
                  remote
                    ? ['Consultation:', 'A specialist will contact you around the scheduled time.']
                    : ['Consultation:', `A specialist will arrive at ${booking.propertyAddress || data.address} at the scheduled time.`],
                ].map(([bold, rest]) => (
                  <li key={bold} className="flex gap-2.5 text-sm leading-relaxed text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>
                      <span className="font-bold text-slate-800">{bold}</span> {rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );
      }

      return (
        <StepLayout
          step={stepNumber}
          total={totalSteps}
          title="Pick a consultation time"
          helper="Free and no obligation. Choose whatever suits you."
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#1B3C6C]">
            <CalendarDays className="h-4 w-4" />
            {meeting.line}
          </div>
          {/* Said before they pick, not after: someone choosing a time
              believing a specialist is driving out has been misled by the time
              the confirmation corrects them. */}
          {remote && (
            <p className="rounded-xl border border-[#1B3C6C]/20 bg-[#e8f1fb] p-3 text-sm text-slate-700">
              {meeting.detail}
            </p>
          )}

          {byDate.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-slate-600">
              No times are free right now. We have your details and will call to arrange one.
            </p>
          ) : (
            <div className="relative">
              <div className="max-h-[52vh] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-[26rem]">
                {byDate.slice(0, 10).map(([date, times]) => (
                  <div key={date} className="rounded-2xl border border-slate-200 p-4">
                    <p className="mb-3 text-sm font-bold text-slate-800">{fmtDateShort(date)}</p>
                    <div className="flex flex-wrap gap-2">
                      {times.map((time) => {
                        const on = chosen?.date === date && chosen?.time === time;
                        return (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setChosen({ date, time })}
                            className={cn(
                              'rounded-xl border-2 px-4 py-2 text-sm font-bold transition',
                              on
                                ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                                : 'border-slate-200 text-slate-700 hover:border-[#1B3C6C]'
                            )}
                          >
                            {fmtTime(time)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
            </div>
          )}

          {bookingError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {bookingError}
            </div>
          )}
        </StepLayout>
      );
    }

    return (
      <StepLayout
        step={stepNumber}
        total={totalSteps}
        title={program ? 'Where should we send your confirmation?' : "Let's review your project and plan next steps"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Full Name"
            placeholder="Jane Homeowner"
            value={data.fullName}
            onChange={(event) => updateData('fullName', event.target.value)}
            onBlur={() => setTouched((current) => ({ ...current, fullName: true }))}
            error={
              touched.fullName && !data.fullName.trim()
                ? 'Please enter your name.'
                : undefined
            }
            autoComplete="name"
          />
          <Field
            label="Phone Number"
            placeholder="(416) 123-4567"
            value={data.phone}
            onChange={(event) =>
              updateData('phone', formatPhoneInput(event.target.value))
            }
            onBlur={() => setTouched((current) => ({ ...current, phone: true }))}
            error={
              touched.phone && phoneDigits(data.phone).length < 10
                ? 'Enter a valid 10-digit phone number.'
                : undefined
            }
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <Field
          label="Email"
          optional
          type="email"
          placeholder="jane@example.com"
          value={data.email}
          onChange={(event) => updateData('email', event.target.value)}
          autoComplete="email"
        />

        {!program && (
          <div>
            <p className={formStyles.label}>When's a good time to reach you?</p>
            <OptionCards
              options={timingOptions}
              value={data.contactTiming}
              onChange={(value) =>
                updateData('contactTiming', value as ContactTiming)
              }
              columns="sm:grid-cols-2"
            />
          </div>
        )}

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <p className="font-semibold text-slate-900">
            {program
              ? 'Next, pick a time for your free consultation. Your specialist reviews everything you sent before it.'
              : "We'll review your details and call to confirm your project and schedule your consultation."}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            No obligation. No pressure.
          </p>
        </div>
      </StepLayout>
    );
  };

  if (submitStatus.type === 'success') {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-[-0.04em] text-slate-900">
              You're all set
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              {submitStatus.message}
            </p>
            {data.contactTiming === 'Today' && (
              <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-blue-50 px-5 py-4 text-sm font-medium leading-6 text-[#1B3C6C]">
                If you selected "Today", expect a call within a few hours.
              </p>
            )}
            <button
              type="button"
              onClick={resetAll}
              className={cn(buttonStyles.secondary, 'mt-8')}
            >
              Start another request
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isLastQuestionStep = step === 'contact';
  const onCalendar = step === 'calendar';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] py-8 sm:py-12 lg:py-14">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-[#1B3C6C]">
            <Home className="h-4 w-4" />
            Guided Project Intake
          </div>
          <h1 className="mx-auto mt-6 max-w-[680px] text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-900 sm:text-5xl sm:leading-[1.02]">
            Start with a proper project review.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Tell us what you're planning, share anything you already have, and book a free consultation with a specialist, all in one place.
          </p>
        </div>

        <div
          ref={cardTop}
          className="scroll-mt-24 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]"
        >
          {/* The opening picker takes the full card: eight photo tiles read at a
              glance four across, and squeezed beside the sidebar they ran four
              rows deep — on a phone, below the fold. The sidebar joins from the
              second screen on. */}
          <div className={cn('grid', step !== 'project' && 'lg:grid-cols-[0.82fr_1.18fr]')}>
            {step !== 'project' && (
            <aside className="bg-[linear-gradient(180deg,#0f172a_0%,#172554_100%)] p-6 text-white sm:p-8">
              <div className="flex items-center gap-2 font-bold text-blue-200">
                <ShieldCheck className="h-6 w-6" />
                OntarioReno Verified
              </div>

              <h2 className="mt-8 text-2xl font-bold tracking-[-0.03em]">
                Designed to prevent bad renovation decisions.
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300">
                We assess your project first so you do not waste time moving in
                the wrong direction.
              </p>

              <div className="mt-7 space-y-3.5">
                {[
                  'Understand your project before major decisions begin',
                  'Identify permit and feasibility risks early',
                  'Share drawings, permits or quotes up front',
                  'Book your consultation at a time that suits you',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
                    <p className="text-sm leading-6 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>

              {data.projectType && (
                <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">
                    Your project
                  </p>
                  <p className="mt-1.5 font-bold text-white">{data.projectType}</p>
                  {data.currentState && (
                    <p className="mt-0.5 text-sm text-slate-300">{data.currentState}</p>
                  )}
                </div>
              )}
            </aside>
            )}

            <main className="p-6 sm:p-8 lg:p-10">
              {step === 'project' && (
                <div className="mb-8">
                  <p className="text-sm leading-7 text-slate-500">
                    This structured intake helps us understand your project before recommending the right next step.
                  </p>
                  <div className="mt-4 flex flex-col gap-2 text-sm font-medium text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <span>Tell us about your project</span>
                    <span className="hidden text-slate-300 sm:inline">&bull;</span>
                    <span>Share documents (optional)</span>
                    <span className="hidden text-slate-300 sm:inline">&bull;</span>
                    <span>Book your consultation</span>
                  </div>
                </div>
              )}

              {renderStep()}

              {submitStatus.type === 'error' && (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                  {submitStatus.message}
                </div>
              )}

              {!onCalendar && (
                <p className="mt-6 text-sm leading-7 text-slate-500">
                  Your information is used to review your project and determine the appropriate next step based on your requirements. You may be contacted regarding your project based on the details you provide.
                </p>
              )}

              {!(onCalendar && booking) && step !== 'project' && (
                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                  {onCalendar ? (
                    // The lead already exists by now; going back would only
                    // invite a second submission. This is the way out instead.
                    <button
                      type="button"
                      onClick={callBackSuccess}
                      disabled={isSubmitting}
                      className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700"
                    >
                      I'd rather you call me
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={prevStep}
                      disabled={isSubmitting}
                      className={cn(buttonStyles.secondary, 'w-full sm:w-auto')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Back
                    </button>
                  )}

                  {onCalendar ? (
                    byDate.length > 0 && (
                      <button
                        type="button"
                        onClick={book}
                        disabled={!chosen || isSubmitting}
                        className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
                      >
                        {isSubmitting
                          ? 'Booking...'
                          : chosen
                            ? `Confirm ${fmtTime(chosen.time)}`
                            : 'Choose a time'}
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    )
                  ) : isLastQuestionStep ? (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
                    >
                      {isSubmitting
                        ? program
                          ? 'Finding times...'
                          : 'Reviewing...'
                        : program
                          ? 'See available times'
                          : 'Start Project Review'}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={nextStep}
                      className={cn(buttonStyles.primary, 'w-full sm:w-auto')}
                    >
                      {step === 'documents' && !uploads.some((u) => u.status === 'done')
                        ? 'Skip for now'
                        : 'Continue'}
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
