import {
  Building2,
  ImagePlus,
  Pencil,
  Mail,
  MapPin,
  Phone,
  Plus,
  Star,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { usePortalAuth } from '../auth';
import FinancePartnerManager from '../components/FinancePartnerManager';
import {
  formatCurrency,
  formatDealStatus,
  formatFinancingStatus,
} from '../data/selectors';
import {
  isContractorStatus,
  isFinancingStatus,
  usePortalData,
} from '../data/store';
import { Contractor, FinancePartner } from '../data/types';
import { Deal, ProposalTemplateType } from '../data/types';

type ContractorFormState = {
  address: string;
  averageProjectSize: string;
  city: string;
  /** Percent string, e.g. "8.5" — stored on the contractor as a fraction (0.085) */
  commissionRate: string;
  companyName: string;
  postalCode: string;
  province: string;
  contactName: string;
  contractorStatus: Contractor['contractorStatus'];
  email: string;
  emailFooterText: string;
  financePartnerIds: string[];
  financingStatus: Contractor['financingStatus'];
  logoUrl: string;
  notes: string;
  phone: string;
  priorityScore: string;
  projectTypes: string;
  publicCompanyName: string;
  publicEmail: string;
  publicPhone: string;
  publicWebsite: string;
  serviceAreas: string;
  website: string;
};

type ProposalFormState = {
  contractorId: string;
  dealId: string;
  safeNotes: string;
  templateType: ProposalTemplateType;
};

type ContractorQuickFilter =
  | 'active_only'
  | 'all'
  | 'cash_only'
  | 'financing_available'
  | 'pending_financing';

const proposalTemplates: Array<{
  label: string;
  value: ProposalTemplateType;
}> = [
  { label: 'New Job Opportunity', value: 'new_job_opportunity' },
  { label: 'Financing Required Opportunity', value: 'financing_required' },
  { label: 'Cash Job Opportunity', value: 'cash_job' },
  { label: 'Contractor Follow-Up', value: 'contractor_follow_up' },
];

const emptyContractorForm: ContractorFormState = {
  address: '',
  averageProjectSize: '0',
  city: '',
  commissionRate: '8.5',
  companyName: '',
  postalCode: '',
  province: '',
  contactName: '',
  contractorStatus: 'active',
  email: '',
  emailFooterText: '',
  financePartnerIds: [],
  financingStatus: 'pending_financing',
  logoUrl: '',
  notes: '',
  phone: '',
  priorityScore: '50',
  projectTypes: '',
  publicCompanyName: '',
  publicEmail: '',
  publicPhone: '',
  publicWebsite: '',
  serviceAreas: '',
  website: '',
};

function contractorToForm(contractor: Contractor): ContractorFormState {
  return {
    address: contractor.address ?? '',
    averageProjectSize: String(contractor.averageProjectSize),
    city: contractor.city ?? '',
    commissionRate: String(
      Math.round((contractor.commissionRate ?? 0.085) * 10000) / 100
    ),
    companyName: contractor.companyName,
    postalCode: contractor.postalCode ?? '',
    province: contractor.province ?? '',
    contactName: contractor.contactName,
    contractorStatus: contractor.contractorStatus,
    email: contractor.email,
    emailFooterText: contractor.emailFooterText ?? '',
    financePartnerIds: contractor.financePartnerIds ?? [],
    financingStatus: contractor.financingStatus,
    logoUrl: contractor.logoUrl ?? '',
    notes: contractor.notes,
    phone: contractor.phone,
    priorityScore: String(contractor.priorityScore),
    projectTypes: contractor.projectTypes.join(', '),
    publicCompanyName: contractor.publicCompanyName ?? '',
    publicEmail: contractor.publicEmail ?? '',
    publicPhone: contractor.publicPhone ?? '',
    publicWebsite: contractor.publicWebsite ?? '',
    serviceAreas: contractor.serviceAreas.join(', '),
    website: contractor.website,
  };
}

function formToContractor(form: ContractorFormState): Omit<Contractor, 'id'> {
  return {
    address: form.address.trim(),
    averageProjectSize: Number(form.averageProjectSize) || 0,
    city: form.city.trim(),
    // Percent → fraction, clamped to 0–100%
    commissionRate:
      Math.min(Math.max(Number(form.commissionRate) || 8.5, 0), 100) / 100,
    companyName: form.companyName.trim(),
    postalCode: form.postalCode.trim(),
    province: form.province.trim(),
    contactName: form.contactName.trim(),
    contractorStatus: form.contractorStatus,
    email: form.email.trim(),
    emailFooterText: form.emailFooterText.trim(),
    // Cash-only contractors have no lender, whatever was ticked before.
    financePartnerIds:
      form.financingStatus === 'cash_only' ? [] : form.financePartnerIds,
    financingStatus: form.financingStatus,
    logoUrl: form.logoUrl.trim(),
    notes: form.notes.trim(),
    phone: form.phone.trim(),
    priorityScore: Math.min(Math.max(Number(form.priorityScore) || 0, 0), 100),
    projectTypes: form.projectTypes
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    publicCompanyName: form.publicCompanyName.trim(),
    publicEmail: form.publicEmail.trim(),
    publicPhone: form.publicPhone.trim(),
    publicWebsite: form.publicWebsite.trim(),
    serviceAreas: form.serviceAreas
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
    website: form.website.trim(),
  };
}

/**
 * A financing partner shown on a contractor card — logo when the admin uploaded
 * one, initials otherwise, so the lender is identifiable at a glance.
 */
function FinancePartnerChip({ partner }: { partner: FinancePartner }) {
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-[#cfe0f2] bg-[#f6faff] py-1 pl-1 pr-3 text-xs font-black text-[#1B3C6C]"
      title={partner.name}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#cfe0f2] bg-white text-[0.6rem] font-black text-[#32639b]">
        {partner.logoUrl ? (
          <img
            src={partner.logoUrl}
            alt={`${partner.name} logo`}
            className="h-full w-full object-contain p-0.5"
          />
        ) : (
          partner.name.slice(0, 2).toUpperCase()
        )}
      </span>
      {partner.name}
    </span>
  );
}

function formatContractorStatus(status: Contractor['contractorStatus']) {
  if (status === 'active') return 'Active';
  if (status === 'pending') return 'Pending';

  return 'Inactive';
}

function getTelHref(phone: string) {
  const safePhone = phone.trim().replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '');
  const hasDigits = /\d/.test(safePhone);

  return hasDigits ? `tel:${safePhone}` : null;
}

function getValueRange(value: number) {
  const lower = Math.max(Math.floor((value - 10000) / 10000) * 10000, 0);
  const upper = Math.ceil((value + 10000) / 10000) * 10000;
  const formatRangeValue = (rangeValue: number) =>
    `$${Math.round(rangeValue / 1000)}k`;

  return `${formatRangeValue(lower)}-${formatRangeValue(upper)}`;
}

function getTemplateIntro(templateType: ProposalTemplateType, deal: Deal) {
  if (templateType === 'financing_required') {
    return `This opportunity appears to require financing support, so it should only be reviewed if your team can support a clean, financeable estimate for a ${deal.projectType}.`;
  }

  if (templateType === 'cash_job') {
    return `This opportunity is currently positioned as cash-ready or non-financing, and may be a fit if your team has capacity for a ${deal.projectType}.`;
  }

  if (templateType === 'contractor_follow_up') {
    return `We are following up on a renovation opportunity that may still be a fit for your team.`;
  }

  return `We have a potential renovation opportunity that may be a fit for this project category.`;
}

function buildProposal(
  contractor: Contractor,
  deal: Deal,
  templateType: ProposalTemplateType,
  safeNotes: string
) {
  const subject =
    templateType === 'contractor_follow_up'
      ? `OntarioReno Follow-Up - ${deal.projectType} in ${deal.city}`
      : `OntarioReno Opportunity - ${deal.projectType} in ${deal.city}`;
  const financingRequired = deal.financingRequired ? 'Yes' : 'No';
  const templateIntro = getTemplateIntro(templateType, deal);
  const notes =
    safeNotes.trim() ||
    'No additional safe proposal notes were added yet.';
  const fitReason =
    contractor.financingStatus === 'financing_available'
      ? `${contractor.companyName} is marked as able to support financeable renovation opportunities.`
      : `${contractor.companyName} appears aligned with this project type and service area.`;

  const body = `Hi ${contractor.contactName},

${templateIntro}

Project overview:
- Area: ${deal.city}
- Project type: ${deal.projectType}
- Estimated project range: ${getValueRange(deal.estimatedJobValue)}
- Financing required: ${financingRequired}
- Current CRM status: ${formatDealStatus(deal.status)}

Contractor fit reason:
${fitReason}

General notes:
${notes}

At this stage, homeowner contact details are not being shared until the opportunity is accepted and assigned.

Please let us know if you would like to review this opportunity further.

OntarioReno Broker Portal`;

  return { body, subject };
}

export default function PortalContractors() {
  const { currentUser, isAdmin } = usePortalAuth();
  const {
    addContractor,
    addProposalHistory,
    contractors,
    deleteContractor,
    financePartners,
    getVisibleDealsForUser,
    updateContractor,
  } = usePortalData();
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(
    null
  );
  const [isAddingContractor, setIsAddingContractor] = useState(false);
  const [isEditingContractor, setIsEditingContractor] = useState(false);
  const selectedContractor = contractors.find(
    (contractor) => contractor.id === selectedContractorId
  );
  const [form, setForm] = useState<ContractorFormState>(emptyContractorForm);
  const [proposalForm, setProposalForm] = useState<ProposalFormState | null>(
    null
  );
  const [contractorPendingDelete, setContractorPendingDelete] =
    useState<Contractor | null>(null);
  const [contractorFilter, setContractorFilter] =
    useState<ContractorQuickFilter>('all');
  const [logoUploadWarning, setLogoUploadWarning] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [projectTypeFilter, setProjectTypeFilter] = useState('');
  const [serviceAreaFilter, setServiceAreaFilter] = useState('');
  const [financePartnerFilter, setFinancePartnerFilter] = useState('');
  const [isManagingPartners, setIsManagingPartners] = useState(false);

  const partnersById = useMemo(
    () => new Map(financePartners.map((partner) => [partner.id, partner])),
    [financePartners]
  );

  /** The partners a contractor is set up with, in the admin's chosen order. */
  const getPartnersFor = (contractor: Contractor) =>
    (contractor.financePartnerIds ?? [])
      .map((partnerId) => partnersById.get(partnerId))
      .filter((partner): partner is FinancePartner => Boolean(partner));

  const isDetailsOpen = Boolean(selectedContractor || isAddingContractor);
  const visibleDeals = currentUser ? getVisibleDealsForUser(currentUser) : [];
  const proposalContractor = proposalForm
    ? contractors.find((contractor) => contractor.id === proposalForm.contractorId)
    : undefined;
  const proposalDeal = proposalForm
    ? visibleDeals.find((deal) => deal.id === proposalForm.dealId)
    : undefined;
  const generatedProposal =
    proposalContractor && proposalDeal
      ? buildProposal(
          proposalContractor,
          proposalDeal,
          proposalForm?.templateType ?? 'new_job_opportunity',
          proposalForm?.safeNotes ?? ''
        )
      : null;
  const panelTitle = isAddingContractor
    ? 'Add Contractor'
    : selectedContractor?.companyName ?? 'Contractor Details';
  const isContractorFormVisible =
    isAdmin && (isAddingContractor || isEditingContractor);

  const sortedContractors = useMemo(
    () => {
      const visibleContractors = isAdmin
        ? contractors
        : contractors.filter(
            (contractor) => contractor.contractorStatus === 'active'
          );

      return visibleContractors
        .filter((contractor) => {
          if (contractorFilter === 'active_only') {
            return contractor.contractorStatus === 'active';
          }

          if (
            ['cash_only', 'financing_available', 'pending_financing'].includes(
              contractorFilter
            )
          ) {
            return contractor.financingStatus === contractorFilter;
          }

          return true;
        })
        .filter((contractor) =>
          projectTypeFilter.trim()
            ? contractor.projectTypes.some((projectType) =>
                projectType
                  .toLowerCase()
                  .includes(projectTypeFilter.trim().toLowerCase())
              )
            : true
        )
        .filter((contractor) =>
          serviceAreaFilter.trim()
            ? contractor.serviceAreas.some((serviceArea) =>
                serviceArea
                  .toLowerCase()
                  .includes(serviceAreaFilter.trim().toLowerCase())
              )
            : true
        )
        .filter((contractor) =>
          financePartnerFilter
            ? (contractor.financePartnerIds ?? []).includes(financePartnerFilter)
            : true
        )
        .sort(
        (first, second) => second.priorityScore - first.priorityScore
      );
    },
    [
      contractorFilter,
      contractors,
      financePartnerFilter,
      isAdmin,
      projectTypeFilter,
      serviceAreaFilter,
    ]
  );

  const openDetails = (contractor: Contractor) => {
    setIsAddingContractor(false);
    setIsEditingContractor(false);
    setSelectedContractorId(contractor.id);
    setForm(contractorToForm(contractor));
  };

  const openEditContractor = (contractor: Contractor) => {
    setIsAddingContractor(false);
    setIsEditingContractor(true);
    setSelectedContractorId(contractor.id);
    setForm(contractorToForm(contractor));
  };

  const openAddContractor = () => {
    setSelectedContractorId(null);
    setIsAddingContractor(true);
    setIsEditingContractor(true);
    setForm(emptyContractorForm);
  };

  const closeDetails = () => {
    setSelectedContractorId(null);
    setIsAddingContractor(false);
    setIsEditingContractor(false);
  };

  const openProposalPanel = (contractor: Contractor) => {
    setProposalForm({
      contractorId: contractor.id,
      dealId: visibleDeals[0]?.id ?? '',
      safeNotes: '',
      templateType: 'new_job_opportunity',
    });
  };

  const closeProposalPanel = () => {
    setProposalForm(null);
  };

  const saveContractor = () => {
    const contractor = formToContractor(form);
    if (!isAdmin || !contractor.companyName) return;

    if (isAddingContractor) {
      addContractor(contractor, currentUser ?? undefined);
    } else if (selectedContractor) {
      updateContractor(
        selectedContractor.id,
        contractor,
        currentUser ?? undefined
      );
    }

    closeDetails();
  };

  const updateForm = (
    field: keyof ContractorFormState,
    value: string
  ) => {
    if (field === 'financingStatus' && !isFinancingStatus(value)) return;
    if (field === 'contractorStatus' && !isContractorStatus(value)) return;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const toggleFormFinancePartner = (partnerId: string) => {
    setForm((current) => ({
      ...current,
      financePartnerIds: current.financePartnerIds.includes(partnerId)
        ? current.financePartnerIds.filter((id) => id !== partnerId)
        : [...current.financePartnerIds, partnerId],
    }));
  };

  /**
   * Reads an uploaded image as a base64 data URL and stores it in logoUrl.
   * Warns (but does not block) if the file exceeds 300 KB, since base64
   * images are stored in localStorage alongside all other portal data.
   */
  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLogoUploadWarning('');

    if (file.size > 300_000) {
      setLogoUploadWarning(
        `This image is ${Math.round(file.size / 1024)} KB. Images over 300 KB may use significant localStorage space. Consider compressing it first.`
      );
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm((current) => ({ ...current, logoUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);

    // Reset the input so the same file can be re-selected after a Remove
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const removeLogo = () => {
    setForm((current) => ({ ...current, logoUrl: '' }));
    setLogoUploadWarning('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  const updateProposalForm = <Field extends keyof ProposalFormState>(
    field: Field,
    value: ProposalFormState[Field]
  ) => {
    setProposalForm((current) =>
      current ? { ...current, [field]: value } : current
    );
  };

  const copyProposal = async () => {
    if (!generatedProposal) return;

    await navigator.clipboard.writeText(
      `Subject: ${generatedProposal.subject}\n\n${generatedProposal.body}`
    );
  };

  const markProposalSent = () => {
    if (!proposalForm || !proposalContractor || !proposalDeal || !generatedProposal || !currentUser) {
      return;
    }

    addProposalHistory({
      contractorId: proposalContractor.id,
      dealId: proposalDeal.id,
      proposalBody: generatedProposal.body,
      proposalSubject: generatedProposal.subject,
      sentByUserId: currentUser.id,
      templateType: proposalForm.templateType,
    }, currentUser);
    closeProposalPanel();
  };

  const confirmDeleteContractor = () => {
    if (!isAdmin || !currentUser || !contractorPendingDelete) return;

    deleteContractor(contractorPendingDelete.id, currentUser);
    setContractorPendingDelete(null);
    setProposalForm((current) =>
      current?.contractorId === contractorPendingDelete.id ? null : current
    );
    closeDetails();
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Contractor network
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
            Approved contractor placeholders
          </h1>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setIsManagingPartners(true)}
              className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-4 py-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
            >
              <WalletCards className="h-4 w-4" />
              Financing Partners
            </button>
            <button
              type="button"
              onClick={openAddContractor}
              className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#153158]"
            >
              <Plus className="h-4 w-4" />
              Add Contractor
            </button>
          </div>
        )}
      </header>

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {[
            ['All', 'all'],
            ['Financing Available', 'financing_available'],
            ['Cash Only', 'cash_only'],
            ['Pending Financing', 'pending_financing'],
            ['Active Only', 'active_only'],
          ].map(([label, value]) => (
            <button
              key={value}
              type="button"
              onClick={() => setContractorFilter(value as ContractorQuickFilter)}
              className={
                contractorFilter === value
                  ? 'rounded-full bg-[#1B3C6C] px-3 py-2 text-xs font-black text-white'
                  : 'rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]'
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            Financing Partner
            <select
              value={financePartnerFilter}
              onChange={(event) => setFinancePartnerFilter(event.target.value)}
            >
              <option value="">Any partner</option>
              {financePartners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            Project Type
            <input
              value={projectTypeFilter}
              onChange={(event) => setProjectTypeFilter(event.target.value)}
              placeholder="Basements, kitchens, legal suites"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-bold text-slate-700">
            Service Area
            <input
              value={serviceAreaFilter}
              onChange={(event) => setServiceAreaFilter(event.target.value)}
              placeholder="Toronto, Hamilton, GTA"
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sortedContractors.map((contractor) => {
          const telHref = getTelHref(contractor.phone);
          const partners = getPartnersFor(contractor);

          return (
            <article
              key={contractor.id}
              className="flex flex-col rounded-[0.5rem] border border-white bg-white p-5 shadow-sm"
            >
            <div className="flex items-start justify-between gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem] bg-[#071525] text-white">
                {contractor.logoUrl ? (
                  <img
                    src={contractor.logoUrl}
                    alt={`${contractor.companyName} logo`}
                    className="h-full w-full object-contain p-1"
                  />
                ) : (
                  <Building2 className="h-5 w-5" />
                )}
              </div>
              <span
                className={
                  contractor.contractorStatus === 'active'
                    ? 'rounded-full bg-[#edf7ef] px-3 py-1 text-xs font-bold text-[#287247]'
                    : contractor.contractorStatus === 'pending'
                      ? 'rounded-full bg-[#fff6df] px-3 py-1 text-xs font-bold text-[#8a6418]'
                      : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500'
                }
              >
                {contractor.contractorStatus === 'active'
                  ? 'Approved'
                  : contractor.contractorStatus === 'pending'
                    ? 'Pending'
                  : 'Inactive'}
              </span>
            </div>
            <h2 className="mt-5 text-xl font-black tracking-[-0.01em]">
              {contractor.companyName}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Contact: {contractor.contactName}
            </p>
            <div className="mt-5">
              <span
                className={
                  contractor.financingStatus === 'financing_available'
                    ? 'inline-flex w-full items-center justify-center gap-2 rounded-[0.5rem] border border-[#b8dfc1] bg-[#eaf8ee] px-3 py-2.5 text-sm font-black text-[#21683d] sm:w-auto'
                    : 'inline-flex w-full items-center justify-center gap-2 rounded-[0.5rem] border border-[#d8d4c7] bg-[#f7f4eb] px-3 py-2.5 text-sm font-black text-[#63573c] sm:w-auto'
                }
              >
                <WalletCards className="h-4 w-4" />
                {formatFinancingStatus(contractor.financingStatus)}
              </span>
              {/* Which lender they actually run — FinanceIt and iFinance are not
                  interchangeable, so the status alone isn't enough to route a deal. */}
              {contractor.financingStatus !== 'cash_only' && (
                <div className="mt-3">
                  <p className="text-[0.65rem] font-black uppercase tracking-[0.12em] text-slate-400">
                    Financing partner{partners.length > 1 ? 's' : ''}
                  </p>
                  {partners.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {partners.map((partner) => (
                        <FinancePartnerChip key={partner.id} partner={partner} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-bold text-slate-400">
                      None recorded yet
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
                <Star className="h-3.5 w-3.5 text-[#d9a72f]" />
                {contractor.projectTypes[0] ?? 'Project'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">
                <MapPin className="h-3.5 w-3.5 text-[#32639b]" />
                {contractor.serviceAreas[0] ?? 'Ontario'}
              </span>
            </div>
            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1B3C6C]"
                style={{ width: `${Math.min(contractor.priorityScore, 100)}%` }}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
              {telHref ? (
                <a
                  href={telHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:bg-white hover:text-[#1B3C6C]"
                  title={`Call ${contractor.contactName}`}
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-400"
                  title="No phone number available"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </button>
              )}
              <button
                type="button"
                onClick={() => openProposalPanel(contractor)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.5rem] border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-600 transition hover:border-[#b8c9dd] hover:bg-white hover:text-[#1B3C6C]"
              >
                <Mail className="h-4 w-4" />
                Send Proposal
              </button>
              <button
                type="button"
                onClick={() => openDetails(contractor)}
                className={
                  isAdmin
                    ? 'inline-flex min-h-11 items-center justify-center rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]'
                    : 'col-span-2 inline-flex min-h-11 items-center justify-center rounded-[0.5rem] border border-[#b8c9dd] bg-[#f6faff] px-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]'
                }
              >
                View Details
              </button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => openEditContractor(contractor)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[0.5rem] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]"
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </button>
              )}
            </div>
            </article>
          );
        })}
      </section>

      {isDetailsOpen && (
        <div className="fixed inset-0 z-[90] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Contractor details
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  {panelTitle}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDetails}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close contractor details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {isContractorFormVisible ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Company Name
                    <input
                      value={form.companyName}
                      onChange={(event) =>
                        updateForm('companyName', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Contact Name
                    <input
                      value={form.contactName}
                      onChange={(event) =>
                        updateForm('contactName', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Phone
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        updateForm('phone', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Email
                    <input
                      value={form.email}
                      onChange={(event) =>
                        updateForm('email', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Website
                    <input
                      value={form.website}
                      onChange={(event) =>
                        updateForm('website', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Mailing Address <span className="font-medium text-slate-400">(used on commission invoices)</span>
                    <input
                      value={form.address}
                      onChange={(event) => updateForm('address', event.target.value)}
                      placeholder="103 Dolomite Dr"
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    City
                    <input value={form.city} onChange={(event) => updateForm('city', event.target.value)} placeholder="North York" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Province
                    <input value={form.province} onChange={(event) => updateForm('province', event.target.value)} placeholder="ON" />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Postal Code
                    <input value={form.postalCode} onChange={(event) => updateForm('postalCode', event.target.value.toUpperCase())} placeholder="M3J 2N1" />
                  </label>
                  {/* ── Company logo upload ── */}
                  <div className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Company Logo
                    <div className="flex items-start gap-4 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                      {/* Preview square */}
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white">
                        {form.logoUrl ? (
                          <img
                            src={form.logoUrl}
                            alt="Logo preview"
                            className="h-full w-full object-contain p-1.5"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-slate-300" />
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <p className="text-xs font-normal leading-5 text-slate-500">
                          Displayed on the contractor card in this portal. PNG, JPG, or SVG.
                        </p>
                        <p className="text-xs font-normal leading-5 text-amber-700">
                          <strong>For emails:</strong> email clients block uploaded images. Paste a public <span className="font-mono">https://</span> URL below so the logo appears in customer emails.
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {/* Hidden file input */}
                          <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="sr-only"
                            id="logo-upload-input"
                            onChange={handleLogoFileChange}
                          />
                          <label
                            htmlFor="logo-upload-input"
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

                        {/* Hosted URL field — always visible so admins can set a public URL for emails */}
                        <input
                          value={form.logoUrl.startsWith('data:') ? '' : form.logoUrl}
                          onChange={(event) =>
                            updateForm('logoUrl', event.target.value)
                          }
                          placeholder="Paste public https:// URL for email logo"
                          className="text-sm font-normal"
                        />

                        {/* Size warning */}
                        {logoUploadWarning && (
                          <p className="text-xs font-semibold text-amber-700">
                            ⚠ {logoUploadWarning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Public Company Name
                    <input
                      value={form.publicCompanyName}
                      onChange={(event) =>
                        updateForm('publicCompanyName', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Public Phone
                    <input
                      value={form.publicPhone}
                      onChange={(event) =>
                        updateForm('publicPhone', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Public Email
                    <input
                      value={form.publicEmail}
                      onChange={(event) =>
                        updateForm('publicEmail', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Public Website
                    <input
                      value={form.publicWebsite}
                      onChange={(event) =>
                        updateForm('publicWebsite', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Financing Status
                    <select
                      value={form.financingStatus}
                      onChange={(event) =>
                        updateForm('financingStatus', event.target.value)
                      }
                    >
                      <option value="financing_available">
                        Financing Available
                      </option>
                      <option value="cash_only">Cash Only</option>
                      <option value="pending_financing">
                        Pending Financing
                      </option>
                    </select>
                  </label>
                  {/* ── Financing partners ── */}
                  {form.financingStatus !== 'cash_only' && (
                    <div className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                      Financing Partners
                      <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                        {financePartners.length === 0 ? (
                          <p className="text-xs font-normal leading-5 text-slate-500">
                            No financing companies yet. Add them under{' '}
                            <button
                              type="button"
                              onClick={() => setIsManagingPartners(true)}
                              className="font-bold text-[#1B3C6C] underline"
                            >
                              Financing Partners
                            </button>
                            , then tick the ones this contractor is set up with.
                          </p>
                        ) : (
                          <>
                            <p className="text-xs font-normal leading-5 text-slate-500">
                              Tick every lender this contractor can actually run a
                              deal through. Leave empty if none are approved yet.
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {financePartners.map((partner) => {
                                const isSelected =
                                  form.financePartnerIds.includes(partner.id);

                                return (
                                  <button
                                    key={partner.id}
                                    type="button"
                                    onClick={() =>
                                      toggleFormFinancePartner(partner.id)
                                    }
                                    className={
                                      isSelected
                                        ? 'inline-flex items-center gap-2 rounded-full border border-[#1B3C6C] bg-[#1B3C6C] py-1 pl-1 pr-3 text-xs font-black text-white'
                                        : 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3 text-xs font-black text-slate-600 transition hover:border-[#b8c9dd] hover:text-[#1B3C6C]'
                                    }
                                  >
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white text-[0.6rem] font-black text-[#32639b]">
                                      {partner.logoUrl ? (
                                        <img
                                          src={partner.logoUrl}
                                          alt=""
                                          className="h-full w-full object-contain p-0.5"
                                        />
                                      ) : (
                                        partner.name.slice(0, 2).toUpperCase()
                                      )}
                                    </span>
                                    {partner.name}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Contractor Status
                    <select
                      value={form.contractorStatus}
                      onChange={(event) =>
                        updateForm('contractorStatus', event.target.value)
                      }
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Service Areas
                    <input
                      value={form.serviceAreas}
                      onChange={(event) =>
                        updateForm('serviceAreas', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Project Types
                    <input
                      value={form.projectTypes}
                      onChange={(event) =>
                        updateForm('projectTypes', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Average Project Size
                    <input
                      type="number"
                      value={form.averageProjectSize}
                      onChange={(event) =>
                        updateForm('averageProjectSize', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                    Priority Score
                    <input
                      max={100}
                      min={0}
                      type="number"
                      value={form.priorityScore}
                      onChange={(event) =>
                        updateForm('priorityScore', event.target.value)
                      }
                    />
                  </label>
                  {isAdmin && (
                    <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                      <span className="flex items-center gap-2">
                        Total Commission Rate (%)
                        <span className="rounded-full bg-[#fff6df] px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-wide text-[#8a6418]">
                          Admin only
                        </span>
                      </span>
                      <input
                        max={100}
                        min={0}
                        step={0.1}
                        type="number"
                        value={form.commissionRate}
                        onChange={(event) =>
                          updateForm('commissionRate', event.target.value)
                        }
                      />
                      <span className="text-xs font-medium text-slate-400">
                        Reps always earn 5% — your net is everything above it.
                        Applies to newly assigned deals only; existing deals keep
                        the rate they locked in.
                      </span>
                    </label>
                  )}
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Email Footer Text
                    <textarea
                      rows={3}
                      value={form.emailFooterText}
                      onChange={(event) =>
                        updateForm('emailFooterText', event.target.value)
                      }
                    />
                  </label>
                  <label className="grid gap-1.5 text-sm font-bold text-slate-700 sm:col-span-2">
                    Internal Notes
                    <textarea
                      rows={4}
                      value={form.notes}
                      onChange={(event) =>
                        updateForm('notes', event.target.value)
                      }
                    />
                  </label>
                </div>
              ) : (
                selectedContractor && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selectedContractor.financingStatus !== 'cash_only' && (
                      <div className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          Financing partners
                        </p>
                        {getPartnersFor(selectedContractor).length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {getPartnersFor(selectedContractor).map((partner) => (
                              <FinancePartnerChip
                                key={partner.id}
                                partner={partner}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm font-bold text-slate-400">
                            None recorded yet
                          </p>
                        )}
                      </div>
                    )}
                    {/* Logo — shown full-width at the top when present */}
                    {selectedContractor.logoUrl && (
                      <div className="flex items-center gap-4 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[0.5rem] border border-slate-200 bg-white">
                          <img
                            src={selectedContractor.logoUrl}
                            alt={`${selectedContractor.companyName} logo`}
                            className="h-full w-full object-contain p-1.5"
                          />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                            Company Logo
                          </p>
                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {selectedContractor.companyName}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-400">
                            Used in customer-facing emails
                          </p>
                        </div>
                      </div>
                    )}
                    {[
                      ['Company Name', selectedContractor.companyName],
                      ['Contact Name', selectedContractor.contactName],
                      ['Phone', selectedContractor.phone || 'Not listed'],
                      ['Email', selectedContractor.email],
                      ['Website', selectedContractor.website || 'Not listed'],
                      [
                        'Financing Status',
                        formatFinancingStatus(
                          selectedContractor.financingStatus
                        ),
                      ],
                      [
                        'Contractor Status',
                        formatContractorStatus(
                          selectedContractor.contractorStatus
                        ),
                      ],
                      [
                        'Service Areas',
                        selectedContractor.serviceAreas.join(', '),
                      ],
                      [
                        'Project Types',
                        selectedContractor.projectTypes.join(', '),
                      ],
                      [
                        'Average Project Size',
                        formatCurrency(selectedContractor.averageProjectSize),
                      ],
                      [
                        'Priority Score',
                        String(selectedContractor.priorityScore),
                      ],
                      // commissionRate is admin-only — the API strips it for reps
                      ...(isAdmin
                        ? [
                            [
                              'Total Commission Rate',
                              `${Math.round((selectedContractor.commissionRate ?? 0.085) * 10000) / 100}%`,
                            ],
                          ]
                        : []),
                      ['Internal Notes', selectedContractor.notes],
                    ].map(([label, value]) => {
                      const telHref =
                        label === 'Phone'
                          ? getTelHref(selectedContractor.phone)
                          : null;

                      return (
                      <div
                        key={label}
                        className="rounded-[0.5rem] border border-slate-200 bg-slate-50 p-3"
                      >
                        <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                          {label}
                        </p>
                        <p className="mt-2 text-sm font-bold text-slate-900">
                          {value}
                        </p>
                        {label === 'Phone' &&
                          (telHref ? (
                            <a
                              href={telHref}
                              className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.5rem] border border-[#b8c9dd] bg-white px-3 text-sm font-bold text-[#1B3C6C] transition hover:bg-[#e8f1fb]"
                              title={`Call ${selectedContractor.contactName}`}
                            >
                              <Phone className="h-4 w-4" />
                              Call
                            </a>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-[0.5rem] border border-slate-200 bg-white px-3 text-sm font-bold text-slate-400"
                              title="No phone number available"
                            >
                              <Phone className="h-4 w-4" />
                              Call
                            </button>
                          ))}
                      </div>
                      );
                    })}
                  </div>
                )
              )}
            </div>

            {isAdmin && (
              <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
                {selectedContractor && !isAddingContractor && (
                  <button
                    type="button"
                    onClick={() => setContractorPendingDelete(selectedContractor)}
                    className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 sm:mr-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Contractor
                  </button>
                )}
                {!isContractorFormVisible && selectedContractor ? (
                  <button
                    type="button"
                    onClick={() => openEditContractor(selectedContractor)}
                    className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit Contractor
                  </button>
                ) : (
                  <div className="flex flex-col gap-2 sm:ml-auto sm:flex-row">
                    <button
                      type="button"
                      onClick={closeDetails}
                      className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveContractor}
                      className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158]"
                    >
                      Save Contractor
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {contractorPendingDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[0.5rem] bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.3)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-700">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-950">
                  Delete contractor
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  Delete this contractor? This cannot be undone in the local
                  prototype.
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900">
                  {contractorPendingDelete.companyName}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setContractorPendingDelete(null)}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteContractor}
                className="rounded-[0.5rem] bg-red-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-800"
              >
                Delete Contractor
              </button>
            </div>
          </div>
        </div>
      )}

      {proposalForm && proposalContractor && (
        <div className="fixed inset-0 z-[95] bg-slate-950/45 p-0 backdrop-blur-sm sm:p-5">
          <div className="ml-auto flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-[0_24px_80px_rgba(15,23,42,0.25)] sm:rounded-[0.5rem]">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 pb-5" style={{ paddingTop: 'max(1.25rem, calc(1.25rem + env(safe-area-inset-top, 0px)))' }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
                  Send Proposal
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
                  {proposalContractor.companyName}
                </h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  Privacy-safe contractor opportunity summary
                </p>
              </div>
              <button
                type="button"
                onClick={closeProposalPanel}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-50"
                aria-label="Close proposal panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <div className="grid gap-3">
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Select Deal
                  <select
                    value={proposalForm.dealId}
                    onChange={(event) =>
                      updateProposalForm('dealId', event.target.value)
                    }
                  >
                    {visibleDeals.length === 0 && (
                      <option value="">No visible deals</option>
                    )}
                    {visibleDeals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.city} - {deal.projectType} -{' '}
                        {formatDealStatus(deal.status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1.5 text-sm font-bold text-slate-700">
                  Proposal Template
                  <select
                    value={proposalForm.templateType}
                    onChange={(event) =>
                      updateProposalForm(
                        'templateType',
                        event.target.value as ProposalTemplateType
                      )
                    }
                  >
                    {proposalTemplates.map((template) => (
                      <option key={template.value} value={template.value}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 rounded-[0.5rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                  Selected contractor
                </p>
                <p className="mt-2 text-sm font-black text-slate-950">
                  {proposalContractor.companyName} /{' '}
                  {proposalContractor.contactName}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {proposalContractor.email || 'No contractor email on file'}
                </p>
              </div>

              <label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-700">
                Safe Proposal Notes
                <textarea
                  rows={4}
                  value={proposalForm.safeNotes}
                  onChange={(event) =>
                    updateProposalForm('safeNotes', event.target.value)
                  }
                  placeholder="Homeowner is looking for a clean, financeable estimate for a legal basement apartment."
                />
              </label>

              <section className="mt-5 rounded-[0.5rem] border border-slate-200 bg-white p-4">
                <div className="border-b border-slate-200 pb-3">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                    Proposal Preview
                  </p>
                  <h3 className="mt-2 text-lg font-black text-slate-950">
                    {generatedProposal?.subject ?? 'Select a deal to preview'}
                  </h3>
                </div>
                <pre className="mt-4 max-h-[22rem] overflow-y-auto whitespace-pre-wrap rounded-[0.5rem] bg-slate-50 p-4 text-sm font-medium leading-6 text-slate-700">
                  {generatedProposal?.body ??
                    'Choose a visible deal to generate a privacy-safe proposal.'}
                </pre>
              </section>
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={copyProposal}
                disabled={!generatedProposal}
                className="rounded-[0.5rem] border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy Proposal
              </button>
              <a
                href={
                  generatedProposal && proposalContractor.email
                    ? `mailto:${encodeURIComponent(
                        proposalContractor.email
                      )}?subject=${encodeURIComponent(
                        generatedProposal.subject
                      )}&body=${encodeURIComponent(generatedProposal.body)}`
                    : undefined
                }
                aria-disabled={!generatedProposal || !proposalContractor.email}
                className={
                  generatedProposal && proposalContractor.email
                    ? 'rounded-[0.5rem] border border-slate-300 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-50'
                    : 'pointer-events-none rounded-[0.5rem] border border-slate-200 px-4 py-3 text-center text-sm font-bold text-slate-400'
                }
              >
                Open Email Client
              </a>
              <button
                type="button"
                onClick={markProposalSent}
                disabled={!generatedProposal}
                className="rounded-[0.5rem] bg-[#1B3C6C] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#153158] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Mark as Sent
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && isManagingPartners && (
        <FinancePartnerManager onClose={() => setIsManagingPartners(false)} />
      )}
    </div>
  );
}
