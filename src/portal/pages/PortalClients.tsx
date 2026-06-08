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
  UserRound,
  X,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import type { Client } from '../data/types';

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
  const { isAdmin, currentUser } = usePortalAuth();
  const { clients, addClient, updateClient, deleteClient, getAppointmentsForClient } =
    usePortalData();

  const [search, setSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;
  const clientAppointments = selectedClientId
    ? getAppointmentsForClient(selectedClientId)
    : [];

  // ── Search filter ──
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

  // ── Panel helpers ──
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

  const isPanelOpen = isCreating || selectedClientId !== null;

  return (
    <div className="space-y-4 pb-16 lg:pb-6">
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
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-[#153158]"
        >
          <Plus className="h-4 w-4" />
          + New Client
        </button>
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
                {/* Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f1fb] text-sm font-black text-[#1B3C6C]">
                  {initials(client.name)}
                </div>
                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-slate-900">{client.name}</p>
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
                {/* City + source */}
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

      {/* ── Slide-in panel ───────────────────────────────────────────────── */}
      {isPanelOpen && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-l-[0.5rem]">
            {/* Panel header */}
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
              {/* Contact summary (view mode) */}
              {!isCreating && selectedClient && (
                <section className="rounded-[0.5rem] border border-[#c9d9eb] bg-[#f6faff] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#32639b]">
                    Contact Info
                  </p>
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
                            <span
                              key={pt}
                              className="rounded-full bg-[#e8f1fb] px-2.5 py-0.5 text-xs font-black text-[#1B3C6C]"
                            >
                              {pt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {selectedClient.internalNotes && (
                    <div className="mt-3 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-800">
                        Internal Notes
                      </p>
                      <p className="mt-1.5 text-sm font-semibold text-slate-700 whitespace-pre-wrap">
                        {selectedClient.internalNotes}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Consultation history */}
              {!isCreating && clientAppointments.length > 0 && (
                <section>
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                    Consultation History ({clientAppointments.length})
                  </p>
                  <div className="space-y-2">
                    {clientAppointments
                      .sort((a, b) => b.appointmentDate.localeCompare(a.appointmentDate))
                      .map((apt) => (
                        <div
                          key={apt.id}
                          className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">
                                {apt.projectType || apt.customerName || 'Consultation'}
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-slate-500">
                                {apt.appointmentDate}
                                {apt.appointmentTime ? ` · ${apt.appointmentTime}` : ''}
                                {apt.city ? ` · ${apt.city}` : ''}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-[#e8f1fb] px-2.5 py-0.5 text-[0.62rem] font-black text-[#1B3C6C]">
                              {apt.status.replace('_', ' ')}
                            </span>
                          </div>
                          {apt.internalNotes && (
                            <p className="mt-1.5 text-xs font-semibold text-slate-500 line-clamp-2">
                              {apt.internalNotes}
                            </p>
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

              {/* Edit / create form */}
              <section>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                  {isCreating ? 'Client Details' : 'Edit Profile'}
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Full Name *
                    <input
                      value={form.name}
                      onChange={(e) => updateForm('name', e.target.value)}
                      placeholder="Jane Smith"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Phone
                    <input
                      value={form.phone}
                      onChange={(e) => updateForm('phone', e.target.value)}
                      placeholder="416-555-0100"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Email
                    <input
                      value={form.email}
                      onChange={(e) => updateForm('email', e.target.value)}
                      placeholder="jane@example.com"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Address
                    <input
                      value={form.address}
                      onChange={(e) => updateForm('address', e.target.value)}
                      placeholder="123 Main St"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    City
                    <input
                      value={form.city}
                      onChange={(e) => updateForm('city', e.target.value)}
                      placeholder="Toronto"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Postal Code
                    <input
                      value={form.postalCode}
                      onChange={(e) => updateForm('postalCode', e.target.value.toUpperCase())}
                      placeholder="M5V 3A8"
                      maxLength={7}
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Project Types
                    <input
                      value={form.projectTypes}
                      onChange={(e) => updateForm('projectTypes', e.target.value)}
                      placeholder="Basement, Kitchen (comma separated)"
                    />
                  </label>
                  <label className="grid gap-1.5 rounded-[0.5rem] border border-amber-200 bg-amber-50 p-3 text-sm font-bold text-slate-700 sm:col-span-2">
                    Internal Notes — Not visible to client
                    <textarea
                      rows={4}
                      value={form.internalNotes}
                      onChange={(e) => updateForm('internalNotes', e.target.value)}
                      placeholder="Notes about this client that are internal to the team…"
                    />
                  </label>
                </div>
                {saveError && (
                  <p className="mt-3 text-sm font-semibold text-red-600">{saveError}</p>
                )}
              </section>
            </div>

            {/* Panel footer */}
            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
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
              <button
                type="button"
                onClick={closePanel}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
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
    </div>
  );
}
