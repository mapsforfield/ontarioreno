import {
  BriefcaseBusiness,
  Building2,
  HandCoins,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../data/selectors';
import { usePortalData } from '../data/store';
import { User } from '../data/types';

type RepFormState = {
  active: boolean;
  avatarInitial: string;
  email: string;
  name: string;
};

const emptyRepForm: RepFormState = {
  active: true,
  avatarInitial: '',
  email: '',
  name: '',
};

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

function userToForm(user: User): RepFormState {
  return {
    active: user.active,
    avatarInitial: user.avatarInitial,
    email: user.email,
    name: user.name,
  };
}

export default function PortalAdmin() {
  const {
    addUser,
    calculateBrokerScore,
    calculateOpenDealsForUser,
    calculatePipelineValue,
    calculateRepPendingCommission,
    toggleUserActive,
    updateUser,
    users,
  } = usePortalData();
  const [isRepManagementOpen, setIsRepManagementOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isRepPanelOpen, setIsRepPanelOpen] = useState(false);
  const [repForm, setRepForm] = useState<RepFormState>(emptyRepForm);
  const reps = users.filter((user) => user.role === 'rep');
  const editingUser = reps.find((rep) => rep.id === editingUserId);

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

  const saveRep = () => {
    const name = repForm.name.trim();
    const email = repForm.email.trim();
    const avatarInitial = repForm.avatarInitial.trim().slice(0, 2).toUpperCase();
    if (!name || !email || !avatarInitial) return;

    if (editingUser) {
      updateUser(editingUser.id, {
        active: repForm.active,
        avatarInitial,
        email,
        name,
      });
    } else {
      addUser({
        active: repForm.active,
        avatarInitial,
        email,
        name,
      });
    }

    closeRepPanel();
    setIsRepManagementOpen(true);
  };

  const updateRepForm = <Field extends keyof RepFormState>(
    field: Field,
    value: RepFormState[Field]
  ) => {
    setRepForm((current) => ({ ...current, [field]: value }));
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
              onClick={() => setIsRepManagementOpen(true)}
              className="rounded-[0.5rem] border border-white bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8c9dd] hover:shadow-md"
            >
              {cardContent}
            </button>
          );
        })}
      </section>

      {isRepManagementOpen && (
        <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
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
            {reps.map((rep) => (
              <article
                key={rep.id}
                className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071525] text-sm font-black text-white">
                      {rep.avatarInitial}
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
                      Broker Score
                    </p>
                    <p className="mt-2 text-2xl font-black">
                      {calculateBrokerScore(rep.id)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {isRepPanelOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
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
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-between">
              {editingUser && (
                <button
                  type="button"
                  onClick={() => {
                    toggleUserActive(editingUser.id);
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
    </div>
  );
}
