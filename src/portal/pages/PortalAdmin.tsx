import {
  BriefcaseBusiness,
  Building2,
  HandCoins,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import { formatCurrency } from '../data/selectors';
import { generateTemporaryPassword, usePortalData } from '../data/store';
import { ActivityEntityType, User } from '../data/types';

type RepFormState = {
  active: boolean;
  avatarInitial: string;
  avatarUrl: string;
  email: string;
  name: string;
};

const emptyRepForm: RepFormState = {
  active: true,
  avatarInitial: '',
  avatarUrl: '',
  email: '',
  name: '',
};

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(reader.result as string); return; }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

const sections = [
  {
    title: 'Manage Contractors',
    description: 'Review, add, and update contractor network records.',
    href: '/portal/contractors',
    icon: Building2,
  },
  {
    title: 'Manage Reps',
    description: 'Add, edit, activate, and deactivate portal sales reps.',
    icon: Users,
    opensRepManagement: true,
  },
  {
    title: 'View All Deals',
    description: 'Open the admin-visible deal pipeline and CRM board.',
    href: '/portal/deals',
    icon: BriefcaseBusiness,
  },
  {
    title: 'Commission Overview',
    description: 'Review rep payouts and admin commission visibility.',
    href: '/portal/commissions',
    icon: HandCoins,
  },
];

const activityFilters: Array<{ label: string; value: 'all' | ActivityEntityType }> = [
  { label: 'All', value: 'all' },
  { label: 'Deals', value: 'deal' },
  { label: 'Proposals', value: 'proposal' },
  { label: 'Contractors', value: 'contractor' },
  { label: 'Reps', value: 'rep' },
  { label: 'Commissions', value: 'commission' },
];

function formatActivityTime(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function userToForm(user: User): RepFormState {
  return {
    active: user.active,
    avatarInitial: user.avatarInitial,
    avatarUrl: user.avatarUrl ?? '',
    email: user.email,
    name: user.name,
  };
}

export default function PortalAdmin() {
  const { currentUser } = usePortalAuth();
  const {
    addUser,
    activities,
    calculateOpenDealsForUser,
    calculatePipelineValue,
    calculateRepPendingCommission,
    calculateWonDeals,
    defaultCommissionRate,
    resetUserPassword,
    setDefaultCommissionRate,
    toggleUserActive,
    updateUser,
    users,
  } = usePortalData();
  const [commissionInput, setCommissionInput] = useState(String(Math.round(defaultCommissionRate * 100)));
  const repManagementRef = useRef<HTMLElement>(null);
  const [activityFilter, setActivityFilter] = useState<
    'all' | ActivityEntityType
  >('all');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isRepPanelOpen, setIsRepPanelOpen] = useState(false);
  const [passwordResetNotice, setPasswordResetNotice] = useState('');
  const [repForm, setRepForm] = useState<RepFormState>(emptyRepForm);
  const reps = users.filter((user) => user.role === 'rep');
  const editingUser = reps.find((rep) => rep.id === editingUserId);
  const filteredActivities = activities
    .filter((activity) =>
      activityFilter === 'all' ? true : activity.entityType === activityFilter
    )
    .slice(0, 20);

  const openAddRep = () => {
    setEditingUserId(null);
    setRepForm(emptyRepForm);
    setIsRepPanelOpen(true);
  };

  const openEditRep = (user: User) => {
    setEditingUserId(user.id);
    setRepForm(userToForm(user));
    setIsRepPanelOpen(true);
  };

  const closeRepPanel = () => {
    setEditingUserId(null);
    setIsRepPanelOpen(false);
  };

  const saveRep = async () => {
    const name = repForm.name.trim();
    const email = repForm.email.trim();
    const avatarInitial = repForm.avatarInitial.trim().slice(0, 2).toUpperCase();
    if (!name || !email || !avatarInitial) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        active: repForm.active,
        avatarInitial,
        avatarUrl: repForm.avatarUrl || undefined,
        email,
        name,
      }, currentUser ?? undefined);
      closeRepPanel();
    } else {
      closeRepPanel();
      const result = await addUser({
        active: repForm.active,
        avatarInitial,
        avatarUrl: repForm.avatarUrl || undefined,
        email,
        name,
      }, currentUser ?? undefined);
      if (result && 'tempPassword' in result) {
        setPasswordResetNotice(
          `${name} was added. Their temporary password is: ${result.tempPassword} — share this with them directly.`
        );
      } else if (result && 'error' in result) {
        setPasswordResetNotice(`Could not add rep: ${result.error}`);
      } else {
        setPasswordResetNotice('Failed to create rep. Please try again.');
      }
    }

    repManagementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const updateRepForm = <Field extends keyof RepFormState>(
    field: Field,
    value: RepFormState[Field]
  ) => {
    setRepForm((current) => ({ ...current, [field]: value }));
  };

  const resetRepPassword = async (rep: User) => {
    const temporaryPassword = generateTemporaryPassword();
    const result = await resetUserPassword(
      rep.id,
      temporaryPassword,
      currentUser ?? undefined
    );

    setPasswordResetNotice(
      result.ok
        ? `${rep.name}'s temporary password is now ${temporaryPassword}.`
        : result.message ?? 'Password reset failed.'
    );
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Admin
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
          Portal management
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => {
          const cardContent = (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-[0.5rem] bg-[#e8f1fb] text-[#1B3C6C]">
                <section.icon className="h-5 w-5" />
              </div>
              <div className="mt-5 flex items-start justify-between gap-3">
                <h2 className="text-xl font-black tracking-[-0.01em]">
                  {section.title}
                </h2>
              </div>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">
                {section.description}
              </p>
            </>
          );

          if (section.href) {
            return (
              <Link
                key={section.title}
                to={section.href}
                className="block rounded-[0.5rem] border border-white bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8c9dd] hover:shadow-md"
              >
                {cardContent}
              </Link>
            );
          }

          return (
            <button
              key={section.title}
              type="button"
              onClick={() => repManagementRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="rounded-[0.5rem] border border-white bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8c9dd] hover:shadow-md"
            >
              {cardContent}
            </button>
          );
        })}
      </section>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Activity Feed
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Recent portal activity
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {activityFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActivityFilter(filter.value)}
                className={
                  activityFilter === filter.value
                    ? 'rounded-full bg-[#1B3C6C] px-3 py-2 text-xs font-black text-white'
                    : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]'
                }
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <article
                key={activity.id}
                className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-950">
                      {activity.actionLabel}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {activity.actorName} / {activity.actorRole}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      Related: {activity.entityLabel}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 lg:justify-end">
                    <span className="rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black capitalize text-[#1B3C6C]">
                      {activity.entityType}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      {formatActivityTime(activity.createdAt)}
                    </span>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-500">
                No activity has been logged yet.
              </p>
            </div>
          )}
        </div>
      </section>

      <section ref={repManagementRef} className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                Manage Reps
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                Sales rep access
              </h2>
            </div>
            <button
              type="button"
              onClick={openAddRep}
              className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#153158]"
            >
              <Plus className="h-4 w-4" />
              Add Rep
            </button>
          </div>

          <div className="mt-4 grid gap-3">
            {passwordResetNotice && (
              <p className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#e8f1fb] px-3 py-2 text-sm font-bold text-[#1B3C6C]">
                {passwordResetNotice}
              </p>
            )}
            {reps.map((rep) => (
              <article
                key={rep.id}
                className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 overflow-hidden rounded-full bg-[#071525] text-sm font-black text-white">
                      {rep.avatarUrl ? (
                        <img
                          src={rep.avatarUrl}
                          alt={rep.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center">
                          {rep.avatarInitial}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-950">
                        {rep.name}
                      </h3>
                      <p className="text-sm font-semibold text-slate-500">
                        {rep.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
                      {rep.role}
                    </span>
                    <span
                      className={
                        rep.active
                          ? 'rounded-full bg-[#edf7ef] px-3 py-1 text-xs font-black text-[#287247]'
                          : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500'
                      }
                    >
                      {rep.active ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditRep(rep)}
                      className="rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => resetRepPassword(rep)}
                      className="rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
                    >
                      Reset Password
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Open Deals
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {calculateOpenDealsForUser(rep)}
                    </p>
                  </div>
                  <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Pipeline Value
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {formatCurrency(calculatePipelineValue(rep.id))}
                    </p>
                  </div>
                  <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Pending Commission
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {formatCurrency(calculateRepPendingCommission(rep.id))}
                    </p>
                  </div>
                  <div className="rounded-[0.5rem] border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                      Won Deals
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {calculateWonDeals(rep.id)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

      {isRepPanelOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Rep Management
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  {editingUser ? 'Edit Rep' : 'Add Rep'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeRepPanel}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close rep panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Name
                  <input
                    value={repForm.name}
                    onChange={(event) =>
                      updateRepForm('name', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Email
                  <input
                    value={repForm.email}
                    onChange={(event) =>
                      updateRepForm('email', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Avatar Initial
                  <input
                    maxLength={2}
                    value={repForm.avatarInitial}
                    onChange={(event) =>
                      updateRepForm('avatarInitial', event.target.value)
                    }
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Status
                  <select
                    value={repForm.active ? 'active' : 'inactive'}
                    onChange={(event) =>
                      updateRepForm('active', event.target.value === 'active')
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
                <div className="grid gap-1.5">
                  <span className="text-sm font-bold text-slate-700">Profile Photo</span>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#1B3C6C] text-lg font-bold text-white">
                      {repForm.avatarUrl ? (
                        <img src={repForm.avatarUrl} alt="preview" className="h-full w-full object-cover" />
                      ) : (
                        repForm.avatarInitial || '?'
                      )}
                    </div>
                    <label className="cursor-pointer rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 py-2 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]">
                      {repForm.avatarUrl ? 'Change photo' : 'Upload photo'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          e.target.value = '';
                          const dataUrl = await compressImage(file);
                          updateRepForm('avatarUrl', dataUrl);
                        }}
                      />
                    </label>
                    {repForm.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => updateRepForm('avatarUrl', '')}
                        className="text-sm text-slate-400 hover:text-slate-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-between">
              {editingUser && (
                <button
                  type="button"
                  onClick={() => {
                    toggleUserActive(editingUser.id, currentUser ?? undefined);
                    closeRepPanel();
                  }}
                  className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Toggle Active/Inactive
                </button>
              )}
              <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                <button
                  type="button"
                  onClick={closeRepPanel}
                  className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveRep}
                  className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                >
                  Save Rep
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">Commission Settings</p>
        <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">Default commission rate</h2>
        <p className="mt-1 text-sm text-slate-500">Applied automatically when a new deal is created.</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="relative w-36">
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionInput}
              onChange={(e) => setCommissionInput(e.target.value)}
              className="w-full rounded-[0.5rem] border border-slate-300 py-2.5 pl-3 pr-8 text-sm font-bold focus:border-[#32639b] focus:outline-none focus:ring-2 focus:ring-[#32639b]/20"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const val = parseFloat(commissionInput);
              if (!isNaN(val) && val >= 0 && val <= 100) {
                setDefaultCommissionRate(val / 100);
                setCommissionInput(String(val));
              }
            }}
            className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#153158]"
          >
            Save
          </button>
          <span className="text-sm text-slate-500">Current: <strong>{Math.round(defaultCommissionRate * 100)}%</strong></span>
        </div>
      </section>
    </div>
  );
}
