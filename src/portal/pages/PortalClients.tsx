import {
  BadgeDollarSign,
  Building2,
  CalendarDays,
  ChevronRight,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import TrashPanel from '../components/TrashPanel';
import { showToast } from '../lib/toast';
import type { Client, Household } from '../data/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── Empty client form ───────────────────────────────────────────────────────

type ClientForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  projectTypes: string;
  internalNotes: string;
};

const emptyForm: ClientForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  postalCode: '',
  projectTypes: '',
  internalNotes: '',
};

function formToPayload(form: ClientForm) {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    email: form.email.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    postalCode: form.postalCode.trim().toUpperCase(),
    projectTypes: form.projectTypes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    internalNotes: form.internalNotes.trim(),
  };
}

function clientToForm(client: Client): ClientForm {
  return {
    name: client.name,
    phone: client.phone,
    email: client.email,
    address: client.address,
    city: client.city,
    postalCode: client.postalCode ?? '',
    projectTypes: client.projectTypes.join(', '),
    internalNotes: client.internalNotes,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PortalClients() {
  const navigate = useNavigate();
  const { isAdmin } = usePortalAuth();
  const {
    clients,
    households,
    addClient,
    updateClient,
    deleteClient,
    restoreClient,
    purgeClient,
    fetchTrashedClients,
    getAppointmentsForClient,
    addHousehold,
    updateHousehold,
    deleteHousehold,
  } = usePortalData();

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [trashOpen, setTrashOpen] = useState(false);
  const [trashedClients, setTrashedClients] = useState<Client[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) fetchTrashedClients().then(setTrashedClients).catch(() => {});
  }, [isAdmin, fetchTrashedClients]);
  const openTrash = async () => {
    setTrashOpen(true);
    setTrashLoading(true);
    setTrashedClients(await fetchTrashedClients());
    setTrashLoading(false);
  };
  const handleRestoreClient = async (client: Client) => {
    setTrashedClients((cur) => cur.filter((c) => c.id !== client.id));
    await restoreClient(client.id);
    showToast({ variant: 'success', message: 'Client restored', description: client.name });
  };
  const handlePurgeClient = async (client: Client) => {
    if (!window.confirm(`Permanently delete "${client.name}"? This cannot be undone.`)) return;
    setTrashedClients((cur) => cur.filter((c) => c.id !== client.id));
    await purgeClient(client.id);
    showToast({ variant: 'error', message: 'Client permanently deleted', description: client.name });
  };

  // ── Household panel state ──
  type HouseholdMode = 'none' | 'view' | 'create' | 'join';
  const [householdMode, setHouseholdMode] = useState<HouseholdMode>('none');
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [householdFormName, setHouseholdFormName] = useState('');
  const [householdFormNotes, setHouseholdFormNotes] = useState('');
  const [householdMemberSearch, setHouseholdMemberSearch] = useState('');
  const [pendingMemberIds, setPendingMemberIds] = useState<string[]>([]);
  const [householdSaving, setHouseholdSaving] = useState(false);
  const [householdError, setHouseholdError] = useState('');
  const [isEditingHouseholdName, setIsEditingHouseholdName] = useState(false);
  const [editHouseholdNameVal, setEditHouseholdNameVal] = useState('');
  const [householdAddMemberSearch, setHouseholdAddMemberSearch] = useState('');
  const [showHouseholdAddMember, setShowHouseholdAddMember] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const clientAppointments = selectedClientId ? getAppointmentsForClient(selectedClientId) : [];

  const selectedHousehold: Household | null =
    selectedHouseholdId ? (households.find((h) => h.id === selectedHouseholdId) ?? null) : null;

  const householdMembers: Client[] = selectedHousehold
    ? (selectedHousehold.memberIds.map((id) => clients.find((c) => c.id === id)).filter(Boolean) as Client[])
    : [];

  const householdAppointments = useMemo(() => {
    if (!selectedHousehold) return [];
    return selectedHousehold.memberIds
      .flatMap((clientId) => {
        const mc = clients.find((c) => c.id === clientId);
        return getAppointmentsForClient(clientId).map((apt) => ({
          ...apt,
          _memberName: mc?.name ?? 'Member',
        }));
      })
      .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHousehold, clients]);

  const q = search.toLowerCase();
  const filteredClients = useMemo(() => {
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.postalCode ?? '').toLowerCase().includes(q) ||
        c.projectTypes.some((pt) => pt.toLowerCase().includes(q))
    );
  }, [clients, q]);

  // Clients eligible to be added to a household being created
  const createMemberCandidates = useMemo(() => {
    const sq = householdMemberSearch.toLowerCase().trim();
    return clients.filter(
      (c) =>
        !pendingMemberIds.includes(c.id) &&
        !c.householdId &&
        (sq === '' || c.name.toLowerCase().includes(sq) || c.email.toLowerCase().includes(sq))
    );
  }, [clients, householdMemberSearch, pendingMemberIds]);

  // Clients eligible to be added to the currently-viewed household
  const addMemberCandidates = useMemo(() => {
    const sq = householdAddMemberSearch.toLowerCase().trim();
    return clients.filter(
      (c) =>
        !c.householdId &&
        (!selectedHousehold || !selectedHousehold.memberIds.includes(c.id)) &&
        (sq === '' || c.name.toLowerCase().includes(sq) || c.email.toLowerCase().includes(sq))
    );
  }, [clients, householdAddMemberSearch, selectedHousehold]);

  // ── Client panel helpers ──

  const openCreate = () => {
    setIsCreating(true);
    setSelectedClientId(null);
    setForm(emptyForm);
    setSaveError('');
  };

  const openEdit = (client: Client) => {
    setIsCreating(false);
    setSelectedClientId(client.id);
    setForm(clientToForm(client));
    setSaveError('');
  };

  const closePanel = () => {
    setIsCreating(false);
    setSelectedClientId(null);
    setForm(emptyForm);
    setSaveError('');
  };

  const updateForm = (field: keyof ClientForm, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      setSaveError('Client name is required.');
      return;
    }
    setIsSaving(true);
    setSaveError('');
    const payload = formToPayload(form);
    if (isCreating) {
      const result = await addClient(payload);
      if (!result) {
        setSaveError('Failed to save. Please try again.');
        setIsSaving(false);
        return;
      }
      setSelectedClientId(result.id);
      setIsCreating(false);
      setForm(clientToForm(result));
    } else if (selectedClientId) {
      const result = await updateClient(selectedClientId, payload);
      if (!result) {
        setSaveError('Failed to save. Please try again.');
        setIsSaving(false);
        return;
      }
      setForm(clientToForm(result));
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedClientId) return;
    if (!window.confirm('Delete this client profile? This cannot be undone.')) return;
    await deleteClient(selectedClientId);
    closePanel();
  };

  // ── Household helpers ──

  const openHouseholdView = (householdId: string) => {
    setSelectedHouseholdId(householdId);
    setHouseholdMode('view');
    setHouseholdError('');
    setIsEditingHouseholdName(false);
    setShowHouseholdAddMember(false);
    setHouseholdAddMemberSearch('');
  };

  const openHouseholdCreate = (prefillClientId: string) => {
    setPendingMemberIds([prefillClientId]);
    setHouseholdFormName('');
    setHouseholdFormNotes('');
    setHouseholdMemberSearch('');
    setHouseholdError('');
    setHouseholdMode('create');
  };

  const openHouseholdJoin = () => {
    setHouseholdError('');
    setHouseholdMode('join');
  };

  const closeHouseholdPanel = () => {
    setHouseholdMode('none');
    setSelectedHouseholdId(null);
    setHouseholdFormName('');
    setHouseholdFormNotes('');
    setHouseholdMemberSearch('');
    setPendingMemberIds([]);
    setHouseholdError('');
    setIsEditingHouseholdName(false);
    setHouseholdAddMemberSearch('');
    setShowHouseholdAddMember(false);
  };

  const handleCreateHousehold = async () => {
    if (!householdFormName.trim()) {
      setHouseholdError('Household name is required.');
      return;
    }
    if (pendingMemberIds.length < 2) {
      setHouseholdError('A household needs at least 2 members.');
      return;
    }
    setHouseholdSaving(true);
    setHouseholdError('');
    const h = await addHousehold(householdFormName.trim(), householdFormNotes.trim(), pendingMemberIds);
    setHouseholdSaving(false);
    if (!h) {
      setHouseholdError('Failed to create household. Please try again.');
      return;
    }
    setSelectedHouseholdId(h.id);
    setHouseholdMode('view');
  };

  const handleSaveHouseholdName = async () => {
    if (!selectedHouseholdId || !editHouseholdNameVal.trim()) return;
    setHouseholdSaving(true);
    await updateHousehold(selectedHouseholdId, { name: editHouseholdNameVal.trim() });
    setHouseholdSaving(false);
    setIsEditingHouseholdName(false);
  };

  const handleRemoveMember = async (clientId: string) => {
    if (!selectedHouseholdId) return;
    const hh = households.find((h) => h.id === selectedHouseholdId);
    if (!hh) return;
    if (hh.memberIds.length <= 2) {
      if (!window.confirm('Removing this member will leave only 1 person in the household. Consider deleting the household instead.')) return;
    }
    setHouseholdSaving(true);
    await updateHousehold(selectedHouseholdId, { removeMemberId: clientId });
    setHouseholdSaving(false);
  };

  const handleAddMemberToHousehold = async (clientId: string) => {
    if (!selectedHouseholdId) return;
    setHouseholdSaving(true);
    await updateHousehold(selectedHouseholdId, { addMemberId: clientId });
    setHouseholdSaving(false);
    setShowHouseholdAddMember(false);
    setHouseholdAddMemberSearch('');
  };

  const handleDeleteHousehold = async () => {
    if (!selectedHouseholdId) return;
    if (!window.confirm('Delete this household? Members will not be deleted — only the household link is removed.')) return;
    setHouseholdSaving(true);
    await deleteHousehold(selectedHouseholdId);
    setHouseholdSaving(false);
    closeHouseholdPanel();
  };

  const isPanelOpen = isCreating || selectedClientId !== null;

  return (
    <div className="space-y-4 pb-16 lg:pb-6">
      <TrashPanel
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        title="Clients"
        subtitle="Restore a client, or delete them permanently."
        emptyLabel="Deleted clients show up here so you can recover them."
        items={trashedClients}
        loading={trashLoading}
        primary={(c) => c.name}
        secondary={(c) => [c.email, c.phone, c.city].filter(Boolean).join(' · ') || 'No contact details'}
        onRestore={handleRestoreClient}
        onPurge={handlePurgeClient}
      />
      {/* Header */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Client Directory
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.03em] text-slate-950">
            Clients
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              type="button"
              onClick={openTrash}
              className="relative inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50"
              title="Trash bin"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden sm:inline">Trash</span>
              {trashedClients.length > 0 && (
                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-slate-200 px-1 text-[0.65rem] font-black text-slate-600">
                  {trashedClients.length}
                </span>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#153158]"
          >
            <Plus className="h-4 w-4" />
            + New Client
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search by name, email, phone, city, postal code, or project type…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-[0.5rem] border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#32639b] focus:outline-none"
        />
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <div className="rounded-[0.5rem] border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Total Clients</p>
          <p className="mt-0.5 text-xl font-black text-slate-950">{clients.length}</p>
        </div>
        <div className="rounded-[0.5rem] border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">From Bookings</p>
          <p className="mt-0.5 text-xl font-black text-slate-950">
            {clients.filter((c) => c.source === 'appointment').length}
          </p>
        </div>
        <div className="rounded-[0.5rem] border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Manual</p>
          <p className="mt-0.5 text-xl font-black text-slate-950">
            {clients.filter((c) => c.source === 'manual').length}
          </p>
        </div>
        {households.length > 0 && (
          <div className="rounded-[0.5rem] border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-slate-500">Households</p>
            <p className="mt-0.5 text-xl font-black text-slate-950">{households.length}</p>
          </div>
        )}
      </div>

      {/* Client list */}
      <section className="rounded-[0.5rem] border border-white bg-white shadow-sm">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center py-14">
            <UserRound className="h-10 w-10 text-slate-200" />
            <p className="mt-3 text-sm font-bold text-slate-400">
              {search ? 'No clients match your search.' : 'No clients yet.'}
            </p>
            {!search && (
              <button
                type="button"
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#1B3C6C] px-4 py-2 text-xs font-black text-white"
              >
                <Plus className="h-3.5 w-3.5" />
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredClients.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => openEdit(client)}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-slate-50/80"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f1fb] text-sm font-black text-[#1B3C6C]">
                  {initials(client.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-black text-slate-900">{client.name}</p>
                    {client.householdId && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[0.6rem] font-black text-violet-700">
                        <Users className="h-2.5 w-2.5" />
                        Household
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">
                    {[client.email, client.phone].filter(Boolean).join(' · ') || 'No contact info'}
                  </p>
                  {client.projectTypes.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {client.projectTypes.slice(0, 3).map((pt) => (
                        <span
                          key={pt}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black text-slate-600"
                        >
                          {pt}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  {client.city && (
                    <p className="text-xs font-semibold text-slate-500">{client.city}</p>
                  )}
                  <p className="mt-0.5 text-[0.65rem] font-semibold text-slate-400">
                    {client.source === 'appointment' ? 'From booking' : 'Manual'} · {formatDate(client.createdAt)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ── Client slide-in panel ─────────────────────────────────────────── */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  {isCreating ? 'New Client' : 'Client Profile'}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  {isCreating ? 'Add Client' : (selectedClient?.name ?? 'Client')}
                </h2>
              </div>
              <button
                type="button"
                onClick={closePanel}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
              {!isCreating && selectedClient && (
                <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">Contact Info</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedClient.phone && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-[#32639b]" />
                        {selectedClient.phone}
                      </div>
                    )}
                    {selectedClient.email && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-[#32639b]" />
                        {selectedClient.email}
                      </div>
                    )}
                    {(selectedClient.address || selectedClient.city || selectedClient.postalCode) && (
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                        <MapPin className="h-3.5 w-3.5 text-[#32639b]" />
                        {[selectedClient.address, selectedClient.city, selectedClient.postalCode].filter(Boolean).join(', ')}
                      </div>
                    )}
                    {selectedClient.projectTypes.length > 0 && (
                      <div className="flex items-start gap-2 sm:col-span-2">
                        <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#32639b]" />
                        <div className="flex flex-wrap gap-1.5">
                          {selectedClient.projectTypes.map((pt) => (
                            <span key={pt} className="rounded-full bg-[#e8f1fb] px-2.5 py-0.5 text-xs font-black text-[#1B3C6C]">{pt}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedClient.internalNotes && (
                    <div className="mt-3 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Internal Notes</p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-700 whitespace-pre-wrap">{selectedClient.internalNotes}</p>
                    </div>
                  )}
                </section>
              )}

              {!isCreating && clientAppointments.length > 0 && (
                <section>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Consultation History ({clientAppointments.length})
                  </p>
                  <div className="space-y-2">
                    {clientAppointments
                      .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
                      .map((apt) => (
                        <div key={apt.id} className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">
                                {apt.projectType || apt.customerName || 'Consultation'}
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {apt.appointmentDate}{apt.appointmentTime ? ` · ${apt.appointmentTime}` : ''}{apt.city ? ` · ${apt.city}` : ''}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#e8f1fb] px-2.5 py-0.5 text-[0.62rem] font-black text-[#1B3C6C]">
                              {apt.status.replace('_', ' ')}
                            </span>
                          </div>
                          {apt.internalNotes && (
                            <p className="mt-1.5 text-xs font-semibold text-slate-500 line-clamp-2">{apt.internalNotes}</p>
                          )}
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {!isCreating && clientAppointments.length === 0 && selectedClient && (
                <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 py-8">
                  <CalendarDays className="h-7 w-7 text-slate-200" />
                  <p className="mt-2 text-sm font-bold text-slate-400">No consultations yet</p>
                </div>
              )}

              <section>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {isCreating ? 'Client Details' : 'Edit Profile'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Full Name *
                    <input value={form.name} onChange={(e) => updateForm('name', e.target.value)} placeholder="Jane Smith" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Phone
                    <input value={form.phone} onChange={(e) => updateForm('phone', e.target.value)} placeholder="416-555-0100" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Email
                    <input value={form.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="jane@example.com" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Address
                    <input value={form.address} onChange={(e) => updateForm('address', e.target.value)} placeholder="123 Main St" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    City
                    <input value={form.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="Toronto" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Postal Code
                    <input value={form.postalCode} onChange={(e) => updateForm('postalCode', e.target.value.toUpperCase())} placeholder="M5V 3A8" maxLength={7} />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Project Types
                    <input value={form.projectTypes} onChange={(e) => updateForm('projectTypes', e.target.value)} placeholder="Basement, Kitchen (comma separated)" />
                  </label>
                  <label className="grid gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-slate-700 sm:col-span-2">
                    Internal Notes — Not visible to client
                    <textarea rows={4} value={form.internalNotes} onChange={(e) => updateForm('internalNotes', e.target.value)} placeholder="Notes about this client that are internal to the team…" />
                  </label>
                </div>
                {saveError && <p className="mt-3 text-sm font-semibold text-red-600">{saveError}</p>}
              </section>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:flex-wrap sm:justify-end">
              {isAdmin && !isCreating && selectedClientId && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded-[0.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 sm:mr-auto"
                >
                  Delete Client
                </button>
              )}
              {!isCreating && selectedClient && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedClient.householdId) {
                        openHouseholdView(selectedClient.householdId);
                      } else if (households.length > 0) {
                        openHouseholdJoin();
                      } else {
                        openHouseholdCreate(selectedClient.id);
                      }
                    }}
                    className="flex items-center gap-2 rounded-[0.5rem] border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
                  >
                    <Users className="h-4 w-4" />
                    {selectedClient.householdId ? 'View Household' : 'Add to Household'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closePanel();
                      navigate('/portal/appointments', { state: { prefillClient: selectedClient } });
                    }}
                    className="flex items-center gap-2 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Schedule Consultation
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      closePanel();
                      navigate('/portal/deals', { state: { prefillClient: selectedClient } });
                    }}
                    className="flex items-center gap-2 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                  >
                    <BadgeDollarSign className="h-4 w-4" />
                    Convert to Deal
                  </button>
                </>
              )}
              <button type="button" onClick={closePanel} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : isCreating ? 'Create Client' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Household panel ───────────────────────────────────────────────── */}
      {householdMode !== 'none' && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">

            {/* ── VIEW ── */}
            {householdMode === 'view' && selectedHousehold && (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Household</p>
                    {isEditingHouseholdName ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          autoFocus
                          value={editHouseholdNameVal}
                          onChange={(e) => setEditHouseholdNameVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveHouseholdName();
                            if (e.key === 'Escape') setIsEditingHouseholdName(false);
                          }}
                          className="flex-1 rounded-[0.5rem] border border-violet-300 bg-violet-50 px-3 py-1.5 text-lg font-black text-slate-900 focus:outline-none"
                        />
                        <button type="button" onClick={handleSaveHouseholdName} disabled={householdSaving} className="rounded-[0.5rem] bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60">Save</button>
                        <button type="button" onClick={() => setIsEditingHouseholdName(false)} className="rounded-[0.5rem] border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setEditHouseholdNameVal(selectedHousehold.name); setIsEditingHouseholdName(true); }}
                        className="mt-2 text-left text-2xl font-black tracking-[-0.02em] text-slate-900 hover:text-violet-700 transition"
                        title="Click to rename"
                      >
                        {selectedHousehold.name}
                      </button>
                    )}
                  </div>
                  <button type="button" onClick={closeHouseholdPanel} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
                  {/* Members */}
                  <section>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Members ({householdMembers.length})</p>
                      <button
                        type="button"
                        onClick={() => { setShowHouseholdAddMember((v) => !v); setHouseholdAddMemberSearch(''); }}
                        className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700 transition hover:bg-violet-200"
                      >
                        <Plus className="h-3 w-3" />
                        Add Member
                      </button>
                    </div>

                    {showHouseholdAddMember && (
                      <div className="mb-3 rounded-[0.5rem] border border-violet-200 bg-violet-50 p-3">
                        <p className="mb-2 text-xs font-bold text-violet-800">Search clients to add:</p>
                        <input
                          autoFocus
                          type="search"
                          placeholder="Name or email…"
                          value={householdAddMemberSearch}
                          onChange={(e) => setHouseholdAddMemberSearch(e.target.value)}
                          className="w-full rounded-[0.5rem] border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none"
                        />
                        {householdAddMemberSearch.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-[0.5rem] border border-slate-200 bg-white">
                            {addMemberCandidates.length === 0 ? (
                              <p className="px-3 py-2.5 text-xs font-semibold text-slate-400">No clients found</p>
                            ) : (
                              addMemberCandidates.slice(0, 8).map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => handleAddMemberToHousehold(c.id)}
                                  disabled={householdSaving}
                                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-violet-50 disabled:opacity-60"
                                >
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">
                                    {initials(c.name)}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                                    {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="divide-y divide-slate-100 rounded-[0.5rem] border border-slate-200 bg-white">
                      {householdMembers.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 px-4 py-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-black text-violet-700">
                            {initials(member.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => { closeHouseholdPanel(); openEdit(member); }}
                              className="text-sm font-black text-slate-900 hover:text-violet-700 transition truncate block max-w-full"
                            >
                              {member.name}
                            </button>
                            {(member.phone || member.email) && (
                              <p className="mt-0.5 text-xs font-semibold text-slate-400 truncate">
                                {[member.phone, member.email].filter(Boolean).join(' · ')}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={householdSaving}
                            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {selectedHousehold.notes && (
                    <section className="rounded-[0.5rem] border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">Notes</p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-700 whitespace-pre-wrap">{selectedHousehold.notes}</p>
                    </section>
                  )}

                  {/* Combined appointment history */}
                  {householdAppointments.length > 0 && (
                    <section>
                      <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                        Appointment History ({householdAppointments.length})
                      </p>
                      <div className="space-y-2">
                        {householdAppointments.map((apt) => (
                          <div key={apt.id} className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-black text-slate-900 truncate">
                                    {apt.projectType || apt.customerName || 'Consultation'}
                                  </p>
                                  <span className="shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[0.6rem] font-black text-violet-700">
                                    {apt._memberName}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                  {apt.appointmentDate}{apt.appointmentTime ? ` · ${apt.appointmentTime}` : ''}{apt.city ? ` · ${apt.city}` : ''}
                                </p>
                              </div>
                              <span className="shrink-0 rounded-full bg-[#e8f1fb] px-2.5 py-0.5 text-[0.62rem] font-black text-[#1B3C6C]">
                                {apt.status.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {householdAppointments.length === 0 && (
                    <div className="flex flex-col items-center rounded-[0.5rem] border border-dashed border-slate-200 bg-slate-50 py-8">
                      <CalendarDays className="h-7 w-7 text-slate-200" />
                      <p className="mt-2 text-sm font-bold text-slate-400">No appointments yet</p>
                    </div>
                  )}

                  {householdError && <p className="text-sm font-semibold text-red-600">{householdError}</p>}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-5">
                  <button
                    type="button"
                    onClick={handleDeleteHousehold}
                    disabled={householdSaving}
                    className="rounded-[0.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                  >
                    Delete Household
                  </button>
                  <button type="button" onClick={closeHouseholdPanel} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    Close
                  </button>
                </div>
              </>
            )}

            {/* ── CREATE ── */}
            {householdMode === 'create' && (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">New Household</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">Create Household</h2>
                  </div>
                  <button type="button" onClick={closeHouseholdPanel} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Household Name *
                    <input autoFocus value={householdFormName} onChange={(e) => setHouseholdFormName(e.target.value)} placeholder="e.g. Smith Family, Johnson Couple" />
                  </label>

                  <label className="grid gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-slate-700">
                    Notes (optional)
                    <textarea rows={2} value={householdFormNotes} onChange={(e) => setHouseholdFormNotes(e.target.value)} placeholder="Any notes about this household…" />
                  </label>

                  <section>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Members ({pendingMemberIds.length} selected — min 2)
                    </p>
                    <div className="space-y-2">
                      {pendingMemberIds.map((id) => {
                        const c = clients.find((cl) => cl.id === id);
                        if (!c) return null;
                        return (
                          <div key={id} className="flex items-center gap-3 rounded-[0.5rem] border border-violet-200 bg-violet-50 px-3 py-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-200 text-xs font-black text-violet-800">{initials(c.name)}</div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                              {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                            </div>
                            {pendingMemberIds.length > 1 && (
                              <button type="button" onClick={() => setPendingMemberIds((prev) => prev.filter((x) => x !== id))} className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-red-100 hover:text-red-600">
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>

                  <section>
                    <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">Add More Members</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="search"
                        placeholder="Search by name or email…"
                        value={householdMemberSearch}
                        onChange={(e) => setHouseholdMemberSearch(e.target.value)}
                        className="w-full rounded-[0.5rem] border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none"
                      />
                    </div>
                    {householdMemberSearch.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto divide-y divide-slate-100 rounded-[0.5rem] border border-slate-200 bg-white">
                        {createMemberCandidates.length === 0 ? (
                          <p className="px-3 py-2.5 text-xs font-semibold text-slate-400">No available clients found</p>
                        ) : (
                          createMemberCandidates.slice(0, 8).map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { setPendingMemberIds((prev) => [...prev, c.id]); setHouseholdMemberSearch(''); }}
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-violet-50"
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-black text-violet-700">{initials(c.name)}</div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{c.name}</p>
                                {c.email && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </section>

                  {householdError && <p className="text-sm font-semibold text-red-600">{householdError}</p>}
                </div>

                <div className="flex gap-2 border-t border-slate-200 p-5 justify-end">
                  <button type="button" onClick={closeHouseholdPanel} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                  <button
                    type="button"
                    onClick={handleCreateHousehold}
                    disabled={householdSaving || pendingMemberIds.length < 2 || !householdFormName.trim()}
                    className="rounded-[0.5rem] bg-violet-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:opacity-60"
                  >
                    {householdSaving ? 'Creating…' : 'Create Household'}
                  </button>
                </div>
              </>
            )}

            {/* ── JOIN existing ── */}
            {householdMode === 'join' && (
              <>
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">Household</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">Add to Household</h2>
                  </div>
                  <button type="button" onClick={closeHouseholdPanel} className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50" aria-label="Close">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-4">
                  <p className="text-sm font-semibold text-slate-600">
                    Add <span className="font-black text-slate-900">{selectedClient?.name}</span> to an existing household, or create a new one.
                  </p>

                  <div className="divide-y divide-slate-100 rounded-[0.5rem] border border-slate-200 bg-white">
                    {households.map((h) => {
                      const members = h.memberIds.map((id) => clients.find((c) => c.id === id)).filter(Boolean) as Client[];
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={async () => {
                            if (!selectedClient) return;
                            setHouseholdSaving(true);
                            await updateHousehold(h.id, { addMemberId: selectedClient.id });
                            setHouseholdSaving(false);
                            openHouseholdView(h.id);
                          }}
                          disabled={householdSaving}
                          className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-violet-50 disabled:opacity-60"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
                            <Users className="h-4 w-4 text-violet-700" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-900">{h.name}</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-500 truncate">
                              {members.map((m) => m.name).join(', ') || 'No members yet'}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => { if (selectedClient) openHouseholdCreate(selectedClient.id); }}
                    className="flex w-full items-center gap-3 rounded-[0.5rem] border-2 border-dashed border-violet-300 px-4 py-4 text-left transition hover:border-violet-500 hover:bg-violet-50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100">
                      <Plus className="h-4 w-4 text-violet-700" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-violet-700">Create new household</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">Start a new household with this client</p>
                    </div>
                  </button>

                  {householdError && <p className="text-sm font-semibold text-red-600">{householdError}</p>}
                </div>

                <div className="border-t border-slate-200 p-5 flex justify-end">
                  <button type="button" onClick={closeHouseholdPanel} className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50">Cancel</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
