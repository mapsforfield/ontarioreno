import { Archive, CalendarDays, ChevronRight, CircleDollarSign, Clock, Download, FileText, Mail, Plus, Search, Send, Trash2, Upload, X } from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { usePortalAuth } from '../auth';
import { getRecommendedContractors } from '../data/recommendations';
import {
  formatCurrency,
  formatDealStatus,
} from '../data/selectors';
import { usePortalData } from '../data/store';
import {
  Appointment,
  AppointmentStatus,
  AppointmentType,
  ConsultationStage,
  Contractor,
  ContractorDispatch,
  ContractorDispatchStatus,
  Deal,
  DealStatus,
} from '../data/types';

const columns: Array<{ label: string; status: DealStatus }> = [
  { label: 'New Lead', status: 'new_lead' },
  { label: 'Appointment Booked', status: 'appointment_booked' },
  { label: 'Quoted', status: 'quoted' },
  { label: 'Negotiating', status: 'negotiating' },
  { label: 'Won', status: 'won' },
  { label: 'Lost', status: 'lost' },
];

type DealFormState = {
  address: string;
  city: string;
  email: string;
  estimatedJobValue: string;
  financingRequired: boolean;
  homeownerName: string;
  nextFollowUpDate: string;
  notes: string;
  phone: string;
  postalCode: string;
  projectType: string;
  status: DealStatus;
};

type AppointmentFormState = {
  appointmentDate: string;
  appointmentTime: string;
  appointmentType: AppointmentType;
  assignedRepId: string;
  consultationStage: ConsultationStage;
  contractorId: string;
  customerNotes: string;
  internalNotes: string;
  location: string;
  notes: string;
  status: AppointmentStatus;
};

type DispatchFormState = {
  contractorIds: string[];
  desiredTimeline: string;
  estimatedProjectRange: string;
  financingRequired: boolean;
  safeSummary: string;
};

const dispatchStatusOptions: ContractorDispatchStatus[] = [
  'viewed',
  'interested',
  'accepted',
  'declined',
  'expired',
];

const emptyDealForm: DealFormState = {
  address: '',
  city: '',
  email: '',
  estimatedJobValue: '0',
  financingRequired: true,
  homeownerName: '',
  nextFollowUpDate: '',
  notes: '',
  phone: '',
  postalCode: '',
  projectType: '',
  status: 'new_lead',
};

const emptyAppointmentForm: AppointmentFormState = {
  appointmentDate: '',
  appointmentTime: '',
  appointmentType: 'home_visit',
  assignedRepId: '',
  consultationStage: 'consultation_scheduled',
  contractorId: '',
  customerNotes: '',
  internalNotes: '',
  location: '',
  notes: '',
  status: 'scheduled',
};

function dealToForm(deal: Deal): DealFormState {
  return {
    address: deal.address ?? '',
    city: deal.city,
    email: deal.email,
    estimatedJobValue: String(deal.estimatedJobValue),
    financingRequired: deal.financingRequired,
    homeownerName: deal.homeownerName,
    nextFollowUpDate: deal.nextFollowUpDate,
    notes: deal.notes,
    phone: deal.phone,
    postalCode: deal.postalCode ?? '',
    projectType: deal.projectType,
    status: deal.status,
  };
}

function formatTimelineTime(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function appointmentToForm(appointment: Appointment): AppointmentFormState {
  return {
    appointmentDate: appointment.appointmentDate,
    appointmentTime: appointment.appointmentTime,
    appointmentType: appointment.appointmentType,
    assignedRepId: appointment.assignedRepId,
    consultationStage: appointment.consultationStage ?? 'consultation_scheduled',
    contractorId: appointment.contractorId ?? '',
    customerNotes: appointment.customerNotes ?? '',
    internalNotes: appointment.internalNotes ?? appointment.notes ?? '',
    location: appointment.location,
    notes: appointment.notes,
    status: appointment.status,
  };
}

function formatAppointmentType(type: AppointmentType) {
  if (type === 'home_visit') return 'Home Visit';
  if (type === 'phone_consultation') return 'Phone Consultation';

  return 'Video Consultation';
}

function formatAppointmentStatus(status: AppointmentStatus) {
  if (status === 'no_show') return 'No-show';

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatDispatchStatus(status: ContractorDispatchStatus) {
  return status
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}

function getValueRange(value: number) {
  const lower = Math.max(Math.floor((value - 10000) / 10000) * 10000, 0);
  const upper = Math.ceil((value + 10000) / 10000) * 10000;
  const formatRangeValue = (rangeValue: number) =>
    `$${Math.round(rangeValue / 1000)}k`;

  return `${formatRangeValue(lower)}-${formatRangeValue(upper)}`;
}

function getDealRot(deal: Deal): { days: number; level: 'warn' | 'danger' } | null {
  if (deal.status !== 'negotiating') return null;
  const days = Math.floor((Date.now() - new Date(deal.updatedAt).getTime()) / 86_400_000);
  if (days >= 14) return { days, level: 'danger' };
  if (days >= 7)  return { days, level: 'warn' };
  return null;
}

export default function PortalDeals() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    addContractorDispatch,
    addDealActivity,
    addDeal,
    addAppointment,
    addProposalHistory,
    assignDispatchContractor,
    assignContractorToDeal,
    clients,
    contractors,
    deleteDeal,
    getActivitiesForUser,
    getAppointmentsForDeal,
    getDispatchesForDeal,
    getVisibleDealsForUser,
    updateContractorDispatch,
    updateDeal,
    updateAppointment,
    users,
    calculateHistoricalSalesTotal,
    calculateHistoricalSalesCount,
    salesAgreements,
    getUploadToken,
    addSalesAgreement,
    deleteSalesAgreement,
  } = usePortalData();
  const visibleDeals = currentUser ? getVisibleDealsForUser(currentUser) : [];
  const visibleActivities = currentUser ? getActivitiesForUser(currentUser) : [];
  const selectableContractors = isAdmin
    ? contractors
    : contractors.filter(
        (contractor) => contractor.contractorStatus === 'active'
      );
  const [mobileStageFilter, setMobileStageFilter] = useState<DealStatus | null>(null);
  const columnsToRender = mobileStageFilter
    ? columns.filter((col) => col.status === mobileStageFilter)
    : columns;
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [form, setForm] = useState<DealFormState>(emptyDealForm);
  const [activityNote, setActivityNote] = useState('');
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [dealPendingDelete, setDealPendingDelete] = useState<Deal | null>(null);
  const [agreementUploading, setAgreementUploading] = useState(false);
  const [agreementError, setAgreementError] = useState('');
  const [viewingRecommendedContractorId, setViewingRecommendedContractorId] =
    useState<string | null>(null);
  const [isDispatchPanelOpen, setIsDispatchPanelOpen] = useState(false);
  const [dispatchActionMessage, setDispatchActionMessage] = useState('');
  const [dispatchForm, setDispatchForm] = useState<DispatchFormState>({
    contractorIds: [],
    desiredTimeline: '',
    estimatedProjectRange: '',
    financingRequired: false,
    safeSummary: '',
  });
  const [appointmentForm, setAppointmentForm] =
    useState<AppointmentFormState>(emptyAppointmentForm);
  const [clientSearch, setClientSearch] = useState('');
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const handledNavState = useRef<string | null>(null);
  const selectedDeal = visibleDeals.find((deal) => deal.id === selectedDealId);
  const selectedDealAppointments = selectedDeal
    ? getAppointmentsForDeal(selectedDeal.id)
    : [];
  const selectedAppointment = selectedDealAppointments[0];
  const canDeleteSelectedDeal = Boolean(
    currentUser &&
      selectedDeal &&
      (currentUser.role === 'admin' ||
        selectedDeal.assignedRepId === currentUser.id)
  );
  const recommendedContractors = selectedDeal
    ? getRecommendedContractors(selectedDeal, selectableContractors)
    : [];
  const selectedDealDispatches = selectedDeal
    ? getDispatchesForDeal(selectedDeal.id)
    : [];
  const dispatchContractorOptions = [...selectableContractors].sort(
    (first, second) => {
      if (!dispatchForm.financingRequired) {
        return second.priorityScore - first.priorityScore;
      }
      if (first.financingStatus === second.financingStatus) {
        return second.priorityScore - first.priorityScore;
      }
      if (first.financingStatus === 'financing_available') return -1;
      if (second.financingStatus === 'financing_available') return 1;
      return second.priorityScore - first.priorityScore;
    }
  );
  const selectedDispatchContractors = contractors.filter((contractor) =>
    dispatchForm.contractorIds.includes(contractor.id)
  );
  const dispatchPreviewMessage = selectedDeal
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
        `- Area: ${selectedDeal.city || 'General Ontario area'}`,
        `- Project type: ${selectedDeal.projectType || 'Renovation project'}`,
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
  const viewingRecommendedContractor = contractors.find(
    (contractor) => contractor.id === viewingRecommendedContractorId
  );
  const reps = users.filter((user) => user.role === 'rep' && user.active);
  const isPanelOpen = Boolean(selectedDeal || isAddingDeal);
  const selectedDealTimeline = selectedDeal
    ? [
        ...visibleActivities
          .filter((activity) => activity.dealId === selectedDeal.id)
          .map((activity) => ({
            actor: `${activity.actorName} / ${activity.actorRole}`,
            createdAt: activity.createdAt,
            id: activity.id,
            label: activity.actionLabel,
            type: activity.entityType,
          })),
        ...(selectedDeal.activity ?? [])
          .filter(
            (dealActivity) =>
              !visibleActivities.some(
                (activity) =>
                  activity.dealId === selectedDeal.id &&
                  activity.actionLabel.includes(dealActivity.note)
              )
          )
          .map((dealActivity) => ({
            actor: 'Legacy note',
            createdAt: dealActivity.createdAt,
            id: dealActivity.id,
            label: dealActivity.note,
            type: 'deal',
          })),
      ].sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      )
    : [];

  // Handle nav state: prefillClient (from Clients page) and openDealId (from Dashboard)
  useEffect(() => {
    const state = location.state as { prefillClient?: import('../data/types').Client; openDealId?: string } | null;
    const prefill = state?.prefillClient;
    if (prefill && handledNavState.current !== `prefill-${prefill.id}`) {
      handledNavState.current = `prefill-${prefill.id}`;
      setSelectedDealId(null);
      setIsAddingDeal(true);
      setForm({
        ...emptyDealForm,
        homeownerName: prefill.name,
        phone: prefill.phone ?? '',
        email: prefill.email ?? '',
        address: prefill.address ?? '',
        city: prefill.city ?? '',
        postalCode: prefill.postalCode ?? '',
        projectType: prefill.projectTypes?.[0] ?? '',
      });
    }
    const dealId = state?.openDealId;
    if (dealId && handledNavState.current !== dealId) {
      handledNavState.current = dealId;
      const dealToOpen = visibleDeals.find((d) => d.id === dealId);
      setSelectedDealId(dealId);
      setIsAddingDeal(false);
      if (dealToOpen) openDeal(dealToOpen);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const openAddDeal = () => {
    setSelectedDealId(null);
    setIsAddingDeal(true);
    setForm(emptyDealForm);
    setActivityNote('');
    setIsEditingAppointment(false);
    setViewingRecommendedContractorId(null);
    setIsDispatchPanelOpen(false);
    setAppointmentForm(emptyAppointmentForm);
  };

  const openDeal = (deal: Deal) => {
    setIsAddingDeal(false);
    setSelectedDealId(deal.id);
    const appointment = getAppointmentsForDeal(deal.id)[0];
    // Fall back to linked appointment for address fields missing on the deal
    const baseForm = dealToForm(deal);
    setForm({
      ...baseForm,
      address: baseForm.address || appointment?.address || '',
      city: baseForm.city || appointment?.city || '',
      postalCode: baseForm.postalCode || appointment?.postalCode || '',
      phone: baseForm.phone || appointment?.phone || '',
      email: baseForm.email || appointment?.email || '',
    });
    setActivityNote('');
    setAppointmentForm(
      appointment
        ? appointmentToForm(appointment)
        : {
            ...emptyAppointmentForm,
            assignedRepId: deal.assignedRepId,
          }
    );
    setIsEditingAppointment(false);
    setViewingRecommendedContractorId(null);
    setIsDispatchPanelOpen(false);
  };

  const closePanel = () => {
    setSelectedDealId(null);
    setIsAddingDeal(false);
    setIsEditingAppointment(false);
    setViewingRecommendedContractorId(null);
    setIsDispatchPanelOpen(false);
  };

  const saveDeal = () => {
    if (!currentUser || !form.homeownerName.trim()) return;

    const dealPayload = {
      address: form.address.trim(),
      city: form.city.trim(),
      email: form.email.trim(),
      estimatedJobValue: Number(form.estimatedJobValue) || 0,
      financingRequired: form.financingRequired,
      homeownerName: form.homeownerName.trim(),
      notes: form.notes.trim(),
      phone: form.phone.trim(),
      postalCode: form.postalCode.trim(),
      projectType: form.projectType.trim(),
      nextFollowUpDate: form.nextFollowUpDate,
    };

    if (isAddingDeal) {
      addDeal(dealPayload, currentUser.id, currentUser);
    } else if (selectedDeal) {
      updateDeal(selectedDeal.id, {
        ...dealPayload,
        status: form.status,
      }, currentUser);
    }

    closePanel();
  };

  const updateForm = <Field extends keyof DealFormState>(
    field: Field,
    value: DealFormState[Field]
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveActivityNote = () => {
    if (!selectedDeal || !activityNote.trim()) return;

    addDealActivity(selectedDeal.id, activityNote, currentUser ?? undefined);
    setActivityNote('');
  };

  const openAppointmentForm = () => {
    if (!selectedDeal) return;

    setAppointmentForm(
      selectedAppointment
        ? appointmentToForm(selectedAppointment)
        : {
            ...emptyAppointmentForm,
            assignedRepId: selectedDeal.assignedRepId,
            consultationStage: 'consultation_scheduled',
            contractorId: selectedDeal.assignedContractorId ?? '',
          }
    );
    setIsEditingAppointment(true);
  };

  const updateAppointmentForm = <Field extends keyof AppointmentFormState>(
    field: Field,
    value: AppointmentFormState[Field]
  ) => {
    setAppointmentForm((current) => ({ ...current, [field]: value }));
  };

  const saveAppointment = () => {
    if (!currentUser || !selectedDeal || !appointmentForm.appointmentDate) {
      return;
    }

    const payload = {
      address: appointmentForm.location.trim(),
      assignedRepId: appointmentForm.assignedRepId || selectedDeal.assignedRepId,
      appointmentDate: appointmentForm.appointmentDate,
      appointmentTime: appointmentForm.appointmentTime,
      appointmentType: appointmentForm.appointmentType,
      consultationStage: appointmentForm.consultationStage,
      contractorId:
        appointmentForm.contractorId || selectedDeal.assignedContractorId,
      city: selectedDeal.city,
      postalCode: selectedAppointment?.postalCode ?? '',
      createdByUserId: selectedAppointment?.createdByUserId ?? currentUser.id,
      closeProbability: selectedAppointment?.closeProbability ?? 0,
      customerNotes: appointmentForm.customerNotes.trim(),
      customerName: selectedDeal.homeownerName,
      dealId: selectedDeal.id,
      durationMinutes: selectedAppointment?.durationMinutes ?? 60,
      email: selectedDeal.email,
      estimatedProjectValue: selectedAppointment?.estimatedProjectValue ?? 0,
      financingNeeded: selectedAppointment?.financingNeeded ?? null,
      followUpDate: selectedAppointment?.followUpDate ?? '',
      homeownerInterestLevel: selectedAppointment?.homeownerInterestLevel ?? null,
      internalNotes: appointmentForm.internalNotes.trim(),
      location: appointmentForm.location.trim(),
      notes: appointmentForm.internalNotes.trim() || appointmentForm.notes.trim(),
      nextStep: selectedAppointment?.nextStep ?? 'no_action',
      objections: selectedAppointment?.objections ?? '',
      outcomeNotes: selectedAppointment?.outcomeNotes ?? '',
      outcomeSubmitted: selectedAppointment?.outcomeSubmitted ?? false,
      phone: selectedDeal.phone,
      projectType: selectedDeal.projectType,
      recommendedContractorId:
        selectedAppointment?.recommendedContractorId ?? null,
      reminderMinutes: selectedAppointment?.reminderMinutes ?? 30,
      status: appointmentForm.status,
    };

    if (selectedAppointment) {
      updateAppointment(selectedAppointment.id, payload, currentUser);
    } else {
      addAppointment(payload, currentUser);
    }

    setIsEditingAppointment(false);
  };

  const assignRecommendedContractor = (contractorId: string) => {
    if (!selectedDeal) return;

    assignContractorToDeal(
      selectedDeal.id,
      contractorId,
      currentUser ?? undefined
    );
    const contractor = contractors.find((candidate) => candidate.id === contractorId);
    if (contractor) {
      addDealActivity(
        selectedDeal.id,
        `Contractor assigned from recommendation: ${contractor.companyName}`,
        currentUser ?? undefined
      );
    }
  };

  const sendRecommendedProposal = (contractor: Contractor) => {
    if (!currentUser || !selectedDeal) return;

    const subject = `OntarioReno Opportunity - ${selectedDeal.projectType} in ${selectedDeal.city}`;
    const body = `Hi ${contractor.contactName},

We have a potential renovation opportunity that may be a fit for ${contractor.companyName}.

Project overview:
- Area: ${selectedDeal.city}
- Project type: ${selectedDeal.projectType}
- Estimated project range: ${getValueRange(selectedDeal.estimatedJobValue)}
- Financing required: ${selectedDeal.financingRequired ? 'Yes' : 'No'}

At this stage, homeowner contact details are not being shared until the opportunity is accepted and assigned.

OntarioReno Broker Portal`;

    addProposalHistory(
      {
        contractorId: contractor.id,
        dealId: selectedDeal.id,
        proposalBody: body,
        proposalSubject: subject,
        sentByUserId: currentUser.id,
        templateType: selectedDeal.financingRequired
          ? 'financing_required'
          : 'cash_job',
      },
      currentUser
    );
    addDealActivity(
      selectedDeal.id,
      `Proposal sent from recommendation to ${contractor.companyName}`,
      currentUser
    );
  };

  const openDispatchPanel = (contractorId?: string) => {
    if (!selectedDeal) return;

    setDispatchForm({
      contractorIds:
        contractorId ||
        selectedDeal.assignedContractorId ||
        recommendedContractors[0]?.contractor.id
          ? [
              contractorId ||
                selectedDeal.assignedContractorId ||
                recommendedContractors[0]?.contractor.id,
            ].filter(Boolean) as string[]
          : [],
      desiredTimeline: selectedDeal.nextFollowUpDate
        ? `Follow up around ${selectedDeal.nextFollowUpDate}`
        : '',
      estimatedProjectRange: getValueRange(selectedDeal.estimatedJobValue),
      financingRequired: selectedDeal.financingRequired,
      safeSummary: `${selectedDeal.projectType || 'Renovation'} opportunity in ${
        selectedDeal.city || 'Ontario'
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
    if (!selectedDeal || selectedDispatchContractors.length !== 1) return;
    const contractor = selectedDispatchContractors[0];
    if (!contractor.email) return;

    window.location.href = `mailto:${encodeURIComponent(
      contractor.email
    )}?subject=${encodeURIComponent(
      `OntarioReno Opportunity - ${selectedDeal.projectType} in ${selectedDeal.city}`
    )}&body=${encodeURIComponent(dispatchPreviewMessage)}`;
    setDispatchActionMessage(`Email client opened for ${contractor.companyName}.`);
  };

  const markDispatchesSent = () => {
    if (!currentUser || !selectedDeal || dispatchForm.contractorIds.length === 0) {
      setDispatchActionMessage('Select at least one contractor first.');
      return;
    }

    dispatchForm.contractorIds.forEach((contractorId) => {
      addContractorDispatch(
        {
          consultationId: selectedAppointment?.id,
          contractorId,
          contractorResponseNote: '',
          dealId: selectedDeal.id,
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
    if (!currentUser) return;
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
    if (!currentUser) return;
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

  const confirmDeleteDeal = () => {
    if (!currentUser || !dealPendingDelete) return;
    if (
      currentUser.role !== 'admin' &&
      dealPendingDelete.assignedRepId !== currentUser.id
    ) {
      setDealPendingDelete(null);
      return;
    }

    deleteDeal(dealPendingDelete.id, currentUser);
    setDealPendingDelete(null);
    closePanel();
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Deal CRM
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
            Pipeline workspace
          </h1>
        </div>
        {currentUser && (
          <button
            type="button"
            onClick={openAddDeal}
            className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#153158]"
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </button>
        )}
      </header>

      {/* ── Historical Sales Banner (only shown if rep has historical deals) ── */}
      {currentUser && (() => {
        const repId = isAdmin ? null : currentUser.id;
        if (!repId) return null;
        const histCount = calculateHistoricalSalesCount(repId);
        const histTotal = calculateHistoricalSalesTotal(repId);
        if (histCount === 0) return null;
        return (
          <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-gradient-to-r from-[#e8f1fb] to-[#f6faff] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B3C6C]/10">
                  <Archive className="h-5 w-5 text-[#1B3C6C]" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                    Pre-Portal Career Sales
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-600">
                    {histCount} historical deal{histCount !== 1 ? 's' : ''} imported from before the portal — not counted on the leaderboard.
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#1B3C6C]">{formatCurrency(histTotal)}</p>
                <p className="text-xs font-semibold text-slate-500">total career sales volume</p>
              </div>
            </div>
          </section>
        );
      })()}

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500">
          <Search className="h-4 w-4" />
          <span className="text-sm font-semibold">Search deals placeholder</span>
        </div>
      </section>

      {/* ── Mobile pipeline strip ──────────────────────────────── */}
      <section className="lg:hidden">
        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4">
          <div className="flex w-max items-center gap-1 py-1">
            {/* All pill */}
            <button
              type="button"
              onClick={() => setMobileStageFilter(null)}
              className={cn(
                'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.68rem] font-bold transition',
                mobileStageFilter === null
                  ? 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              )}
            >
              All
              <span
                className={cn(
                  'flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[0.58rem] font-black',
                  mobileStageFilter === null ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                )}
              >
                {visibleDeals.length}
              </span>
            </button>

            {columns.map((col, colIndex) => {
              const stageCount = visibleDeals.filter((d) => d.status === col.status).length;
              const isActive = mobileStageFilter === col.status;
              const isWon = col.status === 'won';
              const isLost = col.status === 'lost';
              const shortLabel = col.label.replace('Appointment ', '');

              return (
                <Fragment key={col.status}>
                  {/* Vertical separator before Lost — it's an off-ramp, not a funnel step */}
                  {isLost ? (
                    <span className="mx-1 h-5 w-px shrink-0 bg-slate-300" />
                  ) : colIndex > 0 ? (
                    <ChevronRight className="h-3 w-3 shrink-0 text-slate-300" />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setMobileStageFilter(isActive ? null : col.status)}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[0.68rem] font-bold transition',
                      isActive
                        ? isWon
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : isLost
                          ? 'border-slate-600 bg-slate-600 text-white'
                          : 'border-[#1B3C6C] bg-[#1B3C6C] text-white'
                        : isWon
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : isLost
                        ? 'border-slate-200 bg-slate-100 text-slate-500 hover:bg-slate-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {shortLabel}
                    <span
                      className={cn(
                        'flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[0.58rem] font-black',
                        isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                      )}
                    >
                      {stageCount}
                    </span>
                  </button>
                </Fragment>
              );
            })}
          </div>
        </div>

        {/* Stage summary when a filter is active */}
        {mobileStageFilter && (() => {
          const stageDeals = visibleDeals.filter((d) => d.status === mobileStageFilter);
          const stageValue = stageDeals.reduce((sum, d) => sum + d.estimatedJobValue, 0);
          const stageLabel = columns.find((c) => c.status === mobileStageFilter)?.label ?? '';
          return (
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2">
              <span className="text-xs font-black text-slate-900">{stageLabel}</span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-bold text-slate-600">
                {stageDeals.length} deal{stageDeals.length !== 1 ? 's' : ''}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-bold text-[#1B3C6C]">{formatCurrency(stageValue)}</span>
            </div>
          );
        })()}
      </section>

      <section className="w-full overflow-x-auto overscroll-x-contain pb-3 [scrollbar-gutter:stable]">
        <div className="grid min-w-full gap-4 md:grid-flow-col md:auto-cols-[clamp(300px,calc((100vw-24rem)/5),320px)] md:grid-cols-none">
          {columnsToRender.map((column) => {
            const columnDeals = visibleDeals.filter(
              (deal) => deal.status === column.status
            );
            const columnTotal = columnDeals.reduce((sum, d) => sum + (d.estimatedJobValue || 0), 0);
            const columnTotalLabel = columnTotal > 0
              ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }).format(columnTotal)
              : null;

            return (
              <article
                key={column.status}
                className="min-h-[16rem] rounded-[0.5rem] border border-white bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div className="min-w-0">
                    <h2 className="whitespace-nowrap text-sm font-black uppercase leading-snug tracking-[0.12em] text-slate-700">
                      {column.label}
                    </h2>
                    {isAdmin && columnTotalLabel && (
                      <p className="mt-0.5 text-xs font-bold text-slate-400">{columnTotalLabel}</p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-500">
                    {columnDeals.length}
                  </span>
                </div>
                {columnDeals.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {columnDeals.map((deal) => {
                      const contractor = contractors.find(
                        (candidate) =>
                          candidate.id === deal.assignedContractorId
                      );
                      const rep = deal.assignedRepId
                        ? users.find((u) => u.id === deal.assignedRepId)
                        : undefined;
                      const rot = getDealRot(deal);

                      return (
                        <button
                          key={deal.id}
                          type="button"
                          onClick={() => openDeal(deal)}
                          className={`w-full rounded-[0.5rem] border p-3 text-left transition hover:bg-white ${
                            rot?.level === 'danger'
                              ? 'border-red-200 bg-red-50 hover:border-red-300'
                              : rot?.level === 'warn'
                                ? 'border-amber-200 bg-amber-50 hover:border-amber-300'
                                : 'border-slate-200 bg-[#fbfdff] hover:border-[#b8c9dd]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-black text-slate-950">
                              {deal.homeownerName}
                            </p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {rot && (
                                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.6rem] font-black ${
                                  rot.level === 'danger'
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-amber-100 text-amber-600'
                                }`}>
                                  <Clock className="h-2.5 w-2.5" />
                                  {rot.days}d idle
                                </span>
                              )}
                              {deal.isHistorical && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate-400">
                                  Pre-portal
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {deal.city} - {deal.projectType}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-black text-[#1B3C6C]">
                              {formatCurrency(deal.estimatedJobValue)}
                            </span>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {isAdmin && rep && (
                                <span className="rounded-full bg-[#e8f1fb] px-2 py-1 text-[0.65rem] font-bold text-[#1B3C6C]">
                                  {rep.name.split(' ')[0]}
                                </span>
                              )}
                              <span className="max-w-full rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-bold text-slate-500">
                                {contractor?.companyName ?? 'Unassigned'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 px-3 text-center">
                    {column.status === 'new_lead' ? (
                      <>
                        <CalendarDays className="h-7 w-7 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-500">
                          No deals yet
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Deals are created from consultations.
                        </p>
                        <Link
                          to="/portal/appointments"
                          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#1B3C6C] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#153158]"
                        >
                          <CalendarDays className="h-3 w-3" />
                          Schedule Consultation
                        </Link>
                      </>
                    ) : (
                      <>
                        <CircleDollarSign className="h-7 w-7 text-slate-300" />
                        <p className="mt-3 text-sm font-semibold text-slate-500">
                          No deals yet
                        </p>
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {isPanelOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Deal details
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  {isAddingDeal
                    ? 'Add Deal'
                    : selectedDeal?.homeownerName ?? 'Deal'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close deal details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* ── Client autofill search (new deals only) ── */}
                {isAddingDeal && (
                  <div className="sm:col-span-2 relative">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">
                      Pull from existing client
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone…"
                      value={clientSearch}
                      onChange={(e) => { setClientSearch(e.target.value); setClientSearchOpen(true); }}
                      onFocus={() => setClientSearchOpen(true)}
                      className="w-full rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:border-[#1B3C6C] focus:outline-none focus:ring-0"
                    />
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
                                updateForm('homeownerName', c.name);
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
                  Homeowner Name
                  <input
                    value={form.homeownerName}
                    onChange={(event) =>
                      updateForm('homeownerName', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Phone
                  <input
                    value={form.phone}
                    onChange={(event) => updateForm('phone', event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Email
                  <input
                    value={form.email}
                    onChange={(event) => updateForm('email', event.target.value)}
                  />
                </label>
                <label className="col-span-full grid gap-1.5 text-sm font-bold text-slate-700">
                  Address
                  <input
                    value={form.address}
                    onChange={(event) => updateForm('address', event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  City
                  <input
                    value={form.city}
                    onChange={(event) => updateForm('city', event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Postal Code
                  <input
                    value={form.postalCode}
                    onChange={(event) => updateForm('postalCode', event.target.value)}
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Project Type
                  <input
                    value={form.projectType}
                    onChange={(event) =>
                      updateForm('projectType', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Estimated Job Value
                  <input
                    min={0}
                    type="number"
                    value={form.estimatedJobValue}
                    onChange={(event) =>
                      updateForm('estimatedJobValue', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Financing Required
                  <select
                    value={form.financingRequired ? 'yes' : 'no'}
                    onChange={(event) =>
                      updateForm(
                        'financingRequired',
                        event.target.value === 'yes'
                      )
                    }
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                {!isAddingDeal && (
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Status
                    <select
                      value={form.status}
                      onChange={(event) =>
                        updateForm('status', event.target.value as DealStatus)
                      }
                    >
                      {columns.map((column) => (
                        <option key={column.status} value={column.status}>
                          {column.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Next Follow-Up Date
                  <input
                    type="date"
                    value={form.nextFollowUpDate}
                    onChange={(event) =>
                      updateForm('nextFollowUpDate', event.target.value)
                    }
                  />
                </label>
                {!isAddingDeal && selectedDeal && (
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Assigned Contractor
                    <select
                      value={selectedDeal.assignedContractorId ?? ''}
                      onChange={(event) =>
                        assignContractorToDeal(
                          selectedDeal.id,
                          event.target.value || null,
                          currentUser ?? undefined
                        )
                      }
                    >
                      <option value="">Unassigned</option>
                      {selectedDeal.assignedContractorId &&
                        !selectableContractors.some(
                          (contractor) =>
                            contractor.id === selectedDeal.assignedContractorId
                        ) && (
                          <option
                            disabled
                            value={selectedDeal.assignedContractorId}
                          >
                            {contractors.find(
                              (contractor) =>
                                contractor.id ===
                                selectedDeal.assignedContractorId
                            )?.companyName ?? 'Inactive contractor'}{' '}
                            (Unavailable)
                          </option>
                        )}
                      {selectableContractors.map((contractor) => (
                        <option key={contractor.id} value={contractor.id}>
                          {contractor.companyName}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {!isAddingDeal && selectedDeal && (
                  <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Current Status
                    </p>
                    <p className="mt-2 text-sm font-black text-slate-900">
                      {formatDealStatus(selectedDeal.status)}
                    </p>
                  </div>
                )}
                <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                  Notes
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(event) => updateForm('notes', event.target.value)}
                  />
                </label>
              </div>

              {!isAddingDeal && selectedDeal && (
                <section className="mt-6 rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                        Contractor Dispatch
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Send this opportunity only after the summary is safe.
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDispatchPanel()}
                      className="inline-flex w-fit items-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                    >
                      <Send className="h-4 w-4" />
                      Dispatch to Contractor
                    </button>
                  </div>
                </section>
              )}

              {!isAddingDeal && selectedDeal && (
                <section className="mt-6 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Contractor Dispatch History
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Responses and assignment
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => openDispatchPanel()}
                      className="inline-flex w-fit items-center gap-2 rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                    >
                      <Send className="h-4 w-4" />
                      Dispatch
                    </button>
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedDealDispatches.length > 0 ? (
                      selectedDealDispatches.map((dispatch) => {
                        const contractor = contractors.find(
                          (candidate) => candidate.id === dispatch.contractorId
                        );
                        const sender = users.find(
                          (user) => user.id === dispatch.sentByUserId
                        );

                        return (
                          <article
                            key={dispatch.id}
                            className="rounded-[0.5rem] border border-slate-200 bg-white p-3"
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
                                onClick={() =>
                                  currentUser &&
                                  assignDispatchContractor(dispatch.id, currentUser)
                                }
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
                      <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-slate-500">
                        No contractor dispatches yet.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {!isAddingDeal && selectedDeal && (
                <section className="mt-6 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Recommended Contractors
                    </p>
                    <h3 className="mt-1 text-lg font-black text-slate-950">
                      Rule-based contractor fits
                    </h3>
                  </div>
                  <div className="mt-4 space-y-3">
                    {recommendedContractors.length > 0 ? (
                      recommendedContractors.map((recommendation) => (
                        <article
                          key={recommendation.contractor.id}
                          className="rounded-[0.5rem] border border-slate-200 bg-white p-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="text-base font-black text-slate-950">
                                  {recommendation.contractor.companyName}
                                </h4>
                                <span className="rounded-full bg-[#e8f1fb] px-2.5 py-1 text-[0.65rem] font-black text-[#1B3C6C]">
                                  {recommendation.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {recommendation.contractor.contactName} / Score{' '}
                                {recommendation.contractor.priorityScore}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setViewingRecommendedContractorId(
                                    recommendation.contractor.id
                                  )
                                }
                                className="rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
                              >
                                View Details
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  sendRecommendedProposal(
                                    recommendation.contractor
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
                              >
                                <Mail className="h-3.5 w-3.5" />
                                Send Proposal
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openDispatchPanel(
                                    recommendation.contractor.id
                                  )
                                }
                                className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-xs font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                              >
                                <Send className="h-3.5 w-3.5" />
                                Dispatch
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  assignRecommendedContractor(
                                    recommendation.contractor.id
                                  )
                                }
                                className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#153158]"
                              >
                                Assign Contractor
                              </button>
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {recommendation.reasons.map((reason) => (
                              <span
                                key={reason}
                                className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-bold text-slate-600"
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-slate-500">
                        No active contractor recommendations are available for
                        this deal yet.
                      </p>
                    )}
                  </div>
                  {viewingRecommendedContractor && (
                    <div className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-black text-slate-950">
                            {viewingRecommendedContractor.companyName}
                          </h4>
                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {viewingRecommendedContractor.contactName} /{' '}
                            {viewingRecommendedContractor.email || 'No email'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setViewingRecommendedContractorId(null)}
                          className="text-sm font-bold text-slate-500 transition hover:text-[#1B3C6C]"
                        >
                          Close
                        </button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            Service Areas
                          </p>
                          <p className="mt-1 text-sm font-bold">
                            {viewingRecommendedContractor.serviceAreas.join(
                              ', '
                            ) || 'Ontario'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            Project Types
                          </p>
                          <p className="mt-1 text-sm font-bold">
                            {viewingRecommendedContractor.projectTypes.join(
                              ', '
                            ) || 'Renovation'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            Financing
                          </p>
                          <p className="mt-1 text-sm font-bold">
                            {viewingRecommendedContractor.financingStatus}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            Notes
                          </p>
                          <p className="mt-1 text-sm font-bold">
                            {viewingRecommendedContractor.notes || 'No notes'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {!isAddingDeal && selectedDeal && (
                <section className="mt-6 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Consultation
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Linked consultation
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={openAppointmentForm}
                      className="rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                    >
                      {selectedAppointment
                        ? 'Edit Consultation'
                        : 'Schedule Consultation'}
                    </button>
                  </div>

                  {isEditingAppointment ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Assigned Rep
                        <select
                          value={appointmentForm.assignedRepId}
                          disabled={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm(
                              'assignedRepId',
                              event.target.value
                            )
                          }
                        >
                          {reps.map((rep) => (
                            <option key={rep.id} value={rep.id}>
                              {rep.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Assigned Contractor
                        <select
                          value={appointmentForm.contractorId}
                          disabled={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm(
                              'contractorId',
                              event.target.value
                            )
                          }
                        >
                          <option value="">Unassigned Contractor</option>
                          {contractors
                            .filter(
                              (contractor) =>
                                contractor.contractorStatus === 'active' ||
                                isAdmin
                            )
                            .map((contractor) => (
                              <option key={contractor.id} value={contractor.id}>
                                {contractor.companyName}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Consultation Type
                        <select
                          value={appointmentForm.appointmentType}
                          disabled={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm(
                              'appointmentType',
                              event.target.value as AppointmentType
                            )
                          }
                        >
                          <option value="home_visit">Home Visit</option>
                          <option value="phone_consultation">
                            Phone Consultation
                          </option>
                          <option value="video_consultation">
                            Video Consultation
                          </option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Date
                        <input
                          type="date"
                          value={appointmentForm.appointmentDate}
                          readOnly={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm(
                              'appointmentDate',
                              event.target.value
                            )
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Time
                        <input
                          type="time"
                          value={appointmentForm.appointmentTime}
                          readOnly={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm(
                              'appointmentTime',
                              event.target.value
                            )
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Status
                        <select
                          value={appointmentForm.status}
                          onChange={(event) =>
                            updateAppointmentForm(
                              'status',
                              event.target.value as AppointmentStatus
                            )
                          }
                        >
                          {Array.from(
                            new Map(
                              (isAdmin
                                ? [
                                    ['scheduled', 'Scheduled'],
                                    ['confirmed', 'Confirmed'],
                                    ['completed', 'Completed'],
                                    ['rescheduled', 'Rescheduled'],
                                    ['cancelled', 'Cancelled'],
                                    ['no_show', 'No-show'],
                                  ]
                                : [
                                    [
                                      appointmentForm.status,
                                      formatAppointmentStatus(
                                        appointmentForm.status
                                      ),
                                    ],
                                    ['completed', 'Completed'],
                                    ['no_show', 'No-show'],
                                  ]) as Array<[AppointmentStatus, string]>
                            )
                          ).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                        Location
                        <input
                          value={appointmentForm.location}
                          readOnly={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm('location', event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                        Customer Notes
                        <textarea
                          rows={3}
                          value={appointmentForm.customerNotes}
                          readOnly={!isAdmin}
                          onChange={(event) =>
                            updateAppointmentForm('customerNotes', event.target.value)
                          }
                        />
                      </label>
                      <label className="grid gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-slate-700 sm:col-span-2">
                        Internal Notes - Not visible to customer
                        <textarea
                          rows={3}
                          value={appointmentForm.internalNotes}
                          onChange={(event) =>
                            updateAppointmentForm('internalNotes', event.target.value)
                          }
                        />
                      </label>
                      <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setIsEditingAppointment(false)}
                          className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                        >
                          Cancel Consultation Edit
                        </button>
                        <button
                          type="button"
                          onClick={saveAppointment}
                          className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                        >
                          Save Consultation
                        </button>
                      </div>
                    </div>
                  ) : selectedAppointment ? (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        [
                          'Assigned Rep',
                          selectedAppointment.assignedRepId
                            ? users.find(
                                (user) =>
                                  user.id === selectedAppointment.assignedRepId
                              )?.name ?? selectedAppointment.assignedRepId
                            : 'Unassigned Rep',
                        ],
                        [
                          'Assigned Contractor',
                          selectedAppointment.contractorId
                            ? contractors.find(
                                (contractor) =>
                                  contractor.id === selectedAppointment.contractorId
                              )?.companyName ?? 'Unassigned Contractor'
                            : 'Unassigned Contractor',
                        ],
                        [
                          'Type',
                          formatAppointmentType(
                            selectedAppointment.appointmentType
                          ),
                        ],
                        [
                          'Date',
                          selectedAppointment.appointmentDate || 'Not set',
                        ],
                        [
                          'Time',
                          selectedAppointment.appointmentTime || 'Not set',
                        ],
                        [
                          'Status',
                          formatAppointmentStatus(selectedAppointment.status),
                        ],
                        [
                          'Location',
                          selectedAppointment.location || 'Not set',
                        ],
                        [
                          'Customer Notes',
                          selectedAppointment.customerNotes || 'No customer notes yet',
                        ],
                        [
                          'Internal Notes - Not visible to customer',
                          selectedAppointment.internalNotes ||
                            selectedAppointment.notes ||
                            'No internal notes yet',
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-[0.5rem] border border-slate-200 bg-white p-3"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            {label}
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-[0.5rem] border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-slate-500">
                      No consultation has been booked for this deal yet.
                    </p>
                  )}
                </section>
              )}

              {!isAddingDeal && selectedDeal && (() => {
                const dealAgreements = salesAgreements.filter((a) => a.dealId === selectedDeal.id);
                const handleAgreementUpload = async (file: File) => {
                  setAgreementError('');
                  setAgreementUploading(true);
                  try {
                    const tokenData = await getUploadToken(selectedDeal.id);
                    if (!tokenData) { setAgreementError('Could not get upload token. Check blob storage configuration.'); setAgreementUploading(false); return; }
                    const blob = await upload(tokenData.pathname, file, {
                      access: 'private',
                      handleUploadUrl: '',
                      clientPayload: '',
                      // @ts-expect-error — pass token directly
                      token: tokenData.clientToken,
                    });
                    await addSalesAgreement(selectedDeal.id, file.name, blob.url);
                  } catch (err) {
                    setAgreementError(err instanceof Error ? err.message : 'Upload failed.');
                  }
                  setAgreementUploading(false);
                };
                return (
                  <section className="mt-6 rounded-[0.5rem] border border-emerald-200 bg-emerald-50/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">Sales Agreement</p>
                        <h3 className="mt-1 text-lg font-black text-slate-950">Signed Agreement</h3>
                      </div>
                      <label className={`inline-flex cursor-pointer items-center gap-2 rounded-[0.5rem] border border-emerald-300 bg-white px-3 py-2 text-sm font-bold text-emerald-800 transition hover:bg-emerald-50 ${agreementUploading ? 'pointer-events-none opacity-50' : ''}`}>
                        <Upload className="h-4 w-4" />
                        {agreementUploading ? 'Uploading…' : 'Attach PDF'}
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          className="sr-only"
                          disabled={agreementUploading}
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAgreementUpload(f); e.target.value = ''; }}
                        />
                      </label>
                    </div>

                    {agreementError && (
                      <p className="mt-2 text-sm font-semibold text-red-600">{agreementError}</p>
                    )}

                    {dealAgreements.length === 0 ? (
                      <p className="mt-3 rounded-[0.5rem] border border-dashed border-emerald-300 bg-white p-4 text-sm font-semibold text-slate-500">
                        No agreements attached yet.
                      </p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {dealAgreements.map((agreement) => (
                          <div key={agreement.id} className="flex items-center justify-between gap-3 rounded-[0.5rem] border border-emerald-200 bg-white px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <FileText className="h-4 w-4 shrink-0 text-emerald-600" />
                              <span className="truncate text-sm font-bold text-slate-800">{agreement.fileName}</span>
                              <span className="shrink-0 text-xs text-slate-400">{new Date(agreement.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              <a
                                href={agreement.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                title="View"
                              >
                                <FileText className="h-3.5 w-3.5" />
                              </a>
                              <a
                                href={agreement.url}
                                download={agreement.fileName}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                title="Download"
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => deleteSalesAgreement(agreement.id)}
                                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                );
              })()}

              {!isAddingDeal && selectedDeal && (
                <section className="mt-6 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Activity Timeline
                      </p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">
                        Deal activity
                      </h3>
                    </div>
                    <div className="flex flex-col gap-2 sm:min-w-[18rem] sm:flex-row">
                      <input
                        value={activityNote}
                        onChange={(event) => setActivityNote(event.target.value)}
                        placeholder="Add Activity Note"
                        className="min-w-0"
                      />
                      <button
                        type="button"
                        onClick={saveActivityNote}
                        className="rounded-[0.5rem] bg-[#1B3C6C] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#153158]"
                      >
                        Add Activity Note
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    {selectedDealTimeline.length > 0 ? (
                      selectedDealTimeline.map((activity) => (
                        <article
                          key={activity.id}
                          className="rounded-[0.5rem] border border-slate-200 bg-white p-3"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-black text-slate-900">
                                {activity.label}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {activity.actor}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:justify-end">
                              <span className="rounded-full bg-[#e8f1fb] px-2.5 py-1 text-[0.65rem] font-black capitalize text-[#1B3C6C]">
                                {activity.type}
                              </span>
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[0.65rem] font-bold text-slate-500">
                                {formatTimelineTime(activity.createdAt)}
                              </span>
                            </div>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="rounded-[0.5rem] border border-dashed border-slate-300 bg-white p-4 text-sm font-semibold text-slate-500">
                        No activity notes yet
                      </p>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              {canDeleteSelectedDeal && selectedDeal && (
                <button
                  type="button"
                  onClick={() => setDealPendingDelete(selectedDeal)}
                  className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 sm:mr-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Deal
                </button>
              )}
              <button
                type="button"
                onClick={closePanel}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDeal}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
              >
                Save Deal
              </button>
            </div>
          </div>
        </div>
      )}

      {isDispatchPanelOpen && selectedDeal && (
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
              {recommendedContractors.length > 0 && (
                <section className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                    Recommended Contractors
                  </p>
                  <div className="mt-3 space-y-2">
                    {recommendedContractors.map((recommendation) => (
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

      {dealPendingDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[0.5rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.3)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Delete deal
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Delete this deal? This cannot be undone in the local
                  prototype.
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {dealPendingDelete.homeownerName}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDealPendingDelete(null)}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteDeal}
                className="rounded-[0.5rem] bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Delete Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
