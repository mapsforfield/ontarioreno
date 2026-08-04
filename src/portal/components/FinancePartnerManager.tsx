import { ImagePlus, Pencil, Plus, Trash2, WalletCards, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { usePortalData } from '../data/store';
import { FinancePartner } from '../data/types';

type PartnerFormState = {
  active: boolean;
  logoUrl: string;
  name: string;
  notes: string;
  sortOrder: string;
  website: string;
};

const emptyPartnerForm: PartnerFormState = {
  active: true,
  logoUrl: '',
  name: '',
  notes: '',
  sortOrder: '0',
  website: '',
};

function partnerToForm(partner: FinancePartner): PartnerFormState {
  return {
    active: partner.active,
    logoUrl: partner.logoUrl ?? '',
    name: partner.name,
    notes: partner.notes ?? '',
    sortOrder: String(partner.sortOrder),
    website: partner.website ?? '',
  };
}

function formToPartner(form: PartnerFormState): Omit<FinancePartner, 'id'> {
  return {
    active: form.active,
    logoUrl: form.logoUrl.trim(),
    name: form.name.trim(),
    notes: form.notes.trim(),
    sortOrder: Number(form.sortOrder) || 0,
    website: form.website.trim(),
  };
}

/**
 * Admin panel for the lenders contractors run financing through. Kept separate
 * from the contractor record because several contractors share a partner —
 * knowing it's FinanceIt rather than iFinance is what changes how a deal is
 * structured.
 */
export default function FinancePartnerManager({
  onClose,
}: {
  onClose: () => void;
}) {
  const {
    addFinancePartner,
    deleteFinancePartner,
    financePartners,
    updateFinancePartner,
  } = usePortalData();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<PartnerFormState>(emptyPartnerForm);
  const [pendingDelete, setPendingDelete] = useState<FinancePartner | null>(null);
  const [logoWarning, setLogoWarning] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);

  const isFormOpen = isAdding || editingId !== null;

  const openAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    setForm({ ...emptyPartnerForm, sortOrder: String(financePartners.length) });
    setLogoWarning('');
  };

  const openEdit = (partner: FinancePartner) => {
    setIsAdding(false);
    setEditingId(partner.id);
    setForm(partnerToForm(partner));
    setLogoWarning('');
  };

  const closeForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(emptyPartnerForm);
    setLogoWarning('');
  };

  const savePartner = () => {
    const partner = formToPartner(form);
    if (!partner.name) return;

    if (editingId) {
      updateFinancePartner(editingId, partner);
    } else {
      addFinancePartner(partner);
    }

    closeForm();
  };

  /** Same base64 approach as the contractor logo — no upload endpoint needed. */
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoWarning('');

    if (file.size > 300_000) {
      setLogoWarning(
        `This image is ${Math.round(file.size / 1024)} KB. Logos under 300 KB keep the portal snappy — consider compressing it first.`
      );
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((current) => ({ ...current, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);

    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const removeLogo = () => {
    setForm((current) => ({ ...current, logoUrl: '' }));
    setLogoWarning('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteFinancePartner(pendingDelete.id);
    if (editingId === pendingDelete.id) closeForm();
    setPendingDelete(null);
  };

  return (
    <div className="fixed inset-0 z-[96] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
        <div
          className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5"
          style={{
            paddingTop:
              'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))',
          }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              Financing partners
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Lenders you work with
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Add each finance company once, then assign them to contractors.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            aria-label="Close financing partners"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {isFormOpen ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                Company Name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="FinanceIt"
                />
              </label>

              {/* ── Partner logo ── */}
              <div className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                Logo
                <div className="flex items-start gap-4 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white">
                    {form.logoUrl ? (
                      <img
                        src={form.logoUrl}
                        alt="Logo preview"
                        className="h-full w-full object-contain p-1.5"
                      />
                    ) : (
                      <WalletCards className="h-8 w-8 text-slate-300" />
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="text-xs font-normal leading-5 text-slate-500">
                      Shown on every contractor card that uses this lender. PNG,
                      JPG, or SVG.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        id="finance-partner-logo-input"
                        onChange={handleLogoFileChange}
                      />
                      <label
                        htmlFor="finance-partner-logo-input"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-[0.5rem] border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        {form.logoUrl ? 'Replace' : 'Upload Logo'}
                      </label>
                      {form.logoUrl && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="inline-flex items-center gap-1.5 rounded-[0.5rem] border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          logoUrl: event.target.value,
                        }))
                      }
                      placeholder="Or paste a public https:// logo URL"
                      className="text-sm font-normal"
                    />
                    {logoWarning && (
                      <p className="text-xs font-semibold text-amber-700">
                        ⚠ {logoWarning}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Website
                <input
                  value={form.website}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                  placeholder="https://financeit.ca"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                Display Order
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                />
                <span className="text-xs font-medium text-slate-400">
                  Lower numbers list first.
                </span>
              </label>
              <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                Internal Notes
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Rate buy-downs, approval turnaround, dealer fees…"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
                Active — offer this lender on new contractors
              </label>
            </div>
          ) : financePartners.length === 0 ? (
            <div className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <WalletCards className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-600">
                No financing companies yet
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Add FinanceIt, iFinance, or whoever else you place deals with.
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {financePartners.map((partner) => (
                <article
                  key={partner.id}
                  className="flex items-center gap-4 rounded-[0.5rem] border border-slate-200 bg-white p-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white text-xs font-black text-[#32639b]">
                    {partner.logoUrl ? (
                      <img
                        src={partner.logoUrl}
                        alt={`${partner.name} logo`}
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      partner.name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">
                      {partner.name}
                      {!partner.active && (
                        <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-slate-500">
                          Inactive
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-500">
                      {partner.website || partner.notes || 'No details on file'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(partner)}
                    className="inline-flex h-10 items-center gap-1.5 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(partner)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-[0.5rem] border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    aria-label={`Delete ${partner.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
          {isFormOpen ? (
            <>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={savePartner}
                disabled={!form.name.trim()}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {editingId ? 'Save Partner' : 'Add Partner'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={openAdd}
              className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
            >
              <Plus className="h-4 w-4" />
              Add Financing Partner
            </button>
          )}
        </div>
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 z-[97] flex items-center justify-center bg-slate-950/45 p-5 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[0.5rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.25)]">
            <h3 className="text-xl font-black tracking-[-0.01em]">
              Delete {pendingDelete.name}?
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              It will also be removed from every contractor currently assigned to
              it. Contractor records themselves are untouched.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDelete(null)}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-[0.5rem] bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Delete Partner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
