import { ConsultationEmailPreview } from '../data/consultationEmails';

export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string };

export async function sendEmail(preview: ConsultationEmailPreview): Promise<SendEmailResult> {
  if (!preview.metadata.recipientEmail) {
    return { ok: false, error: 'No recipient email address on this template.' };
  }

  try {
    const response = await fetch('/api/send-email', {
      body: JSON.stringify({
        body: preview.body,
        html: preview.html,
        // For customer-facing emails, set replyTo to the contractor's public email
        // so replies land with the contractor, not info@ontarioreno.ca.
        replyTo: preview.metadata.isCustomerFacing
          ? undefined
          : undefined,
        subject: preview.subject,
        to: preview.metadata.recipientEmail,
      }),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    });

    const data: unknown = await response.json();

    if (!response.ok) {
      const message =
        data && typeof data === 'object' && 'error' in data && typeof (data as Record<string, unknown>).error === 'string'
          ? (data as { error: string }).error
          : 'Failed to send email.';
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Network error. Please check your connection and try again.' };
  }
}
