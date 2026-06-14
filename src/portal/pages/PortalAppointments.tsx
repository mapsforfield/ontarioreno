import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  MapPin,
  MoreVertical,
  Paperclip,
  Plus,
  Send,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import {
  ConsultationEmailPreview,
  ConsultationEmailType,
  generateConsultationEmailPreview,
} from '../data/consultationEmails';
import { sendEmail, EmailAttachment } from '../lib/sendEmail';
import { getRecommendedContractors } from '../data/recommendations';
import { formatCurrency, formatDealStatus } from '../data/selectors';
import { usePortalData } from '../data/store';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  ContractorDispatch,
  ContractorDispatchStatus,
  ConsultationStage,
  ConsultationInterestLevel,
  ConsultationNextStep,
} from '../data/types';

type CalendarView = 'day' | 'month' | 'week';
type ConsultationFilter =
  | 'all'
  | 'cancelled'
  | 'completed'
  | 'contractor_review'
  | 'lost'
  | 'needs_follow_up'
  | 'scheduled'
  | 'won';

type AppointmentFormState = {
  address: string;
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  assignedRepId: string;
  contractorId: string;
  city: string;
  postalCode: string;
  consultationStage: ConsultationStage;
  closeProbability: string;
  customerNotes: string;
  customerName: string;
  dealId: string;
  durationMinutes: string;
  email: string;
  internalNotes: string;
  estimatedProjectValue: string;
  financingNeeded: 'no' | 'unknown' | 'yes';
  followUpDate: string;
  homeownerInterestLevel: ConsultationInterestLevel | '';
  notes: string;
  nextStep: ConsultationNextStep;
  objections: string;
  outcomeNotes: string;
  outcomeSubmitted: boolean;
  recommendedContractorId: string;
  phone: string;
  projectType: string;
  reminderMinutes: string;
  status: AppointmentStatus;
};

type DispatchFormState = {
  contractorIds: string[];
  desiredTimeline: string;
  estimatedProjectRange: string;
  financingRequired: boolean;
  safeSummary: string;
};

const statusOptions: Array<{ label: string; value: AppointmentStatus }> = [
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Completed', value: 'completed' },
  { label: 'Rescheduled', value: 'rescheduled' },
  { label: 'No-show', value: 'no_show' },
  { label: 'Cancelled', value: 'cancelled' },
];

const typeOptions: Array<{ label: string; value: AppointmentType }> = [
  { label: 'Home Visit', value: 'home_visit' },
  { label: 'Phone Consultation', value: 'phone_consultation' },
  { label: 'Video Consultation', value: 'video_consultation' },
  { label: 'Showroom Visit', value: 'showroom_visit' },
  { label: 'Supplier Meeting', value: 'supplier_meeting' },
  { label: 'Site Check', value: 'site_check' },
  { label: 'Custom Event', value: 'custom_event' },
];

const EVENT_TYPES: AppointmentType[] = ['showroom_visit', 'supplier_meeting', 'site_check', 'custom_event'];
function isEventType(type: AppointmentType) { return EVENT_TYPES.includes(type); }

const stageOptions: Array<{ label: string; value: ConsultationStage }> = [
  { label: 'Lead Qualified', value: 'lead_qualified' },
  { label: 'Consultation Scheduled', value: 'consultation_scheduled' },
  { label: 'Consultation Completed', value: 'consultation_completed' },
  { label: 'Estimate Requested', value: 'estimate_requested' },
  { label: 'Contractor Review', value: 'contractor_review' },
  { label: 'Proposal Sent', value: 'proposal_sent' },
  { label: 'Contractor Accepted', value: 'contractor_accepted' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Follow-Up Required', value: 'follow_up_required' },
];

const repStageOptions = stageOptions.filter((option) =>
  [
    'consultation_scheduled',
    'consultation_completed',
    'estimate_requested',
    'contractor_review',
    'proposal_sent',
    'follow_up_required',
  ].includes(option.value)
);

const stageProgress = [
  { label: 'Qualified', values: ['lead_qualified'] },
  { label: 'Scheduled', values: ['consultation_scheduled'] },
  { label: 'Completed', values: ['consultation_completed'] },
  { label: 'Estimate', values: ['estimate_requested'] },
  { label: 'Contractor Review', values: ['contractor_review'] },
  { label: 'Proposal', values: ['proposal_sent'] },
  { label: 'Accepted', values: ['contractor_accepted'] },
  { label: 'Won/Lost', values: ['won', 'lost'] },
] as const;

const consultationFilters: Array<{ label: string; value: ConsultationFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Completed', value: 'completed' },
  { label: 'Needs Follow-Up', value: 'needs_follow_up' },
  { label: 'Contractor Review', value: 'contractor_review' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Cancelled', value: 'cancelled' },
];

const interestOptions: Array<{
  label: string;
  value: ConsultationInterestLevel | '';
}> = [
  { label: 'Not Set', value: '' },
  { label: 'Hot', value: 'hot' },
  { label: 'Warm', value: 'warm' },
  { label: 'Cold', value: 'cold' },
  { label: 'Not Interested', value: 'not_interested' },
];

const nextStepOptions: Array<{ label: string; value: ConsultationNextStep }> = [
  { label: 'Estimate Required', value: 'estimate_required' },
  { label: 'Contractor Review', value: 'contractor_review' },
  { label: 'Follow-Up Required', value: 'follow_up_required' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'No Action', value: 'no_action' },
];

const dispatchStatusOptions: ContractorDispatchStatus[] = [
  'viewed',
  'interested',
  'accepted',
  'declined',
  'expired',
];

const dispatchReadyStages: ConsultationStage[] = [
  'consultation_completed',
  'estimate_requested',
  'contractor_review',
  'proposal_sent',
];

const emptyForm: AppointmentFormState = {
  address: '',
  appointmentDate: new Date().toISOString().slice(0, 10),
  appointmentTime: '10:00',
  appointmentType: 'home_visit',
  assignedRepId: '',
  contractorId: '',
  city: '',
  postalCode: '',
  consultationStage: 'consultation_scheduled',
  closeProbability: '0',
  customerNotes: '',
  customerName: '',
  dealId: '',
  durationMinutes: '60',
  email: '',
  estimatedProjectValue: '0',
  financingNeeded: 'unknown',
  followUpDate: '',
  homeownerInterestLevel: '',
  internalNotes: '',
  notes: '',
  nextStep: 'estimate_required',
  objections: '',
  outcomeNotes: '',
  outcomeSubmitted: false,
  phone: '',
  projectType: '',
  recommendedContractorId: '',
  reminderMinutes: '30',
  status: 'scheduled',
};

function formatAppointmentType(type: AppointmentType) {
  if (type === 'home_visit') return 'Home Visit';
  if (type === 'phone_consultation') return 'Phone Consultation';
  if (type === 'video_consultation') return 'Video Consultation';
  if (type === 'showroom_visit') return 'Showroom Visit';
  if (type === 'supplier_meeting') return 'Supplier Meeting';
  if (type === 'site_check') return 'Site Check';
  if (type === 'custom_event') return 'Custom Event';
  return type;
}

function formatAppointmentStatus(status: AppointmentStatus) {
  if (status === 'no_show') return 'No-show';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatConsultationStage(stage: ConsultationStage) {
  return (
    stageOptions.find((option) => option.value === stage)?.label ??
    stage.split('_').join(' ')
  );
}

function formatInterestLevel(level: ConsultationInterestLevel | null) {
  if (!level) return 'Not set';
  return interestOptions.find((option) => option.value === level)?.label ?? level;
}

function formatNextStep(nextStep: ConsultationNextStep) {
  return nextStepOptions.find((option) => option.value === nextStep)?.label ?? nextStep;
}

function formatAppointmentDate(date: string) {
  if (!date) return 'Date not set';
  return new Intl.DateTimeFormat('en-CA', { dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00`)
  );
}

function getStartOfWeek(date: Date) {
  const start = new Date(date);
  start.setDate(date.getDate() - date.getDay());
  start.setHours(0, 0, 0, 0);
  return start;
}

function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getDaysSince(value: string) {
  if (!value) return 0;
  const start = new Date(value);
  const now = new Date();
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function appointmentToForm(appointment: Appointment): AppointmentFormState {
  return {
    address: appointment.address,
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    appointmentType: appointment.appointmentType,
    assignedRepId: appointment.assignedRepId,
    contractorId: appointment.contractorId ?? '',
    city: appointment.city,
    postalCode: appointment.postalCode ?? '',
    consultationStage: appointment.consultationStage ?? 'consultation_scheduled',
    closeProbability: String(appointment.closeProbability ?? 0),
    customerNotes: appointment.customerNotes ?? '',
    customerName: appointment.customerName || appointment.title || '',
    dealId: appointment.dealId,
    durationMinutes: String(appointment.durationMinutes),
    email: appointment.email,
    estimatedProjectValue: String(appointment.estimatedProjectValue ?? 0),
    financingNeeded:
      appointment.financingNeeded === null
        ? 'unknown'
        : appointment.financingNeeded
          ? 'yes'
          : 'no',
    followUpDate: appointment.followUpDate ?? '',
    homeownerInterestLevel: appointment.homeownerInterestLevel ?? '',
    internalNotes: appointment.internalNotes ?? appointment.notes ?? '',
    notes: appointment.notes,
    nextStep: appointment.nextStep ?? 'estimate_required',
    objections: appointment.objections ?? '',
    outcomeNotes: appointment.outcomeNotes ?? '',
    outcomeSubmitted: appointment.outcomeSubmitted ?? false,
    phone: appointment.phone,
    projectType: appointment.projectType,
    recommendedContractorId: appointment.recommendedContractorId ?? '',
    reminderMinutes: String(appointment.reminderMinutes ?? 30),
    status: appointment.status,
  };
}

function sourceLabel(source: Appointment['source']) {
  return source === 'google_calendar' ? 'Google Calendar' : 'Manual';
}

// Stage-based dot color — used on calendar pills and month dots
function getStageDotColor(stage: ConsultationStage, status?: AppointmentStatus): string {
  if (status === 'no_show') return 'bg-red-400';
  if (status === 'cancelled') return 'bg-slate-300';
  if (stage === 'won') return 'bg-emerald-500';
  if (stage === 'lost') return 'bg-red-500';
  if (stage === 'follow_up_required') return 'bg-orange-400';
  if (stage === 'contractor_review' || stage === 'proposal_sent' || stage === 'contractor_accepted') return 'bg-purple-500';
  if (stage === 'estimate_requested') return 'bg-amber-400';
  if (stage === 'consultation_completed') return 'bg-teal-500';
  if (stage === 'consultation_scheduled') return 'bg-[#32639b]';
  return 'bg-slate-400';
}

function getEventTypePillBg(type: AppointmentType): { bg: string; lightText: boolean } {
  if (type === 'showroom_visit') return { bg: 'bg-orange-500', lightText: true };
  if (type === 'supplier_meeting') return { bg: 'bg-purple-600', lightText: true };
  if (type === 'site_check') return { bg: 'bg-teal-700', lightText: true };
  if (type === 'custom_event') return { bg: 'bg-indigo-500', lightText: true };
  return { bg: 'bg-slate-500', lightText: true };
}

function getMobileDotColor(status: AppointmentStatus, stage?: ConsultationStage): string {
  if (stage) return getStageDotColor(stage, status);
  if (status === 'completed') return 'bg-emerald-500';
  if (status === 'confirmed') return 'bg-sky-500';
  if (status === 'rescheduled') return 'bg-amber-500';
  if (status === 'no_show') return 'bg-orange-500';
  if (status === 'cancelled') return 'bg-slate-400';
  return 'bg-[#1B3C6C]';
}

function getStatusLabel(status: AppointmentStatus): string {
  return status.replace(/_/g, ' ');
}

function getStatusClasses(status: AppointmentStatus) {
  if (status === 'completed') {
    return {
      badge: 'bg-emerald-100 text-emerald-800',
      card: 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300',
      dot: 'bg-emerald-500',
    };
  }
  if (status === 'confirmed') {
    return {
      badge: 'bg-sky-100 text-sky-800',
      card: 'border-sky-200 bg-sky-50/70 hover:border-sky-300',
      dot: 'bg-sky-500',
    };
  }
  if (status === 'rescheduled') {
    return {
      badge: 'bg-amber-100 text-amber-800',
      card: 'border-amber-200 bg-amber-50/70 hover:border-amber-300',
      dot: 'bg-amber-500',
    };
  }
  if (status === 'no_show') {
    return {
      badge: 'bg-orange-100 text-orange-800',
      card: 'border-orange-200 bg-orange-50/70 hover:border-orange-300',
      dot: 'bg-orange-500',
    };
  }
  if (status === 'cancelled') {
    return {
      badge: 'bg-slate-200 text-slate-700',
      card: 'border-slate-200 bg-slate-50 hover:border-slate-300',
      dot: 'bg-slate-400',
    };
  }
  return {
    badge: 'bg-[#e8f1fb] text-[#1B3C6C]',
    card: 'border-[#b8c9dd] bg-[#f6faff] hover:border-[#8fb0d2]',
    dot: 'bg-[#32639b]',
  };
}

/** Returns a solid Tailwind bg class + whether text on it should be light or dark */
function getStagePillBg(stage: ConsultationStage, status?: AppointmentStatus, aptType?: AppointmentType): { bg: string; lightText: boolean } {
  if (aptType && isEventType(aptType)) return getEventTypePillBg(aptType);
  if (status === 'no_show')   return { bg: 'bg-red-400',      lightText: true };
  if (status === 'cancelled') return { bg: 'bg-slate-300',    lightText: false };
  if (stage === 'won')        return { bg: 'bg-emerald-500',  lightText: true };
  if (stage === 'lost')       return { bg: 'bg-red-500',      lightText: true };
  if (stage === 'follow_up_required') return { bg: 'bg-orange-400', lightText: true };
  if (stage === 'contractor_review' || stage === 'proposal_sent' || stage === 'contractor_accepted')
                              return { bg: 'bg-purple-500',   lightText: true };
  if (stage === 'estimate_requested') return { bg: 'bg-amber-400', lightText: false };
  if (stage === 'consultation_completed') return { bg: 'bg-teal-500', lightText: true };
  return { bg: 'bg-[#32639b]', lightText: true }; // consultation_scheduled
}

function fmt12(time: string | undefined): string {
  if (!time) return 'TBD';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, '0')}${suffix}`;
}

function AppointmentPill({
  appointment,
  contractorName,
  projectType,
  repName,
  onClick,
  variant = 'compact',
}: {
  appointment: Appointment;
  contractorName: string;
  projectType: string;
  repName: string;
  onClick: () => void;
  variant?: 'compact' | 'full';
}) {
  const { bg, lightText } = getStagePillBg(appointment.consultationStage, appointment.status, appointment.appointmentType);
  const outcomeBadge = getOutcomeBadge(appointment);
  const name = appointment.customerName || appointment.title || 'Consultation';
  const time = fmt12(appointment.appointmentTime);

  // ── Month / Week: compact solid-color pill (Google Calendar style) ──────────
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-lg ${bg} px-2 py-1 text-left shadow-sm ring-1 ring-black/10 transition hover:brightness-110 active:brightness-90`}
      >
        <p className={`truncate text-[0.6rem] font-bold ${lightText ? 'text-white/70' : 'text-slate-600'}`}>
          {time}
        </p>
        <p className={`truncate text-[0.7rem] font-black leading-tight ${lightText ? 'text-white' : 'text-slate-800'}`}>
          {name}
        </p>
        <p className={`truncate text-[0.6rem] font-medium ${lightText ? 'text-white/60' : 'text-slate-500'}`}>
          {projectType || 'Project TBD'} · {repName}
        </p>
      </button>
    );
  }

  // ── Day/List: split-panel card — colored time column + white detail area ────
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-xl border border-slate-100 bg-white text-left shadow-sm transition hover:shadow-md hover:-translate-y-px"
    >
      <div className="flex items-stretch">
        {/* Colored time panel */}
        <div className={`${bg} flex min-w-[72px] flex-col items-center justify-center px-3 py-4`}>
          <span className={`text-sm font-black tabular-nums leading-none ${lightText ? 'text-white' : 'text-slate-700'}`}>
            {time}
          </span>
        </div>
        {/* White detail panel */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 px-4 py-3">
          <p className="truncate text-sm font-black text-slate-900">{name}</p>
          <p className="truncate text-xs text-slate-500">
            {projectType || 'Project type TBD'} · {repName}
            {contractorName ? ` · ${contractorName}` : ''}
          </p>
          <p className="mt-1 truncate text-[0.65rem] font-bold uppercase tracking-widest text-slate-400">
            {formatConsultationStage(appointment.consultationStage)}
          </p>
          {outcomeBadge && (
            <p className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[0.6rem] font-black ${outcomeBadge.className}`}>
              {outcomeBadge.label}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function getPreview(value: string, fallback: string) {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

function getValueRange(value: number) {
  if (!value || value <= 0) return 'To be confirmed';

  const rounded = Math.round(value / 10000) * 10000;
  const low = Math.max(0, rounded - 10000);
  const high = rounded + 10000;
  const formatShort = (amount: number) =>
    amount >= 1000 ? `$${Math.round(amount / 1000)}k` : `$${amount}`;

  return `${formatShort(low)}-${formatShort(high)}`;
}

function formatDispatchStatus(status: ContractorDispatchStatus) {
  return status
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function getOutcomeBadge(appointment: Appointment) {
  if (appointment.outcomeSubmitted) {
    return {
      className: 'bg-emerald-100 text-emerald-800',
      label: 'Outcome Submitted',
    };
  }
  if (appointment.status === 'completed') {
    return {
      className: 'bg-amber-100 text-amber-800',
      label: 'Outcome Needed',
    };
  }
  return null;
}

export default function PortalAppointments() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    addContractorDispatch,
    addAppointment,
    assignDispatchContractor,
    clients,
    createDealFromAppointment,
    contractors,
    daysOff,
    deals,
    deleteAppointment,
    transferAppointment,
    getDispatchesForConsultation,
    getVisibleAppointmentsForUser,
    logActivity,
    updateContractorDispatch,
    updateAppointment,
    addDaysOff,
    removeDayOff,
    users,
  } = usePortalData();
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [calendarRepFilter, setCalendarRepFilter] = useState<string>('all');

  // ── Days off panel ──
  const [daysOffPanelOpen, setDaysOffPanelOpen] = useState(false);
  const [daysOffRepFilter, setDaysOffRepFilter] = useState<string>('');
  const [daysOffFromDate, setDaysOffFromDate] = useState('');
  const [daysOffToDate, setDaysOffToDate] = useState('');
  const [daysOffNote, setDaysOffNote] = useState('');
  const [daysOffSaving, setDaysOffSaving] = useState(false);
  const [daysOffError, setDaysOffError] = useState('');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string | null>(null);
  const [consultationFilter, setConsultationFilter] =
    useState<ConsultationFilter>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AppointmentFormState>(emptyForm);
  const [emailActionMessage, setEmailActionMessage] = useState('');
  const [sendingEmailType, setSendingEmailType] = useState<ConsultationEmailType | null>(null);
  // Per-template subject/body overrides — keyed by ConsultationEmailType
  const [emailEdits, setEmailEdits] = useState<Record<string, { subject: string; body: string }>>({});
  const [emailRecipientOverrides, setEmailRecipientOverrides] = useState<Record<string, { to: string; cc: string }>>({});
  // Per-template file attachments — keyed by ConsultationEmailType
  const [emailAttachments, setEmailAttachments] = useState<Record<string, File[]>>({});
  const [dispatchActionMessage, setDispatchActionMessage] = useState('');
  const [isDispatchPanelOpen, setIsDispatchPanelOpen] = useState(false);
  const [showTransferUI, setShowTransferUI] = useState(false);
  const [transferToRepId, setTransferToRepId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [mobileConsultTab, setMobileConsultTab] = useState<'today' | 'upcoming' | 'attention' | 'calendar' | 'all'>('today');
  const [notesModal, setNotesModal] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<'prep' | 'details' | 'outcome' | 'dispatch' | 'emails'>('prep');
  // Client search/autofill for new consultation form
  const [clientSearch, setClientSearch] = useState('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  // Which agenda card's "•••" dropdown is open (keyed by appointment.id)
  const [openAgendaMenu, setOpenAgendaMenu] = useState<string | null>(null);
  // Which appointment is currently sending a reminder (keyed by id)
  const [reminderSending, setReminderSending] = useState<string | null>(null);
  const [reminderMessage, setReminderMessage] = useState<{ id: string; text: string } | null>(null);
  const [reminderPreview, setReminderPreview] = useState<{ appointment: Appointment; preview: ConsultationEmailPreview; subjectOverride: string } | null>(null);
  // Which today's agenda rows are expanded (desktop compact view)
  const [expandedAgendaRows, setExpandedAgendaRows] = useState<Set<string>>(new Set());
  const [conflictWarning, setConflictWarning] = useState<Appointment | null>(null);
  const conflictOverrideRef = useRef(false);

  // Auto-open a consultation when navigated here from the dashboard
  const location = useLocation();
  const handledNavState = useRef<string | null>(null);
  const [expandedUpcomingRows, setExpandedUpcomingRows] = useState<Set<string>>(new Set());
  const [collapsedRepGroups, setCollapsedRepGroups] = useState<Set<string>>(new Set());
  const [dispatchForm, setDispatchForm] = useState<DispatchFormState>({
    contractorIds: [],
    desiredTimeline: '',
    estimatedProjectRange: '',
    financingRequired: false,
    safeSummary: '',
  });
  const monthDays = useMemo(() => {
    const firstOfMonth = new Date(
      cursorDate.getFullYear(),
      cursorDate.getMonth(),
      1
    );
    const gridStart = getStartOfWeek(firstOfMonth);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [cursorDate]);

  if (!currentUser) return null;

  const activeReps = users.filter((user) => user.role === 'rep' && user.active);
  const visibleAppointments = getVisibleAppointmentsForUser(currentUser).sort(
    (first, second) =>
      `${first.appointmentDate}T${first.appointmentTime}`.localeCompare(
        `${second.appointmentDate}T${second.appointmentTime}`
      )
  );

  // Auto-open a consultation when arriving from the dashboard
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const state = location.state as { openAppointmentId?: string; prefillClient?: import('../data/types').Client } | null;
    const id = state?.openAppointmentId;
    if (id && handledNavState.current !== id) {
      handledNavState.current = id;
      const apt = visibleAppointments.find((a) => a.id === id);
      if (apt) openAppointment(apt);
    }
    // Pre-fill new consultation form from a client profile
    const prefill = state?.prefillClient;
    if (prefill && handledNavState.current !== `prefill-${prefill.id}`) {
      handledNavState.current = `prefill-${prefill.id}`;
      setIsCreating(true);
      setSelectedAppointmentId(null);
      setForm({
        ...emptyForm,
        customerName: prefill.name,
        phone: prefill.phone ?? '',
        email: prefill.email ?? '',
        address: prefill.address ?? '',
        city: prefill.city ?? '',
        postalCode: prefill.postalCode ?? '',
        projectType: prefill.projectTypes?.[0] ?? '',
        assignedRepId: currentUser?.id ?? '',
      });
      setPanelTab('prep');
    }
  // openAppointment is stable; visibleAppointments intentionally omitted to run once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const matchesConsultationFilter = (appointment: Appointment) => {
    if (consultationFilter === 'all') return true;
    if (consultationFilter === 'scheduled') {
      return ['confirmed', 'rescheduled', 'scheduled'].includes(appointment.status);
    }
    if (consultationFilter === 'completed') {
      return (
        appointment.status === 'completed' ||
        appointment.consultationStage === 'consultation_completed'
      );
    }
    if (consultationFilter === 'needs_follow_up') {
      return appointment.consultationStage === 'follow_up_required';
    }
    if (consultationFilter === 'cancelled') {
      return appointment.status === 'cancelled';
    }
    return appointment.consultationStage === consultationFilter;
  };
  const filteredAppointments = visibleAppointments.filter(
    matchesConsultationFilter
  );
  // Calendar-specific rep filter (admin only)
  const calendarAppointments =
    isAdmin && calendarRepFilter !== 'all'
      ? filteredAppointments.filter((a) => a.assignedRepId === calendarRepFilter)
      : filteredAppointments;
  const selectedAppointment = visibleAppointments.find(
    (appointment) => appointment.id === selectedAppointmentId
  );
  const today = toDateKey(new Date());
  const todayAppointments = filteredAppointments.filter(
    (appointment) => appointment.appointmentDate === today
  );
  const futureAppointments = filteredAppointments.filter(
    (appointment) => appointment.appointmentDate > today
  );
  const upcomingAgendaAppointments = futureAppointments.filter((appointment) =>
    ['confirmed', 'rescheduled', 'scheduled'].includes(appointment.status)
  );
  const upcomingAppointments = filteredAppointments.filter(
    (appointment) =>
      appointment.appointmentDate >= today &&
      ['confirmed', 'rescheduled', 'scheduled'].includes(appointment.status)
  );
  const completedAppointments = filteredAppointments.filter(
    (appointment) => appointment.status === 'completed'
  );
  const needsAttentionAppointments = visibleAppointments.filter(
    (appointment) =>
      (appointment.status === 'completed' && !appointment.outcomeSubmitted) ||
      (appointment.nextStep === 'follow_up_required' &&
        appointment.followUpDate &&
        appointment.followUpDate <= today) ||
      (['hot', 'warm'].includes(appointment.homeownerInterestLevel ?? '') &&
        appointment.nextStep === 'no_action') ||
      (appointment.appointmentDate < today && appointment.status !== 'completed') ||
      appointment.consultationStage === 'follow_up_required' ||
      (appointment.consultationStage === 'estimate_requested' &&
        getDaysSince(appointment.updatedAt) > 3) ||
      (appointment.consultationStage === 'contractor_review' &&
        getDaysSince(appointment.updatedAt) > 3) ||
      !appointment.assignedRepId
  );
  // Combined list for the desktop "Upcoming & Dispatch Gaps" section
  const needsAttentionIds = new Set(needsAttentionAppointments.map((a) => a.id));
  const upcomingCombined = (() => {
    const seen = new Set<string>();
    const combined: typeof needsAttentionAppointments = [];
    for (const apt of upcomingAgendaAppointments.slice(0, 12)) {
      seen.add(apt.id);
      combined.push(apt);
    }
    for (const apt of needsAttentionAppointments.slice(0, 8)) {
      if (!seen.has(apt.id)) combined.push(apt);
    }
    return combined.sort((a, b) => {
      const d = a.appointmentDate.localeCompare(b.appointmentDate);
      if (d !== 0) return d;
      return (a.appointmentTime || '').localeCompare(b.appointmentTime || '');
    });
  })();

  const monthLabel = new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    year: 'numeric',
  }).format(cursorDate);
  const weekStart = getStartOfWeek(cursorDate);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
  const currentDayAppointments = calendarAppointments.filter(
    (appointment) => appointment.appointmentDate === toDateKey(cursorDate)
  );

  const getDeal = (dealId: string) => deals.find((deal) => deal.id === dealId);
  const activeContractors = contractors.filter(
    (contractor) => contractor.contractorStatus === 'active'
  );
  const contractorOptions = isAdmin ? contractors : activeContractors;
  const getAppointmentLabel = (appointment: Appointment) => {
    if (appointment.title) return appointment.title;
    if (appointment.customerName) return appointment.customerName;
    const deal = getDeal(appointment.dealId);
    return deal ? `${deal.homeownerName} / ${deal.projectType}` : 'Unlinked consultation';
  };
  const getRepName = (repId: string) =>
    repId ? users.find((user) => user.id === repId)?.name ?? repId : 'Unassigned Rep';
  const getAppointmentProjectType = (appointment: Appointment) =>
    appointment.projectType || getDeal(appointment.dealId)?.projectType || '';
  const getContractorName = (contractorId: string | null) =>
    contractorId
      ? contractors.find((contractor) => contractor.id === contractorId)
          ?.companyName ?? 'Unassigned Contractor'
      : 'Unassigned Contractor';
  const linkedDeal = form.dealId ? getDeal(form.dealId) : undefined;
  const formContractorId = form.contractorId || linkedDeal?.assignedContractorId || null;
  const linkedContractor = formContractorId
    ? contractors.find(
        (contractor) => contractor.id === formContractorId
      )
    : undefined;
  const assignedRep = form.assignedRepId
    ? users.find((user) => user.id === form.assignedRepId)
    : undefined;
  const previewAppointment =
    selectedAppointment && {
      ...selectedAppointment,
      address: form.address,
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      appointmentType: form.appointmentType,
      assignedRepId: form.assignedRepId,
      city: form.city,
      consultationStage: form.consultationStage,
      closeProbability: Number(form.closeProbability) || 0,
      contractorId: form.contractorId || null,
      customerName: form.customerName,
      customerNotes: form.customerNotes,
      dealId: form.dealId,
      durationMinutes: Number(form.durationMinutes) || selectedAppointment.durationMinutes,
      email: form.email,
      estimatedProjectValue: Number(form.estimatedProjectValue) || 0,
      financingNeeded:
        form.financingNeeded === 'unknown'
          ? null
          : form.financingNeeded === 'yes',
      followUpDate: form.followUpDate,
      homeownerInterestLevel: form.homeownerInterestLevel || null,
      internalNotes: form.internalNotes,
      location: [form.address, form.city].filter(Boolean).join(', '),
      notes: form.internalNotes,
      phone: form.phone,
      projectType: form.projectType,
      nextStep: form.nextStep,
      objections: form.objections,
      outcomeNotes: form.outcomeNotes,
      outcomeSubmitted: form.outcomeSubmitted,
      recommendedContractorId: form.recommendedContractorId || null,
      status: form.status,
    };
  const emailTemplateTypes: ConsultationEmailType[] = [
    'booking_confirmation',
    'reschedule_notice',
    'cancellation_notice',
    'rep_assignment',
  ];
  const stageSelectOptions = stageOptions;
  const emailPreviews =
    previewAppointment && emailTemplateTypes.length > 0
      ? emailTemplateTypes.map((type) =>
          generateConsultationEmailPreview(type, {
            appointment: previewAppointment,
            contractor: linkedContractor,
            deal: linkedDeal,
            rep: assignedRep,
          })
        )
      : [];
  const selectedDispatches = selectedAppointment
    ? getDispatchesForConsultation(selectedAppointment.id)
    : [];
  const selectedDispatchDeal =
    selectedAppointment && selectedAppointment.dealId
      ? getDeal(selectedAppointment.dealId)
      : undefined;
  const selectedDispatchRecommendations = selectedDispatchDeal
    ? getRecommendedContractors(selectedDispatchDeal, contractorOptions)
    : [];
  const dispatchContractorOptions = [...contractorOptions].sort((first, second) => {
    if (!dispatchForm.financingRequired) {
      return second.priorityScore - first.priorityScore;
    }
    if (first.financingStatus === second.financingStatus) {
      return second.priorityScore - first.priorityScore;
    }
    if (first.financingStatus === 'financing_available') return -1;
    if (second.financingStatus === 'financing_available') return 1;
    return second.priorityScore - first.priorityScore;
  });
  const selectedDispatchContractors = contractors.filter((contractor) =>
    dispatchForm.contractorIds.includes(contractor.id)
  );
  const dispatchPreviewMessage = selectedAppointment
    ? [
        `Hi ${
          selectedDispatchContractors.length === 1
            ? selectedDispatchContractors[0].contactName
            : 'Contractor Team'
        },`,
        '',
        'OntarioReno has a renovation opportunity that may be a fit for your team.',
        '',
        'Opportunity overview:',
        `- Area: ${selectedAppointment.city || 'General Ontario area'}`,
        `- Project type: ${
          selectedAppointment.projectType ||
          selectedDispatchDeal?.projectType ||
          'Renovation project'
        }`,
        `- Estimated project range: ${
          dispatchForm.estimatedProjectRange || 'To be confirmed'
        }`,
        `- Financing required: ${
          dispatchForm.financingRequired ? 'Yes' : 'No'
        }`,
        dispatchForm.desiredTimeline
          ? `- Desired timeline: ${dispatchForm.desiredTimeline}`
          : '',
        '',
        'Safe summary:',
        dispatchForm.safeSummary || 'Summary to be provided.',
        '',
        'Homeowner contact details and exact address are not shared until the opportunity is accepted and assigned.',
        '',
        'Please let us know if you are interested in reviewing this opportunity further.',
        '',
        'OntarioReno Broker Portal',
      ]
        .filter((line) => line !== '')
        .join('\n')
    : '';
  const canDispatchSelectedAppointment =
    Boolean(selectedAppointment?.dealId) &&
    Boolean(selectedAppointment) &&
    (isAdmin || selectedAppointment?.assignedRepId === currentUser.id) &&
    (dispatchReadyStages.includes(form.consultationStage) ||
      form.nextStep === 'contractor_review');
  const getAttentionReasons = (appointment: Appointment) => {
    const reasons = [];
    if (
      appointment.status === 'completed' &&
      !appointment.outcomeSubmitted
    ) {
      reasons.push('Outcome report needed');
    }
    if (
      appointment.nextStep === 'follow_up_required' &&
      appointment.followUpDate &&
      appointment.followUpDate <= today
    ) {
      reasons.push('Outcome follow-up due');
    }
    if (
      ['hot', 'warm'].includes(appointment.homeownerInterestLevel ?? '') &&
      appointment.nextStep === 'no_action'
    ) {
      reasons.push('Hot/warm lead needs next step');
    }
    if (
      appointment.appointmentDate < today &&
      appointment.status !== 'completed'
    ) {
      reasons.push('Past consultation still open');
    }
    if (appointment.consultationStage === 'follow_up_required') {
      reasons.push('Needs follow-up');
    }
    if (
      appointment.consultationStage === 'estimate_requested' &&
      getDaysSince(appointment.updatedAt) > 3
    ) {
      reasons.push('Estimate requested over 3 days ago');
    }
    if (
      appointment.consultationStage === 'contractor_review' &&
      getDaysSince(appointment.updatedAt) > 3
    ) {
      reasons.push('Contractor review over 3 days old');
    }
    if (!appointment.assignedRepId) reasons.push('Missing sales rep');
    return reasons;
  };
  const groupByRep = (appointments: Appointment[]) => {
    if (!isAdmin) {
      return [
        {
          id: currentUser.id,
          name: currentUser.name,
          appointments,
        },
      ];
    }

    const repIds = Array.from(
      new Set(appointments.map((appointment) => appointment.assignedRepId || ''))
    );

    return repIds.map((repId) => ({
      id: repId || 'unassigned',
      name: getRepName(repId),
      appointments: appointments.filter(
        (appointment) => (appointment.assignedRepId || '') === repId
      ),
    }));
  };

  const updateForm = <Field extends keyof AppointmentFormState>(
    field: Field,
    value: AppointmentFormState[Field]
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleLinkedDealChange = (dealId: string) => {
    const deal = getDeal(dealId);

    setForm((current) => ({
      ...current,
      dealId,
      ...(deal
        ? {
            assignedRepId: deal.assignedRepId || current.assignedRepId,
            contractorId:
              deal.assignedContractorId || current.contractorId || '',
            city: deal.city || current.city,
            customerName: deal.homeownerName || current.customerName,
            email: deal.email || current.email,
            phone: deal.phone || current.phone,
            projectType: deal.projectType || current.projectType,
          }
        : {}),
    }));
  };

  const openCreatePanel = () => {
    setIsCreating(true);
    setSelectedAppointmentId(null);
    setForm({
      ...emptyForm,
      appointmentDate: toDateKey(cursorDate),
      // Pre-assign to the current rep so they don't need to pick themselves
      assignedRepId: isAdmin ? '' : currentUser.id,
    });
  };

  const openAppointment = (appointment: Appointment) => {
    setIsCreating(false);
    setSelectedAppointmentId(appointment.id);
    setForm(appointmentToForm(appointment));
    setPanelTab('prep');
  };

  const closePanel = () => {
    setIsCreating(false);
    setSelectedAppointmentId(null);
    setForm(emptyForm);
    setShowTransferUI(false);
    setTransferToRepId('');
    setEmailEdits({});
    setEmailAttachments({});
    setEmailRecipientOverrides({});
    setEmailActionMessage('');
    setConflictWarning(null);
    conflictOverrideRef.current = false;
  };

  const saveAppointment = () => {
    if (!currentUser) return;
    if (!form.customerName.trim() || !form.appointmentDate) return;

    const payload = {
      address: form.address.trim(),
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      appointmentType: form.appointmentType,
      assignedRepId: form.assignedRepId || currentUser.id,
      contractorId: form.contractorId || null,
      city: form.city.trim(),
      postalCode: form.postalCode.trim(),
      consultationStage: form.consultationStage,
      closeProbability: Number(form.closeProbability) || 0,
      createdByUserId: selectedAppointment?.createdByUserId ?? currentUser.id,
      customerNotes: form.customerNotes.trim(),
      customerName: form.customerName.trim(),
      dealId: form.dealId,
      durationMinutes: Number(form.durationMinutes) || 60,
      email: form.email.trim(),
      estimatedProjectValue: Number(form.estimatedProjectValue) || 0,
      financingNeeded:
        form.financingNeeded === 'unknown'
          ? null
          : form.financingNeeded === 'yes',
      followUpDate: form.followUpDate,
      homeownerInterestLevel: form.homeownerInterestLevel || null,
      internalNotes: form.internalNotes.trim(),
      location: [form.address.trim(), form.city.trim()].filter(Boolean).join(', '),
      notes: form.internalNotes.trim(),
      nextStep: form.nextStep,
      objections: form.objections.trim(),
      outcomeNotes: form.outcomeNotes.trim(),
      outcomeSubmitted: form.outcomeSubmitted,
      phone: form.phone.trim(),
      projectType: form.projectType.trim(),
      recommendedContractorId: form.recommendedContractorId || null,
      reminderMinutes: Number(form.reminderMinutes) || 30,
      status: form.status,
    };

    // Conflict check: same rep, date, and time — skip current appointment when editing
    const conflictingApt = visibleAppointments.find((a) => {
      if (!isCreating && a.id === selectedAppointment?.id) return false;
      return (
        payload.appointmentDate &&
        payload.appointmentTime &&
        a.assignedRepId === payload.assignedRepId &&
        a.appointmentDate === payload.appointmentDate &&
        a.appointmentTime === payload.appointmentTime
      );
    });
    if (conflictingApt && !conflictOverrideRef.current) {
      setConflictWarning(conflictingApt);
      return;
    }
    setConflictWarning(null);
    conflictOverrideRef.current = false;

    if (isCreating) {
      addAppointment(payload, currentUser);
    } else if (selectedAppointment) {
      updateAppointment(selectedAppointment.id, payload, currentUser);
      if (form.status === 'completed' && !form.outcomeSubmitted) {
        setForm((current) => ({
          ...current,
          consultationStage: 'consultation_completed',
          status: 'completed',
        }));
        return;
      }
    }

    closePanel();
  };

  const handleDeleteAppointment = () => {
    if (!selectedAppointment) return;
    if (
      window.confirm(
        'Delete this consultation? This cannot be undone.'
      )
    ) {
      deleteAppointment(selectedAppointment.id, currentUser);
      closePanel();
    }
  };

  const handleTransfer = async () => {
    if (!selectedAppointment || !transferToRepId || transferring) return;
    setTransferring(true);
    const ok = await transferAppointment(selectedAppointment.id, transferToRepId);
    setTransferring(false);
    if (ok) {
      setShowTransferUI(false);
      setTransferToRepId('');
      closePanel();
    }
  };

  const navigate = useNavigate();
  const handleCreateDealFromAppointment = () => {
    if (!selectedAppointment) return;
    if (selectedAppointment.dealId) {
      // Already has a deal — navigate to it
      closePanel();
      navigate('/portal/deals', { state: { openDealId: selectedAppointment.dealId } });
      return;
    }
    createDealFromAppointment(selectedAppointment.id, currentUser);
    closePanel();
  };

  const handleSendReminder = (appointment: Appointment) => {
    if (!appointment.email) {
      setReminderMessage({ id: appointment.id, text: 'No email address on file for this client.' });
      return;
    }
    const preview = generateConsultationEmailPreview('booking_confirmation', {
      appointment,
      contractor: appointment.contractorId ? contractors.find((c) => c.id === appointment.contractorId) : undefined,
      deal: appointment.dealId ? getDeal(appointment.dealId) : undefined,
      rep: appointment.assignedRepId ? users.find((u) => u.id === appointment.assignedRepId) : undefined,
    });
    setReminderPreview({
      appointment,
      preview,
      subjectOverride: `Reminder: ${preview.subject}`,
    });
  };

  const handleConfirmSendReminder = async () => {
    if (!reminderPreview || reminderSending) return;
    const { appointment, preview, subjectOverride } = reminderPreview;
    setReminderSending(appointment.id);
    setReminderPreview(null);
    const result = await sendEmail(preview, { subjectOverride });
    setReminderSending(null);
    if (result.ok) {
      setReminderMessage({ id: appointment.id, text: `Reminder sent to ${appointment.email}` });
      logActivity({
        actionLabel: `Reminder sent to ${appointment.customerName || appointment.email}`,
        actionType: 'email_sent',
        entityId: appointment.id,
        entityLabel: appointment.customerName || appointment.title || 'Consultation',
        entityType: 'appointment',
        metadata: { recipient: appointment.email, templateType: 'booking_confirmation' },
      }, currentUser);
    } else {
      setReminderMessage({ id: appointment.id, text: 'error' in result ? `Failed: ${result.error}` : 'Failed to send reminder.' });
    }
  };

  const markConsultationStatus = (
    appointment: Appointment,
    status: AppointmentStatus
  ) => {
    updateAppointment(
      appointment.id,
      {
        status,
        ...(status === 'completed'
          ? { consultationStage: 'consultation_completed' as ConsultationStage }
          : {}),
      },
      currentUser
    );
    if (status === 'completed') {
      openAppointment({
        ...appointment,
        consultationStage: 'consultation_completed',
        status: 'completed',
      });
    }
  };

  const updateConsultationStage = (
    appointment: Appointment,
    consultationStage: ConsultationStage
  ) => {
    updateAppointment(appointment.id, { consultationStage }, currentUser);
  };

  const submitOutcomeReport = () => {
    if (!selectedAppointment) return;
    const now = new Date().toISOString();
    const estimatedProjectValue = Number(form.estimatedProjectValue) || 0;
    const financingNeeded =
      form.financingNeeded === 'unknown' ? null : form.financingNeeded === 'yes';

    updateAppointment(
      selectedAppointment.id,
      {
        closeProbability: Math.min(
          Math.max(Number(form.closeProbability) || 0, 0),
          100
        ),
        consultationStage:
          form.nextStep === 'won'
            ? 'won'
            : form.nextStep === 'lost'
              ? 'lost'
              : form.nextStep === 'contractor_review'
                ? 'contractor_review'
                : form.nextStep === 'follow_up_required'
                  ? 'follow_up_required'
                  : form.nextStep === 'estimate_required'
                    ? 'estimate_requested'
                    : form.consultationStage,
        estimatedProjectValue,
        financingNeeded,
        followUpDate: form.followUpDate,
        homeownerInterestLevel: form.homeownerInterestLevel || null,
        nextStep: form.nextStep,
        objections: form.objections.trim(),
        outcomeNotes: form.outcomeNotes.trim(),
        outcomeSubmitted: true,
        outcomeSubmittedAt:
          selectedAppointment.outcomeSubmittedAt || now,
        outcomeSubmittedByUserId:
          selectedAppointment.outcomeSubmittedByUserId || currentUser.id,
        recommendedContractorId: form.recommendedContractorId || null,
        status: 'completed',
      },
      currentUser
    );
    setForm((current) => ({
      ...current,
      consultationStage:
        form.nextStep === 'won'
          ? 'won'
          : form.nextStep === 'lost'
            ? 'lost'
            : form.nextStep === 'contractor_review'
              ? 'contractor_review'
              : form.nextStep === 'follow_up_required'
                ? 'follow_up_required'
                : form.nextStep === 'estimate_required'
                  ? 'estimate_requested'
                  : current.consultationStage,
      outcomeSubmitted: true,
      status: 'completed',
    }));
  };

  const openReschedule = (appointment: Appointment) => {
    markConsultationStatus(appointment, 'rescheduled');
    openAppointment({ ...appointment, status: 'rescheduled' });
  };

  const updateInternalNotesFromAgenda = (appointment: Appointment) => {
    const nextNotes = window.prompt(
      'Update internal notes',
      appointment.internalNotes || appointment.notes || ''
    );
    if (nextNotes === null) return;

    updateAppointment(
      appointment.id,
      {
        internalNotes: nextNotes.trim(),
        notes: nextNotes.trim(),
      },
      currentUser
    );
  };

  const logEmailPreviewActivity = (
    preview: ConsultationEmailPreview,
    actionType: 'email_client_opened' | 'email_preview_copied',
    actionLabel: string
  ) => {
    if (!selectedAppointment) return;

    logActivity(
      {
        actionLabel,
        actionType,
        contractorId: selectedAppointment.contractorId || undefined,
        dealId: selectedAppointment.dealId || undefined,
        entityId: selectedAppointment.id,
        entityLabel:
          selectedAppointment.customerName ||
          selectedAppointment.title ||
          preview.metadata.templateLabel,
        entityType: 'appointment',
        metadata: {
          recipient: preview.metadata.recipientEmail || null,
          templateType: preview.type,
        },
      },
      currentUser
    );
  };

  const copyEmailText = async (
    preview: ConsultationEmailPreview,
    mode: 'body' | 'full' | 'subject'
  ) => {
    const text =
      mode === 'subject'
        ? preview.subject
        : mode === 'body'
          ? preview.body
          : `Subject: ${preview.subject}\n\n${preview.body}`;

    await navigator.clipboard.writeText(text);
    setEmailActionMessage(`${preview.metadata.templateLabel} ${mode} copied.`);
    logEmailPreviewActivity(
      preview,
      'email_preview_copied',
      `${currentUser.name} copied ${preview.metadata.templateLabel} ${mode}`
    );
  };

  const openEmailClient = (preview: ConsultationEmailPreview) => {
    const recipOverride = emailRecipientOverrides[preview.type];
    const effectiveTo = recipOverride?.to?.trim() || preview.metadata.recipientEmail;
    if (!effectiveTo) return;

    const edits = emailEdits[preview.type];
    const subject = edits?.subject ?? preview.subject;
    const body = edits?.body ?? preview.body;
    const cc = recipOverride?.cc?.trim();
    const params = new URLSearchParams();
    params.set('subject', subject);
    params.set('body', body);
    if (cc) params.set('cc', cc);
    const mailto = `mailto:${encodeURIComponent(effectiveTo)}?${params.toString()}`;
    window.location.href = mailto;
    setEmailActionMessage(`${preview.metadata.templateLabel} opened in email client.`);
    logEmailPreviewActivity(
      preview,
      'email_client_opened',
      `${currentUser.name} opened email client for ${preview.metadata.templateLabel}`
    );
  };

  // Encode a File to base64 for transmission
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSendEmail = async (preview: ConsultationEmailPreview) => {
    if (!selectedAppointment || sendingEmailType) return;

    setSendingEmailType(preview.type);
    setEmailActionMessage('');

    // Build options: apply any subject/body overrides and encode attachments
    const edits = emailEdits[preview.type];
    const files = emailAttachments[preview.type] ?? [];
    let encodedAttachments: EmailAttachment[] | undefined;
    if (files.length > 0) {
      try {
        encodedAttachments = await Promise.all(
          files.map(async (f) => ({ filename: f.name, content: await fileToBase64(f) }))
        );
      } catch {
        setSendingEmailType(null);
        setEmailActionMessage('Failed to read attachment files. Please try again.');
        return;
      }
    }

    const recipOverride = emailRecipientOverrides[preview.type];
    const effectiveTo = recipOverride?.to?.trim() || preview.metadata.recipientEmail;
    const result = await sendEmail(preview, {
      subjectOverride: edits?.subject,
      bodyOverride: edits?.body,
      attachments: encodedAttachments,
      toOverride: recipOverride?.to?.trim() || undefined,
      ccOverride: recipOverride?.cc?.trim() || undefined,
    });

    setSendingEmailType(null);

    if (result.ok) {
      setEmailActionMessage(`${preview.metadata.templateLabel} sent to ${effectiveTo}.`);
      logActivity(
        {
          actionLabel: `Email sent: ${preview.metadata.templateLabel} to ${preview.metadata.recipientLabel}`,
          actionType: 'email_sent',
          contractorId: selectedAppointment.contractorId || undefined,
          dealId: selectedAppointment.dealId || undefined,
          entityId: selectedAppointment.id,
          entityLabel:
            selectedAppointment.customerName ||
            selectedAppointment.title ||
            preview.metadata.templateLabel,
          entityType: 'appointment',
          metadata: {
            recipient: preview.metadata.recipientEmail || null,
            templateType: preview.type,
          },
        },
        currentUser
      );
    } else if ('error' in result) {
      setEmailActionMessage(`Failed to send ${preview.metadata.templateLabel}: ${result.error}`);
    }
  };

  const openDispatchPanel = () => {
    if (!selectedAppointment || !selectedAppointment.dealId) return;
    const deal = getDeal(selectedAppointment.dealId);
    const estimatedValue =
      selectedAppointment.estimatedProjectValue || deal?.estimatedJobValue || 0;
    const financingRequired =
      selectedAppointment.financingNeeded ?? deal?.financingRequired ?? false;
    const recommendedId =
      selectedAppointment.recommendedContractorId ||
      selectedAppointment.contractorId ||
      deal?.assignedContractorId ||
      '';

    setDispatchForm({
      contractorIds: recommendedId ? [recommendedId] : [],
      desiredTimeline: selectedAppointment.followUpDate
        ? `Follow up around ${selectedAppointment.followUpDate}`
        : '',
      estimatedProjectRange: getValueRange(estimatedValue),
      financingRequired,
      safeSummary:
        selectedAppointment.outcomeNotes ||
        selectedAppointment.customerNotes ||
        `${selectedAppointment.projectType || deal?.projectType || 'Renovation'} opportunity in ${
          selectedAppointment.city || deal?.city || 'Ontario'
        }.`,
    });
    setDispatchActionMessage('');
    setIsDispatchPanelOpen(true);
  };

  const toggleDispatchContractor = (contractorId: string) => {
    setDispatchForm((current) => ({
      ...current,
      contractorIds: current.contractorIds.includes(contractorId)
        ? current.contractorIds.filter((id) => id !== contractorId)
        : [...current.contractorIds, contractorId],
    }));
  };

  const copyDispatchMessage = async () => {
    await navigator.clipboard.writeText(dispatchPreviewMessage);
    setDispatchActionMessage('Dispatch message copied.');
  };

  const openDispatchEmailClient = () => {
    if (selectedDispatchContractors.length !== 1) return;
    const contractor = selectedDispatchContractors[0];
    if (!contractor.email) return;

    window.location.href = `mailto:${encodeURIComponent(
      contractor.email
    )}?subject=${encodeURIComponent(
      `OntarioReno Opportunity - ${
        selectedAppointment?.projectType || selectedDispatchDeal?.projectType || 'Renovation'
      } in ${selectedAppointment?.city || selectedDispatchDeal?.city || 'Ontario'}`
    )}&body=${encodeURIComponent(dispatchPreviewMessage)}`;
    setDispatchActionMessage(`Email client opened for ${contractor.companyName}.`);
  };

  const markDispatchesSent = () => {
    if (!selectedAppointment?.dealId || dispatchForm.contractorIds.length === 0) {
      setDispatchActionMessage('Select at least one contractor first.');
      return;
    }

    dispatchForm.contractorIds.forEach((contractorId) => {
      addContractorDispatch(
        {
          consultationId: selectedAppointment.id,
          contractorId,
          contractorResponseNote: '',
          dealId: selectedAppointment.dealId,
          estimatedProjectRange: dispatchForm.estimatedProjectRange,
          financingRequired: dispatchForm.financingRequired,
          safeSummary: dispatchForm.safeSummary,
          sentAt: new Date().toISOString(),
          sentByUserId: currentUser.id,
          status: 'sent',
        },
        currentUser
      );
    });
    setDispatchActionMessage('Dispatch marked as sent.');
    setIsDispatchPanelOpen(false);
  };

  const updateDispatchStatus = (
    dispatch: ContractorDispatch,
    status: ContractorDispatchStatus
  ) => {
    if (
      status === 'accepted' &&
      window.confirm('Assign this contractor to the opportunity now?')
    ) {
      assignDispatchContractor(dispatch.id, currentUser);
      return;
    }

    updateContractorDispatch(dispatch.id, { status }, currentUser);
  };

  const updateDispatchResponseNote = (dispatch: ContractorDispatch) => {
    const nextNote = window.prompt(
      'Contractor response note',
      dispatch.contractorResponseNote
    );
    if (nextNote === null) return;

    updateContractorDispatch(
      dispatch.id,
      { contractorResponseNote: nextNote.trim() },
      currentUser
    );
  };

  const moveCalendar = (direction: -1 | 1) => {
    setCursorDate((current) => {
      const next = new Date(current);
      if (calendarView === 'month') next.setMonth(current.getMonth() + direction);
      else if (calendarView === 'week') next.setDate(current.getDate() + direction * 7);
      else next.setDate(current.getDate() + direction);
      return next;
    });
  };

  const metrics = [
    { detail: 'Scheduled for today', label: "Today's Consultations", value: todayAppointments.length },
    { detail: 'Scheduled, confirmed, or rescheduled', label: 'Upcoming Consultations', value: upcomingAppointments.length },
    { detail: 'Consultations completed', label: 'Completed Consultations', value: completedAppointments.length },
    {
      detail: 'Performance prep',
      label: 'No-Shows',
      value: visibleAppointments.filter((appointment) => appointment.status === 'no_show').length,
    },
  ];

  const renderAgendaCard = (
    appointment: Appointment,
    options: { attention?: boolean } = {}
  ) => {
    const deal = getDeal(appointment.dealId);
    const statusClasses = getStatusClasses(appointment.status);
    const stageDot = getStageDotColor(appointment.consultationStage, appointment.status);
    const outcomeBadge = getOutcomeBadge(appointment);
    const attentionReasons = getAttentionReasons(appointment);
    const canUseRepActions =
      currentUser.role === 'admin' || appointment.assignedRepId === currentUser.id;
    const isRowExpanded = expandedAgendaRows.has(appointment.id);
    const toggleRow = () =>
      setExpandedAgendaRows((prev) => {
        const next = new Set(prev);
        if (next.has(appointment.id)) next.delete(appointment.id);
        else next.add(appointment.id);
        return next;
      });

    return (
      <div
        key={appointment.id}
        className={`rounded-[0.5rem] border bg-white shadow-sm ${
          options.attention ? 'border-amber-200' : 'border-slate-200'
        }`}
      >
        {/* ── Compact summary row (always visible) ── */}
        <button
          type="button"
          onClick={toggleRow}
          className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50/80 rounded-[0.5rem]"
        >
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${stageDot}`} />
          <span className="w-[4.5rem] shrink-0 text-sm font-black tabular-nums text-[#32639b]">
            {fmt12(appointment.appointmentTime)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">
            {appointment.customerName || appointment.title || 'Consultation'}
          </span>
          <span className="hidden shrink-0 text-xs font-semibold text-slate-500 sm:block">
            {appointment.projectType || deal?.projectType || ''}
            {(appointment.projectType || deal?.projectType) && (appointment.city || deal?.city) ? ' / ' : ''}
            {appointment.city || deal?.city || ''}
          </span>
          {isAdmin && (
            <span className="hidden shrink-0 text-xs font-semibold text-slate-400 lg:block">
              {getRepName(appointment.assignedRepId)}
            </span>
          )}
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.62rem] font-black ${statusClasses.badge}`}>
            {formatAppointmentStatus(appointment.status)}
          </span>
          {outcomeBadge && (
            <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[0.62rem] font-black sm:block ${outcomeBadge.className}`}>
              {outcomeBadge.label}
            </span>
          )}
          {options.attention && attentionReasons.length > 0 && (
            <span className="hidden shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.62rem] font-black text-amber-800 sm:block">
              {attentionReasons[0]}
            </span>
          )}
          <span className="flex items-center gap-1 text-[0.68rem] font-bold text-slate-400 shrink-0">
            {isRowExpanded ? 'Collapse' : 'Expand'}
            <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-150 ${isRowExpanded ? 'rotate-90' : ''}`} />
          </span>
        </button>

        {/* ── Expanded detail panel ── */}
        {isRowExpanded && (
          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
            {/* Rep / Contractor */}
            <div className="mb-3 grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-2">
              <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2">
                Rep: {getRepName(appointment.assignedRepId)}
              </div>
              <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2">
                Contractor: {getContractorName(appointment.contractorId)}
              </div>
            </div>
            {/* Attention reasons */}
            {options.attention && attentionReasons.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {attentionReasons.map((r) => (
                  <span key={r} className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.62rem] font-black text-amber-800">{r}</span>
                ))}
              </div>
            )}
            {/* Notes */}
            <div className="mb-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                  Internal — Not visible to customer
                </p>
                <p className="mt-1.5 text-sm font-semibold text-slate-700">
                  {getPreview(appointment.internalNotes || appointment.notes || '', 'No internal prep notes yet.')}
                </p>
              </div>
              <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Customer Notes</p>
                <p className="mt-1.5 text-sm font-semibold text-slate-700">
                  {getPreview(appointment.customerNotes || '', 'No customer-facing notes.')}
                </p>
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => openAppointment(appointment)}
                className="rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
              >
                Open Details
              </button>
              {/* Send Reminder */}
              <button
                type="button"
                onClick={() => handleSendReminder(appointment)}
                disabled={reminderSending === appointment.id}
                className="rounded-[0.5rem] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
              >
                {reminderSending === appointment.id ? 'Sending…' : 'Send Reminder'}
              </button>
              {reminderMessage?.id === appointment.id && (
                <span className={`text-xs font-semibold ${reminderMessage.text.startsWith('Reminder sent') ? 'text-emerald-600' : 'text-red-500'}`}>
                  {reminderMessage.text}
                </span>
              )}
              {!appointment.dealId ? (
                <button
                  type="button"
                  onClick={() => createDealFromAppointment(appointment.id, currentUser)}
                  className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                >
                  Create Deal
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/portal/deals', { state: { openDealId: appointment.dealId } })}
                  className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                >
                  View Deal
                </button>
              )}
              {(isAdmin || canUseRepActions) && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenAgendaMenu((prev) => prev === appointment.id ? null : appointment.id)}
                    className="flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    More <ChevronDown className="h-3 w-3" />
                  </button>
                  {openAgendaMenu === appointment.id && (
                    <div
                      className="absolute left-0 top-full z-50 mt-1.5 min-w-[13rem] rounded-[0.5rem] border border-slate-200 bg-white shadow-xl"
                      onMouseLeave={() => setOpenAgendaMenu(null)}
                    >
                      {isAdmin && (
                        <button type="button" onClick={() => { openAppointment(appointment); setOpenAgendaMenu(null); }}
                          className="flex w-full items-center gap-2 rounded-t-[0.5rem] px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                          Edit Consultation
                        </button>
                      )}
                      {isAdmin && !['completed', 'no_show'].includes(appointment.status) && (
                        <button type="button" onClick={() => { markConsultationStatus(appointment, 'confirmed'); setOpenAgendaMenu(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-50">
                          Mark Confirmed
                        </button>
                      )}
                      {canUseRepActions && !['completed', 'no_show'].includes(appointment.status) && (
                        <button type="button" onClick={() => { markConsultationStatus(appointment, 'completed'); setOpenAgendaMenu(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50">
                          Mark Completed
                        </button>
                      )}
                      {canUseRepActions && !['completed', 'no_show'].includes(appointment.status) && (
                        <button type="button" onClick={() => { markConsultationStatus(appointment, 'no_show'); setOpenAgendaMenu(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold text-orange-700 transition hover:bg-orange-50">
                          Mark No-show
                        </button>
                      )}
                      {['completed', 'no_show'].includes(appointment.status) && (
                        <div className="px-4 py-2.5 text-xs font-semibold text-slate-400">
                          {appointment.status === 'completed' ? '✓ Completed' : '✗ No-show'} — no status changes
                        </div>
                      )}
                      {canUseRepActions && (
                        <button type="button" onClick={() => { updateInternalNotesFromAgenda(appointment); setOpenAgendaMenu(null); }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-50">
                          Update Internal Notes
                        </button>
                      )}
                      {isAdmin && (
                        <button type="button" onClick={() => { openReschedule(appointment); setOpenAgendaMenu(null); }}
                          className="flex w-full items-center gap-2 rounded-b-[0.5rem] px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                          Reschedule
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroupedAgenda = (
    appointments: Appointment[],
    emptyMessage: string,
    options: { attention?: boolean } = {}
  ) => {
    if (appointments.length === 0) {
      return (
        <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
          {emptyMessage}
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {groupByRep(appointments).map((group) => (
          <div key={group.id} className="space-y-3">
            {isAdmin && (
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                {group.name}
              </p>
            )}
            {group.appointments.map((appointment) =>
              renderAgendaCard(appointment, options)
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDayColumn = (date: Date, compact = false) => {
    const dateKey = toDateKey(date);
    const appointments = calendarAppointments.filter(
      (appointment) => appointment.appointmentDate === dateKey
    );
    const isOutsideMonth = date.getMonth() !== cursorDate.getMonth();
    const repsOffToday = daysOff
      .filter((d) => d.date === dateKey)
      .map((d) => users.find((u) => u.id === d.userId))
      .filter(Boolean) as typeof users;

    const openNewForDate = () => {
      setSelectedAppointmentId(null);
      setIsCreating(true);
      setForm({ ...emptyForm, appointmentDate: dateKey, assignedRepId: currentUser?.id ?? '' });
      setPanelTab('prep');
    };

    return (
      <article
        key={dateKey}
        onClick={openNewForDate}
        className={`cursor-pointer rounded-[0.5rem] border border-slate-200 bg-white transition hover:border-[#b8c9dd] hover:bg-[#f6faff] ${
          compact ? 'min-h-20 p-2' : 'min-h-32 p-3'
        } ${
          isOutsideMonth && calendarView === 'month' ? 'opacity-55' : ''
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
            {new Intl.DateTimeFormat('en-CA', {
              day: 'numeric',
              weekday: compact ? 'short' : 'long',
            }).format(date)}
          </p>
          <div className="flex items-center gap-1">
            {dateKey === today && (
              <span className="rounded-full bg-[#e8f1fb] px-2 py-1 text-[0.65rem] font-black text-[#1B3C6C]">
                Today
              </span>
            )}
            {repsOffToday.length > 0 && (
              <div className="flex items-center gap-0.5" title={repsOffToday.map((r) => `${r.name} — off`).join(', ')}>
                {repsOffToday.slice(0, 3).map((rep) => (
                  <span
                    key={rep.id}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[0.55rem] font-black text-red-700"
                  >
                    {rep.avatarInitial}
                  </span>
                ))}
                {repsOffToday.length > 3 && (
                  <span className="text-[0.55rem] font-bold text-red-500">+{repsOffToday.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className={`${compact ? 'mt-2 space-y-2.5' : 'mt-3 space-y-3'}`}>
          {appointments.slice(0, compact ? 3 : 6).map((appointment) => (
            <span key={appointment.id} onClick={(e) => e.stopPropagation()}>
              <AppointmentPill
                appointment={appointment}
                contractorName={
                  appointment.contractorId
                    ? getContractorName(appointment.contractorId)
                    : ''
                }
                projectType={getAppointmentProjectType(appointment)}
                repName={getRepName(appointment.assignedRepId)}
                onClick={() => openAppointment(appointment)}
              />
            </span>
          ))}
          {appointments.length === 0 && !compact && (
            <p className="rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-400">
              + New consultation
            </p>
          )}
          {!compact && appointments.length > 6 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCursorDate(date);
                setCalendarView('day');
              }}
              className="text-xs font-bold text-[#1B3C6C] hover:underline"
            >
              +{appointments.length - 6} more
            </button>
          )}
          {compact && appointments.length > 3 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCursorDate(date);
                setCalendarView('day');
              }}
              className="text-xs font-bold text-[#1B3C6C] hover:underline"
            >
              +{appointments.length - 3} more
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-5">
      {/* Notes full-preview modal */}
      {notesModal !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setNotesModal(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-[0.75rem] border border-amber-200 bg-amber-50 p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
              Internal Notes — Not visible to customer
            </p>
            <button
              className="absolute right-4 top-4 text-amber-600 hover:text-amber-900"
              onClick={() => setNotesModal(null)}
            >
              <X className="h-5 w-5" />
            </button>
            <p className="mt-3 whitespace-pre-wrap text-sm font-semibold text-slate-800 max-h-[60vh] overflow-y-auto">
              {notesModal}
            </p>
          </div>
        </div>
      )}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Consultation Center
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
            OntarioReno consultation board
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              setDaysOffRepFilter(isAdmin ? 'all' : (currentUser?.id ?? ''));
              setDaysOffFromDate('');
              setDaysOffToDate('');
              setDaysOffNote('');
              setDaysOffError('');
              setDaysOffPanelOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Days Off
          </button>
          <button
            type="button"
            onClick={openCreatePanel}
            className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#153158]"
          >
            <Plus className="h-4 w-4" />
            + Schedule Consultation
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">{metric.label}</p>
            <p className="mt-3 text-3xl font-black tracking-[-0.02em]">
              {metric.value}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      {/* ── Mobile section tab bar ─────────────────────────────── */}
      <div className="lg:hidden">
        <nav className="sticky top-20 z-20 -mx-4 border-b border-slate-100 bg-white/96 px-4 backdrop-blur-sm">
          <div className="flex overflow-x-auto [scrollbar-width:none]">
            {(
              [
                { key: 'today' as const, label: 'Today', count: todayAppointments.length },
                { key: 'upcoming' as const, label: 'Upcoming', count: upcomingAppointments.length },
                { key: 'attention' as const, label: 'Attention', count: needsAttentionAppointments.length, warn: needsAttentionAppointments.length > 0 },
                { key: 'calendar' as const, label: 'Calendar', count: 0 },
                { key: 'all' as const, label: 'All', count: visibleAppointments.length },
              ]
            ).map((tab) => {
              const isActive = mobileConsultTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMobileConsultTab(tab.key)}
                  className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-black transition ${
                    isActive
                      ? 'border-[#1B3C6C] text-[#1B3C6C]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      className={`flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[0.58rem] font-black ${
                        tab.warn
                          ? isActive
                            ? 'bg-amber-500 text-white'
                            : 'bg-amber-100 text-amber-700'
                          : isActive
                          ? 'bg-[#1B3C6C] text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tab.count > 99 ? '99+' : tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Mobile tab content */}
        <div className="mt-4 space-y-3">
          {/* Today */}
          {mobileConsultTab === 'today' && (
            <>
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt) => {
                  const sc = getStatusClasses(apt.status);
                  const ob = getOutcomeBadge(apt);
                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => openAppointment(apt)}
                      className={`w-full rounded-xl border px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] ${sc.card}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sc.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[0.88rem] font-black leading-tight text-slate-900">
                              {apt.customerName || apt.title || 'Consultation'}
                            </p>
                            <p className="mt-px shrink-0 text-xs font-bold tabular-nums leading-tight text-slate-500">
                              {fmt12(apt.appointmentTime)}
                            </p>
                          </div>
                          <p className="mt-1 text-[0.75rem] font-semibold text-slate-600">
                            {getAppointmentProjectType(apt) || 'Project TBD'} · {apt.city || 'City TBD'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${sc.badge}`}>
                              {formatAppointmentStatus(apt.status)}
                            </span>
                            <span className="text-[0.68rem] font-semibold text-[#32639b]">
                              {formatConsultationStage(apt.consultationStage)}
                            </span>
                            {ob && (
                              <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black ${ob.className}`}>
                                {ob.label}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[0.68rem] text-slate-400">
                            {getRepName(apt.assignedRepId)}
                            {apt.contractorId ? ` · ${getContractorName(apt.contractorId)}` : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-10">
                  <CalendarDays className="h-9 w-9 text-slate-200" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No consultations today</p>
                  <button
                    type="button"
                    onClick={openCreatePanel}
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1B3C6C] px-4 py-2 text-xs font-black text-white shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Schedule Consultation
                  </button>
                </div>
              )}
            </>
          )}

          {/* Upcoming */}
          {mobileConsultTab === 'upcoming' && (
            <>
              {upcomingAgendaAppointments.length > 0 ? (
                (() => {
                  const groups = upcomingAgendaAppointments.reduce<Record<string, typeof upcomingAgendaAppointments>>((acc, apt) => {
                    (acc[apt.appointmentDate] ??= []).push(apt);
                    return acc;
                  }, {});
                  return Object.entries(groups).map(([date, apts]) => (
                    <div key={date}>
                      <p className="mb-2 text-[0.7rem] font-black uppercase tracking-[0.14em] text-slate-500">
                        {new Intl.DateTimeFormat('en-CA', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date(`${date}T00:00:00`))}
                      </p>
                      <div className="space-y-2">
                        {apts.map((apt) => {
                          const sc = getStatusClasses(apt.status);
                          return (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={() => openAppointment(apt)}
                              className={`w-full rounded-xl border px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] ${sc.card}`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sc.dot}`} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="truncate text-[0.88rem] font-black leading-tight text-slate-900">
                                      {apt.customerName || apt.title || 'Consultation'}
                                    </p>
                                    <p className="mt-px shrink-0 text-xs font-bold tabular-nums text-slate-500">
                                      {fmt12(apt.appointmentTime)}
                                    </p>
                                  </div>
                                  <p className="mt-1 text-[0.75rem] font-semibold text-slate-600">
                                    {getAppointmentProjectType(apt) || 'Project TBD'} · {apt.city || 'City TBD'}
                                  </p>
                                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${sc.badge}`}>
                                      {formatAppointmentStatus(apt.status)}
                                    </span>
                                    <span className="text-[0.68rem] font-semibold text-[#32639b]">
                                      {formatConsultationStage(apt.consultationStage)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()
              ) : (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-10">
                  <CalendarDays className="h-9 w-9 text-slate-200" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No upcoming consultations</p>
                </div>
              )}
            </>
          )}

          {/* Attention */}
          {mobileConsultTab === 'attention' && (
            <>
              {needsAttentionAppointments.length > 0 ? (
                needsAttentionAppointments.map((apt) => {
                  const sc = getStatusClasses(apt.status);
                  const reasons = getAttentionReasons(apt);
                  const ob = getOutcomeBadge(apt);
                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => openAppointment(apt)}
                      className="w-full rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sc.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[0.88rem] font-black leading-tight text-slate-900">
                              {apt.customerName || apt.title || 'Consultation'}
                            </p>
                            <p className="mt-px shrink-0 text-xs font-bold tabular-nums text-slate-500">
                              {apt.appointmentDate}
                            </p>
                          </div>
                          <p className="mt-1 text-[0.75rem] font-semibold text-slate-600">
                            {getAppointmentProjectType(apt) || 'Project TBD'}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ob && (
                              <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black ${ob.className}`}>
                                {ob.label}
                              </span>
                            )}
                            {reasons.map((r) => (
                              <span key={r} className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.62rem] font-black text-amber-800">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 py-10">
                  <CalendarDays className="h-9 w-9 text-emerald-200" />
                  <p className="mt-3 text-sm font-bold text-emerald-600">All clear — nothing needs attention</p>
                </div>
              )}
            </>
          )}

          {/* Calendar — reuse mobile mini calendar */}
          {mobileConsultTab === 'calendar' && (
            <div>
              {/* Month navigation */}
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCursorDate((d) => { const n = new Date(d); n.setMonth(d.getMonth() - 1); return n; })}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#32639b]">Consultations</p>
                  <p className="text-base font-black tracking-tight text-slate-900">{monthLabel}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCursorDate(new Date())}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-[0.68rem] font-black text-slate-600 transition hover:bg-slate-50"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setCursorDate((d) => { const n = new Date(d); n.setMonth(d.getMonth() + 1); return n; })}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Day-of-week headers */}
              <div className="mb-1 grid grid-cols-7">
                {['S','M','T','W','T','F','S'].map((l, i) => (
                  <div key={i} className="text-center text-[0.6rem] font-black uppercase tracking-wider text-slate-400">{l}</div>
                ))}
              </div>
              {/* Day grid */}
              <div className="grid grid-cols-7">
                {monthDays.map((date) => {
                  const dateKey = toDateKey(date);
                  const isThisMonth = date.getMonth() === cursorDate.getMonth();
                  const isToday = dateKey === today;
                  const isSelected = dateKey === toDateKey(cursorDate);
                  const dayApts = calendarAppointments.filter((a) => a.appointmentDate === dateKey);
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setCursorDate(new Date(date.getFullYear(), date.getMonth(), date.getDate()))}
                      className="flex flex-col items-center py-1 transition"
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                        isSelected ? 'bg-[#1B3C6C] text-white shadow-sm'
                        : isToday ? 'border-2 border-[#1B3C6C] font-black text-[#1B3C6C]'
                        : isThisMonth ? 'text-slate-800 hover:bg-slate-100'
                        : 'text-slate-300'
                      }`}>
                        {date.getDate()}
                      </span>
                      <div className="mt-0.5 flex h-2 items-center justify-center gap-px">
                        {dayApts.slice(0, 3).map((apt, idx) => (
                          <span key={idx} className={`h-1.5 w-1.5 rounded-full ${getMobileDotColor(apt.status, apt.consultationStage)}`} />
                        ))}
                        {dayApts.length > 3 && <span className="h-1 w-1 rounded-full bg-slate-300" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              {/* Selected day */}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black tracking-tight text-slate-900">
                    {new Intl.DateTimeFormat('en-CA', { weekday: 'long', month: 'long', day: 'numeric' }).format(cursorDate)}
                  </p>
                  {currentDayAppointments.length > 0 && (
                    <span className="rounded-full bg-[#e8f1fb] px-2.5 py-1 text-xs font-black text-[#1B3C6C]">
                      {currentDayAppointments.length}
                    </span>
                  )}
                </div>
                {currentDayAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {currentDayAppointments.map((apt) => {
                      const sc = getStatusClasses(apt.status);
                      return (
                        <button
                          key={apt.id}
                          type="button"
                          onClick={() => openAppointment(apt)}
                          className={`w-full rounded-xl border px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] ${sc.card}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${sc.dot}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <p className="truncate text-[0.88rem] font-black leading-tight text-slate-900">
                                  {apt.customerName || apt.title || 'Consultation'}
                                </p>
                                <p className="mt-px shrink-0 text-xs font-bold tabular-nums text-slate-500">
                                  {fmt12(apt.appointmentTime)}
                                </p>
                              </div>
                              <p className="mt-1 text-[0.75rem] font-semibold text-slate-600">
                                {getAppointmentProjectType(apt) || 'Project type TBD'}
                              </p>
                              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${sc.badge}`}>
                                  {getStatusLabel(apt.status)}
                                </span>
                                <span className="text-[0.68rem] font-semibold text-slate-400">{getRepName(apt.assignedRepId)}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-8">
                    <CalendarDays className="h-9 w-9 text-slate-200" />
                    <p className="mt-2.5 text-sm font-bold text-slate-400">No consultations</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {toDateKey(cursorDate) === today ? 'Nothing scheduled for today.' : 'Nothing scheduled for this day.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All */}
          {mobileConsultTab === 'all' && (
            <>
              {/* Inline filter chips */}
              <div className="flex flex-wrap gap-2 pb-1">
                {consultationFilters.map((filter) => (
                  <button
                    key={filter.value}
                    type="button"
                    onClick={() => setConsultationFilter(filter.value)}
                    className={
                      consultationFilter === filter.value
                        ? 'rounded-full bg-[#1B3C6C] px-3 py-1.5 text-xs font-black text-white'
                        : 'rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600'
                    }
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              {filteredAppointments.length > 0 ? (
                filteredAppointments.slice(0, 30).map((apt) => {
                  const sc = getStatusClasses(apt.status);
                  const ob = getOutcomeBadge(apt);
                  return (
                    <button
                      key={apt.id}
                      type="button"
                      onClick={() => openAppointment(apt)}
                      className={`w-full rounded-xl border px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] ${sc.card}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${sc.dot}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[0.88rem] font-black leading-tight text-slate-900">
                              {apt.customerName || apt.title || 'Consultation'}
                            </p>
                            <p className="mt-px shrink-0 text-xs font-bold tabular-nums text-slate-500">
                              {apt.appointmentDate}
                            </p>
                          </div>
                          <p className="mt-1 text-[0.75rem] font-semibold text-slate-600">
                            {getAppointmentProjectType(apt) || 'Project TBD'} · {apt.city || 'City TBD'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${sc.badge}`}>
                              {formatAppointmentStatus(apt.status)}
                            </span>
                            <span className="text-[0.68rem] font-semibold text-[#32639b]">
                              {formatConsultationStage(apt.consultationStage)}
                            </span>
                            {ob && (
                              <span className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black ${ob.className}`}>
                                {ob.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-10">
                  <CalendarDays className="h-9 w-9 text-slate-200" />
                  <p className="mt-3 text-sm font-bold text-slate-400">No consultations match this filter</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* ── End mobile section nav ──────────────────────────────── */}

      {/* Desktop: Consultation Filters */}
      <section className="hidden rounded-[0.5rem] border border-white bg-white p-4 shadow-sm lg:block lg:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Consultation Filters
            </p>
            <h2 className="mt-2 text-xl font-black tracking-[-0.02em]">
              Lifecycle view
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {consultationFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setConsultationFilter(filter.value)}
                className={
                  consultationFilter === filter.value
                    ? 'rounded-full bg-[#1B3C6C] px-3 py-2 text-xs font-black text-white'
                    : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:text-[#1B3C6C]'
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Desktop: Today's Agenda */}
      <section className="hidden rounded-[0.5rem] border border-white bg-white p-4 shadow-sm lg:block lg:p-5">
        <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Rep Agenda
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Today's Agenda
            </h2>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {isAdmin ? 'All reps' : currentUser.name} / {todayAppointments.length}{' '}
            scheduled today
          </p>
        </div>
        <div className="mt-4">
          {renderGroupedAgenda(
            todayAppointments,
            'No consultations on the agenda for today.'
          )}
        </div>
      </section>

      {/* Desktop: Upcoming & Dispatch Gaps — collapsed list */}
      <section className="hidden rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5 lg:block">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Upcoming Consultations
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Upcoming &amp; Dispatch Gaps
            </h2>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3 pb-0.5">
            <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Good
            </span>
            <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-slate-500">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Needs attention
            </span>
          </div>
        </div>
        <div className="mt-2">
          {upcomingCombined.length === 0 ? (
            <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
              No upcoming consultations or dispatch gaps.
            </p>
          ) : (
            <div>
              {groupByRep(upcomingCombined).map((group) => {
                const isGroupCollapsed = collapsedRepGroups.has(group.id);
                const groupHasAttention = group.appointments.some((a) => needsAttentionIds.has(a.id));
                return (
                  <div key={group.id} className="border-b border-slate-100 last:border-b-0">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsedRepGroups((prev) => {
                            const next = new Set(prev);
                            if (next.has(group.id)) next.delete(group.id);
                            else next.add(group.id);
                            return next;
                          })
                        }
                        className="flex w-full items-center gap-2 px-2 py-2.5 text-left transition hover:bg-slate-50"
                      >
                        <ChevronRight
                          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-150 ${isGroupCollapsed ? '' : 'rotate-90'}`}
                        />
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                          {group.name}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black text-slate-500">
                          {group.appointments.length}
                        </span>
                        {groupHasAttention && (
                          <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />
                        )}
                      </button>
                    )}
                    {!isGroupCollapsed && (
                      <div className={isAdmin ? 'ml-5' : ''}>
                        {group.appointments.map((apt) => {
                          const isRowExpanded = expandedUpcomingRows.has(apt.id);
                          const isAttention = needsAttentionIds.has(apt.id);
                          const dotColor = isAttention ? 'bg-red-500' : 'bg-emerald-500';
                          const sc = getStatusClasses(apt.status);
                          const canUseRepActions =
                            currentUser.role === 'admin' || apt.assignedRepId === currentUser.id;
                          const attentionReasons = getAttentionReasons(apt);
                          return (
                            <div key={apt.id} className="border-b border-slate-100 last:border-b-0">
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedUpcomingRows((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(apt.id)) next.delete(apt.id);
                                    else next.add(apt.id);
                                    return next;
                                  })
                                }
                                className="flex w-full items-center gap-3 px-2 py-2.5 text-left transition hover:bg-slate-50/80"
                              >
                                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
                                <span className="w-[8rem] shrink-0 text-[0.72rem] font-bold tabular-nums text-slate-500">
                                  {apt.appointmentDate}
                                  {apt.appointmentTime ? ` · ${fmt12(apt.appointmentTime)}` : ''}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">
                                  {apt.customerName || apt.title || 'Consultation'}
                                </span>
                                {isAdmin && (
                                  <span className="shrink-0 text-xs font-semibold text-slate-400">
                                    {getRepName(apt.assignedRepId)}
                                  </span>
                                )}
                                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.62rem] font-black ${sc.badge}`}>
                                  {formatAppointmentStatus(apt.status)}
                                </span>
                                {isAttention && (
                                  <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[0.62rem] font-black text-red-700">
                                    Attention
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-[0.68rem] font-bold text-slate-400">
                                  {isRowExpanded ? 'Collapse' : 'Expand'}
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${isRowExpanded ? 'rotate-90' : ''}`}
                                  />
                                </span>
                              </button>
                              {isRowExpanded && (
                                <div className="px-2 pb-3 pt-1">
                                  {attentionReasons.length > 0 && (
                                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                                      {attentionReasons.map((r) => (
                                        <span key={r} className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.62rem] font-black text-amber-800">
                                          {r}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mb-3 grid gap-3 lg:grid-cols-2">
                                    <div className="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
                                      <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                                        Internal — Not visible to customer
                                      </p>
                                      <p className="mt-1.5 text-sm font-semibold text-slate-700">
                                        {getPreview(apt.internalNotes || apt.notes || '', 'No internal prep notes yet.')}
                                      </p>
                                    </div>
                                    <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3">
                                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                                        Customer Notes
                                      </p>
                                      <p className="mt-1.5 text-sm font-semibold text-slate-700">
                                        {getPreview(apt.customerNotes || '', 'No customer-facing notes.')}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openAppointment(apt)}
                                      className="rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                                    >
                                      Open Details
                                    </button>
                                    {!apt.dealId ? (
                                      <button
                                        type="button"
                                        onClick={() => createDealFromAppointment(apt.id, currentUser)}
                                        className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                                      >
                                        Create Deal
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => navigate('/portal/deals', { state: { openDealId: apt.dealId } })}
                                        className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                                      >
                                        View Deal
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => markConsultationStatus(apt, 'confirmed')}
                                        className="rounded-[0.5rem] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-800 transition hover:bg-sky-100"
                                      >
                                        Mark Confirmed
                                      </button>
                                    )}
                                    {canUseRepActions && !['completed', 'no_show'].includes(apt.status) && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => markConsultationStatus(apt, 'completed')}
                                          className="rounded-[0.5rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
                                        >
                                          Mark Completed
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => markConsultationStatus(apt, 'no_show')}
                                          className="rounded-[0.5rem] border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-orange-800 transition hover:bg-orange-100"
                                        >
                                          Mark No-show
                                        </button>
                                      </>
                                    )}
                                    {['completed', 'no_show'].includes(apt.status) && (
                                      <span className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">
                                        {apt.status === 'completed' ? '✓ Completed' : '✗ No-show'}
                                      </span>
                                    )}
                                    {canUseRepActions && (
                                      <button
                                        type="button"
                                        onClick={() => updateInternalNotesFromAgenda(apt)}
                                        className="rounded-[0.5rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                                      >
                                        Update Notes
                                      </button>
                                    )}
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => openReschedule(apt)}
                                        className="rounded-[0.5rem] border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                      >
                                        Reschedule
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="hidden rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5 lg:block">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Consultation Dispatch
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              {calendarView === 'month'
                ? monthLabel
                : calendarView === 'week'
                  ? `Week of ${formatAppointmentDate(toDateKey(weekStart))}`
                  : formatAppointmentDate(toDateKey(cursorDate))}
            </h2>
          </div>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {/* Rep filter — admin only */}
            {isAdmin && (
              <select
                value={calendarRepFilter}
                onChange={(e) => setCalendarRepFilter(e.target.value)}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#b8c9dd] focus:outline-none focus:ring-2 focus:ring-[#32639b]/30"
              >
                <option value="all">All reps</option>
                {activeReps.map((rep) => (
                  <option key={rep.id} value={rep.id}>{rep.name}</option>
                ))}
              </select>
            )}
            {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
                className={`${view !== 'day' ? 'hidden sm:inline-flex' : ''} ${
                  calendarView === view
                    ? 'rounded-full bg-[#1B3C6C] px-4 py-2 text-sm font-black capitalize text-white'
                    : 'rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black capitalize text-slate-600 transition hover:text-[#1B3C6C]'
                }`}
              >
                {view === 'day' ? 'Day/list' : view}
              </button>
            ))}
            <button
              type="button"
              onClick={() => moveCalendar(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Previous"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCursorDate(new Date())}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black text-slate-600 transition hover:text-[#1B3C6C]"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => moveCalendar(1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Next"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {calendarView === 'month' && (
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <div className="grid min-w-[44rem] grid-cols-7 gap-1.5 md:min-w-[52rem] md:gap-2">
              {monthDays.map((date) => renderDayColumn(date, true))}
            </div>
          </div>
        )}
        {calendarView === 'week' && (
          <div className="mt-4 hidden overflow-x-auto sm:block">
            <div className="grid min-w-[44rem] grid-cols-7 gap-2 md:min-w-[58rem] md:gap-3">
              {weekDays.map((date) => renderDayColumn(date))}
            </div>
          </div>
        )}
        {calendarView === 'day' && (
          <div className="mt-4 hidden space-y-4 sm:block">
            {currentDayAppointments.length > 0 ? (
              currentDayAppointments.map((appointment) => (
                <AppointmentPill
                  key={appointment.id}
                  appointment={appointment}
                  contractorName={
                    appointment.contractorId
                      ? getContractorName(appointment.contractorId)
                      : ''
                  }
                  projectType={getAppointmentProjectType(appointment)}
                  repName={getRepName(appointment.assignedRepId)}
                  onClick={() => openAppointment(appointment)}
                  variant="full"
                />
              ))
            ) : (
              <div className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  No consultations for this day.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Mobile compact calendar — now rendered in the Calendar tab above ── */}
        <div className="hidden">
          {/* Month navigation */}
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCursorDate((d) => {
                  const n = new Date(d);
                  n.setMonth(d.getMonth() - 1);
                  return n;
                })
              }
              className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-[0.7rem] font-bold uppercase tracking-[0.14em] text-[#32639b]">
                Consultations
              </p>
              <p className="text-base font-black tracking-tight text-slate-900">
                {monthLabel}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCursorDate(new Date())}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[0.68rem] font-black text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  setCursorDate((d) => {
                    const n = new Date(d);
                    n.setMonth(d.getMonth() + 1);
                    return n;
                  })
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 active:bg-slate-100"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Day-of-week headers */}
          <div className="mb-1 grid grid-cols-7">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, i) => (
              <div
                key={i}
                className="text-center text-[0.6rem] font-black uppercase tracking-wider text-slate-400"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {monthDays.map((date) => {
              const dateKey = toDateKey(date);
              const isThisMonth = date.getMonth() === cursorDate.getMonth();
              const isToday = dateKey === today;
              const isSelected = dateKey === toDateKey(cursorDate);
              const dayApts = filteredAppointments.filter(
                (a) => a.appointmentDate === dateKey
              );
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() =>
                    setCursorDate(
                      new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      )
                    )
                  }
                  className="flex flex-col items-center py-1 transition"
                >
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition ${
                      isSelected
                        ? 'bg-[#1B3C6C] text-white shadow-sm'
                        : isToday
                          ? 'border-2 border-[#1B3C6C] text-[#1B3C6C] font-black'
                          : isThisMonth
                            ? 'text-slate-800 hover:bg-slate-100'
                            : 'text-slate-300'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {/* Status dots */}
                  <div className="mt-0.5 flex h-2 items-center justify-center gap-px">
                    {dayApts.slice(0, 3).map((apt, idx) => (
                      <span
                        key={idx}
                        className={`h-1.5 w-1.5 rounded-full ${getMobileDotColor(apt.status, apt.consultationStage)}`}
                      />
                    ))}
                    {dayApts.length > 3 && (
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected day appointments */}
          <div className="mt-5 border-t border-slate-100 pt-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-black tracking-tight text-slate-900">
                {new Intl.DateTimeFormat('en-CA', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }).format(cursorDate)}
              </p>
              {currentDayAppointments.length > 0 && (
                <span className="rounded-full bg-[#e8f1fb] px-2.5 py-1 text-xs font-black text-[#1B3C6C]">
                  {currentDayAppointments.length}
                </span>
              )}
            </div>

            {currentDayAppointments.length > 0 ? (
              <div className="space-y-2">
                {currentDayAppointments.map((appointment) => {
                  const sc = getStatusClasses(appointment.status);
                  return (
                    <button
                      key={appointment.id}
                      type="button"
                      onClick={() => openAppointment(appointment)}
                      className={`w-full rounded-xl border px-4 py-3.5 text-left shadow-sm transition active:scale-[0.99] ${sc.card}`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${sc.dot}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-[0.88rem] font-black text-slate-900 leading-tight">
                              {appointment.customerName ||
                                appointment.title ||
                                'Consultation'}
                            </p>
                            <p className="shrink-0 text-xs font-bold tabular-nums text-slate-500 leading-tight mt-px">
                              {fmt12(appointment.appointmentTime)}
                            </p>
                          </div>
                          <p className="mt-1 text-[0.75rem] font-semibold text-slate-600">
                            {getAppointmentProjectType(appointment) ||
                              'Project type TBD'}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-wide ${sc.badge}`}
                            >
                              {getStatusLabel(appointment.status)}
                            </span>
                            <span className="text-[0.68rem] font-semibold text-slate-400">
                              {getRepName(appointment.assignedRepId)}
                            </span>
                            {appointment.contractorId && (
                              <span className="text-[0.68rem] font-semibold text-slate-400">
                                · {getContractorName(appointment.contractorId)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-8">
                <CalendarDays className="h-9 w-9 text-slate-200" />
                <p className="mt-2.5 text-sm font-bold text-slate-400">
                  No consultations
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {toDateKey(cursorDate) === today
                    ? 'Nothing scheduled for today.'
                    : 'Nothing scheduled for this day.'}
                </p>
              </div>
            )}
          </div>
        </div>
        {/* ── End mobile calendar ──────────────────────────────────── */}

      </section>

      <section className="hidden rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5 lg:block">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Schedule
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
            Upcoming and recent consultations
          </h2>
        </div>
        <div className="mt-2">
          {visibleAppointments.length > 0 ? (
            <div>
              {visibleAppointments.slice(0, 20).map((appointment) => {
                const deal = getDeal(appointment.dealId);
                const statusClasses = getStatusClasses(appointment.status);
                const schedStageDot = getStageDotColor(appointment.consultationStage, appointment.status);
                const outcomeBadge = getOutcomeBadge(appointment);
                const isRowExpanded = expandedAgendaRows.has(`sched-${appointment.id}`);
                const toggleRow = () =>
                  setExpandedAgendaRows((prev) => {
                    const next = new Set(prev);
                    const key = `sched-${appointment.id}`;
                    if (next.has(key)) next.delete(key);
                    else next.add(key);
                    return next;
                  });

                return (
                  <div key={appointment.id} className="border-b border-slate-100 last:border-b-0">
                    {/* Compact row */}
                    <button
                      type="button"
                      onClick={toggleRow}
                      className="flex w-full items-center gap-3 px-2 py-3 text-left transition hover:bg-slate-50/80"
                    >
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${schedStageDot}`} />
                      <span className="w-[6.5rem] shrink-0 text-[0.72rem] font-bold tabular-nums text-slate-500">
                        {appointment.appointmentDate}
                        {appointment.appointmentTime ? ` · ${fmt12(appointment.appointmentTime)}` : ''}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-black text-slate-900">
                        {getAppointmentLabel(appointment)}
                      </span>
                      {appointment.projectType && (
                        <span className="hidden shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[0.62rem] font-bold text-slate-600 xl:block">
                          {appointment.projectType}
                        </span>
                      )}
                      <span className="hidden shrink-0 text-xs font-semibold text-slate-400 lg:block">
                        {getRepName(appointment.assignedRepId)}
                      </span>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[0.62rem] font-black ${statusClasses.badge}`}>
                        {formatAppointmentStatus(appointment.status)}
                      </span>
                      {outcomeBadge && (
                        <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[0.62rem] font-black sm:block ${outcomeBadge.className}`}>
                          {outcomeBadge.label}
                        </span>
                      )}
                      <span className="flex shrink-0 items-center gap-1 text-[0.68rem] font-bold text-slate-400">
                        {isRowExpanded ? 'Collapse' : 'Expand'}
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-150 ${isRowExpanded ? 'rotate-90' : ''}`} />
                      </span>
                    </button>

                    {/* Expanded detail */}
                    {isRowExpanded && (
                      <div className="px-2 pb-4 pt-1">
                        <div className="mb-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <CalendarDays className="h-4 w-4 shrink-0 text-[#32639b]" />
                            {formatAppointmentDate(appointment.appointmentDate)}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <Clock className="h-4 w-4 shrink-0 text-[#32639b]" />
                            {fmt12(appointment.appointmentTime) || 'Time not set'}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <UserRound className="h-4 w-4 shrink-0 text-[#32639b]" />
                            {getRepName(appointment.assignedRepId)}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                            <MapPin className="h-4 w-4 shrink-0 text-[#32639b]" />
                            {appointment.location || appointment.city || 'Location not set'}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openAppointment(appointment)}
                            className="rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-1.5 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                          >
                            Open Details
                          </button>
                          {deal ? (
                            <>
                              <span className="text-xs font-semibold text-slate-500">
                                Deal: {formatDealStatus(deal.status)} / {formatCurrency(deal.estimatedJobValue)}
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate('/portal/deals', { state: { openDealId: appointment.dealId } })}
                                className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-1.5 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                              >
                                View Deal
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-semibold text-slate-400">Not linked to a deal yet.</span>
                              <button
                                type="button"
                                onClick={() => createDealFromAppointment(appointment.id, currentUser)}
                                className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-1.5 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                              >
                                Create Deal
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                No consultations scheduled yet.
              </p>
            </div>
          )}
        </div>
      </section>

      {(isCreating || selectedAppointment) && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Consultation Details
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  {isCreating ? 'Schedule Consultation' : getAppointmentLabel(selectedAppointment as Appointment)}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close consultation panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* ── Tab bar (existing consultations only) ── */}
            {!isCreating && (
              <div className="flex overflow-x-auto border-b border-slate-200 scrollbar-hide">
                {(
                  [
                    { id: 'prep',     label: 'Prep',     badge: null as string | null },
                    { id: 'details',  label: 'Details',  badge: null as string | null },
                    { id: 'outcome',  label: 'Outcome',  badge: selectedAppointment && !selectedAppointment.outcomeSubmitted && selectedAppointment.status === 'completed' ? '!' : null as string | null },
                    { id: 'dispatch', label: 'Dispatch', badge: selectedDispatches.length > 0 ? String(selectedDispatches.length) : null as string | null },
                    { id: 'emails',   label: 'Emails',   badge: emailPreviews.length > 0 ? String(emailPreviews.length) : null as string | null },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPanelTab(tab.id as 'prep' | 'details' | 'outcome' | 'dispatch' | 'emails')}
                    className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-4 py-3 text-sm font-bold transition ${
                      panelTab === tab.id
                        ? 'text-[#1B3C6C] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#1B3C6C] after:content-[""]'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.label}
                    {tab.badge && (
                      <span className={`flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-black ${tab.badge === '!' ? 'bg-amber-100 text-amber-700' : 'bg-[#e8f1fb] text-[#1B3C6C]'}`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              {/* ══ TAB: PREP (default) ══════════════════════════════════════ */}
              {(isCreating || panelTab === 'prep') && !isCreating && (
              <div className="space-y-4">
              <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                  Rep Prep Sheet
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Customer
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {form.customerName || 'Customer TBD'}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {[form.phone, form.email].filter(Boolean).join(' / ') ||
                        'Contact info not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Address
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {[form.address, form.city].filter(Boolean).join(', ') ||
                        'Address not set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Project
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {form.projectType || 'Project type TBD'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Contractor
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {linkedContractor?.companyName ?? 'Unassigned Contractor'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Linked Deal Value
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {linkedDeal
                        ? formatCurrency(linkedDeal.estimatedJobValue)
                        : 'No linked deal'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Financing
                    </p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      {linkedDeal
                        ? linkedDeal.financingRequired
                          ? 'Financing required'
                          : 'No financing required'
                        : 'Not linked'}
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-3 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 ${form.internalNotes?.trim() ? 'cursor-pointer hover:bg-amber-100 transition-colors' : ''}`}
                  onClick={() => form.internalNotes?.trim() && setNotesModal(form.internalNotes)}
                >
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                    Internal Notes - Not visible to customer
                    {form.internalNotes?.trim() && <span className="ml-2 normal-case font-normal opacity-60">(click to expand)</span>}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {getPreview(form.internalNotes, 'No internal prep notes yet.')}
                  </p>
                </div>
              </section>
              <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                      Lifecycle Progress
                    </p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.02em]">
                      {formatConsultationStage(form.consultationStage)}
                    </h3>
                  </div>
                  <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
                    {form.status ? formatAppointmentStatus(form.status) : 'Schedule TBD'}
                  </span>
                  {selectedAppointment && getOutcomeBadge(selectedAppointment) && (
                    <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getOutcomeBadge(selectedAppointment)?.className}`}>
                      {getOutcomeBadge(selectedAppointment)?.label}
                    </span>
                  )}
                  {selectedAppointment && (
                    <button
                      type="button"
                      onClick={openDispatchPanel}
                      disabled={!canDispatchSelectedAppointment}
                      title={
                        canDispatchSelectedAppointment
                          ? 'Dispatch this opportunity to contractors'
                          : 'Link a deal and move the consultation to contractor review, estimate requested, proposal sent, or completed first.'
                      }
                      className="inline-flex w-fit items-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-xs font-black text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Dispatch to Contractor
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-4">
                  {stageProgress.map((step) => {
                    const isActive = (
                      step.values as readonly ConsultationStage[]
                    ).includes(form.consultationStage);

                    return (
                      <div
                        key={step.label}
                        className={
                          isActive
                            ? 'rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] p-3 text-[#1B3C6C]'
                            : 'rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3 text-slate-500'
                        }
                      >
                        <p className="text-xs font-black uppercase tracking-[0.1em]">
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
              </div>
              )}

              {/* ══ TAB: DETAILS ═════════════════════════════════════════════ */}
              {(isCreating || panelTab === 'details') && (
              <div className="grid gap-4 sm:grid-cols-2">
              {/* ── Event/Consultation type selector always shown first ── */}
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                {isEventType(form.appointmentType) ? 'Event Type' : 'Appointment Type'}
                <select value={form.appointmentType} onChange={(event) => updateForm('appointmentType', event.target.value as AppointmentType)}>
                  <optgroup label="Consultations">
                    {typeOptions.filter((o) => !isEventType(o.value)).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Events">
                    {typeOptions.filter((o) => isEventType(o.value)).map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </optgroup>
                </select>
              </label>
              {/* Event-specific fields */}
              {isEventType(form.appointmentType) && (<>
                {/* ── Client autofill search for events ── */}
                {isCreating && (
                  <div className="sm:col-span-2 relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Invite existing client (optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone…"
                        value={clientSearch}
                        onChange={(e) => { setClientSearch(e.target.value); setClientSearchOpen(true); }}
                        onFocus={() => setClientSearchOpen(true)}
                        className="w-full rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1B3C6C] focus:outline-none focus:ring-0"
                      />
                    </div>
                    {clientSearchOpen && clientSearch.trim().length > 0 && (() => {
                      const q = clientSearch.toLowerCase();
                      const matches = clients.filter((c) =>
                        c.name.toLowerCase().includes(q) ||
                        (c.email ?? '').toLowerCase().includes(q) ||
                        (c.phone ?? '').toLowerCase().includes(q)
                      ).slice(0, 6);
                      if (matches.length === 0) return (
                        <div className="absolute z-10 mt-1 w-full rounded-[0.5rem] border border-slate-200 bg-white p-3 shadow-lg">
                          <p className="text-sm font-semibold text-slate-400">No clients found</p>
                        </div>
                      );
                      return (
                        <div className="absolute z-10 mt-1 w-full rounded-[0.5rem] border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                          {matches.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={() => {
                                updateForm('customerName', c.name);
                                updateForm('phone', c.phone ?? '');
                                updateForm('email', c.email ?? '');
                                updateForm('address', c.address ?? '');
                                updateForm('city', c.city ?? '');
                                updateForm('postalCode', c.postalCode ?? '');
                                setClientSearch('');
                                setClientSearchOpen(false);
                              }}
                              className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-[#f6faff]"
                            >
                              <span className="text-sm font-black text-slate-900">{c.name}</span>
                              <span className="text-xs font-semibold text-slate-400">{[c.email, c.phone, c.city].filter(Boolean).join(' · ')}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Event Title
                  <input value={form.customerName} onChange={(event) => updateForm('customerName', event.target.value)} placeholder="e.g. Supplier meeting with ABC Co." />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Address / Location
                  <input value={form.address} onChange={(event) => updateForm('address', event.target.value)} placeholder="e.g. 123 Main St, showroom address, client's home…" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Client Phone
                  <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} placeholder="Optional" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Client Email
                  <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} placeholder="Optional" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Event Date
                  <input type="date" value={form.appointmentDate} onChange={(event) => updateForm('appointmentDate', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Event Time
                  <input type="time" value={form.appointmentTime} onChange={(event) => updateForm('appointmentTime', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Duration (minutes)
                  <input type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateForm('durationMinutes', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Reminder (minutes before)
                  <input type="number" min={5} step={5} value={form.reminderMinutes} onChange={(event) => updateForm('reminderMinutes', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Assigned Rep
                  <select value={form.assignedRepId} onChange={(event) => updateForm('assignedRepId', event.target.value)}>
                    <option value="">Unassigned</option>
                    {activeReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </label>
                {form.assignedRepId && form.appointmentDate && daysOff.some((d) => d.userId === form.assignedRepId && d.date === form.appointmentDate) && (
                  <div className="sm:col-span-2 rounded-[0.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    ⚠ This rep has marked {form.appointmentDate} as a day off.
                  </div>
                )}
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Status
                  <select value={form.status} onChange={(event) => updateForm('status', event.target.value as AppointmentStatus)}>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  {form.appointmentType === 'custom_event' ? 'Event Description' : 'Notes'}
                  <textarea rows={3} value={form.internalNotes} onChange={(event) => updateForm('internalNotes', event.target.value)} placeholder={form.appointmentType === 'custom_event' ? 'Describe what this event is about…' : ''} />
                </label>
              </>)}
              {/* Consultation-specific fields */}
              {!isEventType(form.appointmentType) && (<>
                {/* ── Client autofill search (new consultations only) ── */}
                {isCreating && (
                  <div className="sm:col-span-2 relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Pull from existing client
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by name, email, or phone…"
                        value={clientSearch}
                        onChange={(e) => { setClientSearch(e.target.value); setClientSearchOpen(true); }}
                        onFocus={() => setClientSearchOpen(true)}
                        className="w-full rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1B3C6C] focus:outline-none focus:ring-0"
                      />
                    </div>
                    {clientSearchOpen && clientSearch.trim().length > 0 && (() => {
                      const q = clientSearch.toLowerCase();
                      const matches = clients.filter((c) =>
                        c.name.toLowerCase().includes(q) ||
                        (c.email ?? '').toLowerCase().includes(q) ||
                        (c.phone ?? '').toLowerCase().includes(q)
                      ).slice(0, 6);
                      if (matches.length === 0) return (
                        <div className="absolute z-10 mt-1 w-full rounded-[0.5rem] border border-slate-200 bg-white p-3 shadow-lg">
                          <p className="text-sm font-semibold text-slate-400">No clients found</p>
                        </div>
                      );
                      return (
                        <div className="absolute z-10 mt-1 w-full rounded-[0.5rem] border border-slate-200 bg-white shadow-lg divide-y divide-slate-100">
                          {matches.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onMouseDown={() => {
                                updateForm('customerName', c.name);
                                updateForm('phone', c.phone ?? '');
                                updateForm('email', c.email ?? '');
                                updateForm('address', c.address ?? '');
                                updateForm('city', c.city ?? '');
                                updateForm('postalCode', c.postalCode ?? '');
                                if (c.projectTypes?.[0]) updateForm('projectType', c.projectTypes[0]);
                                setClientSearch('');
                                setClientSearchOpen(false);
                              }}
                              className="flex w-full flex-col px-3 py-2.5 text-left hover:bg-[#f6faff]"
                            >
                              <span className="text-sm font-black text-slate-900">{c.name}</span>
                              <span className="text-xs font-semibold text-slate-400">{[c.email, c.phone, c.city].filter(Boolean).join(' · ')}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                )}
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Customer Name
                  <input
                    value={form.customerName}
                    onChange={(event) => updateForm('customerName', event.target.value)}
                   
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Phone
                  <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Email
                  <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  City
                  <input value={form.city} onChange={(event) => updateForm('city', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Postal Code
                  <input value={form.postalCode} onChange={(event) => updateForm('postalCode', event.target.value)} placeholder="e.g. L6Y 4X2" />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Address
                  <input value={form.address} onChange={(event) => updateForm('address', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Project Type
                  <input value={form.projectType} onChange={(event) => updateForm('projectType', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Date
                  <input type="date" value={form.appointmentDate} onChange={(event) => updateForm('appointmentDate', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Time
                  <input type="time" value={form.appointmentTime} onChange={(event) => updateForm('appointmentTime', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Duration (minutes)
                  <input type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateForm('durationMinutes', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Reminder (minutes before)
                  <input type="number" min={5} step={5} value={form.reminderMinutes} onChange={(event) => updateForm('reminderMinutes', event.target.value)} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Status
                  <select value={form.status} onChange={(event) => updateForm('status', event.target.value as AppointmentStatus)}>
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Stage
                  <select value={form.consultationStage} onChange={(event) => updateForm('consultationStage', event.target.value as ConsultationStage)}>
                    {stageSelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Assigned Sales Rep
                  <select value={form.assignedRepId} onChange={(event) => updateForm('assignedRepId', event.target.value)}>
                    <option value="">Unassigned Rep</option>
                    {activeReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>{rep.name}</option>
                    ))}
                  </select>
                </label>
                {form.assignedRepId && form.appointmentDate && daysOff.some((d) => d.userId === form.assignedRepId && d.date === form.appointmentDate) && (
                  <div className="sm:col-span-2 rounded-[0.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                    ⚠ This rep has marked {form.appointmentDate} as a day off.
                  </div>
                )}
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Assigned Contractor
                  <select value={form.contractorId} onChange={(event) => updateForm('contractorId', event.target.value)}>
                    <option value="">Unassigned Contractor</option>
                    {contractorOptions.map((contractor) => (
                      <option key={contractor.id} value={contractor.id}>{contractor.companyName}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Linked Deal
                  <select value={form.dealId} onChange={(event) => handleLinkedDealChange(event.target.value)}>
                    <option value="">Unlinked</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>{deal.homeownerName} / {deal.projectType}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Customer Notes
                  <textarea rows={3} value={form.customerNotes} onChange={(event) => updateForm('customerNotes', event.target.value)} />
                </label>
                <label className="grid gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-slate-700 sm:col-span-2">
                  Internal Notes — Not visible to customer
                  <textarea rows={4} value={form.internalNotes} onChange={(event) => updateForm('internalNotes', event.target.value)} />
                </label>
              </>)}
              </div>
              )}

              {/* ══ TAB: OUTCOME ═════════════════════════════════════════════ */}
              {selectedAppointment && panelTab === 'outcome' && (
                <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                        Outcome Report
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-0.02em]">
                        {form.outcomeSubmitted
                          ? 'Outcome submitted'
                          : 'Outcome needed after completion'}
                      </h3>
                    </div>
                    {form.outcomeSubmitted ? (
                      <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                        Outcome Submitted
                      </span>
                    ) : (
                      <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                        Outcome Needed
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Estimated Project Value
                      <input
                        type="number"
                        min={0}
                        value={form.estimatedProjectValue}
                        onChange={(event) =>
                          updateForm('estimatedProjectValue', event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Financing Needed?
                      <select
                        value={form.financingNeeded}
                        onChange={(event) =>
                          updateForm(
                            'financingNeeded',
                            event.target.value as AppointmentFormState['financingNeeded']
                          )
                        }
                      >
                        <option value="unknown">Unknown</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Homeowner Interest Level
                      <select
                        value={form.homeownerInterestLevel}
                        onChange={(event) =>
                          updateForm(
                            'homeownerInterestLevel',
                            event.target.value as AppointmentFormState['homeownerInterestLevel']
                          )
                        }
                      >
                        {interestOptions.map((option) => (
                          <option key={option.value || 'none'} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Recommended Contractor
                      <select
                        value={form.recommendedContractorId}
                        onChange={(event) =>
                          updateForm('recommendedContractorId', event.target.value)
                        }
                      >
                        <option value="">No recommendation yet</option>
                        {contractorOptions.map((contractor) => (
                          <option key={contractor.id} value={contractor.id}>
                            {contractor.companyName}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Close Probability %
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.closeProbability}
                        onChange={(event) =>
                          updateForm('closeProbability', event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Next Step
                      <select
                        value={form.nextStep}
                        onChange={(event) =>
                          updateForm(
                            'nextStep',
                            event.target.value as ConsultationNextStep
                          )
                        }
                      >
                        {nextStepOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      Follow-Up Date
                      <input
                        type="date"
                        value={form.followUpDate}
                        onChange={(event) =>
                          updateForm('followUpDate', event.target.value)
                        }
                      />
                    </label>
                    <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                        Outcome Summary
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {formatInterestLevel(form.homeownerInterestLevel || null)} /{' '}
                        {formatNextStep(form.nextStep)} /{' '}
                        {form.closeProbability || 0}% probability
                      </p>
                    </div>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                      Outcome Notes
                      <textarea
                        rows={4}
                        value={form.outcomeNotes}
                        onChange={(event) =>
                          updateForm('outcomeNotes', event.target.value)
                        }
                      />
                    </label>
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                      Objections / Concerns
                      <textarea
                        rows={3}
                        value={form.objections}
                        onChange={(event) =>
                          updateForm('objections', event.target.value)
                        }
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={submitOutcomeReport}
                      className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                    >
                      {form.outcomeSubmitted
                        ? 'Update Outcome Report'
                        : 'Submit Outcome Report'}
                    </button>
                    {!form.dealId && (
                      <button
                        type="button"
                        onClick={handleCreateDealFromAppointment}
                        className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                      >
                        Create Deal from Outcome
                      </button>
                    )}
                  </div>
                </section>
              )}
              {/* ══ TAB: DISPATCH ════════════════════════════════════════════ */}
              {selectedAppointment && panelTab === 'dispatch' && (
                <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                        Contractor Dispatch
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-slate-950">
                        Opportunity outreach history
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={openDispatchPanel}
                      disabled={!canDispatchSelectedAppointment}
                      className="inline-flex w-fit items-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      Dispatch to Contractor
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedDispatches.length > 0 ? (
                      selectedDispatches.map((dispatch) => {
                        const contractor = contractors.find(
                          (candidate) => candidate.id === dispatch.contractorId
                        );
                        const sender = users.find(
                          (user) => user.id === dispatch.sentByUserId
                        );

                        return (
                          <article
                            key={dispatch.id}
                            className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="text-sm font-black text-slate-950">
                                  {contractor?.companyName ?? 'Deleted contractor'}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  Sent by {sender?.name ?? 'Unknown'} on{' '}
                                  {new Date(dispatch.sentAt).toLocaleDateString()}
                                </p>
                              </div>
                              <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
                                {formatDispatchStatus(dispatch.status)}
                              </span>
                            </div>
                            <p className="mt-3 text-sm font-semibold text-slate-600">
                              {dispatch.contractorResponseNote ||
                                'No contractor response note yet.'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {dispatchStatusOptions.map((status) => (
                                <button
                                  key={status}
                                  type="button"
                                  onClick={() => updateDispatchStatus(dispatch, status)}
                                  className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                                >
                                  Mark {formatDispatchStatus(status)}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => assignDispatchContractor(dispatch.id, currentUser)}
                                className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                              >
                                Assign Contractor
                              </button>
                              <button
                                type="button"
                                onClick={() => updateDispatchResponseNote(dispatch)}
                                className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                              >
                                Response Note
                              </button>
                            </div>
                          </article>
                        );
                      })
                    ) : (
                      <div className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                        No contractor dispatches yet.
                      </div>
                    )}
                  </div>
                </section>
              )}
              {/* ══ TAB: EMAILS ══════════════════════════════════════════════ */}
              {selectedAppointment && panelTab === 'emails' && (
                <section className="rounded-[0.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                        Email Preview
                      </p>
                      <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-slate-950">
                        Prepared templates
                      </h3>
                    </div>
                    <p className="max-w-sm text-sm font-semibold text-slate-500">
                      Review each template before sending. Emails are sent from info@ontarioreno.ca.
                    </p>
                  </div>
                  {emailActionMessage && (
                    <p className="mt-3 rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-3 text-sm font-bold text-[#1B3C6C]">
                      {emailActionMessage}
                    </p>
                  )}
                  {emailPreviews.length === 0 && (
                    <div className="mt-4 rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                      No email templates available yet — link a deal to generate templates.
                    </div>
                  )}
                  <div className="mt-4 space-y-4">
                    {emailPreviews.map((preview) => (
                      <article
                        key={preview.type}
                        className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-sm font-black text-slate-950">
                              {preview.metadata.templateLabel}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              To: {preview.metadata.recipientLabel}
                              {preview.metadata.recipientEmail
                                ? ` / ${preview.metadata.recipientEmail}`
                                : ' / Missing recipient email'}
                            </p>
                            {preview.metadata.isCustomerFacing && (
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                Customer-facing brand:{' '}
                                {preview.metadata.contractorName}
                              </p>
                            )}
                          </div>
                          <span
                            className={
                              preview.metadata.isCustomerFacing
                                ? 'w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800'
                                : 'w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800'
                            }
                          >
                            {preview.metadata.isCustomerFacing
                              ? 'Customer-facing'
                              : 'Internal only'}
                          </span>
                        </div>
                        {preview.metadata.logoUrl && (
                          <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                              Contractor Logo
                            </p>
                            <img
                              src={preview.metadata.logoUrl}
                              alt={preview.metadata.contractorName}
                              className="mt-2 max-h-12 max-w-[10rem] object-contain"
                            />
                          </div>
                        )}
                        {/* ── Recipient Overrides ── */}
                        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3 space-y-2">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            Recipients
                          </p>
                          <div>
                            <label className="text-xs font-bold text-slate-500">To</label>
                            <input
                              type="email"
                              placeholder={preview.metadata.recipientEmail || 'Recipient email'}
                              value={emailRecipientOverrides[preview.type]?.to ?? ''}
                              onChange={(e) =>
                                setEmailRecipientOverrides((prev) => ({
                                  ...prev,
                                  [preview.type]: {
                                    to: e.target.value,
                                    cc: prev[preview.type]?.cc ?? '',
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded border border-transparent bg-slate-50 text-sm font-semibold text-slate-900 focus:border-[#1B3C6C] focus:bg-white focus:outline-none focus:ring-0 px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-500">CC <span className="font-normal">(optional, comma-separated)</span></label>
                            <input
                              type="text"
                              placeholder="e.g. other@example.com, another@example.com"
                              value={emailRecipientOverrides[preview.type]?.cc ?? ''}
                              onChange={(e) =>
                                setEmailRecipientOverrides((prev) => ({
                                  ...prev,
                                  [preview.type]: {
                                    to: prev[preview.type]?.to ?? '',
                                    cc: e.target.value,
                                  },
                                }))
                              }
                              className="mt-1 w-full rounded border border-transparent bg-slate-50 text-sm font-semibold text-slate-900 focus:border-[#1B3C6C] focus:bg-white focus:outline-none focus:ring-0 px-2 py-1"
                            />
                          </div>
                        </div>
                        {/* ── Editable Subject ── */}
                        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                              Subject
                            </p>
                            {emailEdits[preview.type]?.subject !== undefined && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEmailEdits((prev) => {
                                    const next = { ...prev };
                                    if (next[preview.type]) {
                                      const { subject: _s, ...rest } = next[preview.type];
                                      next[preview.type] = rest as typeof next[string];
                                    }
                                    return next;
                                  })
                                }
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <input
                            type="text"
                            value={emailEdits[preview.type]?.subject ?? preview.subject}
                            onChange={(e) =>
                              setEmailEdits((prev) => ({
                                ...prev,
                                [preview.type]: {
                                  body: prev[preview.type]?.body ?? preview.body,
                                  subject: e.target.value,
                                },
                              }))
                            }
                            className="mt-2 w-full rounded border border-transparent bg-transparent text-sm font-bold text-slate-900 focus:border-[#1B3C6C] focus:bg-slate-50 focus:outline-none focus:ring-0 px-1 py-0.5 -ml-1"
                          />
                        </div>
                        {/* ── Editable Body ── */}
                        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                              Body
                            </p>
                            {emailEdits[preview.type]?.body !== undefined && (
                              <button
                                type="button"
                                onClick={() =>
                                  setEmailEdits((prev) => {
                                    const next = { ...prev };
                                    if (next[preview.type]) {
                                      const { body: _b, ...rest } = next[preview.type];
                                      next[preview.type] = rest as typeof next[string];
                                    }
                                    return next;
                                  })
                                }
                                className="text-xs font-bold text-slate-400 hover:text-slate-600"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          <textarea
                            value={emailEdits[preview.type]?.body ?? preview.body}
                            onChange={(e) =>
                              setEmailEdits((prev) => ({
                                ...prev,
                                [preview.type]: {
                                  subject: prev[preview.type]?.subject ?? preview.subject,
                                  body: e.target.value,
                                },
                              }))
                            }
                            rows={8}
                            className="mt-2 w-full resize-y rounded border border-transparent bg-transparent text-sm font-semibold leading-6 text-slate-700 focus:border-[#1B3C6C] focus:bg-slate-50 focus:outline-none focus:ring-0 px-1 py-0.5 -ml-1"
                          />
                        </div>
                        {/* ── Attachments ── */}
                        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                              Attachments
                            </p>
                          </div>
                          {(emailAttachments[preview.type] ?? []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {(emailAttachments[preview.type] ?? []).map((file, idx) => (
                                <span
                                  key={idx}
                                  className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                                >
                                  <Paperclip className="h-3 w-3 text-slate-400" />
                                  {file.name}
                                  <span className="text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEmailAttachments((prev) => ({
                                        ...prev,
                                        [preview.type]: (prev[preview.type] ?? []).filter((_, i) => i !== idx),
                                      }))
                                    }
                                    className="ml-0.5 text-slate-400 hover:text-red-500"
                                    aria-label="Remove attachment"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs font-bold text-[#1B3C6C] hover:underline">
                            <input
                              type="file"
                              multiple
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.txt,.csv"
                              className="sr-only"
                              onChange={(e) => {
                                const newFiles = Array.from(e.target.files ?? []);
                                if (newFiles.length === 0) return;
                                setEmailAttachments((prev) => ({
                                  ...prev,
                                  [preview.type]: [...(prev[preview.type] ?? []), ...newFiles],
                                }));
                                e.target.value = '';
                              }}
                            />
                            + Add file
                          </label>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => copyEmailText(preview, 'subject')}
                            className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Copy Subject
                          </button>
                          <button
                            type="button"
                            onClick={() => copyEmailText(preview, 'body')}
                            className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Copy Body
                          </button>
                          <button
                            type="button"
                            onClick={() => copyEmailText(preview, 'full')}
                            className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                          >
                            Copy Full Email
                          </button>
                          <button
                            type="button"
                            onClick={() => openEmailClient(preview)}
                            disabled={!emailRecipientOverrides[preview.type]?.to?.trim() && !preview.metadata.recipientEmail}
                            className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Open Email Client
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendEmail(preview)}
                            disabled={
                              (!emailRecipientOverrides[preview.type]?.to?.trim() && !preview.metadata.recipientEmail) ||
                              sendingEmailType !== null
                            }
                            className="flex items-center gap-2 rounded-[0.5rem] bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {sendingEmailType === preview.type ? 'Sending…' : 'Send Now'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-200 p-5">
              {/* Conflict warning — full width above buttons */}
              {conflictWarning && (
                <div className="flex w-full flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-semibold">Scheduling conflict detected</p>
                  <p className="text-amber-700">
                    {conflictWarning.customerName} is already booked on {conflictWarning.appointmentDate} at {conflictWarning.appointmentTime}.
                  </p>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => { conflictOverrideRef.current = true; saveAppointment(); }} className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700">Save Anyway</button>
                    <button type="button" onClick={() => setConflictWarning(null)} className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100">Go Back</button>
                  </div>
                </div>
              )}

              {/* Secondary actions row */}
              {!isCreating && selectedAppointment && (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Send Reminder */}
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => handleSendReminder(selectedAppointment)}
                      disabled={reminderSending === selectedAppointment.id}
                      className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:opacity-60"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      {reminderSending === selectedAppointment.id ? 'Sending…' : 'Send Reminder'}
                    </button>
                    {reminderMessage?.id === selectedAppointment.id && (
                      <span className={`text-xs font-semibold ${reminderMessage.text.startsWith('Reminder sent') ? 'text-emerald-600' : 'text-red-500'}`}>
                        {reminderMessage.text}
                      </span>
                    )}
                  </div>

                  {/* Transfer */}
                  {(isAdmin || selectedAppointment.assignedRepId === currentUser.id) && (
                    showTransferUI ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={transferToRepId}
                          onChange={(e) => setTransferToRepId(e.target.value)}
                          className="rounded-[0.5rem] border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-[#1B3C6C] focus:outline-none"
                        >
                          <option value="">Select rep…</option>
                          {users.filter((u) => u.id !== selectedAppointment.assignedRepId).map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <button type="button" onClick={handleTransfer} disabled={!transferToRepId || transferring} className="rounded-[0.5rem] bg-amber-500 px-3 py-2 text-xs font-bold text-white hover:bg-amber-600 disabled:opacity-50">
                          {transferring ? 'Transferring…' : 'Confirm'}
                        </button>
                        <button type="button" onClick={() => { setShowTransferUI(false); setTransferToRepId(''); }} className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:bg-slate-50">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setShowTransferUI(true)} className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100">
                        <ArrowRightLeft className="h-3.5 w-3.5" />
                        Transfer
                      </button>
                    )
                  )}

                  {/* Create / View Deal */}
                  <button type="button" onClick={handleCreateDealFromAppointment} className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]">
                    {selectedAppointment.dealId ? 'View Deal' : 'Create Deal'}
                  </button>

                  {/* Delete — rep can delete their own, admin can delete any */}
                  {(isAdmin || selectedAppointment.assignedRepId === currentUser.id) && (
                    <button type="button" onClick={handleDeleteAppointment} className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}

              {/* Primary actions row */}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={closePanel} className="rounded-[0.5rem] border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" onClick={saveAppointment} className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#153158]">
                  {isCreating ? 'Schedule Consultation' : 'Save Consultation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDispatchPanelOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Contractor Dispatch
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  Dispatch opportunity
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsDispatchPanelOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close dispatch panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                  Privacy Safe Summary
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  This message excludes homeowner name, phone, email, exact
                  address, internal notes, and commission details.
                </p>
              </div>

              {selectedDispatchRecommendations.length > 0 && (
                <section className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                    Recommended Contractors
                  </p>
                  <div className="mt-3 space-y-2">
                    {selectedDispatchRecommendations.map((recommendation) => (
                      <button
                        key={recommendation.contractor.id}
                        type="button"
                        onClick={() => toggleDispatchContractor(recommendation.contractor.id)}
                        className="w-full rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3 text-left transition hover:border-[#b8c9dd]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-950">
                              {recommendation.contractor.companyName}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {recommendation.label} /{' '}
                              {recommendation.reasons.join(', ')}
                            </p>
                          </div>
                          <span className="rounded-full bg-[#e8f1fb] px-2 py-1 text-[0.65rem] font-black text-[#1B3C6C]">
                            {dispatchForm.contractorIds.includes(
                              recommendation.contractor.id
                            )
                              ? 'Selected'
                              : 'Select'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                  Select Contractor(s)
                </p>
                <div className="mt-3 grid gap-2">
                  {dispatchContractorOptions.map((contractor) => (
                    <label
                      key={contractor.id}
                      className="flex items-start gap-3 rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3 text-sm font-bold text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={dispatchForm.contractorIds.includes(contractor.id)}
                        onChange={() => toggleDispatchContractor(contractor.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-slate-950">
                          {contractor.companyName}
                        </span>
                        <span className="mt-1 block text-xs font-semibold text-slate-500">
                          {contractor.financingStatus === 'financing_available'
                            ? 'Financing available'
                            : contractor.financingStatus === 'cash_only'
                              ? dispatchForm.financingRequired
                                ? 'Cash only - caution for financed opportunity'
                                : 'Cash only'
                              : 'Pending financing'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>

              <section className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Estimated Project Range
                  <input
                    value={dispatchForm.estimatedProjectRange}
                    onChange={(event) =>
                      setDispatchForm((current) => ({
                        ...current,
                        estimatedProjectRange: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Financing Required
                  <select
                    value={dispatchForm.financingRequired ? 'yes' : 'no'}
                    onChange={(event) =>
                      setDispatchForm((current) => ({
                        ...current,
                        financingRequired: event.target.value === 'yes',
                      }))
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Desired Timeline
                  <input
                    value={dispatchForm.desiredTimeline}
                    onChange={(event) =>
                      setDispatchForm((current) => ({
                        ...current,
                        desiredTimeline: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Safe Summary
                  <textarea
                    rows={5}
                    value={dispatchForm.safeSummary}
                    onChange={(event) =>
                      setDispatchForm((current) => ({
                        ...current,
                        safeSummary: event.target.value,
                      }))
                    }
                  />
                </label>
              </section>

              <section className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                  Preview Message
                </p>
                <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-6 text-slate-700">
                  {dispatchPreviewMessage}
                </pre>
                {dispatchActionMessage && (
                  <p className="mt-3 rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-3 text-sm font-bold text-[#1B3C6C]">
                    {dispatchActionMessage}
                  </p>
                )}
              </section>
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={copyDispatchMessage}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Copy Message
              </button>
              <button
                type="button"
                onClick={openDispatchEmailClient}
                disabled={
                  selectedDispatchContractors.length !== 1 ||
                  !selectedDispatchContractors[0]?.email
                }
                className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open Email Client
              </button>
              <button
                type="button"
                onClick={markDispatchesSent}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
              >
                Mark as Sent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reminder Email Preview Modal ── */}
      {reminderPreview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-[0.75rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.3)]" style={{ maxHeight: '90vh' }}>
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-600">Email Preview</p>
                <p className="mt-1 text-base font-black text-slate-900">{reminderPreview.subjectOverride}</p>
                <p className="mt-0.5 text-xs font-semibold text-slate-500">To: {reminderPreview.appointment.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setReminderPreview(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <iframe
                srcDoc={reminderPreview.preview.html}
                className="h-full w-full border-0"
                style={{ minHeight: '420px' }}
                sandbox="allow-same-origin"
                title="Email preview"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
              <button
                type="button"
                onClick={() => setReminderPreview(null)}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendReminder}
                className="rounded-[0.5rem] bg-sky-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-700"
              >
                Send to Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Days Off Panel ── */}
      {daysOffPanelOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Scheduling</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">Days Off</h2>
              </div>
              <button
                type="button"
                onClick={() => setDaysOffPanelOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
              {/* Mark dates off */}
              <div className="rounded-[0.5rem] border border-slate-200 p-4 space-y-4">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">Mark Dates Off</p>

                {isAdmin && (
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Rep
                    <select
                      value={daysOffRepFilter}
                      onChange={(e) => setDaysOffRepFilter(e.target.value)}
                      className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select a rep…</option>
                      {activeReps.map((rep) => (
                        <option key={rep.id} value={rep.id}>{rep.name}</option>
                      ))}
                    </select>
                  </label>
                )}

                {/* Quick picks */}
                <div className="flex gap-2">
                  {[
                    { label: 'Today', offset: 0 },
                    { label: 'Tomorrow', offset: 1 },
                  ].map(({ label, offset }) => {
                    const d = new Date();
                    d.setDate(d.getDate() + offset);
                    const iso = d.toISOString().slice(0, 10);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => { setDaysOffFromDate(iso); setDaysOffToDate(''); }}
                        className={`rounded-[0.5rem] border px-3 py-1.5 text-xs font-bold transition ${daysOffFromDate === iso && !daysOffToDate ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Date
                    <input
                      type="date"
                      value={daysOffFromDate}
                      onChange={(e) => setDaysOffFromDate(e.target.value)}
                      className="rounded-[0.5rem] border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    <span>To <span className="font-normal text-slate-400">(optional range)</span></span>
                    <input
                      type="date"
                      value={daysOffToDate}
                      min={daysOffFromDate}
                      onChange={(e) => setDaysOffToDate(e.target.value)}
                      className="rounded-[0.5rem] border border-slate-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Note (optional)
                  <input
                    type="text"
                    value={daysOffNote}
                    onChange={(e) => setDaysOffNote(e.target.value)}
                    placeholder="e.g. Vacation, sick day…"
                    className="rounded-[0.5rem] border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>

                {daysOffError && (
                  <p className="text-sm font-semibold text-red-600">{daysOffError}</p>
                )}

                <button
                  type="button"
                  disabled={daysOffSaving || !daysOffFromDate}
                  onClick={async () => {
                    const repId = isAdmin ? daysOffRepFilter : (currentUser?.id ?? '');
                    if (isAdmin && !repId) { setDaysOffError('Please select a rep.'); return; }
                    if (!daysOffFromDate) { setDaysOffError('Please select a start date.'); return; }
                    setDaysOffError('');
                    setDaysOffSaving(true);
                    // Generate all dates in range
                    const dates: string[] = [];
                    const cursor = new Date(daysOffFromDate + 'T00:00:00');
                    const end = new Date((daysOffToDate || daysOffFromDate) + 'T00:00:00');
                    while (cursor <= end) {
                      dates.push(cursor.toISOString().slice(0, 10));
                      cursor.setDate(cursor.getDate() + 1);
                    }
                    await addDaysOff(dates, daysOffNote.trim(), isAdmin ? repId : undefined);
                    setDaysOffFromDate('');
                    setDaysOffToDate('');
                    setDaysOffNote('');
                    setDaysOffSaving(false);
                  }}
                  className="w-full rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-black text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {daysOffSaving ? 'Saving…' : 'Mark as Off'}
                </button>
              </div>

              {/* Existing days off list */}
              <div className="space-y-3">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-slate-500">
                  {isAdmin ? 'All Days Off' : 'Your Days Off'}
                </p>
                {(() => {
                  const filtered = daysOff
                    .filter((d) => isAdmin || d.userId === currentUser?.id)
                    .sort((a, b) => a.date.localeCompare(b.date));
                  if (filtered.length === 0) {
                    return <p className="text-sm text-slate-400">No days off recorded.</p>;
                  }
                  // Group by userId for admin view
                  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, d) => {
                    (acc[d.userId] ??= []).push(d);
                    return acc;
                  }, {});
                  return Object.entries(grouped).map(([uid, entries]) => {
                    const rep = users.find((u) => u.id === uid);
                    return (
                      <div key={uid}>
                        {isAdmin && (
                          <p className="mb-1.5 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            {rep?.name ?? 'Unknown Rep'}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          {entries.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-3 rounded-[0.5rem] border border-slate-100 bg-slate-50 px-3 py-2">
                              <div>
                                <span className="text-sm font-bold text-slate-800">{d.date}</span>
                                {d.note && <span className="ml-2 text-xs text-slate-500">{d.note}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeDayOff(d.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                                aria-label="Remove"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
