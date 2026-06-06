import { Appointment, Contractor, ContractorDispatch, Deal, User } from './types';
import {
  buildCustomerHtml,
  buildRepAssignmentHtml,
  buildContractorDispatchHtml,
} from './emailTemplates';

export type ConsultationEmailType =
  | 'booking_confirmation'
  | 'cancellation_notice'
  | 'contractor_dispatch'
  | 'rep_assignment'
  | 'reschedule_notice';

export type ConsultationEmailPreview = {
  body: string;
  /** HTML version of the email body. Sent alongside plain-text for email client rendering. */
  html: string;
  metadata: {
    contractorName: string;
    isCustomerFacing: boolean;
    logoUrl: string;
    recipientEmail: string;
    recipientLabel: string;
    templateLabel: string;
  };
  subject: string;
  type: ConsultationEmailType;
};

type ConsultationEmailInput = {
  appointment: Appointment;
  contractor?: Contractor;
  deal?: Deal;
  rep?: User;
};

const templateLabels: Record<ConsultationEmailType, string> = {
  booking_confirmation: 'Booking Confirmation',
  cancellation_notice: 'Cancellation Notice',
  contractor_dispatch: 'Contractor Dispatch',
  rep_assignment: 'Rep Assignment Notice',
  reschedule_notice: 'Reschedule Notice',
};

function contractorPublicName(contractor?: Contractor) {
  return contractor?.publicCompanyName?.trim() || contractor?.companyName || 'Your Renovation Contractor';
}

function contractorPublicPhone(contractor?: Contractor) {
  return contractor?.publicPhone?.trim() || contractor?.phone || '';
}

function contractorPublicEmail(contractor?: Contractor) {
  return contractor?.publicEmail?.trim() || contractor?.email || '';
}

function contractorPublicWebsite(contractor?: Contractor) {
  return contractor?.publicWebsite?.trim() || contractor?.website || '';
}

function formatDateTime(appointment: Appointment) {
  const date = appointment.appointmentDate || 'Date TBD';
  const time = appointment.appointmentTime || 'Time TBD';
  return `${date} at ${time}`;
}

function customerFooter(contractor?: Contractor) {
  const lines = [
    contractor?.emailFooterText?.trim(),
    contractorPublicPhone(contractor) ? `Phone: ${contractorPublicPhone(contractor)}` : '',
    contractorPublicEmail(contractor) ? `Email: ${contractorPublicEmail(contractor)}` : '',
    contractorPublicWebsite(contractor) ? `Website: ${contractorPublicWebsite(contractor)}` : '',
  ].filter(Boolean);

  return lines.length ? `\n\n${lines.join('\n')}` : '';
}

function customerBodyIntro(type: ConsultationEmailType) {
  if (type === 'reschedule_notice') {
    return 'Your renovation consultation has been rescheduled.';
  }
  if (type === 'cancellation_notice') {
    return 'Your renovation consultation has been cancelled.';
  }

  return 'Your renovation consultation has been booked.';
}

function buildCustomerEmail(
  type: Exclude<ConsultationEmailType, 'rep_assignment'>,
  input: ConsultationEmailInput
): ConsultationEmailPreview {
  const contractorName = contractorPublicName(input.contractor);
  const logoUrl = input.contractor?.logoUrl?.trim() || '';
  const subjectAction =
    type === 'booking_confirmation'
      ? 'Consultation Confirmed'
      : type === 'reschedule_notice'
        ? 'Consultation Rescheduled'
        : 'Consultation Cancelled';
  const body = [
    logoUrl ? `[Contractor logo: ${logoUrl}]` : '',
    `Hi ${input.appointment.customerName || 'there'},`,
    '',
    customerBodyIntro(type),
    '',
    `Contractor: ${contractorName}`,
    `Consultation: ${formatDateTime(input.appointment)}`,
    `Project type: ${input.appointment.projectType || 'Renovation consultation'}`,
    input.rep?.name ? `Assigned representative: ${input.rep.name}` : '',
    input.appointment.customerNotes
      ? `\nCustomer notes:\n${input.appointment.customerNotes}`
      : '',
    '',
    `Reschedule: /portal/consultation/${input.appointment.id}/reschedule`,
    `Cancel: /portal/consultation/${input.appointment.id}/cancel`,
    customerFooter(input.contractor),
  ]
    .filter((line) => line !== '')
    .join('\n');

  // Only booking_confirmation, reschedule_notice, cancellation_notice are
  // valid CustomerEmailType values — the cast is safe at this call site.
  const html = buildCustomerHtml({
    type: type as Exclude<ConsultationEmailType, 'rep_assignment' | 'contractor_dispatch'>,
    appointment: input.appointment,
    contractor: input.contractor,
    rep: input.rep,
    contractorName,
  });

  return {
    body,
    html,
    metadata: {
      contractorName,
      isCustomerFacing: true,
      logoUrl,
      recipientEmail: input.appointment.email,
      recipientLabel: input.appointment.customerName || 'Customer',
      templateLabel: templateLabels[type],
    },
    subject: `${contractorName} - ${subjectAction}`,
    type,
  };
}

function buildRepAssignmentEmail(
  input: ConsultationEmailInput
): ConsultationEmailPreview {
  const contractorName = contractorPublicName(input.contractor);
  const dealValue = input.deal
    ? new Intl.NumberFormat('en-CA', {
        currency: 'CAD',
        style: 'currency',
      }).format(input.deal.estimatedJobValue)
    : 'No linked deal value';
  const financing = input.deal
    ? input.deal.financingRequired
      ? 'Financing required'
      : 'No financing required'
    : 'No linked deal';

  const html = buildRepAssignmentHtml({
    appointment: input.appointment,
    contractor: input.contractor,
    deal: input.deal,
    rep: input.rep,
    contractorName,
  });

  return {
    body: [
      `Hi ${input.rep?.name || 'Sales Rep'},`,
      '',
      'A renovation consultation has been assigned to you.',
      '',
      `Customer: ${input.appointment.customerName || 'Customer TBD'}`,
      `Phone: ${input.appointment.phone || 'Not provided'}`,
      `Email: ${input.appointment.email || 'Not provided'}`,
      `Address: ${input.appointment.address || 'Not provided'}`,
      `City: ${input.appointment.city || 'Not provided'}`,
      `Project type: ${input.appointment.projectType || 'Not provided'}`,
      `Consultation: ${formatDateTime(input.appointment)}`,
      `Assigned contractor: ${contractorName}`,
      `Linked deal value: ${dealValue}`,
      `Financing: ${financing}`,
      '',
      'Internal notes:',
      input.appointment.internalNotes || input.appointment.notes || 'No internal notes yet.',
      '',
      'Customer notes:',
      input.appointment.customerNotes || 'No customer-facing notes.',
    ].join('\n'),
    html,
    metadata: {
      contractorName,
      isCustomerFacing: false,
      logoUrl: '',
      recipientEmail: input.rep?.email || '',
      recipientLabel: input.rep?.name || 'Assigned rep',
      templateLabel: templateLabels.rep_assignment,
    },
    subject: `Consultation Assigned - ${input.appointment.customerName || input.appointment.projectType || 'Renovation Lead'}`,
    type: 'rep_assignment',
  };
}

export function generateConsultationEmailPreview(
  type: ConsultationEmailType,
  input: ConsultationEmailInput
) {
  if (type === 'rep_assignment') return buildRepAssignmentEmail(input);

  return buildCustomerEmail(
    type as Exclude<ConsultationEmailType, 'rep_assignment' | 'contractor_dispatch'>,
    input
  );
}

export type ContractorDispatchEmailInput = {
  appointment: Appointment;
  contractor: Contractor;
  deal?: Deal;
  dispatch: ContractorDispatch;
  estimatedProjectRange?: string;
  safeSummary?: string;
};

export function generateContractorDispatchEmail(
  input: ContractorDispatchEmailInput
): ConsultationEmailPreview {
  const { appointment, contractor, deal, dispatch, estimatedProjectRange, safeSummary } = input;
  const contactName = contractor.contactName || contractor.companyName;
  const city = appointment.city || deal?.city || 'General Ontario area';
  const projectType = appointment.projectType || deal?.projectType || 'Renovation project';
  const financingRequired = dispatch.financingRequired ?? deal?.financingRequired ?? false;

  const body = [
    `Hi ${contactName},`,
    '',
    'OntarioReno has a renovation opportunity that may be a fit for your team.',
    '',
    'Opportunity overview:',
    `- Area: ${city}`,
    `- Project type: ${projectType}`,
    `- Estimated project range: ${estimatedProjectRange || 'To be confirmed'}`,
    `- Financing required: ${financingRequired ? 'Yes' : 'No'}`,
    '',
    'Safe summary:',
    safeSummary || dispatch.safeSummary || 'Summary to be provided.',
    '',
    'Homeowner contact details and exact address are not shared until the opportunity is accepted and assigned.',
    '',
    'Please let us know if you are interested in reviewing this opportunity further.',
    '',
    'OntarioReno Broker Portal',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const html = buildContractorDispatchHtml({
    appointment,
    contractor,
    deal,
    dispatch,
    estimatedProjectRange,
    safeSummary,
  });

  return {
    body,
    html,
    metadata: {
      contractorName: contractor.companyName,
      isCustomerFacing: false,
      logoUrl: '',
      recipientEmail: contractor.email,
      recipientLabel: contactName,
      templateLabel: templateLabels.contractor_dispatch,
    },
    subject: `Renovation Opportunity – ${projectType} in ${city}`,
    type: 'contractor_dispatch',
  };
}

