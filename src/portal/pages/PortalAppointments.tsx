import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  CloudDownload,
  MapPin,
  Plus,
  Send,
  UserRound,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePortalAuth } from '../auth';
import {
  ConsultationEmailPreview,
  ConsultationEmailType,
  generateConsultationEmailPreview,
} from '../data/consultationEmails';
import { sendEmail } from '../lib/sendEmail';
import {
  connectGoogleCalendar,
  disconnectGoogleCalendar,
  getGoogleCalendarConnection,
} from '../data/googleCalendar';
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
];

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
  status: 'scheduled',
};

function formatAppointmentType(type: AppointmentType) {
  if (type === 'home_visit') return 'Home Visit';
  if (type === 'phone_consultation') return 'Phone Consultation';
  return 'Video Consultation';
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
    status: appointment.status,
  };
}

function sourceLabel(source: Appointment['source']) {
  return source === 'google_calendar' ? 'Google Calendar' : 'Manual';
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

function AppointmentPill({
  appointment,
  contractorName,
  projectType,
  repName,
  onClick,
}: {
  appointment: Appointment;
  contractorName: string;
  projectType: string;
  repName: string;
  onClick: () => void;
}) {
  const statusClasses = getStatusClasses(appointment.status);
  const outcomeBadge = getOutcomeBadge(appointment);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[0.5rem] border px-2.5 py-2 text-left shadow-sm transition ${statusClasses.card}`}
    >
      <div className="flex items-start gap-2">
        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${statusClasses.dot}`} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.68rem] font-black uppercase text-slate-500">
            {appointment.appointmentTime || 'Time TBD'}
          </p>
          <p className="truncate text-xs font-black text-slate-950">
            {appointment.customerName || appointment.title || 'Consultation'}
          </p>
          <p className="mt-0.5 truncate text-[0.68rem] font-semibold text-slate-600">
            {projectType || 'Project type TBD'} / {repName}
          </p>
          {contractorName && (
            <p className="mt-0.5 truncate text-[0.68rem] font-semibold text-slate-500">
              {contractorName}
            </p>
          )}
          <p className="mt-1 truncate text-[0.65rem] font-black uppercase text-[#32639b]">
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
    createDealFromAppointment,
    contractors,
    deals,
    deleteAppointment,
    getDispatchesForConsultation,
    getVisibleAppointmentsForUser,
    importGoogleCalendarEvents,
    logActivity,
    updateContractorDispatch,
    updateAppointment,
    users,
  } = usePortalData();
  const [calendarView, setCalendarView] = useState<CalendarView>('month');
  const [cursorDate, setCursorDate] = useState(new Date());
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string | null>(null);
  const [consultationFilter, setConsultationFilter] =
    useState<ConsultationFilter>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<AppointmentFormState>(emptyForm);
  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState(false);
  const [calendarConnection, setCalendarConnection] = useState(() =>
    getGoogleCalendarConnection()
  );
  const [connectionMessage, setConnectionMessage] = useState('');
  const [emailActionMessage, setEmailActionMessage] = useState('');
  const [sendingEmailType, setSendingEmailType] = useState<ConsultationEmailType | null>(null);
  const [dispatchActionMessage, setDispatchActionMessage] = useState('');
  const [isDispatchPanelOpen, setIsDispatchPanelOpen] = useState(false);
  const [dispatchForm, setDispatchForm] = useState<DispatchFormState>({
    contractorIds: [],
    desiredTimeline: '',
    estimatedProjectRange: '',
    financingRequired: false,
    safeSummary: '',
  });
  const [importMessage, setImportMessage] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
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
    return appointment.consultationStage === consultationFilter;
  };
  const filteredAppointments = visibleAppointments.filter(
    matchesConsultationFilter
  );
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
      !appointment.assignedRepId ||
      !appointment.contractorId
  );
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
  const currentDayAppointments = filteredAppointments.filter(
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
  const emailTemplateTypes: ConsultationEmailType[] = isAdmin
    ? [
        'booking_confirmation',
        'reschedule_notice',
        'cancellation_notice',
        'rep_assignment',
      ]
    : selectedAppointment?.assignedRepId === currentUser.id
      ? ['rep_assignment']
      : [];
  const stageSelectOptions = isAdmin
    ? stageOptions
    : Array.from(
        new Map(
          [
            [
              form.consultationStage,
              formatConsultationStage(form.consultationStage),
            ],
            ...repStageOptions.map((option) => [option.value, option.label]),
          ] as Array<[ConsultationStage, string]>
        )
      ).map(([value, label]) => ({ label, value }));
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
    if (!appointment.contractorId) reasons.push('Missing contractor');
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
    if (!isAdmin) return;
    setIsCreating(true);
    setSelectedAppointmentId(null);
    setForm({
      ...emptyForm,
      appointmentDate: toDateKey(cursorDate),
    });
  };

  const openAppointment = (appointment: Appointment) => {
    setIsCreating(false);
    setSelectedAppointmentId(appointment.id);
    setForm(appointmentToForm(appointment));
  };

  const closePanel = () => {
    setIsCreating(false);
    setSelectedAppointmentId(null);
    setForm(emptyForm);
  };

  const saveAppointment = () => {
    if (!currentUser) return;

    if (!isAdmin && selectedAppointment) {
      updateAppointment(
        selectedAppointment.id,
        {
          consultationStage: form.consultationStage,
          closeProbability: Number(form.closeProbability) || 0,
          estimatedProjectValue: Number(form.estimatedProjectValue) || 0,
          financingNeeded:
            form.financingNeeded === 'unknown'
              ? null
              : form.financingNeeded === 'yes',
          followUpDate: form.followUpDate,
          homeownerInterestLevel: form.homeownerInterestLevel || null,
          notes: form.notes.trim(),
          internalNotes: form.internalNotes.trim(),
          nextStep: form.nextStep,
          objections: form.objections.trim(),
          outcomeNotes: form.outcomeNotes.trim(),
          outcomeSubmitted: form.outcomeSubmitted,
          recommendedContractorId: form.recommendedContractorId || null,
          status: form.status,
        },
        currentUser
      );
      if (form.status === 'completed' && !form.outcomeSubmitted) {
        setForm((current) => ({
          ...current,
          consultationStage: 'consultation_completed',
          status: 'completed',
        }));
        return;
      }
      closePanel();
      return;
    }

    if (!isAdmin || !form.customerName.trim() || !form.appointmentDate) return;

    const payload = {
      address: form.address.trim(),
      appointmentDate: form.appointmentDate,
      appointmentTime: form.appointmentTime,
      appointmentType: form.appointmentType,
      assignedRepId: form.assignedRepId,
      contractorId: form.contractorId || null,
      city: form.city.trim(),
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
      status: form.status,
    };

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
    if (!isAdmin || !selectedAppointment) return;
    if (
      window.confirm(
        'Delete this consultation? This cannot be undone in the local prototype.'
      )
    ) {
      deleteAppointment(selectedAppointment.id, currentUser);
      closePanel();
    }
  };

  const handleCreateDealFromAppointment = () => {
    if (!selectedAppointment) return;
    createDealFromAppointment(selectedAppointment.id, currentUser);
    closePanel();
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
    if (!preview.metadata.recipientEmail) return;

    const mailto = `mailto:${encodeURIComponent(
      preview.metadata.recipientEmail
    )}?subject=${encodeURIComponent(preview.subject)}&body=${encodeURIComponent(
      preview.body
    )}`;
    window.location.href = mailto;
    setEmailActionMessage(`${preview.metadata.templateLabel} opened in email client.`);
    logEmailPreviewActivity(
      preview,
      'email_client_opened',
      `${currentUser.name} opened email client for ${preview.metadata.templateLabel}`
    );
  };

  const handleSendEmail = async (preview: ConsultationEmailPreview) => {
    if (!selectedAppointment || sendingEmailType) return;

    setSendingEmailType(preview.type);
    setEmailActionMessage('');

    const result = await sendEmail(preview);

    setSendingEmailType(null);

    if (result.ok) {
      setEmailActionMessage(`${preview.metadata.templateLabel} sent to ${preview.metadata.recipientEmail}.`);
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

  const handleConnectGoogleCalendar = async () => {
    setIsConnecting(true);
    setConnectionMessage('');
    setImportMessage('');
    try {
      const connection = await connectGoogleCalendar();
      setCalendarConnection(connection);
      setConnectionMessage('Google Calendar connected for this local prototype.');
    } catch (error) {
      setConnectionMessage(
        error instanceof Error ? error.message : 'Google Calendar connection failed.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGoogleCalendar = () => {
    disconnectGoogleCalendar();
    setCalendarConnection(null);
    setConnectionMessage('Google Calendar disconnected locally.');
    setImportMessage('');
  };

  const importUpcomingGoogleEvents = async () => {
    setIsImporting(true);
    setImportMessage('');
    try {
      const result = await importGoogleCalendarEvents(currentUser);
      setImportMessage(
        `Google Calendar import complete: ${result.imported} imported, ${result.updated} updated, ${result.unlinked} unlinked.`
      );
    } catch (error) {
      setImportMessage(
        error instanceof Error
          ? error.message
          : 'Could not import Google Calendar events.'
      );
    } finally {
      setIsImporting(false);
    }
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
    const outcomeBadge = getOutcomeBadge(appointment);
    const attentionReasons = getAttentionReasons(appointment);
    const canUseRepActions =
      currentUser.role === 'admin' || appointment.assignedRepId === currentUser.id;

    return (
      <article
        key={appointment.id}
        className={`rounded-[0.5rem] border bg-white p-4 shadow-sm ${
          options.attention ? 'border-amber-200' : 'border-slate-200'
        }`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#32639b]">
                {appointment.appointmentTime || 'Time TBD'}
              </p>
              <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${statusClasses.badge}`}>
                {formatAppointmentStatus(appointment.status)}
              </span>
              <span className="rounded-full bg-[#e8f1fb] px-2.5 py-1 text-[0.68rem] font-black text-[#1B3C6C]">
                {formatConsultationStage(appointment.consultationStage)}
              </span>
              {outcomeBadge && (
                <span className={`rounded-full px-2.5 py-1 text-[0.68rem] font-black ${outcomeBadge.className}`}>
                  {outcomeBadge.label}
                </span>
              )}
              {options.attention &&
                attentionReasons.map((reason) => (
                  <span
                    key={reason}
                    className="rounded-full bg-amber-100 px-2.5 py-1 text-[0.68rem] font-black text-amber-800"
                  >
                    {reason}
                  </span>
                ))}
            </div>
            <h3 className="mt-2 text-lg font-black text-slate-950">
              {appointment.customerName || appointment.title || 'Consultation'}
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {appointment.projectType || deal?.projectType || 'Project type TBD'} /{' '}
              {appointment.city || deal?.city || 'City TBD'}
            </p>
          </div>
          <div className="grid gap-2 text-sm font-bold text-slate-700 sm:grid-cols-2 lg:min-w-[22rem]">
            <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2">
              Rep: {getRepName(appointment.assignedRepId)}
            </div>
            <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2">
              Contractor: {getContractorName(appointment.contractorId)}
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div className="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
              Internal - Not visible to customer
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {getPreview(
                appointment.internalNotes || appointment.notes || '',
                'No internal prep notes yet.'
              )}
            </p>
          </div>
          <div className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
              Customer Notes
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-700">
              {getPreview(appointment.customerNotes || '', 'No customer-facing notes.')}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openAppointment(appointment)}
            className="rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
          >
            Open Details
          </button>
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => openAppointment(appointment)}
                className="rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Edit Consultation
              </button>
              <button
                type="button"
                onClick={() => markConsultationStatus(appointment, 'confirmed')}
                className="rounded-[0.5rem] border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-bold text-sky-800 transition hover:bg-sky-100"
              >
                Mark Confirmed
              </button>
            </>
          )}
          {canUseRepActions && (
            <>
              <button
                type="button"
                onClick={() => markConsultationStatus(appointment, 'completed')}
                className="rounded-[0.5rem] border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                Mark Completed
              </button>
              <button
                type="button"
                onClick={() => markConsultationStatus(appointment, 'no_show')}
                className="rounded-[0.5rem] border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
              >
                Mark No-show
              </button>
              <button
                type="button"
                onClick={() => updateInternalNotesFromAgenda(appointment)}
                className="rounded-[0.5rem] border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
              >
                Update Internal Notes
              </button>
            </>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => openReschedule(appointment)}
              className="rounded-[0.5rem] border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Reschedule
            </button>
          )}
        </div>
      </article>
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
    const appointments = filteredAppointments.filter(
      (appointment) => appointment.appointmentDate === dateKey
    );
    const isOutsideMonth = date.getMonth() !== cursorDate.getMonth();

    return (
      <article
        key={dateKey}
        className={`rounded-[0.5rem] border border-slate-200 bg-white ${
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
          {dateKey === today && (
            <span className="rounded-full bg-[#e8f1fb] px-2 py-1 text-[0.65rem] font-black text-[#1B3C6C]">
              Today
            </span>
          )}
        </div>
        <div className={`${compact ? 'mt-2 space-y-1.5' : 'mt-3 space-y-2'}`}>
          {appointments.slice(0, compact ? 3 : 6).map((appointment) => (
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
            />
          ))}
          {appointments.length === 0 && !compact && (
            <p className="rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-400">
              Open
            </p>
          )}
          {compact && appointments.length > 3 && (
            <p className="text-xs font-bold text-slate-500">
              +{appointments.length - 3} more
            </p>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-5">
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
          {isAdmin && (
            <button
              type="button"
              onClick={openCreatePanel}
              className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#153158]"
            >
              <Plus className="h-4 w-4" />
              + Schedule Consultation
            </button>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsSyncPanelOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <CloudDownload className="h-4 w-4" />
              External Calendar Sync
            </button>
          )}
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
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

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
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

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Upcoming Consultations
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Next consultations
            </h2>
          </div>
          <div className="mt-4">
            {renderGroupedAgenda(
              upcomingAgendaAppointments.slice(0, 12),
              'No upcoming consultations scheduled.'
            )}
          </div>
        </article>

        <article className="rounded-[0.5rem] border border-amber-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="border-b border-amber-100 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-700">
              Needs Attention
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Dispatch gaps
            </h2>
          </div>
          <div className="mt-4">
            {renderGroupedAgenda(
              needsAttentionAppointments.slice(0, 8),
              'No consultations need attention right now.',
              { attention: true }
            )}
          </div>
        </article>
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
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
          <div className="flex flex-wrap items-center gap-2">
            {(['month', 'week', 'day'] as CalendarView[]).map((view) => (
              <button
                key={view}
                type="button"
                onClick={() => setCalendarView(view)}
                className={
                  calendarView === view
                    ? 'rounded-full bg-[#1B3C6C] px-4 py-2 text-sm font-black capitalize text-white'
                    : 'rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-black capitalize text-slate-600 transition hover:text-[#1B3C6C]'
                }
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
          <div className="mt-4 grid min-w-[52rem] grid-cols-7 gap-2 overflow-x-auto">
            {monthDays.map((date) => renderDayColumn(date, true))}
          </div>
        )}
        {calendarView === 'week' && (
          <div className="mt-4 grid min-w-[58rem] grid-cols-7 gap-3 overflow-x-auto">
            {weekDays.map((date) => renderDayColumn(date))}
          </div>
        )}
        {calendarView === 'day' && (
          <div className="mt-4 space-y-3">
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
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Schedule
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
            Upcoming and recent consultations
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          {visibleAppointments.length > 0 ? (
            visibleAppointments.slice(0, 20).map((appointment) => {
              const deal = getDeal(appointment.dealId);
              const statusClasses = getStatusClasses(appointment.status);
              const outcomeBadge = getOutcomeBadge(appointment);

              return (
                <article
                  key={appointment.id}
                  className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
                >
                  <button
                    type="button"
                    onClick={() => openAppointment(appointment)}
                    className="block w-full text-left"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-slate-950">
                          {getAppointmentLabel(appointment)}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          {formatAppointmentType(appointment.appointmentType)} /{' '}
                          {sourceLabel(appointment.source)}
                        </p>
                      </div>
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${statusClasses.badge}`}>
                        {formatAppointmentStatus(appointment.status)}
                      </span>
                      <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
                        {formatConsultationStage(appointment.consultationStage)}
                      </span>
                      {outcomeBadge && (
                        <span className={`w-fit rounded-full px-3 py-1 text-xs font-black ${outcomeBadge.className}`}>
                          {outcomeBadge.label}
                        </span>
                      )}
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <CalendarDays className="h-4 w-4 text-[#32639b]" />
                        {formatAppointmentDate(appointment.appointmentDate)}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Clock className="h-4 w-4 text-[#32639b]" />
                        {appointment.appointmentTime || 'Time not set'}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <UserRound className="h-4 w-4 text-[#32639b]" />
                        {getRepName(appointment.assignedRepId)}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <MapPin className="h-4 w-4 text-[#32639b]" />
                        {appointment.location || appointment.city || 'Location not set'}
                      </div>
                    </div>
                  </button>
                  {deal ? (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Deal status: {formatDealStatus(deal.status)} / Value:{' '}
                      {formatCurrency(deal.estimatedJobValue)}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      This consultation is not linked to a deal yet.
                    </p>
                  )}
                </article>
              );
            })
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
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
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
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <section className="mb-5 rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
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
                <div className="mt-3 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                    Internal Notes - Not visible to customer
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {getPreview(form.internalNotes, 'No internal prep notes yet.')}
                  </p>
                </div>
              </section>
              <section className="mb-5 rounded-[0.5rem] border border-slate-200 bg-white p-4">
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
              {selectedAppointment && (
                <section className="mb-5 rounded-[0.5rem] border border-slate-200 bg-white p-4">
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
                    {!form.dealId && isAdmin && (
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
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Customer Name
                  <input
                    value={form.customerName}
                    onChange={(event) => updateForm('customerName', event.target.value)}
                    readOnly={!isAdmin}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Phone
                  <input value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Email
                  <input value={form.email} onChange={(event) => updateForm('email', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  City
                  <input value={form.city} onChange={(event) => updateForm('city', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Address
                  <input value={form.address} onChange={(event) => updateForm('address', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Project Type
                  <input value={form.projectType} onChange={(event) => updateForm('projectType', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Assigned Sales Rep
                  <select value={form.assignedRepId} onChange={(event) => updateForm('assignedRepId', event.target.value)} disabled={!isAdmin}>
                    <option value="">Unassigned Rep</option>
                    {activeReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Assigned Contractor
                  <select value={form.contractorId} onChange={(event) => updateForm('contractorId', event.target.value)} disabled={!isAdmin}>
                    <option value="">Unassigned Contractor</option>
                    {contractorOptions.map((contractor) => (
                      <option key={contractor.id} value={contractor.id}>
                        {contractor.companyName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Date
                  <input type="date" value={form.appointmentDate} onChange={(event) => updateForm('appointmentDate', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Time
                  <input type="time" value={form.appointmentTime} onChange={(event) => updateForm('appointmentTime', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Duration
                  <input type="number" min={15} step={15} value={form.durationMinutes} onChange={(event) => updateForm('durationMinutes', event.target.value)} readOnly={!isAdmin} />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Type
                  <select value={form.appointmentType} onChange={(event) => updateForm('appointmentType', event.target.value as AppointmentType)} disabled={!isAdmin}>
                    {typeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Status
                  <select value={form.status} onChange={(event) => updateForm('status', event.target.value as AppointmentStatus)}>
                    {(isAdmin
                      ? statusOptions
                      : statusOptions.filter((option) =>
                          ['completed', 'no_show', form.status].includes(option.value)
                        )
                    ).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Consultation Stage
                  <select
                    value={form.consultationStage}
                    onChange={(event) =>
                      updateForm(
                        'consultationStage',
                        event.target.value as ConsultationStage
                      )
                    }
                  >
                    {stageSelectOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Linked Deal
                  <select value={form.dealId} onChange={(event) => handleLinkedDealChange(event.target.value)} disabled={!isAdmin}>
                    <option value="">Unlinked</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.homeownerName} / {deal.projectType}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Assigned Contractor
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {linkedContractor?.companyName ?? 'Unassigned Contractor'}
                  </p>
                </div>
                <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                    Linked Deal
                  </p>
                  <p className="mt-2 text-sm font-black text-slate-950">
                    {linkedDeal
                      ? `${linkedDeal.homeownerName} / ${formatDealStatus(linkedDeal.status)}`
                      : 'No linked deal'}
                  </p>
                </div>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Customer Notes
                  <textarea
                    rows={3}
                    value={form.customerNotes}
                    onChange={(event) => updateForm('customerNotes', event.target.value)}
                    readOnly={!isAdmin}
                  />
                </label>
                <label className="grid gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-slate-700 sm:col-span-2">
                  Internal Notes - Not visible to customer
                  <textarea
                    rows={4}
                    value={form.internalNotes}
                    onChange={(event) => updateForm('internalNotes', event.target.value)}
                  />
                </label>
              </div>
              {selectedAppointment && (
                <section className="mt-5 rounded-[0.5rem] border border-slate-200 bg-white p-4">
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
              {selectedAppointment && emailPreviews.length > 0 && (
                <section className="mt-5 rounded-[0.5rem] border border-slate-200 bg-white p-4">
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
                        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            Subject
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {preview.subject}
                          </p>
                        </div>
                        <div className="mt-3 rounded-[0.5rem] border border-slate-200 bg-white p-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                            Body
                          </p>
                          <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap text-sm font-semibold leading-6 text-slate-700">
                            {preview.body}
                          </pre>
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
                            disabled={!preview.metadata.recipientEmail}
                            className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Open Email Client
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendEmail(preview)}
                            disabled={
                              !preview.metadata.recipientEmail ||
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
            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              {isAdmin && selectedAppointment && !selectedAppointment.dealId && (
                <button
                  type="button"
                  onClick={handleCreateDealFromAppointment}
                  className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb] sm:mr-auto"
                >
                  Create Deal From Consultation
                </button>
              )}
              {isAdmin && selectedAppointment && (
                <button
                  type="button"
                  onClick={handleDeleteAppointment}
                  className="rounded-[0.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  Delete
                </button>
              )}
              <button type="button" onClick={closePanel} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={saveAppointment} className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]">
                {isCreating ? 'Schedule Consultation' : 'Save Consultation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDispatchPanelOpen && selectedAppointment && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
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

      {isSyncPanelOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  External Calendar Sync
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  Legacy Google Calendar import
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsSyncPanelOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close calendar sync panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#e8f1fb] p-4 text-[#17385f]">
                <p className="text-sm font-bold">Native scheduling is now primary.</p>
                <p className="mt-2 text-sm font-semibold leading-6">
                  Google Calendar remains available as an optional legacy import
                  path while OntarioReno moves toward an internal scheduling
                  workflow.
                </p>
              </div>
              <div className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Connection Status
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {calendarConnection ? 'Google Calendar connected' : 'Not connected'}
                </p>
                {calendarConnection && (
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Calendar: {calendarConnection.calendarId} / Connected:{' '}
                    {new Date(calendarConnection.connectedAt).toLocaleString()}
                  </p>
                )}
              </div>
              {connectionMessage && (
                <p className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">
                  {connectionMessage}
                </p>
              )}
              {importMessage && (
                <p className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-3 text-sm font-bold text-slate-700">
                  {importMessage}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              {calendarConnection && (
                <button type="button" onClick={handleDisconnectGoogleCalendar} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 sm:mr-auto">
                  Disconnect
                </button>
              )}
              <button type="button" onClick={() => setIsSyncPanelOpen(false)} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Close
              </button>
              <button type="button" onClick={handleConnectGoogleCalendar} disabled={isConnecting} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">
                {isConnecting ? 'Connecting...' : 'Connect Google Calendar'}
              </button>
              <button type="button" onClick={importUpcomingGoogleEvents} disabled={isImporting || !calendarConnection} className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50">
                <CloudDownload className="h-4 w-4" />
                {isImporting ? 'Importing...' : 'Import Upcoming Events'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
