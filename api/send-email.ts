import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Body shape posted by the React frontend. The frontend pre-renders the email
// using consultationEmails.ts (same text the rep sees in the preview), then
// posts it here. The API key never touches the browser.
type SendEmailBody = {
  body: string;
  replyTo?: string;
  subject: string;
  to: string;
};

const EMAIL_FROM = process.env.EMAIL_FROM ?? 'OntarioReno <info@ontarioreno.ca>';
const MAX_BODY_LENGTH = 20_000;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validate(data: unknown): { error: string } | { ok: true; payload: SendEmailBody } {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid request body.' };
  }

  const { to, subject, body, replyTo } = data as Record<string, unknown>;

  if (typeof to !== 'string' || !isValidEmail(to)) {
    return { error: 'Missing or invalid recipient email address.' };
  }
  if (typeof subject !== 'string' || subject.trim().length === 0) {
    return { error: 'Missing email subject.' };
  }
  if (typeof body !== 'string' || body.trim().length === 0) {
    return { error: 'Missing email body.' };
  }
  if (body.length > MAX_BODY_LENGTH) {
    return { error: 'Email body exceeds maximum allowed length.' };
  }
  if (replyTo !== undefined && (typeof replyTo !== 'string' || !isValidEmail(replyTo))) {
    return { error: 'Invalid replyTo email address.' };
  }

  return {
    ok: true,
    payload: {
      body: body.trim(),
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

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not configured.');
    return res.status(500).json({ error: 'Email service is not configured.' });
  }

  const result = validate(req.body);
  if ('error' in result) {
    return res.status(400).json({ error: result.error });
  }

  const { to, subject, body, replyTo } = result.payload;

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
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
