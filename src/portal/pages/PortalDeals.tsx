import { CircleDollarSign, Plus, Search, X } from 'lucide-react';
import { useState } from 'react';
import { usePortalAuth } from '../auth';
import {
  formatCurrency,
  formatDealStatus,
} from '../data/selectors';
import { usePortalData } from '../data/store';
import { Deal, DealStatus } from '../data/types';

const columns: Array<{ label: string; status: DealStatus }> = [
  { label: 'New Lead', status: 'new_lead' },
  { label: 'Contacted', status: 'contacted' },
  { label: 'Appointment Booked', status: 'appointment_booked' },
  { label: 'Quoted', status: 'quoted' },
  { label: 'Negotiating', status: 'negotiating' },
  { label: 'Won', status: 'won' },
  { label: 'Lost', status: 'lost' },
];

type DealFormState = {
  city: string;
  email: string;
  estimatedJobValue: string;
  financingRequired: boolean;
  homeownerName: string;
  nextFollowUpDate: string;
  notes: string;
  phone: string;
  projectType: string;
  status: DealStatus;
};

const emptyDealForm: DealFormState = {
  city: '',
  email: '',
  estimatedJobValue: '0',
  financingRequired: true,
  homeownerName: '',
  nextFollowUpDate: '',
  notes: '',
  phone: '',
  projectType: '',
  status: 'new_lead',
};

function dealToForm(deal: Deal): DealFormState {
  return {
    city: deal.city,
    email: deal.email,
    estimatedJobValue: String(deal.estimatedJobValue),
    financingRequired: deal.financingRequired,
    homeownerName: deal.homeownerName,
    nextFollowUpDate: deal.nextFollowUpDate,
    notes: deal.notes,
    phone: deal.phone,
    projectType: deal.projectType,
    status: deal.status,
  };
}

export default function PortalDeals() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    addDealActivity,
    addDeal,
    assignContractorToDeal,
    contractors,
    getVisibleDealsForUser,
    updateDeal,
  } = usePortalData();
  const visibleDeals = currentUser ? getVisibleDealsForUser(currentUser) : [];
  const selectableContractors = isAdmin
    ? contractors
    : contractors.filter(
        (contractor) => contractor.contractorStatus === 'active'
      );
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isAddingDeal, setIsAddingDeal] = useState(false);
  const [form, setForm] = useState<DealFormState>(emptyDealForm);
  const [activityNote, setActivityNote] = useState('');
  const selectedDeal = visibleDeals.find((deal) => deal.id === selectedDealId);
  const isPanelOpen = Boolean(selectedDeal || isAddingDeal);

  const openAddDeal = () => {
    setSelectedDealId(null);
    setIsAddingDeal(true);
    setForm(emptyDealForm);
    setActivityNote('');
  };

  const openDeal = (deal: Deal) => {
    setIsAddingDeal(false);
    setSelectedDealId(deal.id);
    setForm(dealToForm(deal));
    setActivityNote('');
  };

  const closePanel = () => {
    setSelectedDealId(null);
    setIsAddingDeal(false);
  };

  const saveDeal = () => {
    if (!currentUser || !form.homeownerName.trim()) return;

    const dealPayload = {
      city: form.city.trim(),
      email: form.email.trim(),
      estimatedJobValue: Number(form.estimatedJobValue) || 0,
      financingRequired: form.financingRequired,
      homeownerName: form.homeownerName.trim(),
      notes: form.notes.trim(),
      phone: form.phone.trim(),
      projectType: form.projectType.trim(),
      nextFollowUpDate: form.nextFollowUpDate,
    };

    if (isAddingDeal) {
      if (currentUser.role !== 'rep') return;
      addDeal(dealPayload, currentUser.id);
    } else if (selectedDeal) {
      updateDeal(selectedDeal.id, {
        ...dealPayload,
        status: form.status,
      });
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

    addDealActivity(selectedDeal.id, activityNote);
    setActivityNote('');
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
        {currentUser?.role === 'rep' && (
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

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500">
          <Search className="h-4 w-4" />
          <span className="text-sm font-semibold">Search deals placeholder</span>
        </div>
      </section>

      <section className="overflow-x-auto overscroll-x-contain pb-3 [scrollbar-gutter:stable]">
        <div className="grid gap-4 md:grid-flow-col md:auto-cols-[minmax(260px,300px)] md:grid-cols-none">
          {columns.map((column) => {
            const columnDeals = visibleDeals.filter(
              (deal) => deal.status === column.status
            );

            return (
              <article
                key={column.status}
                className="min-h-[16rem] rounded-[0.5rem] border border-white bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <h2 className="text-sm font-black uppercase leading-snug tracking-[0.12em] text-slate-700">
                    {column.label}
                  </h2>
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

                      return (
                        <button
                          key={deal.id}
                          type="button"
                          onClick={() => openDeal(deal)}
                          className="w-full rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-3 text-left transition hover:border-[#b8c9dd] hover:bg-white"
                        >
                          <p className="text-sm font-black text-slate-950">
                            {deal.homeownerName}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {deal.city} - {deal.projectType}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-black text-[#1B3C6C]">
                              {formatCurrency(deal.estimatedJobValue)}
                            </span>
                            <span className="max-w-full rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-bold text-slate-500">
                              {contractor?.companyName ?? 'Unassigned'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-6 flex min-h-36 flex-col items-center justify-center rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 text-center">
                    <CircleDollarSign className="h-7 w-7 text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      No deals yet
                    </p>
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
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
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
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  City
                  <input
                    value={form.city}
                    onChange={(event) => updateForm('city', event.target.value)}
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
                          event.target.value || null
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
                    {(selectedDeal.activity ?? []).length > 0 ? (
                      selectedDeal.activity.map((activity) => (
                        <article
                          key={activity.id}
                          className="rounded-[0.5rem] border border-slate-200 bg-white p-3"
                        >
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {activity.note}
                          </p>
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
    </div>
  );
}
