import { ConsultationEmailPreview } from '../data/consultationEmails';

export type SendEmailResult =
  | { ok: true }
  | { ok: false; error: string };

export type EmailAttachment = {
  /** Base64-encoded file content */
  content: string;
  filename: string;
};

export type SendEmailOptions = {
  /** File attachments to include */
  attachments?: EmailAttachment[];
  /** Override the template body */
  bodyOverride?: string;
  /** Override the template subject */
  subjectOverride?: string;
  /** Override the recipient email address */
  toOverride?: string;
  /** CC email address(es), comma-separated */
  ccOverride?: string;
};

export async function sendEmail(
  preview: ConsultationEmailPreview,
  options: SendEmailOptions = {}
): Promise<SendEmailResult> {
  const effectiveTo = options.toOverride?.trim() || preview.metadata.recipientEmail;
  if (!effectiveTo) {
    return { ok: false, error: 'No recipient email address on this template.' };
  }

  const subject = options.subjectOverride?.trim() || preview.subject;
  const body = options.bodyOverride?.trim() || preview.body;
  // When body is customized the HTML template may no longer match — send plain-text only.
  const html = options.bodyOverride ? undefined : preview.html;

  try {
    const response = await fetch('/api/send-email', {
      body: JSON.stringify({
        attachments: options.attachments?.length ? options.attachments : undefined,
        body,
        cc: options.ccOverride?.trim() || undefined,
        html,
        // For customer-facing emails, set replyTo to the contractor's public email
        // so replies land with the contractor, not info@ontarioreno.ca.
        replyTo: preview.metadata.isCustomerFacing ? undefined : undefined,
        subject,
        to: effectiveTo,
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
