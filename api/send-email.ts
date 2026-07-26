import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { requireAuth, denyContractor } from '../lib/auth.js';

// Body shape posted by the React frontend. The frontend pre-renders the email
// using consultationEmails.ts (same text the rep sees in the preview), then
// posts it here. The API key never touches the browser.
type EmailAttachment = {
  /** Original filename shown to recipient (e.g. "Proposal.pdf") */
  filename: string;
  /** Base64-encoded file content */
  content: string;
};

type SendEmailBody = {
  attachments?: EmailAttachment[];
  body: string;
  /** CC recipient(s), comma-separated */
  cc?: string;
  /** HTML version of the email. Sent alongside the plain-text fallback. */
  html?: string;
  replyTo?: string;
  subject: string;
  to: string;
};

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB per file
const MAX_TOTAL_ATTACHMENT_BYTES = 25 * 1024 * 1024; // 25 MB total

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
/** Plain-text body limit â€” should stay small. */
const MAX_TEXT_LENGTH = 20_000;
/**
 * HTML body limit â€” intentionally higher because our templates include
 * substantial inline CSS required for email client compatibility.
 * 200 KB covers even the largest template with a long safe summary.
 */
const MAX_HTML_LENGTH = 200_000;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(data: unknown): { error: string } | { ok: true; payload: SendEmailBody } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body.' };
  }

  const { to, subject, body, html, cc, replyTo, attachments } = data as Record<string, unknown>;

  if (typeof to !== 'string' || !isValidEmail(to)) {
    return { error: 'Missing or invalid recipient email address.' };
  }
  if (typeof subject !== 'string' || subject.trim().length === 0) {
    return { error: 'Missing email subject.' };
  }
  if (typeof body !== 'string' || body.trim().length === 0) {
    return { error: 'Missing email body.' };
  }
  if (body.length > MAX_TEXT_LENGTH) {
    return { error: 'Email body exceeds maximum allowed length.' };
  }
  if (html !== undefined && typeof html !== 'string') {
    return { error: 'Invalid html field: must be a string.' };
  }
  if (html !== undefined && html.length > MAX_HTML_LENGTH) {
    return { error: 'Email HTML exceeds maximum allowed length.' };
  }
  if (replyTo !== undefined && (typeof replyTo !== 'string' || !isValidEmail(replyTo))) {
    return { error: 'Invalid replyTo email address.' };
  }
  if (cc !== undefined && typeof cc !== 'string') {
    return { error: 'Invalid cc field: must be a string.' };
  }
  // Validate each cc address if provided
  if (cc && typeof cc === 'string') {
    const ccAddresses = cc.split(',').map((a) => a.trim()).filter(Boolean);
    for (const addr of ccAddresses) {
      if (!isValidEmail(addr)) return { error: `Invalid CC email address: ${addr}` };
    }
  }

  // Validate attachments
  let validatedAttachments: EmailAttachment[] | undefined;
  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      return { error: 'attachments must be an array.' };
    }
    let totalBytes = 0;
    for (const att of attachments) {
      if (!att || typeof att !== 'object') return { error: 'Each attachment must be an object.' };
      const { filename, content } = att as Record<string, unknown>;
      if (typeof filename !== 'string' || !filename.trim()) return { error: 'Each attachment must have a filename.' };
      if (typeof content !== 'string' || !content) return { error: 'Each attachment must have base64 content.' };
      const bytes = Math.ceil(content.length * 0.75); // approx decoded size
      if (bytes > MAX_ATTACHMENT_BYTES) return { error: `Attachment "${filename}" exceeds the 10 MB per-file limit.` };
      totalBytes += bytes;
      if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) return { error: 'Total attachment size exceeds 25 MB.' };
    }
    validatedAttachments = (attachments as EmailAttachment[]).map((a) => ({
      filename: a.filename.trim(),
      content: a.content,
    }));
  }

  return {
    ok: true,
    payload: {
      attachments: validatedAttachments,
      body: body.trim(),
      cc: typeof cc === 'string' && cc.trim().length > 0 ? cc.trim() : undefined,
      html: typeof html === 'string' && html.trim().length > 0 ? html : undefined,
      replyTo: typeof replyTo === 'string' ? replyTo.trim() : undefined,
      subject: subject.trim(),
      to: to.trim(),
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, service: 'send-email' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  // This endpoint sends from the verified info@ontarioreno.ca identity with
  // caller-supplied recipients, body and attachments. Unauthenticated, it is an
  // open relay against our own sending domain. Both callers are portal-internal
  // and same-origin (src/portal/lib/sendEmail.ts, components/CommissionInvoice.tsx),
  // so the session cookie is sent automatically.
  const user = await requireAuth(req, res);
  if (!user) return;
  if (denyContractor(user, res)) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const result = validate(req.body);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  const { to, subject, body, html, cc, replyTo, attachments } = result.payload;

  try {
    const resend = new Resend(apiKey);
    // Parse CC string into array for Resend
    const ccAddresses = cc ? cc.split(',').map((a) => a.trim()).filter(Boolean) : undefined;
    const { error } = await resend.emails.send({
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.content, 'base64'),
      })),
      cc: ccAddresses,
      from: EMAIL_FROM,
      html,
      replyTo,
      subject,
      text: body,
      to,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({ error: error.message ?? 'Failed to send email.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Unexpected error sending email:', err);
    return res.status(500).json({ error: 'Unexpected error sending email.' });
  }
}
