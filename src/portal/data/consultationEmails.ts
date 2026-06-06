import { Appointment, Contractor, Deal, User } from './types';

export type ConsultationEmailType =
  | 'booking_confirmation'
  | 'cancellation_notice'
  | 'rep_assignment'
  | 'reschedule_notice';

export type ConsultationEmailPreview = {
  body: string;
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

  return {
    body,
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

  return buildCustomerEmail(type, input);
}

